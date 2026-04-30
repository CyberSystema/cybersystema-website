// PBKDF2-SHA256 password hashing/verification using Web Crypto only
// (works on Cloudflare Workers without nodejs_compat). The encoded format is:
//   pbkdf2-sha256$<iterations>$<saltBase64>$<hashBase64>

const ALGORITHM_LABEL = "pbkdf2-sha256";
// Cloudflare Workers caps PBKDF2 iterations at 100_000. We pin to that ceiling
// (still well above the OWASP 2024 minimum of 600k for SHA-1; for SHA-256 the
// guidance is 210k but Workers refuses, so 100k is the maximum available).
const DEFAULT_ITERATIONS = 100_000;
const DEFAULT_SALT_BYTES = 16;
const DEFAULT_HASH_BYTES = 32;

// Sentinel hash used to equalise timing on unknown usernames. It is a real
// PBKDF2 hash of an unknown random password so verifyPassword performs the
// same amount of work as a real comparison.
export const TIMING_DUMMY_HASH =
  "pbkdf2-sha256$100000$YWFhYWFhYWFhYWFhYWFhYQ==$3h2Z6oFqYqg5h3I+gV2yC8u5jQyV3oKqL0d8M0R7m6E=";

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Decode(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
  byteLength: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    byteLength * 8,
  );
  return new Uint8Array(derived);
}

export async function hashPassword(
  password: string,
  options: { iterations?: number; saltBytes?: number; hashBytes?: number } = {},
): Promise<string> {
  const iterations = options.iterations ?? DEFAULT_ITERATIONS;
  const saltBytes = options.saltBytes ?? DEFAULT_SALT_BYTES;
  const hashBytes = options.hashBytes ?? DEFAULT_HASH_BYTES;

  const salt = new Uint8Array(saltBytes);
  crypto.getRandomValues(salt);

  const derived = await deriveBits(password, salt, iterations, hashBytes);
  return `${ALGORITHM_LABEL}$${iterations}$${base64Encode(salt)}$${base64Encode(derived)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 4 || parts[0] !== ALGORITHM_LABEL) {
    return false;
  }
  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 1) {
    return false;
  }

  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = base64Decode(parts[2]);
    expected = base64Decode(parts[3]);
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  const derived = await deriveBits(password, salt, iterations, expected.length);
  return timingSafeEqualBytes(derived, expected);
}
