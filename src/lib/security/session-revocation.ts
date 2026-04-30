// JTI-keyed session revocation list backed by Cloudflare KV.
// On logout we write `rev:<jti>` with a TTL equal to the JWT's remaining
// lifetime, so the entry self-deletes when the token would have expired.

const PREFIX = "rev:";

export async function revokeJti(
  kv: KVNamespace,
  jti: string,
  expSeconds: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(60, expSeconds - now + 60);
  await kv.put(`${PREFIX}${jti}`, "1", { expirationTtl: ttl });
}

export async function isJtiRevoked(kv: KVNamespace, jti: string): Promise<boolean> {
  const v = await kv.get(`${PREFIX}${jti}`);
  return v !== null;
}
