import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/wiki', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  // Auth routes that should redirect if already logged in
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))

  // Wiki is accessible to guests (no authentication required)
  if (path.startsWith('/wiki')) {
    return response
  }

  // If user is logged in and trying to access auth pages, redirect to home
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is not logged in and trying to access protected routes
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is logged in but email is not verified, redirect to verify-email page
  // (except for verify-email page itself and auth callback)
  if (
    user &&
    !user.email_confirmed_at &&
    !path.startsWith('/verify-email') &&
    !path.startsWith('/auth/callback') &&
    !isAuthRoute
  ) {
    return NextResponse.redirect(new URL('/verify-email', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
