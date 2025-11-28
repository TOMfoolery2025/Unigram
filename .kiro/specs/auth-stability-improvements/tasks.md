# Implementation Plan

- [x] 1. Implement session cache for middleware
  - Create session cache module with get/set/clear/cleanup methods
  - Use Map-based in-memory storage with 30-second TTL
  - Add automatic cleanup on each request
  - _Requirements: 1.1, 1.2_

- [ ]* 1.1 Write property test for session cache
  - **Property 1: Session cache reduces redundant checks**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2. Update middleware with session caching and atomic cookie updates
  - Integrate session cache into middleware authentication flow
  - Ensure all cookie operations use single response object
  - Adjust session refresh threshold from 5 minutes to 2 minutes
  - Add graceful error handling with fallback to existing session
  - _Requirements: 1.1, 1.3, 2.1, 2.5, 3.1, 3.4_

- [ ]* 2.1 Write property test for cookie atomicity
  - **Property 3: Cookie updates are atomic**
  - **Validates: Requirements 2.1, 2.5**

- [ ]* 2.2 Write property test for session refresh threshold
  - **Property 4: Session refresh is lenient**
  - **Validates: Requirements 1.3, 3.1**

- [ ]* 2.3 Write property test for middleware redirect determinism
  - **Property 8: Middleware redirects are deterministic**
  - **Validates: Requirements 2.3, 4.3, 4.4**

- [x] 3. Add debouncing and request deduplication to Auth Provider
  - Create custom debounce hook with 300ms delay
  - Implement request deduplication for refreshUser() calls
  - Add in-flight request tracking to prevent concurrent execution
  - Update auth state listener to use debounced updates
  - _Requirements: 1.2, 1.4, 2.5_

- [ ]* 3.1 Write property test for debouncing
  - **Property 2: Debouncing prevents rapid state updates**
  - **Validates: Requirements 1.4**

- [ ]* 3.2 Write property test for request deduplication
  - **Property 5: Auth Provider deduplicates concurrent requests**
  - **Validates: Requirements 1.2, 2.5**

- [x] 4. Improve error handling in Auth Provider
  - Update refreshUser() to maintain current state on errors
  - Add fallback to basic profile when profile fetch fails
  - Ensure authentication persists even if profile is incomplete
  - Remove automatic logout on transient errors
  - _Requirements: 2.2, 2.3, 3.3_

- [ ]* 4.1 Write property test for profile fetch failure handling
  - **Property 6: Profile fetch failures don't log users out**
  - **Validates: Requirements 3.3**

- [x] 5. Optimize Auth Provider initialization
  - Ensure single authentication check on mount
  - Prevent multiple concurrent initialization calls
  - Add loading state management to avoid unnecessary checks
  - _Requirements: 1.2, 1.5_

- [x] 6. Update Protected Route component to minimize flickering
  - Show loading state only when auth status is truly unknown (loading = true)
  - Render content immediately when auth is confirmed (loading = false)
  - Add skeleton/fallback support to prevent layout shift
  - Ensure single redirect without loops
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 6.1 Write property test for protected route loading logic
  - **Property 7: Protected routes show loading only when unknown**
  - **Validates: Requirements 4.1, 4.5**

- [x] 7. Implement silent session refresh
  - Add silent refresh attempt before requiring re-login
  - Allow continued access during refresh operation
  - Update middleware to handle refresh-in-progress state
  - _Requirements: 3.4, 3.5_

- [ ]* 7.1 Write property test for silent refresh
  - **Property 9: Silent refresh before re-login**
  - **Validates: Requirements 3.4**

- [ ]* 7.2 Write property test for continued access during refresh
  - **Property 10: Session refresh allows continued access**
  - **Validates: Requirements 3.5**

- [x] 8. Add lenient email verification handling
  - Update middleware to allow access to non-critical routes without verification
  - Modify Protected Route to support requireVerified flag properly
  - Ensure dashboard and basic features work without verification
  - _Requirements: 3.2_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Add performance monitoring
  - Track cache hit rate in middleware
  - Monitor session refresh frequency
  - Measure Auth Provider re-render count
  - Log page load time improvements
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]* 11. Add integration tests for auth flows
  - Test login → navigate → logout flow
  - Test session expiry → silent refresh flow
  - Test concurrent request handling
  - Test error recovery scenarios
  - _Requirements: 1.1, 2.5, 3.4_
