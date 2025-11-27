# Performance Guide

## Overview

This guide covers performance optimization strategies for Unigram, including database queries, client-side rendering, bundle size, and caching.

## Performance Targets

### Page Load Performance
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.0s
- **Time to Interactive (TTI)**: < 3.0s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Database Performance
- **Simple queries**: < 50ms
- **Complex queries with joins**: < 200ms
- **Slow query threshold**: 500ms
- **Connection acquisition**: < 10ms

### API Response Times
- **GET requests**: < 200ms (p95)
- **POST requests**: < 500ms (p95)
- **Concurrent requests**: 100+ req/s

## Database Optimization

### Query Optimization

#### 1. Avoid N+1 Queries

**Problem**: Fetching related data in loops causes multiple database round trips.

**Bad Example**:
```typescript
// Fetches posts (1 query)
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('subforum_id', subforumId)

// Fetches author for each post (N queries)
for (const post of posts) {
  const { data: author } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', post.author_id)
    .single()
  
  post.author = author
}
```

**Good Example**:
```typescript
// Single query with join
const { data: posts } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    content,
    vote_count,
    created_at,
    user_profiles!posts_author_id_fkey(
      display_name,
      avatar_url
    )
  `)
  .eq('subforum_id', subforumId)
```

#### 2. Select Only Required Columns

**Problem**: `SELECT *` fetches unnecessary data, increasing transfer time.

**Bad Example**:
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select('*')
```

**Good Example**:
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select('id, title, vote_count, created_at')
```

#### 3. Use Proper Indexes

**Check Index Usage**:
```sql
-- View index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**Add Missing Indexes**:
```sql
-- Index for filtering
CREATE INDEX idx_posts_subforum_id ON posts(subforum_id);

-- Composite index for filtering + sorting
CREATE INDEX idx_posts_subforum_created 
ON posts(subforum_id, created_at DESC);

-- Index for full-text search
CREATE INDEX idx_subforums_name_trgm 
ON subforums USING gin(name gin_trgm_ops);
```

#### 4. Batch Operations

**Problem**: Multiple individual inserts/updates are slow.

**Bad Example**:
```typescript
for (const item of items) {
  await supabase
    .from('table')
    .insert(item)
}
```

**Good Example**:
```typescript
await supabase
  .from('table')
  .insert(items)
```

#### 5. Use Pagination

**Problem**: Loading all records at once is slow and memory-intensive.

**Good Example**:
```typescript
const PAGE_SIZE = 20

const { data: posts, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  .order('created_at', { ascending: false })
```

### Connection Management

#### Reuse Supabase Clients

**Problem**: Creating new clients on every request wastes resources.

**Bad Example**:
```typescript
// middleware.ts - creates new client every request
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  // ...
}
```

**Good Example**:
```typescript
// lib/supabase/client.ts - cache browser client
let browserClient: SupabaseClient | null = null

export function createClient() {
  if (browserClient) return browserClient
  
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return browserClient
}
```

**Note**: Server clients use Next.js request-scoped caching automatically.

### Query Result Caching

**Implementation** (to be added):
```typescript
// lib/database/cache.ts
const cache = new Map<string, { data: any; expiry: number }>()

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000 // 1 minute default
): Promise<T> {
  const cached = cache.get(key)
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }
  
  const data = await fetcher()
  cache.set(key, { data, expiry: Date.now() + ttl })
  
  return data
}

// Usage
const posts = await withCache(
  `posts:${subforumId}`,
  () => fetchPosts(subforumId),
  60000 // Cache for 1 minute
)
```

## Frontend Optimization

### Component Optimization

#### 1. Use Server Components by Default

**Good Practice**:
```typescript
// app/forums/page.tsx - Server Component (default)
export default async function ForumsPage() {
  const supabase = await createClient()
  const { data: subforums } = await supabase
    .from('subforums')
    .select('*')
  
  return <SubforumList subforums={subforums} />
}
```

**Only use Client Components when needed**:
```typescript
// components/forum/vote-buttons.tsx
'use client'

export function VoteButtons({ postId }: { postId: string }) {
  // Needs client-side interactivity
  const handleVote = async (type: 'upvote' | 'downvote') => {
    // ...
  }
  
  return (
    <div>
      <button onClick={() => handleVote('upvote')}>↑</button>
      <button onClick={() => handleVote('downvote')}>↓</button>
    </div>
  )
}
```

#### 2. Lazy Load Heavy Components

```typescript
import dynamic from 'next/dynamic'

// Lazy load calendar component
const CalendarView = dynamic(
  () => import('@/components/calendar/calendar-view'),
  {
    loading: () => <div>Loading calendar...</div>,
    ssr: false // Disable SSR for client-only components
  }
)
```

#### 3. Optimize Images

```typescript
import Image from 'next/image'

// Use Next.js Image component
<Image
  src={avatarUrl}
  alt="User avatar"
  width={40}
  height={40}
  className="rounded-full"
  priority={false} // Only true for above-the-fold images
/>
```

#### 4. Add Loading States

```typescript
// app/forums/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-24 bg-gray-800 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
```

### Bundle Optimization

#### 1. Analyze Bundle Size

```bash
# Build and analyze
npm run build

# Check .next/analyze/ for bundle report
```

#### 2. Code Splitting

Next.js automatically splits code by route. For manual splitting:

```typescript
// Dynamic imports for large libraries
const QRCode = dynamic(() => import('qrcode'), {
  ssr: false
})
```

#### 3. Tree Shaking

**Good Practice**:
```typescript
// Import only what you need
import { format } from 'date-fns'

// Not this
import * as dateFns from 'date-fns'
```

#### 4. Remove Unused Dependencies

```bash
# Check for unused dependencies
npx depcheck

# Remove unused packages
npm uninstall package-name
```

### Caching Strategies

#### 1. Next.js Caching

**Static Generation**:
```typescript
// app/wiki/page.tsx
export const revalidate = 3600 // Revalidate every hour

export default async function WikiPage() {
  // This page is statically generated and cached
  const articles = await fetchArticles()
  return <ArticleList articles={articles} />
}
```

**Dynamic with Cache**:
```typescript
// Fetch with cache
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 } // Cache for 60 seconds
})
```

#### 2. Client-Side Caching

**Using SWR** (to be added):
```typescript
'use client'

import useSWR from 'swr'

export function PostList({ subforumId }: { subforumId: string }) {
  const { data: posts, error } = useSWR(
    `/api/posts?subforum=${subforumId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 30000 // Refresh every 30s
    }
  )
  
  if (error) return <div>Error loading posts</div>
  if (!posts) return <div>Loading...</div>
  
  return <div>{/* Render posts */}</div>
}
```

#### 3. Browser Caching

**Set Cache Headers**:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

## Real-time Optimization

### Supabase Realtime

#### 1. Limit Subscriptions

**Bad Example**:
```typescript
// Subscribe to all messages (expensive)
const subscription = supabase
  .channel('all-messages')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'channel_messages'
  }, handleMessage)
  .subscribe()
```

**Good Example**:
```typescript
// Subscribe only to current channel
const subscription = supabase
  .channel(`channel:${channelId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'channel_messages',
    filter: `channel_id=eq.${channelId}`
  }, handleMessage)
  .subscribe()
```

#### 2. Clean Up Subscriptions

```typescript
useEffect(() => {
  const subscription = supabase
    .channel(`channel:${channelId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'channel_messages',
      filter: `channel_id=eq.${channelId}`
    }, handleMessage)
    .subscribe()
  
  // Clean up on unmount
  return () => {
    subscription.unsubscribe()
  }
}, [channelId])
```

#### 3. Throttle Updates

```typescript
import { debounce } from 'lodash'

const handleMessageDebounced = debounce((payload) => {
  setMessages(prev => [...prev, payload.new])
}, 100)
```

## Monitoring Performance

### Measuring Performance

#### 1. Web Vitals

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### 2. Custom Performance Tracking

```typescript
// lib/monitoring/performance.ts
export function measureQuery<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  
  return fn().then(result => {
    const duration = performance.now() - start
    
    if (duration > 500) {
      console.warn(`Slow query: ${name} took ${duration}ms`)
    }
    
    return result
  })
}

// Usage
const posts = await measureQuery(
  'fetchPosts',
  () => supabase.from('posts').select('*')
)
```

#### 3. Lighthouse CI

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun
```

### Performance Budgets

**Set budgets in `next.config.js`**:
```javascript
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  // Warn if bundle exceeds limits
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}
```

## Best Practices Checklist

### Database
- [ ] Use joins instead of N+1 queries
- [ ] Select only required columns
- [ ] Add indexes for filtered/sorted columns
- [ ] Use pagination for large datasets
- [ ] Batch insert/update operations
- [ ] Reuse Supabase client instances
- [ ] Implement query result caching

### Frontend
- [ ] Use Server Components by default
- [ ] Lazy load heavy components
- [ ] Optimize images with Next.js Image
- [ ] Add loading states and skeletons
- [ ] Implement code splitting
- [ ] Remove unused dependencies
- [ ] Use proper caching strategies

### Real-time
- [ ] Limit subscription scope
- [ ] Clean up subscriptions on unmount
- [ ] Throttle/debounce frequent updates
- [ ] Use filters to reduce data transfer

### Monitoring
- [ ] Track Web Vitals
- [ ] Log slow queries (> 500ms)
- [ ] Monitor bundle size
- [ ] Set performance budgets
- [ ] Use Lighthouse CI in deployment

## Common Performance Issues

### Issue: Slow Page Load

**Symptoms**:
- LCP > 2.5s
- TTI > 3.5s

**Solutions**:
1. Check bundle size: `npm run build`
2. Lazy load heavy components
3. Optimize images
4. Use Server Components
5. Implement caching

### Issue: Slow Database Queries

**Symptoms**:
- Queries taking > 500ms
- High database CPU usage

**Solutions**:
1. Check for N+1 patterns
2. Add missing indexes
3. Use EXPLAIN ANALYZE
4. Optimize SELECT clauses
5. Implement caching

### Issue: High Memory Usage

**Symptoms**:
- Browser tab using > 500MB
- Slow scrolling/interactions

**Solutions**:
1. Limit data fetched per page
2. Implement pagination
3. Clean up subscriptions
4. Remove memory leaks
5. Use virtualization for long lists

### Issue: Slow Real-time Updates

**Symptoms**:
- Messages delayed > 1s
- High network usage

**Solutions**:
1. Limit subscription scope
2. Use filters on subscriptions
3. Throttle update handlers
4. Batch updates
5. Check network conditions

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Database Guide](./DATABASE.md) - Database optimization
- [Deployment Guide](./DEPLOYMENT.md) - Production optimization
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues
