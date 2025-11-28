/** @format */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { logger } from "@/lib/monitoring";
import { SessionCache } from "@/lib/auth/session-cache";
import { createHash } from "crypto";

/**
 * Middleware configuration for route protection
 */
interface MiddlewareConfig {
  publicRoutes: string[];
  authRoutes: string[];
  guestRoutes: string[];
  nonCriticalRoutes: string[]; // Routes accessible without email verification
  sessionRefreshThreshold: number; // seconds before expiry
  cacheEnabled: boolean;
}

const routeConfig: MiddlewareConfig = {
  // Routes accessible without authentication
  publicRoutes: ["/login", "/register", "/wiki", "/auth/callback", "/verify-email"],
  // Routes that redirect to dashboard if already authenticated
  authRoutes: ["/login", "/register"],
  // Routes accessible to guests (no auth check needed)
  guestRoutes: ["/wiki"],
  // Routes accessible without email verification (non-critical features)
  nonCriticalRoutes: ["/dashboard", "/profile", "/hives", "/calendar", "/clusters"],
  // Refresh session if it expires within 2 minutes (120 seconds)
  sessionRefreshThreshold: 120,
  // Enable session caching
  cacheEnabled: true,
};

/**
 * Check if a path matches any route in the list
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => path.startsWith(route));
}

/**
 * Generate a cache key from session tokens
 * Uses a hash of the access token for privacy and consistency
 */
function generateCacheKey(request: NextRequest): string | null {
  // Get the access token from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value || 
                     request.cookies.get('supabase-auth-token')?.value;
  
  if (!accessToken) {
    return null;
  }
  
  // Create a hash of the token for the cache key
  return createHash('sha256').update(accessToken).digest('hex');
}

/**
 * Main middleware function for authentication and session management
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Cleanup expired cache entries on each request
  if (routeConfig.cacheEnabled) {
    SessionCache.cleanup();
  }

  // Early return for guest routes - skip all auth checks
  if (matchesRoute(path, routeConfig.guestRoutes)) {
    return NextResponse.next();
  }

  // Generate cache key for this request
  const cacheKey = routeConfig.cacheEnabled ? generateCacheKey(request) : null;
  
  // Check cache first
  if (cacheKey) {
    const cachedEntry = SessionCache.get(cacheKey);
    if (cachedEntry) {
      // Cache hit - use cached user
      const user = cachedEntry.user;
      
      // Handle route logic with cached user
      const isPublicRoute = matchesRoute(path, routeConfig.publicRoutes);
      const isAuthRoute = matchesRoute(path, routeConfig.authRoutes);

      if (user && isAuthRoute) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (!user && !isPublicRoute) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", path);
        return NextResponse.redirect(loginUrl);
      }

      // Handle email verification requirement - allow access to non-critical routes
      const isNonCriticalRoute = matchesRoute(path, routeConfig.nonCriticalRoutes);
      if (
        user &&
        !user.email_confirmed_at &&
        !path.startsWith("/verify-email") &&
        !path.startsWith("/auth/callback") &&
        !isAuthRoute &&
        !isNonCriticalRoute
      ) {
        return NextResponse.redirect(new URL("/verify-email", request.url));
      }

      // Return with cached result
      return NextResponse.next();
    }
  }

  // Cache miss - proceed with full authentication check
  // Create response object once for atomic cookie updates
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with consistent cookie handling
  // All cookie operations use the same response object for atomicity
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update both request and response cookies atomically
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
          // Update both request and response cookies atomically
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
  let user = null;
  let sessionError = null;
  
  try {
    const {
      data: { session },
      error: getSessionError,
    } = await supabase.auth.getSession();

    sessionError = getSessionError;
    user = session?.user ?? null;

    // Check if session needs refresh
    if (session) {
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      // Refresh if session expires within 2 minutes (120 seconds) - more lenient threshold
      const shouldRefresh = expiresAt ? (expiresAt - now) < routeConfig.sessionRefreshThreshold : false;

      if (shouldRefresh) {
        // Check if refresh is already in progress for this session
        if (cacheKey && SessionCache.isRefreshInProgress(cacheKey)) {
          // Wait for the in-progress refresh to complete
          try {
            const refreshedUser = await SessionCache.getRefreshInProgress(cacheKey);
            if (refreshedUser) {
              user = refreshedUser;
            }
            // If refresh failed, keep existing user for continued access
          } catch (error) {
            logger.debug("Waiting for refresh failed, using existing session", {
              operation: 'middleware_refresh_wait',
              metadata: { 
                error: error instanceof Error ? error.message : String(error),
                path 
              },
            });
          }
        } else {
          // Start a new refresh operation
          const refreshPromise = (async () => {
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                // Graceful error handling - fallback to existing session
                logger.debug("Session refresh failed, using existing session", {
                  operation: 'middleware_session_refresh',
                  metadata: { error: refreshError.message, path },
                });
                // Return existing user for continued access
                return user;
              } else if (refreshData.session) {
                // Clear cache on successful refresh to force re-validation
                if (cacheKey) {
                  SessionCache.clear(cacheKey);
                }
                return refreshData.session.user;
              }
              return user;
            } catch (error) {
              // Graceful error handling - fallback to existing session
              logger.debug("Session refresh error, using existing session", {
                operation: 'middleware_session_refresh',
                metadata: { 
                  error: error instanceof Error ? error.message : String(error),
                  path 
                },
              });
              // Return existing user for continued access
              return user;
            } finally {
              // Clear refresh-in-progress state
              if (cacheKey) {
                SessionCache.clearRefreshInProgress(cacheKey);
              }
            }
          })();

          // Track this refresh operation
          if (cacheKey) {
            SessionCache.setRefreshInProgress(cacheKey, refreshPromise);
          }

          // Wait for refresh to complete
          const refreshedUser = await refreshPromise;
          if (refreshedUser) {
            user = refreshedUser;
          }
        }
      }
    } else if (!sessionError) {
      // No session but no error - attempt silent refresh before giving up
      // This handles the case where the session has expired
      if (cacheKey && SessionCache.isRefreshInProgress(cacheKey)) {
        // Wait for in-progress refresh
        try {
          const refreshedUser = await SessionCache.getRefreshInProgress(cacheKey);
          if (refreshedUser) {
            user = refreshedUser;
          }
        } catch (error) {
          logger.debug("Waiting for refresh failed", {
            operation: 'middleware_refresh_wait',
            metadata: { 
              error: error instanceof Error ? error.message : String(error),
              path 
            },
          });
        }
      } else {
        // Try silent refresh using refresh token
        try {
          const refreshPromise = (async () => {
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (!refreshError && refreshData.session) {
                logger.debug("Silent refresh successful", {
                  operation: 'middleware_silent_refresh',
                  metadata: { path },
                });
                // Clear cache to force re-validation with new session
                if (cacheKey) {
                  SessionCache.clear(cacheKey);
                }
                return refreshData.session.user;
              }
              
              // Refresh failed - try getUser as final fallback
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              return currentUser;
            } catch (error) {
              logger.debug("Silent refresh and getUser failed", {
                operation: 'middleware_silent_refresh',
                metadata: { 
                  error: error instanceof Error ? error.message : String(error),
                  path 
                },
              });
              return null;
            } finally {
              if (cacheKey) {
                SessionCache.clearRefreshInProgress(cacheKey);
              }
            }
          })();

          // Track this refresh operation
          if (cacheKey) {
            SessionCache.setRefreshInProgress(cacheKey, refreshPromise);
          }

          user = await refreshPromise;
        } catch (error) {
          // Graceful error handling - continue with null user
          logger.debug("Failed to refresh or get user, continuing with null", {
            operation: 'middleware_get_user',
            metadata: { 
              error: error instanceof Error ? error.message : String(error),
              path 
            },
          });
        }
      }
    }
  } catch (error) {
    // Graceful error handling for any unexpected errors
    logger.error("Middleware authentication error", {
      operation: 'middleware_auth',
      metadata: { 
        error: error instanceof Error ? error.message : String(error),
        path 
      },
    });
    // Continue with null user
    user = null;
  }

  // Cache the result for future requests
  if (cacheKey && routeConfig.cacheEnabled) {
    SessionCache.set(cacheKey, user);
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

  // Handle email verification requirement - allow access to non-critical routes
  const isNonCriticalRoute = matchesRoute(path, routeConfig.nonCriticalRoutes);
  if (
    user &&
    !user.email_confirmed_at &&
    !path.startsWith("/verify-email") &&
    !path.startsWith("/auth/callback") &&
    !isAuthRoute &&
    !isNonCriticalRoute
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
