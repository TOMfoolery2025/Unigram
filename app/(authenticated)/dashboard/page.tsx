/** @format */

"use client";

import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getChannels, getUserChannels } from "@/lib/channel";
import { getUserSubforums } from "@/lib/forum";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalChannels: 0,
    joinedChannels: 0,
    joinedSubforums: 0,
  });

  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [channelsResult, userChannelsResult, userSubforumsResult] =
        await Promise.all([
          getChannels(),
          getUserChannels(user.id),
          getUserSubforums(user.id),
        ]);

      setStats({
        totalChannels: channelsResult.data?.length || 0,
        joinedChannels: userChannelsResult.data?.length || 0,
        joinedSubforums: userSubforumsResult.data?.length || 0,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    // main padding / background is now controlled by (authenticated)/layout.tsx
    <div className='min-h-full'>
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-4xl font-bold text-primary mb-1'>Dashboard</h1>
            <p className='text-muted-foreground'>Welcome back, {user?.email}</p>
          </div>
        </div>

        {/* Profile card */}
        <Card className='border-border/60 bg-card/80'>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Account information and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Email:</span>
              <span>{user?.email}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Admin:</span>
              <span>{user?.is_admin ? "Yes" : "No"}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Can Create Events:</span>
              <span>{user?.can_create_events ? "Yes" : "No"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card className='border-border/60 bg-card/80'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Joined Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-violet-400'>
                {stats.joinedChannels}
              </div>
              <p className='text-xs text-muted-foreground'>
                of {stats.totalChannels} total channels
              </p>
            </CardContent>
          </Card>

          <Card className='border-border/60 bg-card/80'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Joined Subforums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-violet-400'>
                {stats.joinedSubforums}
              </div>
              <p className='text-xs text-muted-foreground'>
                discussion communities
              </p>
            </CardContent>
          </Card>

          <Card className='border-border/60 bg-card/80'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Account Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-violet-400'>
                {user?.is_admin ? "Admin" : "Student"}
              </div>
              <p className='text-xs text-muted-foreground'>
                {user?.can_create_events
                  ? "Can create events"
                  : "Standard access"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <Card className='border-border/60 bg-card/80'>
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
                className='h-20 flex flex-col items-center justify-center gap-2'
                onClick={() => router.push("/channels")}>
                <div className='text-lg'>📢</div>
                <span>Channels</span>
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
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
