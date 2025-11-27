# Error Handling System

This directory contains the error handling utilities for the TUM Community Platform.

## Overview

The error handling system provides:
- Structured error types with consistent properties
- Automatic error classification
- Sensitive data sanitization
- User-friendly error messages
- Retry detection for transient errors

## Error Types

### BaseAppError
Base class for all application errors with the following properties:
- `code`: Error code (e.g., 'DATABASE_ERROR')
- `message`: Internal error message
- `userMessage`: User-friendly error message
- `statusCode`: HTTP status code
- `category`: Error category (database, authentication, validation, network, unknown)
- `details`: Additional error context

### Specific Error Types

#### DatabaseError
For database-related errors (status 500)
```typescript
throw new DatabaseError('Query failed', { query: 'SELECT *' });
```

#### AuthenticationError
For authentication/authorization errors (status 401)
```typescript
throw new AuthenticationError('Invalid token', 'Please log in again');
```

#### ValidationError
For input validation errors (status 400)
```typescript
throw new ValidationError('Invalid email format', { field: 'email' });
```

#### NetworkError
For network-related errors (status 503)
```typescript
throw new NetworkError('Connection timeout');
```

## Usage

### Error Classification
```typescript
import { handleError } from '@/lib/errors';

try {
  // Some operation
} catch (error) {
  const appError = handleError(error);
  // appError is now a properly classified AppError
}
```

### Error Sanitization
```typescript
import { sanitizeError } from '@/lib/errors';

const error = new DatabaseError('Query failed', { 
  password: 'secret',
  userId: '123' 
});

const sanitized = sanitizeError(error);
// sanitized.details.password === '[REDACTED]'
// sanitized.details.userId === '123'
```

### Retry Detection
```typescript
import { isRetryableError } from '@/lib/errors';

const error = new NetworkError('Timeout');
if (isRetryableError(error)) {
  // Retry the operation
}
```

## Integration

The error handling system is integrated into:
- Forum operations (posts, comments, subforums)
- Channel operations (channels, messages)
- Event operations (events, registrations)
- Middleware (authentication, session management)

## Testing

Run tests with:
```bash
npm test lib/errors/handler.test.ts
```
