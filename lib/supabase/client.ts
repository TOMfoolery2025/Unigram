import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser client instance cache
 * 
 * This singleton pattern ensures we reuse the same Supabase client instance
 * across all component renders in the browser, which:
 * - Reduces memory usage
 * - Prevents unnecessary connection overhead
 * - Maintains consistent auth state across components
 * - Improves performance by avoiding repeated client initialization
 */
let browserClient: SupabaseClient | null = null

/**
 * Creates or returns cached Supabase browser client for Client Components
 * 
 * This function implements a singleton pattern to ensure only one client instance
 * exists throughout the application lifecycle in the browser. The client is cached
 * on first creation and reused for all subsequent calls.
 * 
 * **When to use:**
 * - Client Components (components with 'use client' directive)
 * - Browser-side data fetching
 * - Real-time subscriptions
 * - Client-side mutations
 * 
 * **When NOT to use:**
 * - Server Components - use lib/supabase/server.ts instead
 * - Server Actions - use lib/supabase/server.ts instead
 * - Route Handlers - use lib/supabase/server.ts instead
 * - Middleware - create client inline with proper cookie handling
 * 
 * **Performance characteristics:**
 * - First call: Creates new client (~10ms)
 * - Subsequent calls: Returns cached instance (~0.1ms)
 * - Memory: Single instance shared across all components
 * 
 * @returns {SupabaseClient} Cached Supabase client instance
 * 
 * @example
 * // In a Client Component
 * 'use client'
 * 
 * import { createClient } from '@/lib/supabase/client'
 * import { useEffect, useState } from 'react'
 * 
 * export function UserProfile() {
 *   const [user, setUser] = useState(null)
 *   const supabase = createClient()
 * 
 *   useEffect(() => {
 *     supabase.auth.getUser().then(({ data }) => {
 *       setUser(data.user)
 *     })
 *   }, [])
 * 
 *   return <div>{user?.email}</div>
 * }
 * 
 * @example
 * // Real-time subscription in Client Component
 * 'use client'
 * 
 * import { createClient } from '@/lib/supabase/client'
 * import { useEffect } from 'react'
 * 
 * export function MessageList() {
 *   const supabase = createClient()
 * 
 *   useEffect(() => {
 *     const channel = supabase
 *       .channel('messages')
 *       .on('postgres_changes', 
 *         { event: 'INSERT', schema: 'public', table: 'messages' },
 *         (payload) => console.log('New message:', payload)
 *       )
 *       .subscribe()
 * 
 *     return () => {
 *       supabase.removeChannel(channel)
 *     }
 *   }, [])
 * 
 *   return <div>Messages</div>
 * }
 */
export function createClient() {
  // Return cached instance if it exists
  if (browserClient) {
    return browserClient
  }

  // Create new client instance and cache it
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return browserClient
}
