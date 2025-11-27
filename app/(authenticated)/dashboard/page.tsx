'use client'

import { ProtectedRoute } from '@/components/auth'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Account information and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admin:</span>
              <span>{user?.is_admin ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Can Create Events:</span>
              <span>{user?.can_create_events ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Navigate to different sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Forums, channels, events, and calendar features will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <DashboardContent />
    </ProtectedRoute>
  )
}
