import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "__Host-cs_admin_session";
const PRE_MFA_COOKIE_NAME = "__Host-cs_admin_pre_mfa";
export const SESSION_DURATION_SECONDS = 60 * 60 * 12;
export const PRE_MFA_DURATION_SECONDS = 60 * 5;
export const SESSION_ISSUER = "cybersystema:admin";

export const ADMIN_ROLES = ["super_admin", "content_admin", "read_only"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminSessionClaims = {
  sub: string; // admin_users.id
  username: string;
  role: AdminRole;
  jti: string;
  exp: number;
};

export type PreMfaClaims = {
  sub: string;
  username: string;
  role: AdminRole;
  jti: string;
  exp: number;
};

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getPreMfaCookieName(): string {
  return PRE_MFA_COOKIE_NAME;
}

export async function createAdminSessionToken(
  input: { sub: string; username: string; role: AdminRole },
  secret: string,
): Promise<{ token: string; jti: string; exp: number }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_DURATION_SECONDS;
  const jti = crypto.randomUUID();
  const token = await new SignJWT({ role: input.role, username: input.username, kind: "session" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setSubject(input.sub)
    .setJti(jti)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(exp)
    .sign(getSecretKey(secret));
  return { token, jti, exp };
}

export async function createPreMfaToken(
  input: { sub: string; username: string; role: AdminRole },
  secret: string,
): Promise<{ token: string; jti: string; exp: number }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + PRE_MFA_DURATION_SECONDS;
  const jti = crypto.randomUUID();
  const token = await new SignJWT({ role: input.role, username: input.username, kind: "pre_mfa" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setSubject(input.sub)
    .setJti(jti)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(exp)
    .sign(getSecretKey(secret));
  return { token, jti, exp };
}

async function verifyToken<T extends "session" | "pre_mfa">(
  token: string,
  secret: string,
  expectedKind: T,
): Promise<AdminSessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
    });
    if (
      payload.kind !== expectedKind ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      typeof payload.jti !== "string" ||
      typeof payload.exp !== "number" ||
      typeof payload.username !== "string" ||
      !isAdminRole(payload.role)
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function verifyAdminSessionToken(token: string, secret: string) {
  return verifyToken(token, secret, "session");
}

export function verifyPreMfaToken(token: string, secret: string) {
  return verifyToken(token, secret, "pre_mfa");
}
