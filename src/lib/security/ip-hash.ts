// HMAC-based IP hash so we never store raw IPs in the database.
// Key is derived from ADMIN_SESSION_SECRET (already required).

const TEXT = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    TEXT.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function hashIp(ip: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, TEXT.encode(`ip:${ip}`)),
  );
  let s = "";
  for (let i = 0; i < sig.length; i += 1) s += sig[i].toString(16).padStart(2, "0");
  return s.slice(0, 32);
}
