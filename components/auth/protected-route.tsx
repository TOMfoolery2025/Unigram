'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireVerified?: boolean
  requireAdmin?: boolean
  requireEventCreator?: boolean
  fallback?: React.ReactNode // Custom loading component
  redirectTo?: string // Custom redirect destination
}

export function ProtectedRoute({
  children,
  requireVerified = false, // Changed default to false for lenient verification
  requireAdmin = false,
  requireEventCreator = false,
  fallback,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading, isEmailVerified } = useAuth()
  const router = useRouter()
  const hasRedirectedRef = useRef(false) // Ensure single redirect without loops

  useEffect(() => {
    // Only perform redirect logic when auth status is known (loading = false)
    if (!loading && !hasRedirectedRef.current) {
      // Not authenticated
      if (!user) {
        hasRedirectedRef.current = true
        router.push(redirectTo || '/login')
        return
      }

      // Email not verified - only redirect if explicitly required
      if (requireVerified && !isEmailVerified) {
        hasRedirectedRef.current = true
        router.push('/verify-email')
        return
      }

      // Admin required but user is not admin
      if (requireAdmin && !user.is_admin) {
        hasRedirectedRef.current = true
        router.push('/')
        return
      }

      // Event creator permission required but user doesn't have it
      if (requireEventCreator && !user.can_create_events && !user.is_admin) {
        hasRedirectedRef.current = true
        router.push('/')
        return
      }
    }
  }, [user, loading, isEmailVerified, requireVerified, requireAdmin, requireEventCreator, router, redirectTo])

  // Show loading state only when auth status is truly unknown (loading = true)
  // This prevents flickering when auth is already confirmed
  if (loading) {
    // Use custom fallback if provided, otherwise use default skeleton
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Default skeleton fallback to prevent layout shift
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Render content immediately when auth is confirmed (loading = false)
  // Don't render children until auth checks pass
  if (!user) {
    return null
  }

  // Only block on email verification if explicitly required
  if (requireVerified && !isEmailVerified) {
    return null
  }

  if (requireAdmin && !user.is_admin) {
    return null
  }

  if (requireEventCreator && !user.can_create_events && !user.is_admin) {
    return null
  }

  return <>{children}</>
}
