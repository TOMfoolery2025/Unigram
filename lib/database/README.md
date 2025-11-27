# Database Utilities

This module provides utilities for optimizing database operations in the TUM Community Platform.

## Features

- **Query Utilities**: Explicit column selection, batch operations, and query timing
- **Caching Layer**: In-memory cache with TTL support for reducing database load

## Quick Start

### Query Utilities

```typescript
import { buildSelectClause, batchQuery, measureQuery } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// Explicit column selection (avoid SELECT *)
const supabase = await createClient()
const { data } = await supabase
  .from('posts')
  .select(buildSelectClause([
    'id',
    'title',
    'content',
    'user_profiles(display_name, avatar_url)'
  ]))

// Batch query operations
const userIds = ['id1', 'id2', 'id3', /* ... */]
const profiles = await batchQuery(
  userIds,
  async (batchIds) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', batchIds)
    return data || []
  },
  { batchSize: 50 }
)

// Query timing and monitoring
const result = await measureQuery(
  async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
    return data
  },
  { name: 'fetch_user_posts', slowQueryThreshold: 500 }
)

console.log(`Query took ${result.duration}ms`)
if (result.isSlow) {
  console.warn('Slow query detected!')
}
```

### Caching Layer

```typescript
import { createCache, generateCacheKey, withCache } from '@/lib/database'

// Create cache instance
const cache = createCache({
  defaultTTL: 300000, // 5 minutes
  maxSize: 1000
})

// Basic usage
cache.set('user:123', { name: 'John', email: 'john@example.com' })
const user = cache.get('user:123')

// Generate consistent cache keys
const key = generateCacheKey('posts', {
  authorId: '123',
  limit: 10,
  offset: 0
})
// Returns: 'posts:authorId=123:limit=10:offset=0'

// Wrap functions with caching
async function fetchUser(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

const cachedFetchUser = withCache(
  cache,
  (id) => generateCacheKey('user', { id }),
  fetchUser,
  60000 // 1 minute TTL
)

// First call: fetches from database
const user1 = await cachedFetchUser('123')

// Second call: returns from cache
const user2 = await cachedFetchUser('123')

// Cache invalidation
cache.invalidatePattern(/^user:\d+:profile$/)

// Monitor cache performance
const stats = cache.getStats()
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`)
```

## Best Practices

### Query Optimization

1. **Always specify columns explicitly** - Use `buildSelectClause()` instead of `SELECT *`
2. **Batch related queries** - Use `batchQuery()` to avoid N+1 patterns
3. **Monitor slow queries** - Use `measureQuery()` to identify bottlenecks
4. **Use joins for related data** - Fetch related data in a single query when possible

### Caching Strategy

1. **Cache frequently accessed data** - User profiles, settings, static content
2. **Set appropriate TTLs** - Balance freshness vs. performance
3. **Invalidate on updates** - Clear cache when data changes
4. **Monitor hit rates** - Use `getStats()` to optimize cache configuration
5. **Consider distributed caching** - Use Redis for multi-instance deployments

## Performance Targets

- **Simple queries**: < 50ms
- **Complex queries with joins**: < 200ms
- **Slow query threshold**: 500ms
- **Cache hit rate**: > 80% for frequently accessed data

## Examples

### Optimizing Forum Queries

```typescript
// Before: N+1 pattern
const posts = await supabase.from('posts').select('*')
for (const post of posts) {
  const { data: author } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', post.author_id)
  post.author = author
}

// After: Single query with join
const posts = await supabase
  .from('posts')
  .select(buildSelectClause([
    'id',
    'title',
    'content',
    'created_at',
    'user_profiles!posts_author_id_fkey(display_name, avatar_url)'
  ]))
```

### Caching User Profiles

```typescript
const cache = createCache({ defaultTTL: 300000 }) // 5 minutes

async function getUserProfile(userId: string) {
  const cacheKey = generateCacheKey('user:profile', { userId })
  
  // Try cache first
  const cached = cache.get(cacheKey)
  if (cached) return cached
  
  // Fetch from database
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select(buildSelectClause([
      'id',
      'display_name',
      'avatar_url',
      'bio'
    ]))
    .eq('id', userId)
    .single()
  
  // Cache result
  if (data) {
    cache.set(cacheKey, data)
  }
  
  return data
}
```

## Testing

Run tests for the database utilities:

```bash
npm test -- lib/database
```

## Related Documentation

- [Database Schema](../../docs/DATABASE.md)
- [Performance Guidelines](../../docs/PERFORMANCE.md)
- [Supabase Client Usage](../supabase/README.md)
