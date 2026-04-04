/**
 * In-memory sliding window rate limiter.
 *
 * For production at scale, replace with Redis-backed implementation
 * (e.g., @upstash/ratelimit). This in-memory version works for single-instance
 * deployments and Vercel edge/serverless (per-instance).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60s to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    });
  }, 60_000);
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(key, newEntry);
    return { allowed: true, remaining: config.limit - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(req: Request): string {
  const headers = new Headers(req.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// Pre-configured rate limiters
export const RATE_LIMITS = {
  /** Public routes: 10 req/sec per IP */
  public: { limit: 10, windowSec: 1 },
  /** Authenticated routes: 50 req/sec per IP */
  authenticated: { limit: 50, windowSec: 1 },
  /** Portal token: 5 attempts per minute per IP (brute-force protection) */
  portal: { limit: 5, windowSec: 60 },
  /** Webhooks: 100 req/sec per IP */
  webhook: { limit: 100, windowSec: 1 },
} as const;
