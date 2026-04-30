import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { requireServerSecurityEnv } from "@/lib/security/env";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import {
  createAdminSessionToken,
  getPreMfaCookieName,
  getSessionCookieName,
  SESSION_DURATION_SECONDS,
  verifyPreMfaToken,
} from "@/lib/security/session";
import { findAdminById, recordSuccessfulLogin } from "@/lib/security/admin-users";
import { decryptString } from "@/lib/security/crypto";
import { hashRecoveryCode, verifyTotp } from "@/lib/security/totp";
import { consumeRateLimit, resetRateLimit } from "@/lib/security/rate-limit";
import { hashIp } from "@/lib/security/ip-hash";
import { writeAudit } from "@/lib/security/audit";
import { generateCsrfToken, getCsrfCookieName } from "@/lib/security/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  code: z.string().min(6).max(20),
});

export async function POST(request: Request) {
  const env = (() => {
    try {
      return requireServerSecurityEnv();
    } catch {
      return null;
    }
  })();
  if (!env) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const cf = await getCloudflareEnv();
  if (!cf?.DB || !cf?.SECURITY_KV) {
    return NextResponse.json({ error: "Backend not provisioned" }, { status: 503 });
  }

  const cookieStore = await cookies();
  const preToken = cookieStore.get(getPreMfaCookieName())?.value;
  if (!preToken) {
    return NextResponse.json({ error: "MFA session expired" }, { status: 401 });
  }

  const claims = await verifyPreMfaToken(preToken, env.ADMIN_SESSION_SECRET);
  if (!claims) {
    return NextResponse.json({ error: "MFA session invalid" }, { status: 401 });
  }

  const headerStore = await headers();
  const ip = headerStore.get("cf-connecting-ip") ?? "unknown";
  const ipHash = await hashIp(ip, env.ADMIN_SESSION_SECRET);
  const rateKey = `admin-mfa:${ipHash}:${claims.sub}`;
  const limit = await consumeRateLimit(cf.SECURITY_KV, rateKey, 6, 5 * 60_000);
  if (!limit.allowed) {
    const r = NextResponse.json({ error: "Too many attempts." }, { status: 429 });
    r.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return r;
  }

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await findAdminById(cf.DB, claims.sub);
  if (!user || user.is_active !== 1 || !user.mfa_enabled || !user.mfa_secret_encrypted) {
    return NextResponse.json({ error: "MFA not configured" }, { status: 400 });
  }

  const secret = await decryptString(user.mfa_secret_encrypted, env.ADMIN_SESSION_SECRET);
  if (!secret) {
    return NextResponse.json({ error: "MFA misconfigured" }, { status: 500 });
  }

  const cleaned = parsed.data.code.replace(/\s+/g, "");
  let success = false;
  if (/^\d+$/.test(cleaned)) {
    success = await verifyTotp(secret, cleaned);
  } else if (user.recovery_codes_hash) {
    const candidates: string[] = JSON.parse(user.recovery_codes_hash);
    const hashed = await hashRecoveryCode(cleaned);
    const idx = candidates.indexOf(hashed);
    if (idx !== -1) {
      candidates.splice(idx, 1);
      await cf.DB.prepare(
        "UPDATE admin_users SET recovery_codes_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
        .bind(JSON.stringify(candidates), user.id)
        .run();
      success = true;
    }
  }

  if (!success) {
    await writeAudit(cf.DB, {
      actorUserId: user.id,
      action: "admin.mfa.failure",
      resourceType: "admin_users",
      resourceId: user.id,
      sourceIpHash: ipHash,
    });
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  await resetRateLimit(cf.SECURITY_KV, rateKey);

  const session = await createAdminSessionToken(
    { sub: user.id, username: user.username, role: user.role },
    env.ADMIN_SESSION_SECRET,
  );
  await recordSuccessfulLogin(cf.DB, user.id);
  await writeAudit(cf.DB, {
    actorUserId: user.id,
    action: "admin.login.success_mfa",
    resourceType: "admin_users",
    resourceId: user.id,
    sourceIpHash: ipHash,
  });

  const csrf = generateCsrfToken();
  const r = NextResponse.json({ success: true });
  r.cookies.set(getSessionCookieName(), session.token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  r.cookies.set(getCsrfCookieName(), csrf, {
    httpOnly: false,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  r.cookies.set(getPreMfaCookieName(), "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  r.headers.set("Cache-Control", "no-store");
  return r;
}
