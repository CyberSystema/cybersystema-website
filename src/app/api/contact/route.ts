import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getServerSecurityEnv } from "@/lib/security/env";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  createContact,
  rateLimitContactByIpHash,
} from "@/lib/data/contact";
import { writeAudit } from "@/lib/security/audit";
import { hashIp } from "@/lib/security/ip-hash";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  subject: z.string().min(1).max(160),
  message: z.string().min(1).max(5000),
  turnstileToken: z.string().max(4096).optional(),
  // Honeypot — bots fill this; real users never see it.
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const env = getServerSecurityEnv();
  if (!env) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const cf = await getCloudflareEnv();
  if (!cf?.DB || !cf?.SECURITY_KV) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 },
    );
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    // Pretend success to avoid telling a bot it was caught.
    return NextResponse.json({ success: true });
  }

  const headerStore = await headers();
  const ip = headerStore.get("cf-connecting-ip") ?? "unknown";
  const ipHash = await hashIp(ip, env.ADMIN_SESSION_SECRET);

  const limit = await consumeRateLimit(
    cf.SECURITY_KV,
    `contact:${ipHash}`,
    5,
    60 * 60_000,
  );
  if (!limit.allowed) {
    const r = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
    r.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return r;
  }

  const turnstile = await verifyTurnstile(
    parsed.data.turnstileToken,
    ip,
    env.TURNSTILE_SECRET_KEY,
  );
  if (!turnstile.ok) {
    return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
  }

  const allowed = await rateLimitContactByIpHash(cf.DB, ipHash, 60, 3);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions from this network." },
      { status: 429 },
    );
  }

  const created = await createContact(cf.DB, {
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    sourceIpHash: ipHash,
  });
  await writeAudit(cf.DB, {
    actorUserId: null,
    action: "contact.submission",
    resourceType: "contact_submissions",
    resourceId: created.id,
    sourceIpHash: ipHash,
  });
  return NextResponse.json({ success: true });
}
