// KV-backed fixed-window rate limiter. Survives across Worker isolates and
// regions, unlike an in-memory Map. Bucket value is JSON: { count, resetAt }.
//
// KV is eventually consistent and rate-limited at ~1 write/s per key, which is
// acceptable for low-frequency events such as admin login attempts. For
// higher-throughput needs, replace with a Durable Object.

type BucketState = {
  count: number;
  resetAt: number; // epoch ms
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function isBucketState(value: unknown): value is BucketState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.count === "number" && typeof candidate.resetAt === "number";
}

function bucketKey(key: string): string {
  return `rl:${key}`;
}

async function readBucket(kv: KVNamespace, key: string): Promise<BucketState | null> {
  const raw = await kv.get(bucketKey(key), "json");
  return isBucketState(raw) ? raw : null;
}

async function writeBucket(
  kv: KVNamespace,
  key: string,
  bucket: BucketState,
): Promise<void> {
  // Auto-expire the entry shortly after the window closes so KV self-cleans.
  const ttlSeconds = Math.max(60, Math.ceil((bucket.resetAt - Date.now()) / 1000) + 60);
  await kv.put(bucketKey(key), JSON.stringify(bucket), { expirationTtl: ttlSeconds });
}

export async function consumeRateLimit(
  kv: KVNamespace,
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = await readBucket(kv, key);

  if (!existing || now >= existing.resetAt) {
    const fresh: BucketState = { count: 1, resetAt: now + windowMs };
    await writeBucket(kv, key, fresh);
    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  const updated: BucketState = { count: existing.count + 1, resetAt: existing.resetAt };
  await writeBucket(kv, key, updated);
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - updated.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export async function resetRateLimit(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(bucketKey(key));
}
