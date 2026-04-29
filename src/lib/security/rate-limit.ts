type BucketState = {
  count: number;
  resetAt: number;
};

const bucketState = new Map<string, BucketState>();

export function consumeRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = bucketState.get(key);

  if (!existing || now >= existing.resetAt) {
    bucketState.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (existing.count >= maxAttempts) {
    return false;
  }

  existing.count += 1;
  return true;
}

export function getRetryAfterSeconds(key: string): number {
  const existing = bucketState.get(key);
  if (!existing) {
    return 0;
  }

  return Math.max(0, Math.ceil((existing.resetAt - Date.now()) / 1000));
}
