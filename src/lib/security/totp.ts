// RFC 6238 TOTP using HMAC-SHA1 (the universal authenticator standard) plus
// RFC 4226 Base32 encoding for otpauth URLs. Web Crypto only — Workers safe.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function bytesToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += BASE32_ALPHABET[(value >>> bits) & 31];
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

function base32ToBytes(value: string): Uint8Array {
  const cleaned = value.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let buffer = 0;
  for (let i = 0; i < cleaned.length; i += 1) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) throw new Error("Invalid Base32 character");
    buffer = (buffer << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

export function generateTotpSecret(byteLength = 20): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase32(bytes);
}

export function buildOtpAuthUrl(params: {
  issuer: string;
  account: string;
  secret: string;
  digits?: number;
  period?: number;
}): string {
  const issuer = encodeURIComponent(params.issuer);
  const account = encodeURIComponent(params.account);
  const search = new URLSearchParams({
    secret: params.secret,
    issuer: params.issuer,
    algorithm: "SHA1",
    digits: String(params.digits ?? 6),
    period: String(params.period ?? 30),
  });
  return `otpauth://totp/${issuer}:${account}?${search.toString()}`;
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data as BufferSource));
}

function counterToBytes(counter: number): Uint8Array {
  const buf = new Uint8Array(8);
  // JS bitwise ops are 32-bit; split high/low manually.
  let high = Math.floor(counter / 0x1_0000_0000);
  let low = counter >>> 0;
  for (let i = 7; i >= 0; i -= 1) {
    if (i >= 4) {
      buf[i] = low & 0xff;
      low = Math.floor(low / 256);
    } else {
      buf[i] = high & 0xff;
      high = Math.floor(high / 256);
    }
  }
  return buf;
}

async function hotp(secret: string, counter: number, digits = 6): Promise<string> {
  const key = base32ToBytes(secret);
  const hash = await hmacSha1(key, counterToBytes(counter));
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  const mod = 10 ** digits;
  return (code % mod).toString().padStart(digits, "0");
}

export async function verifyTotp(
  secret: string,
  token: string,
  options: { period?: number; window?: number; digits?: number } = {},
): Promise<boolean> {
  const period = options.period ?? 30;
  const window = options.window ?? 1;
  const digits = options.digits ?? 6;
  const sanitized = token.replace(/\s+/g, "");
  if (!/^\d{6,8}$/.test(sanitized)) return false;
  const now = Math.floor(Date.now() / 1000);
  const baseCounter = Math.floor(now / period);
  for (let i = -window; i <= window; i += 1) {
    const expected = await hotp(secret, baseCounter + i, digits);
    // constant-time-ish compare
    if (expected.length === sanitized.length) {
      let diff = 0;
      for (let j = 0; j < expected.length; j += 1) {
        diff |= expected.charCodeAt(j) ^ sanitized.charCodeAt(j);
      }
      if (diff === 0) return true;
    }
  }
  return false;
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    const part = bytesToBase32(bytes).slice(0, 8);
    codes.push(`${part.slice(0, 4)}-${part.slice(4, 8)}`);
  }
  return codes;
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.toUpperCase().replace(/[^A-Z0-9]/g, ""));
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  const bytes = new Uint8Array(digest);
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}
