'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireVerified?: boolean
  requireAdmin?: boolean
  requireEventCreator?: boolean
}

export function ProtectedRoute({
  children,
  requireVerified = true,
  requireAdmin = false,
  requireEventCreator = false,
}: ProtectedRouteProps) {
  const { user, loading, isEmailVerified } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.push('/login')
        return
      }

      // Email not verified
      if (requireVerified && !isEmailVerified) {
        router.push('/verify-email')
        return
      }

      // Admin required but user is not admin
      if (requireAdmin && !user.is_admin) {
        router.push('/')
        return
      }

      // Event creator permission required but user doesn't have it
      if (requireEventCreator && !user.can_create_events && !user.is_admin) {
        router.push('/')
        return
      }
    }
  }, [user, loading, isEmailVerified, requireVerified, requireAdmin, requireEventCreator, router])

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children until auth checks pass
  if (!user) {
    return null
  }

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
