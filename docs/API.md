# API Documentation

## Overview

Unigram uses Next.js API Routes for server-side API endpoints. Most data operations use Supabase client directly, but some features require custom API routes.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

All API routes (except public ones) require authentication via Supabase session cookies.

**Authentication Flow**:
1. User logs in via Supabase Auth
2. Session cookie is set automatically
3. API routes validate session using Supabase server client
4. Unauthorized requests return 401

## API Routes

### Authentication

#### POST /auth/callback

OAuth callback handler for email verification.

**Purpose**: Exchanges auth code for session and creates user profile.

**Query Parameters**:
- `code` (string, required): Auth code from email verification link

**Response**:
- Redirects to `/dashboard` on success
- Redirects to `/login` on error

**Example**:
```
GET /auth/callback?code=abc123...
→ Redirects to /dashboard
```

**Implementation**:
```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // Create user profile if doesn't exist
    // ...
  }
  
  return NextResponse.redirect('/dashboard')
}
```

### Wiki API

The Wiki API provides access to content managed in Hygraph CMS.

#### GET /api/wiki/categories

Get all wiki categories.

**Authentication**: Not required (public)

**Response**:
```json
[
  {
    "id": "category-id",
    "name": "Getting Started",
    "slug": "getting-started",
    "description": "Introduction to the platform"
  }
]
```

**Example**:
```bash
curl http://localhost:3000/api/wiki/categories
```

**Implementation**:
```typescript
// app/api/wiki/categories/route.ts
export async function GET() {
  try {
    const categories = await getAllCategories()
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
```

#### GET /api/wiki/category/[category]

Get all articles in a category.

**Authentication**: Not required (public)

**Path Parameters**:
- `category` (string): Category slug

**Response**:
```json
[
  {
    "id": "article-id",
    "title": "How to Get Started",
    "slug": "how-to-get-started",
    "excerpt": "Learn the basics...",
    "category": {
      "name": "Getting Started",
      "slug": "getting-started"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

**Example**:
```bash
curl http://localhost:3000/api/wiki/category/getting-started
```

**Error Responses**:
- `404`: Category not found
- `500`: Server error

#### GET /api/wiki/articles/[slug]

Get a specific article by slug.

**Authentication**: Not required (public)

**Path Parameters**:
- `slug` (string): Article slug

**Response**:
```json
{
  "id": "article-id",
  "title": "How to Get Started",
  "slug": "how-to-get-started",
  "content": {
    "raw": { /* Rich text content */ }
  },
  "excerpt": "Learn the basics...",
  "category": {
    "name": "Getting Started",
    "slug": "getting-started"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

**Example**:
```bash
curl http://localhost:3000/api/wiki/articles/how-to-get-started
```

**Error Responses**:
- `404`: Article not found
- `500`: Server error

#### GET /api/wiki/search

Search wiki articles.

**Authentication**: Not required (public)

**Query Parameters**:
- `q` (string, required): Search query

**Response**:
```json
[
  {
    "id": "article-id",
    "title": "How to Get Started",
    "slug": "how-to-get-started",
    "excerpt": "Learn the basics...",
    "category": {
      "name": "Getting Started",
      "slug": "getting-started"
    }
  }
]
```

**Example**:
```bash
curl "http://localhost:3000/api/wiki/search?q=getting+started"
```

**Error Responses**:
- `400`: Missing query parameter
- `500`: Server error

### Health Check (To Be Implemented)

#### GET /api/health

Check system health status.

**Authentication**: Not required (public)

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "checks": {
    "database": true,
    "authentication": true
  }
}
```

**Error Response** (503):
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "error": "Database connection failed"
}
```

## Data Access Patterns

Most data operations use Supabase client directly instead of API routes:

### Server Components

```typescript
// app/forums/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function ForumsPage() {
  const supabase = await createClient()
  
  const { data: subforums, error } = await supabase
    .from('subforums')
    .select('*')
  
  if (error) {
    console.error('Error:', error)
    return <div>Error loading forums</div>
  }
  
  return <SubforumList subforums={subforums} />
}
```

### Client Components

```typescript
// components/forum/create-post-form.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function CreatePostForm() {
  const supabase = createClient()
  
  const handleSubmit = async (data: PostData) => {
    const { error } = await supabase
      .from('posts')
      .insert(data)
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    // Success
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Server Actions (Alternative)

```typescript
// app/actions/posts.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function createPost(data: PostData) {
  const supabase = await createClient()
  
  const { data: post, error } = await supabase
    .from('posts')
    .insert(data)
    .select()
    .single()
  
  if (error) throw error
  
  return post
}
```

## Error Handling

### Standard Error Response

All API routes return errors in this format:

```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not authorized)
- `404`: Not Found
- `500`: Internal Server Error

### Error Examples

**400 Bad Request**:
```json
{
  "error": "Missing required parameter: q"
}
```

**401 Unauthorized**:
```json
{
  "error": "Authentication required"
}
```

**404 Not Found**:
```json
{
  "error": "Article not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to fetch articles"
}
```

## Rate Limiting

**Current Status**: Not implemented

**Planned**:
- 100 requests per minute per IP
- 1000 requests per hour per user
- Stricter limits for write operations

## CORS

**Current Configuration**:
- Same-origin requests allowed
- Cross-origin requests blocked by default

**For Production**:
Configure allowed origins in `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://yourdomain.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  }
}
```

## Creating New API Routes

### Basic API Route

```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Fetch data
    const { data, error } = await supabase
      .from('table')
      .select('*')
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### API Route with Parameters

```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(data)
}
```

### API Route with Query Parameters

```typescript
// app/api/posts/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subforumId = searchParams.get('subforum')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  let query = supabase
    .from('posts')
    .select('*')
    .limit(limit)
  
  if (subforumId) {
    query = query.eq('subforum_id', subforumId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  return NextResponse.json(data)
}
```

### POST API Route

```typescript
// app/api/posts/route.ts
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validate input
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Insert data
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...body,
        author_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
```

## Best Practices

### Security

1. **Always validate authentication**:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

2. **Validate input**:
```typescript
const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1)
})

const result = schema.safeParse(body)
if (!result.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
}
```

3. **Sanitize error messages**:
```typescript
// Don't expose internal errors
catch (error) {
  console.error('Internal error:', error)
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
}
```

### Performance

1. **Use appropriate HTTP methods**:
   - GET: Read data
   - POST: Create data
   - PUT/PATCH: Update data
   - DELETE: Delete data

2. **Implement caching**:
```typescript
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  })
}
```

3. **Use pagination**:
```typescript
const page = parseInt(searchParams.get('page') || '0')
const limit = 20

const { data } = await supabase
  .from('posts')
  .select('*')
  .range(page * limit, (page + 1) * limit - 1)
```

### Error Handling

1. **Use try-catch blocks**
2. **Log errors for debugging**
3. **Return user-friendly messages**
4. **Use appropriate status codes**

## Testing API Routes

### Manual Testing

```bash
# GET request
curl http://localhost:3000/api/wiki/categories

# POST request
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content"}'

# With authentication
curl http://localhost:3000/api/posts \
  -H "Cookie: sb-xxx-auth-token=..."
```

### Automated Testing

```typescript
// app/api/posts/route.test.ts
import { describe, it, expect } from 'vitest'
import { GET, POST } from './route'

describe('Posts API', () => {
  it('should return posts', async () => {
    const request = new Request('http://localhost:3000/api/posts')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})
```

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Authentication Guide](./AUTHENTICATION.md) - Auth implementation
- [Database Guide](./DATABASE.md) - Database operations
- [Contributing Guide](./CONTRIBUTING.md) - Development guidelines
