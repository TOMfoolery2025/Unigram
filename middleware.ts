/** @format */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { logger } from "@/lib/monitoring";

/**
 * Middleware configuration for route protection
 */
interface MiddlewareConfig {
  publicRoutes: string[];
  authRoutes: string[];
  guestRoutes: string[];
}

const routeConfig: MiddlewareConfig = {
  // Routes accessible without authentication
  publicRoutes: ["/login", "/register", "/wiki", "/auth/callback", "/verify-email"],
  // Routes that redirect to dashboard if already authenticated
  authRoutes: ["/login", "/register"],
  // Routes accessible to guests (no auth check needed)
  guestRoutes: ["/wiki"],
};

/**
 * Check if a path matches any route in the list
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => path.startsWith(route));
}

/**
 * Main middleware function for authentication and session management
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Early return for guest routes - skip all auth checks
  if (matchesRoute(path, routeConfig.guestRoutes)) {
    return NextResponse.next();
  }

  // Create response object once
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with consistent cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update both request and response cookies consistently
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Update both request and response cookies consistently
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Get session and check if refresh is needed
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  let user = session?.user ?? null;

  // Check if session needs refresh
  if (session) {
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    // Refresh if session expires within 5 minutes (300 seconds)
    const shouldRefresh = expiresAt ? (expiresAt - now) < 300 : false;

    if (shouldRefresh || sessionError) {
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          logger.error("Session refresh failed", {
            operation: 'middleware_session_refresh',
            metadata: { error: refreshError.message, path },
          });
          // If refresh fails, try to get user anyway
          const { data: { user: fallbackUser } } = await supabase.auth.getUser();
          user = fallbackUser;
        } else if (refreshData.session) {
          user = refreshData.session.user;
          logger.debug("Session refreshed successfully", {
            operation: 'middleware_session_refresh',
            metadata: { path },
          });
        }
      } catch (error) {
        logger.error("Session refresh error", {
          operation: 'middleware_session_refresh',
          metadata: { 
            error: error instanceof Error ? error.message : String(error),
            path 
          },
        });
        // Fallback to getUser
        const { data: { user: fallbackUser } } = await supabase.auth.getUser();
        user = fallbackUser;
      }
    }
  } else if (!sessionError) {
    // No session but no error - try to get user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    user = currentUser;
  }

  const isPublicRoute = matchesRoute(path, routeConfig.publicRoutes);
  const isAuthRoute = matchesRoute(path, routeConfig.authRoutes);

  // Handle authenticated users on auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Handle unauthenticated users on protected routes
  if (!user && !isPublicRoute) {
    logger.info("Unauthenticated access to protected route", {
      operation: 'middleware_auth_redirect',
      metadata: { path, destination: '/login' },
    });
    // Preserve destination URL for redirect after login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Handle email verification requirement
  if (
    user &&
    !user.email_confirmed_at &&
    !path.startsWith("/verify-email") &&
    !path.startsWith("/auth/callback") &&
    !isAuthRoute
  ) {
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  return response;
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
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
