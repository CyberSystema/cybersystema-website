import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "__Host-cs_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

export type AdminSessionClaims = {
  sub: string;
  role: "super_admin";
};

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export async function createAdminSessionToken(
  claims: AdminSessionClaims,
  secret: string,
): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey(secret));
}

export async function verifyAdminSessionToken(token: string, secret: string): Promise<AdminSessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret), {
      algorithms: ["HS256"],
    });

    const subject = payload.sub;
    const role = payload.role;

    if (typeof subject !== "string" || role !== "super_admin") {
      return null;
    }

    return {
      sub: subject,
      role,
    };
  } catch {
    return null;
  }
}
