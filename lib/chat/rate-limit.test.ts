/**
 * Tests for rate limiting utilities
 * Requirements: 1.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, ExponentialBackoff } from './rate-limit';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
  });

  it('should allow requests within limit', () => {
    const result1 = rateLimiter.checkLimit('user1');
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = rateLimiter.checkLimit('user1');
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = rateLimiter.checkLimit('user1');
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('should block requests exceeding limit', () => {
    // Use up the limit
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user1');

    // Next request should be blocked
    const result = rateLimiter.checkLimit('user1');
    expect(result.allowed).toBe(false);
    expect(result.waitTimeMs).toBeGreaterThan(0);
  });

  it('should track different users separately', () => {
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user1');

    // user1 is at limit
    const result1 = rateLimiter.checkLimit('user1');
    expect(result1.allowed).toBe(false);

    // user2 should still be allowed
    const result2 = rateLimiter.checkLimit('user2');
    expect(result2.allowed).toBe(true);
  });

  it('should reset after window expires', async () => {
    // Use up the limit
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user1');

    // Should be blocked
    const result1 = rateLimiter.checkLimit('user1');
    expect(result1.allowed).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should be allowed again
    const result2 = rateLimiter.checkLimit('user1');
    expect(result2.allowed).toBe(true);
  });

  it('should reset specific user', () => {
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user1');

    // Should be blocked
    const result1 = rateLimiter.checkLimit('user1');
    expect(result1.allowed).toBe(false);

    // Reset user
    rateLimiter.reset('user1');

    // Should be allowed again
    const result2 = rateLimiter.checkLimit('user1');
    expect(result2.allowed).toBe(true);
  });

  it('should clear all limits', () => {
    rateLimiter.checkLimit('user1');
    rateLimiter.checkLimit('user2');

    expect(rateLimiter.getCount('user1')).toBe(1);
    expect(rateLimiter.getCount('user2')).toBe(1);

    rateLimiter.clear();

    expect(rateLimiter.getCount('user1')).toBe(0);
    expect(rateLimiter.getCount('user2')).toBe(0);
  });
});

describe('ExponentialBackoff', () => {
  let backoff: ExponentialBackoff;

  beforeEach(() => {
    backoff = new ExponentialBackoff(100, 1000, 3);
  });

  it('should calculate exponential delays', () => {
    const delay0 = backoff.calculateDelay(0);
    const delay1 = backoff.calculateDelay(1);
    const delay2 = backoff.calculateDelay(2);

    // Delays should increase exponentially (with jitter)
    expect(delay0).toBeGreaterThanOrEqual(100);
    expect(delay0).toBeLessThanOrEqual(125); // 100 + 25% jitter

    expect(delay1).toBeGreaterThanOrEqual(200);
    expect(delay1).toBeLessThanOrEqual(250); // 200 + 25% jitter

    expect(delay2).toBeGreaterThanOrEqual(400);
    expect(delay2).toBeLessThanOrEqual(500); // 400 + 25% jitter
  });

  it('should cap delay at max', () => {
    const backoffShort = new ExponentialBackoff(100, 300, 5);
    
    const delay3 = backoffShort.calculateDelay(3);
    const delay4 = backoffShort.calculateDelay(4);

    // Both should be capped at 300
    expect(delay3).toBeLessThanOrEqual(300);
    expect(delay4).toBeLessThanOrEqual(300);
  });

  it('should throw error when max retries exceeded', () => {
    expect(() => backoff.calculateDelay(3)).toThrow('Maximum retry attempts');
  });

  it('should execute function with retry on failure', async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    });

    const result = await backoff.executeWithRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn(async () => {
      throw new Error('Permanent failure');
    });

    const shouldRetry = (error: any) => false;

    await expect(backoff.executeWithRetry(fn, shouldRetry)).rejects.toThrow('Permanent failure');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn(async () => {
      throw new Error('Always fails');
    });

    await expect(backoff.executeWithRetry(fn)).rejects.toThrow('Always fails');
    expect(fn).toHaveBeenCalledTimes(3); // maxRetries
  });

  it('should return max retries', () => {
    expect(backoff.getMaxRetries()).toBe(3);
  });
});
