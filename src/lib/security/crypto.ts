// AES-GCM encryption/decryption helpers backed by ADMIN_SESSION_SECRET.
// Used to encrypt MFA secrets at rest in D1.

const TEXT = new TextEncoder();

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    TEXT.encode(secret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: TEXT.encode("cybersystema:hkdf:v1"),
      info: TEXT.encode("aes-gcm-encryption"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function bytesToBase64(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i += 1) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function base64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptString(plaintext: string, secret: string): Promise<string> {
  const key = await deriveAesKey(secret);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, TEXT.encode(plaintext)),
  );
  return `aesgcm$${bytesToBase64(iv)}$${bytesToBase64(ct)}`;
}

export async function decryptString(payload: string, secret: string): Promise<string | null> {
  const parts = payload.split("$");
  if (parts.length !== 3 || parts[0] !== "aesgcm") return null;
  try {
    const key = await deriveAesKey(secret);
    const iv = base64ToBytes(parts[1]);
    const ct = base64ToBytes(parts[2]);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}
