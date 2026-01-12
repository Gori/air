/**
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, consider using Redis or Upstash.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const key = identifier
  const entry = rateLimitMap.get(key)

  // No existing entry or window has expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitMap.set(key, { count: 1, resetTime })
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime,
    }
  }

  // Within window, check count
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client identifier from request headers.
 * Uses X-Forwarded-For header (common with proxies/Vercel) or falls back to a default.
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback - in serverless, we may not have direct IP access
  return 'unknown'
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /** Strict: 10 requests per minute (for sensitive public endpoints) */
  strict: { limit: 10, windowMs: 60 * 1000 },
  /** Standard: 60 requests per minute */
  standard: { limit: 60, windowMs: 60 * 1000 },
  /** Lenient: 200 requests per minute */
  lenient: { limit: 200, windowMs: 60 * 1000 },
} as const
