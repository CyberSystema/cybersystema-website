// Double-submit CSRF token. The token is a 32-byte random value rendered into
// a non-HttpOnly cookie AND into form/header payloads. Server compares them in
// constant time. SameSite=Strict on the session cookie already provides strong
// CSRF protection, but this is defense-in-depth for browsers that downgrade.

const CSRF_COOKIE = "cs_admin_csrf";
const CSRF_HEADER = "x-csrf-token";

function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

export function getCsrfCookieName(): string {
  return CSRF_COOKIE;
}

export function getCsrfHeaderName(): string {
  return CSRF_HEADER;
}

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkCsrf(request: Request, cookieToken: string | undefined): boolean {
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!headerToken || !cookieToken) return false;
  if (headerToken.length < 32 || cookieToken.length < 32) return false;
  return constantTimeEqual(headerToken, cookieToken);
}
