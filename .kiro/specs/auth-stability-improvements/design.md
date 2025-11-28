# Design Document

## Overview

This design addresses authentication stability issues in the TUM Community Platform by implementing caching, debouncing, lenient session handling, and improved state synchronization. The solution focuses on reducing unnecessary authentication checks, preventing login/logout loops, and providing a smoother user experience without compromising security.

The core strategy involves:
1. Implementing session caching in middleware to reduce redundant checks
2. Adding debouncing and deduplication to the Auth Provider
3. Making session validation more lenient with graceful fallbacks
4. Improving Protected Route component to minimize flickering
5. Ensuring atomic cookie updates to prevent race conditions

## Architecture

### Current Architecture Issues

The current authentication flow has several problems:

1. **Excessive Checks**: Every page navigation triggers full authentication validation in both middleware and Auth Provider
2. **Race Conditions**: Concurrent cookie updates in middleware can create inconsistent state
3. **Aggressive Refresh**: Session refresh logic triggers too frequently (within 5 minutes of expiry)
4. **No Caching**: Session validation results are never cached, causing repeated database queries
5. **State Conflicts**: Middleware and Auth Provider can have conflicting authentication states
6. **Flickering UI**: Protected routes show loading states even when auth status is already known

### Improved Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Request                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Middleware Layer                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Check Session Cache (in-memory, 30s TTL)           │ │
│  │  2. If cached: Use cached session                      │ │
│  │  3. If not cached: Validate with Supabase              │ │
│  │  4. Atomic cookie updates (single response object)     │ │
│  │  5. Lenient refresh (only if < 2 min to expiry)        │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Client-Side Rendering                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Auth Provider (React Context)             │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  1. Single initialization check                  │ │ │
│  │  │  2. Debounced state updates (300ms)              │ │ │
│  │  │  3. Deduplication of concurrent requests         │ │ │
│  │  │  4. Graceful error handling (maintain state)     │ │ │
│  │  │  5. Sync with server state via auth events       │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Protected Route Component                   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  1. Check loading state (only show if unknown)  │ │ │
│  │  │  2. Immediate render if auth confirmed           │ │ │
│  │  │  3. Prevent layout shift with skeleton           │ │ │
│  │  │  4. Single redirect (no loops)                   │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Session Cache (Middleware)

A lightweight in-memory cache for session validation results to reduce redundant Supabase calls.

```typescript
interface SessionCacheEntry {
  user: User | null;
  expiresAt: number;
  cachedAt: number;
}

interface SessionCache {
  get(sessionId: string): SessionCacheEntry | null;
  set(sessionId: string, entry: SessionCacheEntry): void;
  clear(sessionId: string): void;
  cleanup(): void; // Remove expired entries
}
```

**Cache Strategy:**
- TTL: 30 seconds (balances freshness with performance)
- Key: Session token hash
- Eviction: Automatic cleanup on each request + periodic cleanup
- Invalidation: On logout, session refresh, or explicit clear

### 2. Enhanced Middleware

```typescript
interface MiddlewareConfig {
  publicRoutes: string[];
  authRoutes: string[];
  guestRoutes: string[];
  sessionRefreshThreshold: number; // seconds before expiry
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
}

interface MiddlewareResponse {
  user: User | null;
  shouldRedirect: boolean;
  redirectUrl?: string;
  cacheHit: boolean;
}
```

**Key Improvements:**
- Session caching to reduce Supabase calls
- Atomic cookie updates (single response object)
- Lenient refresh threshold (2 minutes instead of 5)
- Graceful error handling (fallback to existing session)
- Reduced logging verbosity

### 3. Debounced Auth Provider

```typescript
interface AuthProviderState {
  user: UserProfile | null;
  loading: boolean;
  isEmailVerified: boolean;
  lastUpdate: number;
  pendingUpdate: boolean;
}

interface AuthProviderConfig {
  debounceMs: number; // 300ms default
  enableDeduplication: boolean;
  maxRetries: number;
}
```

**Key Improvements:**
- Debounced state updates (300ms) to prevent rapid re-renders
- Request deduplication (prevent concurrent refreshUser calls)
- Graceful error handling (maintain existing state on errors)
- Single initialization check
- Optimized auth state listener

### 4. Improved Protected Route

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  requireAdmin?: boolean;
  requireEventCreator?: boolean;
  fallback?: React.ReactNode; // Custom loading component
  redirectTo?: string; // Custom redirect destination
}

interface ProtectedRouteState {
  shouldRender: boolean;
  shouldRedirect: boolean;
  redirectUrl: string | null;
}
```

**Key Improvements:**
- Show loading only when auth status is truly unknown
- Prevent layout shift with skeleton/fallback
- Single redirect (no loops)
- Immediate render when auth is confirmed
- Custom fallback support

## Data Models

### Session Cache Entry

```typescript
interface SessionCacheEntry {
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
  } | null;
  expiresAt: number; // Unix timestamp
  cachedAt: number; // Unix timestamp
}
```

### Auth Provider State

```typescript
interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isEmailVerified: boolean;
  error: Error | null;
  lastUpdate: number;
}
```

### Middleware Session Info

```typescript
interface SessionInfo {
  user: User | null;
  session: Session | null;
  expiresAt: number | null;
  needsRefresh: boolean;
  fromCache: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Session cache reduces redundant checks

*For any* sequence of requests with the same session token within the cache TTL, only the first request should perform a Supabase authentication check, and subsequent requests should use the cached result.

**Validates: Requirements 1.1, 1.2**

### Property 2: Debouncing prevents rapid state updates

*For any* sequence of authentication state changes occurring within the debounce window (300ms), only the final state should trigger a React re-render.

**Validates: Requirements 1.4**

### Property 3: Cookie updates are atomic

*For any* middleware execution, all cookie modifications (set/remove operations) should be applied to a single response object, ensuring no partial updates occur.

**Validates: Requirements 2.1, 2.5**

### Property 4: Session refresh is lenient

*For any* valid session that expires more than 2 minutes in the future, the Auth System should not attempt to refresh it.

**Validates: Requirements 1.3, 3.1**

### Property 5: Auth Provider deduplicates concurrent requests

*For any* set of concurrent refreshUser() calls, only one should execute while others wait for the result.

**Validates: Requirements 1.2, 2.5**

### Property 6: Profile fetch failures don't log users out

*For any* authenticated user where profile fetching fails, the Auth System should maintain authentication with basic profile information derived from the auth user object.

**Validates: Requirements 3.3**

### Property 7: Protected routes show loading only when unknown

*For any* protected route access where the Auth Provider has already determined authentication status (loading = false), the Protected Route component should not display a loading state.

**Validates: Requirements 4.1, 4.5**

### Property 8: Middleware redirects are deterministic

*For any* given authentication state and request path, the middleware should produce the same redirect decision, preventing redirect loops.

**Validates: Requirements 2.3, 4.3, 4.4**

### Property 9: Silent refresh before re-login

*For any* expired session, the Auth System should attempt a silent refresh using the refresh token before requiring the user to log in again.

**Validates: Requirements 3.4**

### Property 10: Session refresh allows continued access

*For any* session refresh operation in progress, the Auth System should allow the user to continue using the application with their existing session.

**Validates: Requirements 3.5**

## Error Handling

### Middleware Error Handling

1. **Session Validation Errors**
   - Fallback: Use existing session if available
   - Log: Error details with context
   - Action: Continue with null user if no fallback

2. **Session Refresh Errors**
   - Fallback: Keep existing session if still valid
   - Log: Refresh failure with timing
   - Action: Attempt getUser() as secondary fallback

3. **Cookie Update Errors**
   - Fallback: Continue without cookie update
   - Log: Cookie error (may indicate browser restrictions)
   - Action: Session may not persist but request proceeds

### Auth Provider Error Handling

1. **User Fetch Errors**
   - Fallback: Maintain current user state
   - Log: Error with operation context
   - Action: Don't clear user on transient errors

2. **Profile Fetch Errors**
   - Fallback: Create basic profile from auth user
   - Log: Profile error
   - Action: Allow authentication with minimal profile

3. **Auth State Listener Errors**
   - Fallback: Continue with current state
   - Log: Listener error
   - Action: Attempt to re-establish listener

### Protected Route Error Handling

1. **Redirect Errors**
   - Fallback: Show error message
   - Log: Redirect failure
   - Action: Provide manual navigation link

2. **Auth Check Timeout**
   - Fallback: Show loading state with timeout message
   - Log: Timeout event
   - Action: Provide retry button

## Testing Strategy

### Unit Testing

We'll use Vitest for unit testing with the following focus areas:

1. **Session Cache Tests**
   - Cache hit/miss scenarios
   - TTL expiration
   - Cleanup functionality
   - Concurrent access

2. **Debounce Logic Tests**
   - Multiple rapid calls collapse to one
   - Timing verification
   - Cancellation on unmount

3. **Cookie Update Tests**
   - Atomic updates
   - Error handling
   - Consistency verification

4. **Protected Route Tests**
   - Loading state logic
   - Redirect decisions
   - Layout shift prevention

### Property-Based Testing

We'll use fast-check for property-based testing to verify universal properties:

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Test Tagging**: Each property-based test must include a comment with the format:
`// Feature: auth-stability-improvements, Property {number}: {property_text}`

**Property Test Coverage**:
- Property 1: Session cache behavior across request sequences
- Property 2: Debouncing with various timing patterns
- Property 3: Cookie update atomicity
- Property 4: Session refresh threshold logic
- Property 5: Request deduplication
- Property 6: Profile fetch failure handling
- Property 7: Protected route loading state logic
- Property 8: Middleware redirect determinism
- Property 9: Silent refresh attempts
- Property 10: Continued access during refresh

### Integration Testing

1. **End-to-End Auth Flows**
   - Login → Navigate → Logout
   - Session expiry → Silent refresh
   - Multiple tabs synchronization

2. **Performance Testing**
   - Cache hit rate measurement
   - Reduced Supabase call count
   - Page load time improvements

3. **Error Scenario Testing**
   - Network failures
   - Supabase downtime simulation
   - Concurrent request handling

## Implementation Notes

### Session Cache Implementation

The session cache will be implemented as a simple in-memory Map with automatic cleanup:

```typescript
const sessionCache = new Map<string, SessionCacheEntry>();
const CACHE_TTL = 30000; // 30 seconds

function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of sessionCache.entries()) {
    if (now > entry.expiresAt) {
      sessionCache.delete(key);
    }
  }
}
```

**Trade-offs:**
- ✅ Simple implementation
- ✅ Fast lookups (O(1))
- ✅ Automatic memory management
- ⚠️ Not shared across server instances (acceptable for this use case)
- ⚠️ Lost on server restart (acceptable, just causes one extra check)

### Debouncing Implementation

We'll use a custom debounce hook with cancellation support:

```typescript
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}
```

### Request Deduplication

We'll track in-flight requests to prevent concurrent execution:

```typescript
let refreshPromise: Promise<void> | null = null;

async function refreshUser() {
  if (refreshPromise) {
    return refreshPromise; // Return existing promise
  }
  
  refreshPromise = (async () => {
    try {
      // Actual refresh logic
    } finally {
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}
```

### Atomic Cookie Updates

Ensure all cookie operations use the same response object:

```typescript
// ❌ Wrong: Creates new response for each cookie
response.cookies.set('cookie1', 'value1');
const newResponse = NextResponse.next();
newResponse.cookies.set('cookie2', 'value2');

// ✅ Correct: All operations on same response
const response = NextResponse.next();
response.cookies.set('cookie1', 'value1');
response.cookies.set('cookie2', 'value2');
```

## Performance Considerations

### Expected Improvements

1. **Reduced Supabase Calls**: 60-80% reduction in auth checks due to caching
2. **Faster Page Loads**: 100-200ms improvement from cached session validation
3. **Fewer Re-renders**: 50-70% reduction in Auth Provider re-renders from debouncing
4. **Better UX**: Elimination of loading flickers on protected routes

### Monitoring Metrics

1. **Cache Hit Rate**: Target 70%+ within 30-second windows
2. **Session Refresh Frequency**: Should decrease by 50%+
3. **Auth Provider Re-renders**: Track with React DevTools
4. **Page Load Time**: Measure time to interactive on protected routes

## Security Considerations

### No Security Compromises

The lenient authentication approach does not compromise security:

1. **Session Caching**: 30-second TTL is short enough to prevent stale auth state
2. **Lenient Refresh**: Still refreshes before expiry, just less aggressively
3. **Error Fallbacks**: Maintain existing valid sessions, never create fake sessions
4. **Profile Failures**: User is still authenticated, just with minimal profile data

### Security Maintained

1. **Token Validation**: Still performed, just cached briefly
2. **Session Expiry**: Still enforced, just with graceful refresh
3. **Route Protection**: Still active, just with better UX
4. **Logout**: Still clears all state immediately

## Migration Strategy

### Phase 1: Middleware Improvements
1. Add session cache
2. Implement atomic cookie updates
3. Adjust refresh threshold
4. Add error fallbacks

### Phase 2: Auth Provider Improvements
1. Add debouncing
2. Implement request deduplication
3. Improve error handling
4. Optimize initialization

### Phase 3: Protected Route Improvements
1. Update loading logic
2. Add skeleton fallback
3. Prevent layout shift
4. Optimize redirects

### Phase 4: Testing & Monitoring
1. Add unit tests
2. Add property-based tests
3. Add performance monitoring
4. Validate improvements

## Rollback Plan

If issues arise, we can roll back incrementally:

1. **Disable session cache**: Set `cacheEnabled: false`
2. **Disable debouncing**: Set `debounceMs: 0`
3. **Revert refresh threshold**: Back to 5 minutes
4. **Revert Protected Route**: Use original loading logic

Each component is independent and can be rolled back separately.
