/**
 * Rate limiter with Upstash Redis support.
 *
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
 * uses @upstash/ratelimit (sliding window) backed by Redis.
 * Otherwise, falls back to the in-memory implementation.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Redis-backed rate limiter (production)
// ---------------------------------------------------------------------------

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function createRedisLimiter(config: RateLimitConfig): Ratelimit {
  return new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSec} s`),
    analytics: false,
    prefix: "rl",
  });
}

// Cache Ratelimit instances per config fingerprint
const limiterCache = new Map<string, Ratelimit>();

function getRedisLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.limit}:${config.windowSec}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = createRedisLimiter(config);
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

// ---------------------------------------------------------------------------
// In-memory fallback (dev / single instance)
// ---------------------------------------------------------------------------

interface InMemoryEntry {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, InMemoryEntry>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    memStore.forEach((entry, key) => {
      if (now > entry.resetAt) {
        memStore.delete(key);
      }
    });
  }, 60_000);
}

function rateLimitInMemory(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const entry = memStore.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: InMemoryEntry = { count: 1, resetAt: now + windowMs };
    memStore.set(key, newEntry);
    return { allowed: true, remaining: config.limit - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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

/**
 * Rate-limit a request by key.
 *
 * Uses Upstash Redis when configured, otherwise falls back to in-memory.
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (redis) {
    const limiter = getRedisLimiter(config);
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }

  return rateLimitInMemory(key, config);
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
