/** @format */

"use client";

import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { MainNav } from "@/components/navigation/main-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <MainNav />
      <main className='min-h-screen p-8 bg-background'>
        <div className='max-w-4xl mx-auto space-y-6'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h1 className='text-4xl font-bold text-primary mb-2'>
                Dashboard
              </h1>
              <p className='text-muted-foreground'>
                Welcome back, {user?.email}
              </p>
            </div>
            <Button variant='outline' onClick={handleSignOut}>
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
            <CardContent className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Email:</span>
                <span>{user?.email}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Admin:</span>
                <span>{user?.is_admin ? "Yes" : "No"}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  Can Create Events:
                </span>
                <span>{user?.can_create_events ? "Yes" : "No"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Navigate to different sections</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <Button
                  variant='outline'
                  className='h-20 flex flex-col items-center justify-center gap-2'
                  onClick={() => router.push("/forums")}>
                  <div className='text-lg'>💬</div>
                  <span>Forums</span>
                </Button>

                <Button
                  variant='outline'
                  className='h-20 flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed'
                  disabled>
                  <div className='text-lg'>📢</div>
                  <span>Channels</span>
                  <span className='text-xs text-muted-foreground'>
                    Coming Soon
                  </span>
                </Button>

                <Button
                  variant='outline'
                  className='h-20 flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed'
                  disabled>
                  <div className='text-lg'>📅</div>
                  <span>Events</span>
                  <span className='text-xs text-muted-foreground'>
                    Coming Soon
                  </span>
                </Button>

                <Button
                  variant='outline'
                  className='h-20 flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed'
                  disabled>
                  <div className='text-lg'>🗓️</div>
                  <span>Calendar</span>
                  <span className='text-xs text-muted-foreground'>
                    Coming Soon
                  </span>
                </Button>

                <Button
                  variant='outline'
                  className='h-20 flex flex-col items-center justify-center gap-2'
                  onClick={() => router.push("/wiki")}>
                  <div className='text-lg'>📚</div>
                  <span>Wiki</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
