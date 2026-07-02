import type { NextRequest } from 'next/server';

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

export function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || req.headers.get('x-real-ip') || 'unknown';
}

export function checkRateLimit(
  req: NextRequest,
  keyPrefix: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const key = `${keyPrefix}:${getClientIp(req)}`;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter(timestamp => now - timestamp < windowMs);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    const resetAt = bucket.timestamps[0] + windowMs;
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}
