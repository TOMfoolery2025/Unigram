# Rate Limiting Implementation

## Overview

This document describes the rate limiting implementation for the wiki chatbot integration, which ensures fair usage and prevents abuse of the chat API and LLM services.

**Requirements Addressed:** 1.1

## Components

### 1. Rate Limiter (`lib/chat/rate-limit.ts`)

The `RateLimiter` class implements per-user rate limiting using a sliding window algorithm:

- **Default Configuration:**
  - 10 requests per minute per user
  - 60-second sliding window
  
- **Features:**
  - Per-user tracking with user ID
  - Automatic window expiration
  - Remaining request count tracking
  - Wait time calculation when rate limited

**Usage:**
```typescript
import { chatRateLimiter } from '@/lib/chat/rate-limit';

const result = chatRateLimiter.checkLimit(userId);
if (!result.allowed) {
  // User is rate limited
  const waitTimeSeconds = Math.ceil((result.waitTimeMs || 0) / 1000);
  // Display wait time to user
}
```

### 2. Exponential Backoff (`lib/chat/rate-limit.ts`)

The `ExponentialBackoff` class implements retry logic with exponential backoff for LLM API calls:

- **Default Configuration:**
  - Base delay: 1 second
  - Max delay: 32 seconds
  - Max retries: 5 attempts
  - Jitter: 0-25% random variation to prevent thundering herd

- **Retry Strategy:**
  - Delay = baseDelay × 2^attempt + jitter
  - Only retries on transient errors (429, 500, 503, timeouts)
  - Non-retryable errors (401, 400) fail immediately

**Usage:**
```typescript
import { llmBackoff } from '@/lib/chat/rate-limit';

const result = await llmBackoff.executeWithRetry(
  async () => {
    return await apiCall();
  },
  (error) => {
    // Return true to retry, false to fail immediately
    return error.status === 429 || error.status === 503;
  }
);
```

### 3. API Integration (`app/api/chat/message/route.ts`)

The chat message API endpoint enforces rate limits before processing requests:

1. **Authentication Check** - Verify user is authenticated
2. **Rate Limit Check** - Check if user has exceeded their limit
3. **Rate Limit Response** - Return 429 status with wait time if limited
4. **Process Request** - Handle message if within limits

**Response Headers:**
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when the rate limit resets
- `Retry-After`: Seconds to wait before retrying (when rate limited)

**Error Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please wait 45 seconds before trying again.",
  "waitTimeMs": 45000,
  "retryAfter": 45
}
```

### 4. LLM Service Integration (`lib/chat/llm.ts`)

The LLM service uses exponential backoff for all OpenAI API calls:

- Automatically retries on transient failures
- Logs retry attempts for monitoring
- Provides user-friendly error messages
- Distinguishes between retryable and non-retryable errors

**Retryable Errors:**
- 429 (Rate Limit)
- 500 (Internal Server Error)
- 503 (Service Unavailable)
- ETIMEDOUT (Timeout)
- ECONNRESET (Connection Reset)

**Non-Retryable Errors:**
- 401 (Unauthorized - invalid API key)
- 400 (Bad Request - invalid parameters)

### 5. UI Integration

#### Chat Context (`lib/chat/chat-context.tsx`)

The chat context handles rate limit errors and displays user-friendly messages:

- Parses 429 responses from the API
- Extracts wait time from error response
- Formats wait time in human-readable format (minutes and seconds)
- Displays rate limit errors with ⏱️ emoji for visual distinction

**Error Message Format:**
```
⏱️ Rate limit exceeded. Please wait 1 minute and 30 seconds before trying again.
```

#### Message List (`components/wiki/chat-message-list.tsx`)

The message list component displays rate limit errors with special styling:

- **Visual Distinction:**
  - Amber/yellow background for rate limit errors
  - Red background for other errors
  
- **User Guidance:**
  - Clear wait time display
  - Explanation that request will be processed after wait time
  - No retry button for rate limit errors (prevents further limiting)

## Configuration

Rate limiting can be configured by modifying the singleton instances in `lib/chat/rate-limit.ts`:

```typescript
// Chat API rate limiter
export const chatRateLimiter = new RateLimiter({
  maxRequests: 10,  // Requests per window
  windowMs: 60000,  // Window size in milliseconds (1 minute)
});

// LLM retry backoff
export const llmBackoff = new ExponentialBackoff(
  1000,   // Base delay (1 second)
  32000,  // Max delay (32 seconds)
  5       // Max retries
);
```

## Testing

Comprehensive tests are provided in `lib/chat/rate-limit.test.ts`:

### Rate Limiter Tests
- ✅ Allows requests within limit
- ✅ Blocks requests exceeding limit
- ✅ Tracks different users separately
- ✅ Resets after window expires
- ✅ Supports manual reset
- ✅ Supports clearing all limits

### Exponential Backoff Tests
- ✅ Calculates exponential delays correctly
- ✅ Caps delay at maximum
- ✅ Throws error when max retries exceeded
- ✅ Executes function with retry on failure
- ✅ Does not retry non-retryable errors
- ✅ Throws after max retries

**Run Tests:**
```bash
npm test -- lib/chat/rate-limit.test.ts
```

## Monitoring and Observability

### Logging

The implementation includes comprehensive logging:

1. **Rate Limit Events:**
   - User ID
   - Wait time
   - Timestamp

2. **Retry Attempts:**
   - Attempt number
   - Delay duration
   - Error details

3. **LLM Errors:**
   - Error type and status
   - Retryability
   - Timestamp
   - User context

### Metrics to Monitor

- **Rate Limit Hit Rate:** Percentage of requests that are rate limited
- **Average Wait Time:** Average wait time when rate limited
- **Retry Success Rate:** Percentage of retries that succeed
- **LLM Error Rate:** Frequency of LLM service errors by type

## Best Practices

1. **Adjust Limits Based on Usage:**
   - Monitor rate limit hit rates
   - Increase limits if legitimate users are frequently limited
   - Decrease limits if abuse is detected

2. **Monitor LLM Costs:**
   - Track retry frequency
   - Adjust max retries if costs are too high
   - Consider implementing per-user cost tracking

3. **User Communication:**
   - Always display clear wait times
   - Explain why rate limiting exists
   - Provide alternative actions (browse wiki, search)

4. **Error Handling:**
   - Log all rate limit events for analysis
   - Alert on unusual patterns (sudden spikes)
   - Implement circuit breakers for cascading failures

## Future Enhancements

1. **Redis-Based Rate Limiting:**
   - Current implementation uses in-memory storage
   - For multi-instance deployments, use Redis for shared state

2. **Tiered Rate Limits:**
   - Different limits for different user types
   - Premium users get higher limits

3. **Adaptive Rate Limiting:**
   - Adjust limits based on system load
   - Increase limits during low-traffic periods

4. **Rate Limit Dashboard:**
   - Real-time monitoring of rate limit metrics
   - User-specific rate limit status
   - Historical trends and patterns

## Troubleshooting

### Users Frequently Hit Rate Limits

**Symptoms:** Many users reporting rate limit errors

**Solutions:**
1. Increase `maxRequests` in rate limiter configuration
2. Increase `windowMs` to allow more requests over longer period
3. Investigate if there's a bot or automated tool causing issues

### LLM Retries Failing

**Symptoms:** High retry failure rate, users seeing timeout errors

**Solutions:**
1. Check OpenAI API status
2. Verify API key is valid and has sufficient quota
3. Increase `maxRetries` if transient failures are common
4. Increase `maxDelayMs` to allow longer waits between retries

### Rate Limiter Not Working

**Symptoms:** Users can send unlimited requests

**Solutions:**
1. Verify rate limiter is imported and used in API route
2. Check that user ID is being passed correctly
3. Ensure rate limiter instance is shared (singleton)
4. Check for errors in rate limit check logic

## Summary

The rate limiting implementation provides:

✅ **Per-user rate limits** - 10 requests per minute per user
✅ **Exponential backoff** - Automatic retry with exponential delays
✅ **User-friendly errors** - Clear wait times and guidance
✅ **Comprehensive testing** - 13 passing tests
✅ **Production-ready** - Logging, monitoring, and error handling

This implementation ensures fair usage of the chat API while providing a good user experience with clear feedback and automatic retry logic.
