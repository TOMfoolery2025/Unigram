'use client'

import { useState } from 'react'
import { resendVerificationEmail } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface VerifyEmailPromptProps {
  email: string
}

export function VerifyEmailPrompt({ email }: VerifyEmailPromptProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResend = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await resendVerificationEmail(email)

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Email Verification Required</CardTitle>
        <CardDescription>
          Please verify your email address to access the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-violet-500/15 p-4 text-sm">
          <p className="mb-2">
            We&apos;ve sent a verification email to <strong>{email}</strong>
          </p>
          <p className="text-muted-foreground">
            Click the link in the email to verify your account and gain access
            to all features.
          </p>
        </div>

        {success && (
          <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
            Verification email sent! Please check your inbox.
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={loading || success}
        >
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Check your spam folder if you don&apos;t see the email
        </p>
      </CardFooter>
    </Card>
  )
}
