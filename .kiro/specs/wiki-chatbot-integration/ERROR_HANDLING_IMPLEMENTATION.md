# LLM Service Error Handling Implementation

## Overview

This document describes the implementation of comprehensive error handling for LLM service failures in the wiki chatbot integration, fulfilling Requirement 7.3.

## Implementation Summary

### 1. Error Classification and Custom Error Class

**Location**: `lib/chat/llm.ts`

Created `LLMServiceError` class to categorize errors:
- Stores original error for debugging
- Includes `isRetryable` flag to indicate if user should retry
- Provides user-friendly error messages

```typescript
export class LLMServiceError extends Error {
  constructor(
    message: string,
    public readonly originalError?: any,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'LLMServiceError';
  }
}
```

### 2. API Error Handling

**Location**: `lib/chat/llm.ts` - `generateResponse()` function

Catches and categorizes OpenAI API errors:

#### Retryable Errors (isRetryable = true)
- **429 Rate Limit**: "Rate limit exceeded. Please try again in a moment."
- **503 Service Unavailable**: "The AI service is temporarily unavailable. Please try again later."
- **500 Internal Server Error**: "The AI service is temporarily unavailable. Please try again later."
- **ETIMEDOUT**: "Request timed out. Please try again."
- **ECONNRESET**: "Request timed out. Please try again."

#### Non-Retryable Errors (isRetryable = false)
- **401 Unauthorized**: "Authentication failed. Please check your API key configuration."

#### Streaming Errors
- Connection interruptions during streaming: "Connection interrupted while receiving response. Please try again."

### 3. Detailed Error Logging

**Requirement**: Log errors for monitoring

All errors are logged with detailed context:

```typescript
console.error('LLM API error:', {
  message: error.message,
  status: error.status,
  code: error.code,
  type: error.type,
  timestamp: new Date().toISOString(),
});
```

Logging locations:
- `lib/chat/llm.ts`: API errors, streaming errors, unexpected errors
- `app/api/chat/message/route.ts`: Endpoint errors with session and user context

### 4. API Route Error Handling

**Location**: `app/api/chat/message/route.ts`

The streaming endpoint:
1. Catches errors from the LLM service
2. Extracts error message and retryable flag
3. Sends error to client via Server-Sent Events
4. Logs detailed error information including sessionId and userId

```typescript
const errorData = JSON.stringify({
  type: 'error',
  data: errorMessage,
  retryable: isRetryable,
});
controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
```

### 5. Client-Side Error Display

**Location**: `components/wiki/chat-message-list.tsx`

Enhanced error display with retry button:
- Shows user-friendly error message in red alert box
- Displays "Try again" button when retry is available
- Accessible with proper ARIA attributes
- Keyboard navigable

```tsx
{error && (
  <div 
    className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
    role="alert"
    aria-live="assertive"
  >
    <div className="flex flex-col gap-2">
      <p className="text-sm text-destructive">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-destructive hover:text-destructive/80 underline self-start"
          aria-label="Retry sending message"
        >
          Try again
        </button>
      )}
    </div>
  </div>
)}
```

### 6. Retry Functionality

**Location**: `components/wiki/chat-widget.tsx`

Implemented retry mechanism:
1. Stores last message in state
2. Provides `handleRetry()` function
3. Clears error and resends message on retry
4. Passes retry handler to ChatMessageList component

```typescript
const [lastMessage, setLastMessage] = useState<string | null>(null);

const handleRetry = () => {
  if (lastMessage && currentSessionId) {
    setError(null);
    sendMessageToSession(currentSessionId, lastMessage);
  }
};
```

### 7. Stream Error Parsing

**Location**: `components/wiki/chat-widget.tsx`

Enhanced streaming response handler:
- Parses error events from Server-Sent Events
- Extracts error message from stream
- Throws error to be caught by outer error handler
- Logs parsing errors for debugging

## Error Flow

```
1. User sends message
   ↓
2. API calls LLM service
   ↓
3. LLM service encounters error
   ↓
4. Error is caught and categorized
   ↓
5. LLMServiceError is thrown with user-friendly message
   ↓
6. API route catches error and logs details
   ↓
7. Error sent to client via SSE with retryable flag
   ↓
8. Client displays error message with retry button
   ↓
9. User clicks "Try again"
   ↓
10. Message is resent automatically
```

## Testing

**Location**: `lib/chat/error-handling.test.ts`

Comprehensive test suite covering:
- LLMServiceError creation and properties
- Error categorization (retryable vs non-retryable)
- User-friendly error messages
- Original error preservation

All 12 error handling tests pass ✓

## User Experience

### Before Error Handling Enhancement
- Generic error messages
- No retry functionality
- Limited error logging
- No indication if retry would help

### After Error Handling Enhancement
- Specific, actionable error messages
- One-click retry button
- Comprehensive error logging with context
- Clear indication when retry is available
- Accessible error display with ARIA labels

## Monitoring and Debugging

All errors are logged with:
- Error message and type
- HTTP status code (if applicable)
- Error code (if applicable)
- Stack trace
- Timestamp
- Session ID and User ID (in API routes)

This enables:
- Quick identification of error patterns
- Debugging of specific user issues
- Monitoring of API reliability
- Detection of configuration problems

## Requirements Fulfilled

✅ **Requirement 7.3**: WHEN the LLM service is unavailable THEN the Chatbot SHALL display an error message and suggest trying again later

Implementation:
1. ✅ Catch API errors and timeouts
2. ✅ Display user-friendly error messages
3. ✅ Provide retry functionality
4. ✅ Log errors for monitoring

## Future Enhancements

Potential improvements:
1. Exponential backoff for automatic retries
2. Error rate monitoring dashboard
3. Fallback to cached responses
4. Queue system for rate-limited requests
5. User notification for prolonged outages
