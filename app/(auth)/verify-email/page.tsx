'use client'

import { useAuth } from '@/lib/auth'
import { VerifyEmailPrompt } from '@/components/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function VerifyEmailPage() {
  const { user, loading, isEmailVerified } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login')
      } else if (isEmailVerified) {
        // Already verified, redirect to home
        router.push('/')
      }
    }
  }, [user, loading, isEmailVerified, router])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            TUM Community Platform
          </h1>
        </div>
        
        <VerifyEmailPrompt email={user.email} />
      </div>
    </main>
  )
}
