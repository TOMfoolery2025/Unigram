# Caching Strategy

This document outlines the caching strategies implemented in the Unigram application to improve performance and reduce server load.

## Overview

The application uses a multi-layered caching approach:

1. **Server-side caching** - In-memory cache for database queries
2. **Client-side caching** - SWR for React data fetching
3. **HTTP caching** - Cache headers for API responses
4. **Static generation** - Next.js ISR for static content

## Server-Side Caching

### Database Query Cache

Location: `lib/database/cache.ts`

The application implements an in-memory cache for database queries with TTL (Time To Live) support.

**Features:**
- Automatic cache key generation
- Configurable TTL per query
- Cache invalidation strategies
- Memory-efficient storage

**Usage:**
```typescript
import { withCache } from '@/lib/database/cache';

const data = await withCache(
  'cache-key',
  async () => {
    // Your database query here
    return await supabase.from('table').select('*');
  },
  300 // TTL in seconds (5 minutes)
);
```

**Default TTL values:**
- User data: 5 minutes
- Channel data: 10 minutes
- Forum data: 5 minutes
- Event data: 2 minutes
- Wiki content: 30 minutes

## Client-Side Caching

### SWR (Stale-While-Revalidate)

Location: `lib/hooks/use-swr-fetch.ts`

SWR provides client-side caching with automatic revalidation.

**Configuration:**
- `revalidateOnFocus`: false - Don't revalidate when window regains focus
- `revalidateOnReconnect`: true - Revalidate when network reconnects
- `dedupingInterval`: 5000ms - Dedupe requests within 5 seconds
- `focusThrottleInterval`: 10000ms - Throttle revalidation on focus

**Available Hooks:**
```typescript
// Fetch all channels with caching
const { data, error, isLoading } = useChannels();

// Fetch user's channels
const { data, error, isLoading } = useUserChannels(userId);

// Fetch user's subforums
const { data, error, isLoading } = useUserSubforums(userId);

// Fetch all subforums
const { data, error, isLoading } = useSubforums();

// Fetch events
const { data, error, isLoading } = useEvents();

// Fetch combined dashboard data
const { channels, userChannels, userSubforums, isLoading, error } = useDashboardData(userId);
```

**Benefits:**
- Reduces redundant API calls
- Provides instant data from cache
- Automatic background revalidation
- Optimistic UI updates

## HTTP Caching

### Cache Headers

API routes include appropriate cache headers for CDN and browser caching.

**Wiki API Routes:**

`/api/wiki/categories`:
- Revalidation: Every 1 hour
- Cache-Control: `public, s-maxage=3600, stale-while-revalidate=86400`

`/api/wiki/articles/[slug]`:
- Revalidation: Every 30 minutes
- Cache-Control: `public, s-maxage=1800, stale-while-revalidate=3600`

**Cache-Control Directives:**
- `public`: Response can be cached by any cache
- `s-maxage`: CDN cache duration in seconds
- `stale-while-revalidate`: Serve stale content while revalidating in background

## Static Generation (ISR)

### Incremental Static Regeneration

Next.js ISR allows static pages to be regenerated in the background.

**Configuration:**
```typescript
// In API routes or page components
export const revalidate = 3600; // Revalidate every hour
```

**Benefits:**
- Fast page loads (served from CDN)
- Always up-to-date content
- Reduced server load
- Better SEO

## Cache Invalidation

### Manual Invalidation

For SWR cached data:
```typescript
import { mutate } from 'swr';

// Invalidate specific cache key
mutate('channels');

// Invalidate all keys matching pattern
mutate(key => typeof key === 'string' && key.startsWith('user-'));
```

### Automatic Invalidation

The cache automatically invalidates:
- When TTL expires
- On data mutations (create, update, delete)
- On network reconnection
- On manual trigger

## Performance Metrics

Expected improvements with caching:

- **API Response Time**: 50-80% reduction for cached queries
- **Database Load**: 60-70% reduction in query count
- **Page Load Time**: 30-50% improvement for repeat visits
- **Bandwidth Usage**: 40-60% reduction for static content

## Best Practices

1. **Set appropriate TTL values**
   - Frequently changing data: 1-5 minutes
   - Moderately changing data: 5-15 minutes
   - Rarely changing data: 30-60 minutes

2. **Use SWR for user-specific data**
   - Provides instant feedback
   - Handles loading and error states
   - Automatic revalidation

3. **Implement cache invalidation**
   - Invalidate cache after mutations
   - Use optimistic updates for better UX

4. **Monitor cache hit rates**
   - Track cache effectiveness
   - Adjust TTL values based on metrics

5. **Handle cache misses gracefully**
   - Always have fallback logic
   - Show loading states
   - Handle errors appropriately

## Troubleshooting

### Cache Not Working

1. Check if cache key is consistent
2. Verify TTL is not too short
3. Ensure cache provider is initialized
4. Check for cache invalidation triggers

### Stale Data Issues

1. Reduce TTL for frequently changing data
2. Implement manual cache invalidation
3. Use SWR's revalidation features
4. Check cache headers in API responses

### Memory Issues

1. Monitor cache size
2. Implement cache size limits
3. Use LRU (Least Recently Used) eviction
4. Clear cache periodically

## Future Improvements

1. **Redis Integration**
   - Distributed caching across instances
   - Persistent cache storage
   - Better scalability

2. **Cache Warming**
   - Pre-populate cache on deployment
   - Background cache refresh

3. **Advanced Invalidation**
   - Tag-based invalidation
   - Dependency tracking
   - Automatic invalidation on related data changes

4. **Cache Analytics**
   - Hit/miss ratio tracking
   - Performance metrics
   - Cache effectiveness reports
