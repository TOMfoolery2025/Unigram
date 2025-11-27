# Design Document

## Overview

This design document outlines the approach to transform the TUM Community Platform (Unigram) from a buggy development application into a production-ready, well-documented, and performant system. The design focuses on three core pillars: comprehensive documentation, reliable authentication, and optimized performance - all without changing the visual appearance of the application.

The current application suffers from:
- **Authentication Issues**: Middleware creates new Supabase clients on every request, causing token refresh problems and session inconsistencies
- **Performance Problems**: N+1 query patterns, missing connection pooling, and inefficient data fetching
- **Documentation Gaps**: Scattered and incomplete documentation making onboarding and maintenance difficult
- **Code Organization**: Inconsistent patterns and lack of centralized utilities

## Architecture

### High-Level Architecture

The application follows a Next.js 14 App Router architecture with Supabase as the backend:

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Middleware │  │  Server      │  │   Client     │     │
│  │   (Auth)     │  │  Components  │  │  Components  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │   Supabase  │                         │
│                    │   Clients   │                         │
│                    └──────┬──────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │    Supabase    │
                    │   (PostgreSQL) │
                    └────────────────┘
```

### Documentation Structure

```
docs/
├── README.md                    # Main entry point
├── ARCHITECTURE.md              # System architecture overview
├── AUTHENTICATION.md            # Auth flow and middleware
├── DATABASE.md                  # Schema, queries, optimization
├── PERFORMANCE.md               # Performance guidelines
├── DEPLOYMENT.md                # Production deployment guide
├── TROUBLESHOOTING.md           # Common issues and solutions
├── CONTRIBUTING.md              # Development guidelines
└── API.md                       # API routes documentation
```

## Components and Interfaces

### 1. Authentication System

#### Middleware Enhancement

**Current Issues:**
- Creates new Supabase client on every request
- Inconsistent cookie handling
- No session refresh mechanism
- Redundant authentication checks

**Improved Design:**

```typescript
// middleware.ts
interface MiddlewareConfig {
  publicRoutes: string[];
  authRoutes: string[];
  guestRoutes: string[];
}

interface SessionResult {
  user: User | null;
  session: Session | null;
  needsRefresh: boolean;
}

async function getSession(request: NextRequest): Promise<SessionResult>
async function refreshSession(request: NextRequest): Promise<void>
async function handleProtectedRoute(request: NextRequest, user: User | null): Promise<NextResponse>
async function handleAuthRoute(request: NextRequest, user: User | null): Promise<NextResponse>
```

**Key Improvements:**
- Single Supabase client creation per request
- Automatic session refresh before expiry
- Proper cookie management with consistent options
- Route-based authentication logic separation

#### Supabase Client Management

**Current Issues:**
- Client created on every function call
- No connection pooling
- Inconsistent client usage patterns

**Improved Design:**

```typescript
// lib/supabase/client.ts
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(/* ... */);
  return browserClient;
}

// lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient> {
  // Uses Next.js cookies() which is request-scoped
  // No caching needed as Next.js handles this
}
```

### 2. Database Query Optimization

#### Query Pattern Improvements

**Current Issues:**
- N+1 queries (fetching related data in loops)
- Selecting all columns with `*`
- No query result caching
- Multiple round trips for related data

**Optimized Patterns:**

```typescript
// Before: N+1 pattern
const posts = await supabase.from('posts').select('*');
for (const post of posts) {
  const { data: author } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', post.author_id);
}

// After: Single query with join
const posts = await supabase
  .from('posts')
  .select(`
    id,
    title,
    content,
    created_at,
    user_profiles!posts_author_id_fkey(display_name)
  `);
```

#### Query Utilities

```typescript
// lib/database/query-utils.ts
interface QueryOptions {
  select?: string[];
  limit?: number;
  offset?: number;
  orderBy?: { column: string; ascending: boolean };
}

interface BatchQueryOptions {
  batchSize: number;
  parallel: boolean;
}

function buildSelectClause(columns: string[]): string
function batchQuery<T>(ids: string[], fetcher: (ids: string[]) => Promise<T[]>, options: BatchQueryOptions): Promise<T[]>
function withCache<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T>
```

#### Connection Management

```typescript
// lib/database/connection.ts
interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
}

// Supabase handles connection pooling automatically
// Document best practices for client reuse
```

### 3. Performance Monitoring

```typescript
// lib/monitoring/performance.ts
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
}

interface PerformanceLogger {
  logQuery(metrics: QueryMetrics): void;
  logSlowQuery(metrics: QueryMetrics): void;
  getMetrics(): QueryMetrics[];
}

function createPerformanceLogger(config: { slowQueryThreshold: number }): PerformanceLogger
function measureQuery<T>(name: string, fn: () => Promise<T>): Promise<T>
```

### 4. Error Handling

```typescript
// lib/errors/handler.ts
interface AppError {
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
  details?: any;
}

class DatabaseError extends Error implements AppError
class AuthenticationError extends Error implements AppError
class ValidationError extends Error implements AppError

function handleError(error: Error): AppError
function logError(error: AppError, context: any): void
```

## Data Models

### Enhanced Type Definitions

```typescript
// types/database.types.ts
// Keep existing Supabase-generated types

// types/enhanced.ts
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  metadata?: {
    duration: number;
    cached: boolean;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  error: Error | null;
}

export interface CacheConfig {
  key: string;
  ttl: number;
  revalidate?: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, several properties can be consolidated:

**Redundancies Identified:**
- Properties 2.1-2.6 all relate to middleware authentication behavior and can be tested together in comprehensive middleware tests
- Properties 3.3, 4.2, and 4.3 all relate to query optimization and can be combined into query pattern validation
- Properties 6.1, 6.2, and 6.3 all relate to logging behavior and can be tested together
- Documentation properties (1.1-1.5, 8.1, 8.2, 8.4, 8.5) are all examples of file existence checks

**Consolidated Approach:**
- Group authentication properties into comprehensive middleware behavior tests
- Combine query optimization properties into query pattern analysis
- Merge logging properties into unified logging behavior tests
- Treat documentation as examples rather than properties

### Correctness Properties

Property 1: Authenticated session grants route access
*For any* authenticated user with a valid session, accessing a protected route should succeed without redirect to login
**Validates: Requirements 2.1**

Property 2: Expired session triggers automatic refresh
*For any* user with an expired but refreshable session, the middleware should refresh the token automatically and allow continued access
**Validates: Requirements 2.2**

Property 3: Unauthenticated access redirects with destination preservation
*For any* protected route accessed without authentication, the system should redirect to login and preserve the original destination URL
**Validates: Requirements 2.3**

Property 4: Public routes skip authentication checks
*For any* public route, the middleware should not perform authentication checks or database queries
**Validates: Requirements 2.4**

Property 5: Cookie operations are consistent across route types
*For any* route type (public, protected, auth), cookie set/get/remove operations should use consistent options and succeed
**Validates: Requirements 2.5, 2.6**

Property 6: Page load completes within performance budget
*For any* page in the application, initial render should complete within 2 seconds under standard network conditions (simulated 3G)
**Validates: Requirements 3.1**

Property 7: Queries select only required columns
*For any* database query in the codebase, the select clause should specify explicit columns rather than using SELECT *
**Validates: Requirements 3.3**

Property 8: Repeated queries utilize caching
*For any* query executed multiple times with identical parameters within a short time window, subsequent executions should return cached results
**Validates: Requirements 3.4**

Property 9: Client instances are reused
*For any* request context, database client creation should return the same instance when called multiple times
**Validates: Requirements 4.1**

Property 10: Queries use parameterized statements
*For any* database query with user input, the query should use parameterized statements rather than string concatenation
**Validates: Requirements 4.2**

Property 11: Related data fetching avoids N+1 patterns
*For any* operation fetching a collection with related data, the total number of queries should be constant regardless of collection size
**Validates: Requirements 4.3**

Property 12: Write operations are batched when possible
*For any* sequence of multiple write operations to the same table, the system should batch them into a single query when possible
**Validates: Requirements 4.4**

Property 13: Error handling includes cleanup
*For any* database operation that throws an error, the system should properly clean up resources (close connections, clear state)
**Validates: Requirements 4.5**

Property 14: Errors log with sufficient context
*For any* error that occurs, the logging system should capture error type, message, stack trace, and relevant context
**Validates: Requirements 6.1**

Property 15: Slow queries are logged with metrics
*For any* query exceeding the slow query threshold, the system should log the query text, duration, and parameters
**Validates: Requirements 6.2**

Property 16: Development logs exclude sensitive data
*For any* log entry in development mode, the content should not contain passwords, tokens, or other sensitive patterns
**Validates: Requirements 6.3**

Property 17: Error messages are user-friendly
*For any* error presented to users, the message should be human-readable and not expose internal implementation details
**Validates: Requirements 7.2**

Property 18: Concurrent requests handle efficiently
*For any* set of concurrent requests to the same endpoint, the system should handle them without connection pool exhaustion or deadlocks
**Validates: Requirements 7.4**

Property 19: Environment variables are documented
*For any* environment variable used in the codebase, it should be documented in .env.example with description
**Validates: Requirements 8.3**

## Error Handling

### Error Classification

```typescript
enum ErrorCategory {
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

interface ErrorContext {
  category: ErrorCategory;
  operation: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### Error Handling Strategy

1. **Database Errors**
   - Catch and classify Supabase errors
   - Log with query context (sanitized)
   - Return user-friendly messages
   - Implement retry logic for transient failures

2. **Authentication Errors**
   - Handle token expiration gracefully
   - Provide clear feedback for invalid credentials
   - Log security-relevant events
   - Redirect appropriately based on error type

3. **Validation Errors**
   - Use Zod for input validation
   - Return structured error responses
   - Provide field-level error messages
   - Log validation failures for monitoring

4. **Network Errors**
   - Implement exponential backoff for retries
   - Provide offline indicators
   - Cache data when possible
   - Log network failures for debugging

### Error Logging

```typescript
interface ErrorLog {
  id: string;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: ErrorContext;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function logError(error: Error, context: ErrorContext): void {
  // Development: Log full details to console
  // Production: Send to error tracking service
  // Always: Sanitize sensitive data
}
```

## Testing Strategy

### Unit Testing

Unit tests will cover:
- Utility functions (query builders, formatters, validators)
- Error handling functions
- Client creation and caching logic
- Route configuration and matching
- Performance monitoring utilities

**Testing Framework:** Vitest (already configured)

**Example Tests:**
```typescript
describe('Query Utils', () => {
  it('should build select clause with specified columns', () => {
    const columns = ['id', 'name', 'email'];
    const result = buildSelectClause(columns);
    expect(result).toBe('id,name,email');
  });

  it('should handle nested relations in select clause', () => {
    const columns = ['id', 'user_profiles(display_name)'];
    const result = buildSelectClause(columns);
    expect(result).toBe('id,user_profiles(display_name)');
  });
});

describe('Error Handler', () => {
  it('should classify database errors correctly', () => {
    const error = new Error('relation "users" does not exist');
    const appError = handleError(error);
    expect(appError.code).toBe('DATABASE_ERROR');
    expect(appError.userMessage).not.toContain('relation');
  });
});
```

### Property-Based Testing

Property-based tests will verify universal behaviors across many inputs using **fast-check** library.

**Library:** fast-check (to be added)

**Configuration:** Each property test should run minimum 100 iterations

**Test Organization:**
- Co-locate property tests with implementation files using `.property.test.ts` suffix
- Tag each test with the property number from this design document
- Use format: `**Feature: app-optimization-and-documentation, Property {number}: {property_text}**`

**Example Property Tests:**
```typescript
import fc from 'fast-check';

describe('Property 7: Queries select only required columns', () => {
  /**
   * Feature: app-optimization-and-documentation, Property 7: Queries select only required columns
   * For any database query in the codebase, the select clause should specify explicit columns
   */
  it('should not use SELECT * in any query', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        (columns) => {
          const query = buildQuery({ select: columns });
          expect(query).not.toContain('*');
          expect(query).toContain(columns.join(','));
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 11: Related data fetching avoids N+1 patterns', () => {
  /**
   * Feature: app-optimization-and-documentation, Property 11: Related data fetching avoids N+1 patterns
   * For any operation fetching a collection with related data, query count should be constant
   */
  it('should use constant queries regardless of collection size', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (itemCount) => {
          const queryCounter = new QueryCounter();
          await fetchPostsWithAuthors(itemCount, queryCounter);
          
          // Should be 1 query regardless of itemCount (using joins)
          expect(queryCounter.count).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify:
- Middleware authentication flows
- Database query patterns in real scenarios
- Error handling across layers
- Performance under load

**Approach:**
- Use Vitest with test database
- Mock Supabase responses where appropriate
- Test complete user flows
- Measure performance metrics

### Performance Testing

Performance tests will verify:
- Page load times meet requirements
- Query execution times are acceptable
- No memory leaks in long-running operations
- Concurrent request handling

**Tools:**
- Lighthouse CI for page load metrics
- Custom query timing utilities
- Memory profiling in Node.js

## Implementation Phases

### Phase 1: Documentation Foundation
- Create comprehensive documentation structure
- Document current architecture and patterns
- Establish contribution guidelines
- Create troubleshooting guides

### Phase 2: Authentication Fixes
- Fix middleware client creation
- Implement session refresh logic
- Improve cookie handling
- Add authentication tests

### Phase 3: Query Optimization
- Audit existing queries for N+1 patterns
- Implement query utilities
- Add connection pooling best practices
- Optimize slow queries

### Phase 4: Performance Improvements
- Implement caching layer
- Add performance monitoring
- Optimize bundle size
- Improve initial load time

### Phase 5: Production Readiness
- Add error tracking
- Implement health checks
- Create deployment guides
- Add monitoring dashboards

## Performance Targets

### Page Load Performance
- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.0s
- **Time to Interactive (TTI):** < 3.0s
- **Cumulative Layout Shift (CLS):** < 0.1

### Database Performance
- **Simple queries:** < 50ms
- **Complex queries with joins:** < 200ms
- **Slow query threshold:** 500ms
- **Connection acquisition:** < 10ms

### API Response Times
- **GET requests:** < 200ms (p95)
- **POST requests:** < 500ms (p95)
- **Concurrent requests:** 100+ req/s

## Security Considerations

### Authentication Security
- Use httpOnly cookies for session tokens
- Implement CSRF protection
- Validate session on every request
- Automatic session expiry and refresh

### Database Security
- Use parameterized queries exclusively
- Implement Row Level Security (RLS) policies
- Validate all user inputs
- Sanitize error messages

### Environment Security
- Never commit secrets to repository
- Use environment variables for configuration
- Implement secret rotation procedures
- Document security best practices

## Monitoring and Observability

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rates by category
- Database query performance
- Authentication success/failure rates
- Cache hit rates

### Logging Strategy
- **Development:** Verbose console logging
- **Production:** Structured JSON logs
- **Error Tracking:** Integration with error tracking service
- **Performance:** Query timing and slow query logs

### Health Checks
```typescript
// app/api/health/route.ts
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: boolean;
    authentication: boolean;
  };
}
```

## Migration Strategy

### Incremental Rollout
1. **Week 1:** Documentation and monitoring
2. **Week 2:** Authentication fixes
3. **Week 3:** Query optimization
4. **Week 4:** Performance improvements
5. **Week 5:** Production readiness

### Rollback Plan
- Keep existing code functional during migration
- Feature flags for new implementations
- Database migrations with rollback scripts
- Monitoring for regression detection

## Success Criteria

### Documentation
- ✓ All major systems documented
- ✓ Setup time for new developers < 30 minutes
- ✓ Troubleshooting guide covers 80% of common issues

### Authentication
- ✓ Zero authentication-related errors in production
- ✓ Session refresh success rate > 99%
- ✓ Proper redirect behavior in all scenarios

### Performance
- ✓ All pages meet performance targets
- ✓ No N+1 query patterns in codebase
- ✓ Database query time < 200ms (p95)

### Production Readiness
- ✓ Error tracking implemented
- ✓ Health checks operational
- ✓ Deployment documentation complete
- ✓ Zero critical security issues
