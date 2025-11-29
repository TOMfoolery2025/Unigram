/**
 * Rate limiting utilities for chat API
 * Implements per-user rate limits and exponential backoff
 * Requirements: 1.1
 */

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limit entry tracking user requests
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate limiter for chat API
 * Implements sliding window rate limiting per user
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }) {
    this.limits = new Map();
    this.config = config;
  }

  /**
   * Check if a user has exceeded their rate limit
   * 
   * @param userId - The user ID to check
   * @returns Object with allowed status and wait time if rate limited
   */
  checkLimit(userId: string): { allowed: boolean; waitTimeMs?: number; remaining?: number } {
    const now = Date.now();
    const entry = this.limits.get(userId);

    // If no entry or window has expired, allow and create new entry
    if (!entry || now >= entry.resetTime) {
      this.limits.set(userId, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return { allowed: true, remaining: this.config.maxRequests - 1 };
    }

    // Check if user has exceeded limit
    if (entry.count >= this.config.maxRequests) {
      const waitTimeMs = entry.resetTime - now;
      return { allowed: false, waitTimeMs };
    }

    // Increment count and allow
    entry.count++;
    return { allowed: true, remaining: this.config.maxRequests - entry.count };
  }

  /**
   * Reset rate limit for a specific user
   * 
   * @param userId - The user ID to reset
   */
  reset(userId: string): void {
    this.limits.delete(userId);
  }

  /**
   * Clear all rate limit entries
   */
  clear(): void {
    this.limits.clear();
  }

  /**
   * Get current count for a user
   * 
   * @param userId - The user ID to check
   * @returns Current request count
   */
  getCount(userId: string): number {
    const entry = this.limits.get(userId);
    if (!entry || Date.now() >= entry.resetTime) {
      return 0;
    }
    return entry.count;
  }
}

/**
 * Exponential backoff calculator for LLM retries
 * Requirements: 1.1
 */
export class ExponentialBackoff {
  private baseDelayMs: number;
  private maxDelayMs: number;
  private maxRetries: number;

  constructor(
    baseDelayMs: number = 1000,
    maxDelayMs: number = 32000,
    maxRetries: number = 5
  ) {
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
    this.maxRetries = maxRetries;
  }

  /**
   * Calculate delay for a given retry attempt
   * 
   * @param attempt - The retry attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number): number {
    if (attempt >= this.maxRetries) {
      throw new Error(`Maximum retry attempts (${this.maxRetries}) exceeded`);
    }

    // Calculate exponential delay: baseDelay * 2^attempt
    const delay = this.baseDelayMs * Math.pow(2, attempt);
    
    // Add jitter (random 0-25% of delay) to prevent thundering herd
    const jitter = Math.random() * 0.25 * delay;
    
    // Cap at max delay
    return Math.min(delay + jitter, this.maxDelayMs);
  }

  /**
   * Execute a function with exponential backoff retry logic
   * 
   * @param fn - The async function to execute
   * @param shouldRetry - Optional function to determine if error is retryable
   * @returns Promise that resolves with the function result
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    shouldRetry?: (error: any) => boolean
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Check if we should retry this error
        if (shouldRetry && !shouldRetry(error)) {
          throw error;
        }

        // If this was the last attempt, throw
        if (attempt === this.maxRetries - 1) {
          throw error;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt);
        console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError;
  }

  /**
   * Get maximum number of retries
   */
  getMaxRetries(): number {
    return this.maxRetries;
  }
}

// Export singleton instances for use across the application
export const chatRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 requests per minute per user
  windowMs: 60000, // 1 minute window
});

export const llmBackoff = new ExponentialBackoff(
  1000,  // Start with 1 second
  32000, // Max 32 seconds
  5      // Max 5 retries
);
