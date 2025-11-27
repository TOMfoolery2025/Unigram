# Supabase Client Usage Guide

This directory contains Supabase client utilities for the TUM Community Platform. Understanding when to use each client is crucial for optimal performance and correct behavior.

## Overview

We have two client creation functions:

1. **`lib/supabase/client.ts`** - Browser client for Client Components
2. **`lib/supabase/server.ts`** - Server client for Server Components, Server Actions, and Route Handlers

## Quick Reference

| Context | Use | Import |
|---------|-----|--------|
| Client Component | `client.ts` | `import { createClient } from '@/lib/supabase/client'` |
| Server Component | `server.ts` | `import { createClient } from '@/lib/supabase/server'` |
| Server Action | `server.ts` | `import { createClient } from '@/lib/supabase/server'` |
| Route Handler | `server.ts` | `import { createClient } from '@/lib/supabase/server'` |
| Middleware | Inline creation | See middleware.ts for example |

## Browser Client (`client.ts`)

### When to Use

Use the browser client in **Client Components** (components with `'use client'` directive):

- Client-side data fetching
- Real-time subscriptions
- Browser-based mutations
- Auth state management in the browser

### Caching Strategy

The browser client uses a **singleton pattern**:

```typescript
let browserClient: SupabaseClient | null = null

export function createClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient(...)
  return browserClient
}
```

**Benefits:**
- Single instance shared across all components
- Reduces memory usage
- Prevents connection overhead
- Maintains consistent auth state
- ~0.1ms for cached calls vs ~10ms for new client

### Example Usage

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function UserProfile() {
  const [user, setUser] = useState(null)
  const supabase = createClient() // Returns cached instance

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  return <div>{user?.email}</div>
}
```

### Real-time Subscriptions

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function MessageList() {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => console.log('New message:', payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <div>Messages</div>
}
```

## Server Client (`server.ts`)

### When to Use

Use the server client in **server-side contexts**:

- Server Components (RSC)
- Server Actions
- Route Handlers (API routes)
- Any server-side code

### Caching Strategy

The server client uses **request-scoped caching** via Next.js:

```typescript
export async function createClient() {
  const cookieStore = await cookies() // Cached per request by Next.js
  return createServerClient(...)
}
```

**Benefits:**
- Each request gets isolated auth context
- No manual caching needed
- Automatic cleanup after request
- Multiple calls in same request reuse cookie store
- ~1ms for subsequent calls in same request

**Important:** Do NOT try to cache the server client manually. Next.js handles this automatically per request.

### Example Usage

#### Server Component

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function PostsPage() {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, content')
    .order('created_at', { ascending: false })
  
  return (
    <div>
      {posts?.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  )
}
```

#### Server Action

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: formData.get('title'),
      content: formData.get('content')
    })
    .select()
    .single()
  
  if (error) throw error
  
  revalidatePath('/posts')
  return data
}
```

#### Route Handler

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch data
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
  
  return NextResponse.json({ posts })
}
```

## Performance Comparison

### Browser Client

| Operation | First Call | Cached Call |
|-----------|-----------|-------------|
| Client creation | ~10ms | ~0.1ms |
| Memory | Single instance | Reused |
| Lifecycle | App lifetime | App lifetime |

### Server Client

| Operation | First Call | Same Request | New Request |
|-----------|-----------|--------------|-------------|
| Client creation | ~5ms | ~1ms | ~5ms |
| Memory | Per request | Reused | New instance |
| Lifecycle | Request | Request | Request |

## Common Patterns

### Multiple Queries in Same Request

**Efficient** - All calls reuse the cookie store:

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // All efficient - request-scoped caching
  const { data: user } = await supabase.auth.getUser()
  const { data: posts } = await supabase.from('posts').select('*')
  const { data: comments } = await supabase.from('comments').select('*')
  
  return <div>Dashboard</div>
}
```

### Mixing Client and Server

**Correct** - Use appropriate client for each context:

```typescript
// app/posts/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import PostList from './PostList'

export default async function PostsPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase.from('posts').select('*')
  
  return <PostList initialPosts={posts} />
}

// app/posts/PostList.tsx (Client Component)
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function PostList({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts)
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          // Refetch posts on changes
        }
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [])
  
  return <div>{/* Render posts */}</div>
}
```

## Cookie Handling

### Server Client Cookie Operations

The server client provides three cookie operations:

1. **`get(name)`** - Read cookies (works everywhere)
2. **`set(name, value, options)`** - Write cookies (Route Handlers & Server Actions only)
3. **`remove(name, options)`** - Delete cookies (Route Handlers & Server Actions only)

**Important:** `set()` and `remove()` fail silently in Server Components because they are read-only. This is expected behavior. Use middleware for session refresh.

### Why Cookie Operations Fail in Server Components

Server Components are rendered on the server and cannot modify the response after rendering starts. Cookie modifications require response headers, which can only be set in:

- Route Handlers (API routes)
- Server Actions
- Middleware

For session refresh, use middleware to update cookies before the request reaches your components.

## Common Mistakes

### ❌ Using Browser Client on Server

```typescript
// WRONG - Don't use browser client in Server Component
import { createClient } from '@/lib/supabase/client'

export default async function Page() {
  const supabase = createClient() // ERROR: No browser environment
  // ...
}
```

### ❌ Using Server Client in Browser

```typescript
// WRONG - Don't use server client in Client Component
'use client'

import { createClient } from '@/lib/supabase/server'

export function Component() {
  const supabase = await createClient() // ERROR: No cookies() in browser
  // ...
}
```

### ❌ Manually Caching Server Client

```typescript
// WRONG - Don't cache server client manually
let serverClient: SupabaseClient | null = null

export async function createClient() {
  if (serverClient) return serverClient // BAD: Shares auth across requests
  serverClient = createServerClient(...)
  return serverClient
}
```

### ❌ Creating New Browser Client Every Render

```typescript
// WRONG - Don't create new client on every render
'use client'

export function Component() {
  // BAD: Creates new client every render
  const supabase = createBrowserClient(url, key)
  // ...
}

// CORRECT - Use cached client
export function Component() {
  const supabase = createClient() // Returns cached instance
  // ...
}
```

## Troubleshooting

### "cookies() can only be called in Server Components"

**Problem:** Using server client in Client Component

**Solution:** Use `lib/supabase/client.ts` instead

### "Auth session not persisting"

**Problem:** Creating new browser client on every render

**Solution:** Use `createClient()` from `lib/supabase/client.ts` which caches the instance

### "Different users seeing each other's data"

**Problem:** Manually caching server client across requests

**Solution:** Never cache server client. Let Next.js handle request-scoped caching

### "Slow performance with many queries"

**Problem:** Not reusing client in same request

**Solution:** Call `createClient()` once and reuse the instance within the same request/component

## Best Practices

1. **Always use the correct client for your context**
   - Client Components → `client.ts`
   - Server-side → `server.ts`

2. **Don't manually cache server clients**
   - Next.js handles request-scoped caching automatically

3. **Reuse client instances within a request**
   - Call `createClient()` once per component/function
   - Pass the client to helper functions instead of recreating

4. **Use explicit column selection**
   - Avoid `select('*')` in production
   - Select only the columns you need

5. **Handle errors appropriately**
   - Always check for errors in responses
   - Log errors with context for debugging

6. **Use middleware for session refresh**
   - Don't try to refresh sessions in Server Components
   - Middleware can modify cookies before rendering

## Additional Resources

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Project Architecture Documentation](../../docs/ARCHITECTURE.md)
- [Authentication Flow Documentation](../../docs/AUTHENTICATION.md)
