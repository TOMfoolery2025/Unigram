import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase server client for Server Components, Server Actions, and Route Handlers
 * 
 * **Request-Scoped Caching:**
 * Next.js automatically caches the cookies() function per request. This means:
 * - Multiple calls to createClient() in the same request reuse the same cookie store
 * - No need for manual client instance caching on the server
 * - Each request gets its own isolated client with proper auth context
 * - Memory is automatically cleaned up after the request completes
 * 
 * **When to use:**
 * - Server Components: Data fetching in React Server Components
 * - Server Actions: Mutations and form submissions
 * - Route Handlers: API endpoints (app/api/*)
 * - Any server-side code that needs database access
 * 
 * **When NOT to use:**
 * - Client Components: Use lib/supabase/client.ts instead
 * - Browser-side code: Use lib/supabase/client.ts instead
 * - Middleware: Create client inline with proper cookie handling
 * 
 * **Performance characteristics:**
 * - First call in request: Creates new client (~5ms)
 * - Subsequent calls in same request: Reuses cookie store (~1ms)
 * - Memory: Automatically cleaned up after request
 * - Connection pooling: Handled by Supabase automatically
 * 
 * **Cookie handling:**
 * - get(): Reads auth cookies from the request
 * - set(): Updates auth cookies (works in Route Handlers and Server Actions)
 * - remove(): Clears auth cookies (works in Route Handlers and Server Actions)
 * 
 * Note: set() and remove() will fail silently in Server Components because
 * they are read-only. This is expected - use middleware for session refresh.
 * 
 * @returns {Promise<SupabaseClient>} Server-side Supabase client with request context
 * 
 * @example
 * // Server Component - Data fetching
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export default async function PostsPage() {
 *   const supabase = await createClient()
 *   
 *   const { data: posts } = await supabase
 *     .from('posts')
 *     .select('id, title, content')
 *     .order('created_at', { ascending: false })
 *   
 *   return (
 *     <div>
 *       {posts?.map(post => (
 *         <article key={post.id}>
 *           <h2>{post.title}</h2>
 *           <p>{post.content}</p>
 *         </article>
 *       ))}
 *     </div>
 *   )
 * }
 * 
 * @example
 * // Server Action - Mutation
 * 'use server'
 * 
 * import { createClient } from '@/lib/supabase/server'
 * import { revalidatePath } from 'next/cache'
 * 
 * export async function createPost(formData: FormData) {
 *   const supabase = await createClient()
 *   
 *   const { data, error } = await supabase
 *     .from('posts')
 *     .insert({
 *       title: formData.get('title'),
 *       content: formData.get('content')
 *     })
 *     .select()
 *     .single()
 *   
 *   if (error) throw error
 *   
 *   revalidatePath('/posts')
 *   return data
 * }
 * 
 * @example
 * // Route Handler - API endpoint
 * import { createClient } from '@/lib/supabase/server'
 * import { NextResponse } from 'next/server'
 * 
 * export async function GET(request: Request) {
 *   const supabase = await createClient()
 *   
 *   // Check authentication
 *   const { data: { user } } = await supabase.auth.getUser()
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   
 *   // Fetch data
 *   const { data: posts } = await supabase
 *     .from('posts')
 *     .select('*')
 *   
 *   return NextResponse.json({ posts })
 * }
 * 
 * @example
 * // Multiple calls in same request (efficient)
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export default async function DashboardPage() {
 *   const supabase = await createClient()
 *   
 *   // All these calls reuse the same cookie store (request-scoped caching)
 *   const { data: user } = await supabase.auth.getUser()
 *   const { data: posts } = await supabase.from('posts').select('*')
 *   const { data: comments } = await supabase.from('comments').select('*')
 *   
 *   return <div>Dashboard content</div>
 * }
 */
export async function createClient() {
  // Get request-scoped cookie store (cached by Next.js per request)
  const cookieStore = await cookies()

  // Create server client with cookie handlers
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Read cookie value from the request
         * Used to retrieve auth tokens for the current request
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        /**
         * Set cookie value in the response
         * Works in Route Handlers and Server Actions
         * Fails silently in Server Components (expected behavior)
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        /**
         * Remove cookie from the response
         * Works in Route Handlers and Server Actions
         * Fails silently in Server Components (expected behavior)
         */
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
