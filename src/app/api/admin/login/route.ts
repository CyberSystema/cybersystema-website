import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { requireServerSecurityEnv } from "@/lib/security/env";
import {
  createAdminSessionToken,
  createPreMfaToken,
  getPreMfaCookieName,
  getSessionCookieName,
  PRE_MFA_DURATION_SECONDS,
  SESSION_DURATION_SECONDS,
} from "@/lib/security/session";
import { TIMING_DUMMY_HASH, verifyPassword } from "@/lib/security/password";
import { consumeRateLimit, resetRateLimit } from "@/lib/security/rate-limit";
import { getCloudflareEnv } from "@/lib/security/cloudflare";
import {
  findAdminByUsername,
  LOCKOUT_MINUTES,
  MAX_FAILED_LOGINS,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/lib/security/admin-users";
import { hashIp } from "@/lib/security/ip-hash";
import { writeAudit } from "@/lib/security/audit";
import { generateCsrfToken, getCsrfCookieName } from "@/lib/security/csrf";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

const loginSchema = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(512),
  turnstileToken: z.string().max(4096).optional(),
});

async function getClientIdentifier(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get("cf-connecting-ip") ?? "unknown";
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function POST(request: Request) {
  let env;
  try {
    env = requireServerSecurityEnv();
  } catch {
    return noStore(NextResponse.json({ error: "Auth not configured" }, { status: 503 }));
  }

  const cf = await getCloudflareEnv();
  if (!cf?.SECURITY_KV || !cf?.DB) {
    return noStore(
      NextResponse.json({ error: "Backend not provisioned" }, { status: 503 }),
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return noStore(NextResponse.json({ error: "Invalid payload" }, { status: 400 }));
  }

  const ip = await getClientIdentifier();
  const ipHash = await hashIp(ip, env.ADMIN_SESSION_SECRET);
  const usernameKey = parsed.data.username.toLowerCase().slice(0, 128);
  const rateKey = `admin-login:${ipHash}:${usernameKey}`;

  const limit = await consumeRateLimit(cf.SECURITY_KV, rateKey, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    const r = NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
    r.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return noStore(r);
  }

  const turnstile = await verifyTurnstile(
    parsed.data.turnstileToken,
    ip,
    env.TURNSTILE_SECRET_KEY,
  );
  if (!turnstile.ok) {
    return noStore(
      NextResponse.json({ error: "Captcha verification failed" }, { status: 400 }),
    );
  }

  const user = await findAdminByUsername(cf.DB, parsed.data.username);
  // Always run KDF to mask user existence via timing.
  const passwordOk = await verifyPassword(
    parsed.data.password,
    user?.password_hash ?? TIMING_DUMMY_HASH,
  );

  const lockedUntilMs = user?.locked_until ? Date.parse(user.locked_until) : 0;
  const isLocked = lockedUntilMs > Date.now();

  if (!user || user.is_active !== 1 || isLocked || !passwordOk) {
    if (user) {
      const newCount = user.failed_login_count + 1;
      const lockedUntil =
        newCount >= MAX_FAILED_LOGINS
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
          : null;
      await recordFailedLogin(cf.DB, user.id, newCount, lockedUntil);
    }
    await writeAudit(cf.DB, {
      actorUserId: user?.id ?? null,
      action: "admin.login.failure",
      resourceType: "admin_users",
      resourceId: user?.id ?? null,
      sourceIpHash: ipHash,
      metadata: { reason: !user ? "unknown_user" : isLocked ? "locked" : "bad_password" },
    });
    return noStore(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }));
  }

  await resetRateLimit(cf.SECURITY_KV, rateKey);

  // MFA required path
  if (user.mfa_enabled === 1) {
    const pre = await createPreMfaToken(
      { sub: user.id, username: user.username, role: user.role },
      env.ADMIN_SESSION_SECRET,
    );
    const r = NextResponse.json({ mfa_required: true });
    r.cookies.set(getPreMfaCookieName(), pre.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: PRE_MFA_DURATION_SECONDS,
    });
    await writeAudit(cf.DB, {
      actorUserId: user.id,
      action: "admin.login.mfa_required",
      resourceType: "admin_users",
      resourceId: user.id,
      sourceIpHash: ipHash,
    });
    return noStore(r);
  }

  // No-MFA path: issue full session immediately
  const session = await createAdminSessionToken(
    { sub: user.id, username: user.username, role: user.role },
    env.ADMIN_SESSION_SECRET,
  );
  await recordSuccessfulLogin(cf.DB, user.id);
  await writeAudit(cf.DB, {
    actorUserId: user.id,
    action: "admin.login.success",
    resourceType: "admin_users",
    resourceId: user.id,
    sourceIpHash: ipHash,
  });

  const csrf = generateCsrfToken();
  const r = NextResponse.json({ success: true, mfa_required: false });
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
  return noStore(r);
}
