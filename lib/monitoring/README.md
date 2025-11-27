# Monitoring System

This directory contains the monitoring and logging utilities for the TUM Community Platform.

## Overview

The monitoring system provides:
- Structured logging with context
- Log level configuration
- Sensitive data filtering
- Performance monitoring
- Query timing and slow query detection
- Metrics collection

## Logger

### Basic Usage
```typescript
import { logger } from '@/lib/monitoring';

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

### Contextual Logging
```typescript
import { createLogger } from '@/lib/monitoring';

const logger = createLogger({ userId: '123', service: 'api' });
logger.info('User action', { 
  operation: 'createPost',
  metadata: { postId: 'abc' }
});
```

### Error Logging
```typescript
import { logger } from '@/lib/monitoring';
import { DatabaseError } from '@/lib/errors';

const error = new DatabaseError('Query failed');
logger.logError(error, { 
  operation: 'getUser',
  userId: '123'
});
```

### Child Loggers
```typescript
const parentLogger = createLogger({ service: 'api' });
const childLogger = parentLogger.child({ operation: 'createUser' });

childLogger.info('Starting operation');
// Logs include both service and operation context
```

## Performance Monitoring

### Query Measurement
```typescript
import { measureQuery } from '@/lib/monitoring';

const result = await measureQuery(
  'getUserPosts',
  async () => {
    return await supabase.from('posts').select('*');
  },
  { userId: '123' }
);
```

### Operation Measurement
```typescript
import { measureOperation } from '@/lib/monitoring';

const result = await measureOperation(
  'processPayment',
  async () => {
    // Complex operation
    return result;
  }
);
```

### Manual Timing
```typescript
import { PerformanceTimer } from '@/lib/monitoring';

const timer = new PerformanceTimer('complex_operation');
// Do work
const duration = timer.stop();
console.log(`Operation took ${duration}ms`);
```

### Query Statistics
```typescript
import { getQueryStats, getSlowQueries } from '@/lib/monitoring';

const stats = getQueryStats();
console.log(`Total queries: ${stats.total}`);
console.log(`Average duration: ${stats.averageDuration}ms`);
console.log(`Slow queries: ${stats.slowQueries}`);

const slowQueries = getSlowQueries();
slowQueries.forEach(q => {
  console.log(`Slow query: ${q.query} (${q.duration}ms)`);
});
```

## Configuration

### Log Levels
Set via environment variable:
```bash
LOG_LEVEL=debug  # debug, info, warn, error
```

Default:
- Development: `debug`
- Production: `info`

### Slow Query Threshold
Set via environment variable:
```bash
SLOW_QUERY_THRESHOLD=500  # milliseconds
```

Default: 500ms

### Metrics Collection
Enable/disable via environment variable:
```bash
ENABLE_METRICS=true  # or false
```

Default: `true`

## Sensitive Data Filtering

The logger automatically filters sensitive data patterns:
- `password`
- `token`
- `secret`
- `api_key`
- `bearer`
- `jwt`
- `session`
- `cookie`
- `authorization`

Example:
```typescript
logger.info('User login', {
  metadata: {
    username: 'john',
    password: 'secret123',  // Will be filtered
    token: 'abc123'         // Will be filtered
  }
});
// Output: password: '[FILTERED]', token: '[FILTERED]'
```

## Log Format

### Development
Human-readable format:
```
[2025-11-27T21:00:00.000Z] INFO  User created {"userId":"123","operation":"createUser"}
```

### Production
JSON format for structured logging:
```json
{
  "level": "info",
  "message": "User created",
  "userId": "123",
  "operation": "createUser",
  "timestamp": "2025-11-27T21:00:00.000Z"
}
```

## Integration

The monitoring system is integrated into:
- Forum operations (posts, comments, subforums)
- Channel operations (channels, messages)
- Event operations (events, registrations)
- Middleware (authentication, session management)
- Database query utilities

## Testing

Run tests with:
```bash
npm test lib/monitoring/logger.test.ts
npm test lib/monitoring/performance.test.ts
```

## Best Practices

1. **Always include context**: Add userId, operation, and relevant metadata
2. **Use appropriate log levels**: 
   - `debug`: Detailed debugging information
   - `info`: General informational messages
   - `warn`: Warning messages for potential issues
   - `error`: Error messages for failures
3. **Measure performance-critical operations**: Use `measureQuery` for database operations
4. **Create child loggers for scoped operations**: Maintain context across related operations
5. **Never log sensitive data**: The system filters common patterns, but be cautious
