'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function GuestAccessButton() {
  const router = useRouter()

  const handleGuestAccess = () => {
    // Redirect to wiki section for guest users
    router.push('/wiki')
  }

  return (
    <Button
      variant="outline"
      onClick={handleGuestAccess}
      className="w-full"
    >
      Continue as Guest
    </Button>
  )
}
