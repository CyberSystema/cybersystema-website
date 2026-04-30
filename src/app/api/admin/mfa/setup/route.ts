import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/security/auth-context";
import { encryptString } from "@/lib/security/crypto";
import {
  buildOtpAuthUrl,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotp,
} from "@/lib/security/totp";
import {
  disableMfa,
  enableMfa,
  setMfaSecret,
} from "@/lib/security/admin-users";
import { writeAudit } from "@/lib/security/audit";
import { hashIp } from "@/lib/security/ip-hash";
import { checkCsrf, getCsrfCookieName } from "@/lib/security/csrf";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET starts enrollment (returns provisional secret, not yet enabled).
export async function GET(request: Request) {
  const ctx = await requireAdminApi(request);
  if (ctx instanceof NextResponse) return ctx;
  const { session, env, cf } = ctx;

  const secret = generateTotpSecret();
  const encrypted = await encryptString(secret, env.ADMIN_SESSION_SECRET);
  const recoveryCodes = generateRecoveryCodes();
  const recoveryHashes = await Promise.all(recoveryCodes.map(hashRecoveryCode));
  await setMfaSecret(cf.DB, session.user.id, encrypted, JSON.stringify(recoveryHashes));

  const otpauth = buildOtpAuthUrl({
    issuer: "CyberSystema",
    account: session.user.username,
    secret,
  });
  return NextResponse.json({
    otpauth_url: otpauth,
    secret,
    recovery_codes: recoveryCodes,
  });
}

// POST enables MFA after the user proves they scanned the QR by submitting a code.
const enableSchema = z.object({
  code: z.string().regex(/^\d{6,8}$/),
});

export async function POST(request: Request) {
  const ctx = await requireAdminApi(request);
  if (ctx instanceof NextResponse) return ctx;
  const { session, env, cf, ip } = ctx;

  const cookieStore = await cookies();
  if (!checkCsrf(request, cookieStore.get(getCsrfCookieName())?.value)) {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = enableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!session.user.mfa_secret_encrypted) {
    return NextResponse.json({ error: "Enrollment not started" }, { status: 400 });
  }
  const { decryptString } = await import("@/lib/security/crypto");
  const secret = await decryptString(
    session.user.mfa_secret_encrypted,
    env.ADMIN_SESSION_SECRET,
  );
  if (!secret) {
    return NextResponse.json({ error: "MFA misconfigured" }, { status: 500 });
  }
  const ok = await verifyTotp(secret, parsed.data.code);
  if (!ok) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }
  await enableMfa(cf.DB, session.user.id);
  const ipHash = await hashIp(ip, env.ADMIN_SESSION_SECRET);
  await writeAudit(cf.DB, {
    actorUserId: session.user.id,
    action: "admin.mfa.enabled",
    resourceType: "admin_users",
    resourceId: session.user.id,
    sourceIpHash: ipHash,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const ctx = await requireAdminApi(request);
  if (ctx instanceof NextResponse) return ctx;
  const { session, env, cf, ip } = ctx;

  const cookieStore = await cookies();
  if (!checkCsrf(request, cookieStore.get(getCsrfCookieName())?.value)) {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }

  await disableMfa(cf.DB, session.user.id);
  const ipHash = await hashIp(ip, env.ADMIN_SESSION_SECRET);
  await writeAudit(cf.DB, {
    actorUserId: session.user.id,
    action: "admin.mfa.disabled",
    resourceType: "admin_users",
    resourceId: session.user.id,
    sourceIpHash: ipHash,
  });
  return NextResponse.json({ success: true });
}
