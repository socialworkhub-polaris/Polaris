/**
 * lib/rateLimit.ts
 * In-memory sliding-window rate limiter for protecting AI & Search endpoints.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((record, key) => {
      const valid = record.timestamps.filter((ts: number) => now - ts < 600000);
      if (valid.length === 0) {
        memoryStore.delete(key);
      } else {
        record.timestamps = valid;
      }
    });
  }, 600000);
}

export function checkRateLimit(
  req: Request, 
  limit: number = 20, 
  windowMs: number = 600000 // 10 minutes
): { allowed: boolean; remaining: number; resetInSec: number } {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = (forwarded ? forwarded.split(',')[0] : realIp) || '127.0.0.1';

  const now = Date.now();
  const record = memoryStore.get(ip) || { timestamps: [] };

  const activeTimestamps = record.timestamps.filter((ts: number) => now - ts < windowMs);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    const resetInSec = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSec: resetInSec > 0 ? resetInSec : 1,
    };
  }

  activeTimestamps.push(now);
  memoryStore.set(ip, { timestamps: activeTimestamps });

  return {
    allowed: true,
    remaining: limit - activeTimestamps.length,
    resetInSec: Math.ceil(windowMs / 1000),
  };
}
