/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { ChannelList } from "@/components/channel";
import { ChannelWithMembership } from "@/types/channel";
import {
  getChannels,
  joinChannel,
  leaveChannel,
  createChannel,
} from "@/lib/channel";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

function ChannelsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelWithMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChannels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await getChannels(undefined, user?.id);
      if (error) throw error;

      setChannels(data || []);
    } catch (err) {
      console.error("Failed to load channels:", err);
      setError(err instanceof Error ? err.message : "Failed to load clusters");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /**
   * Join channel (supports public + PIN-protected)
   * ChannelList / ChannelCard will pass pinCode when needed.
   */
  const handleJoinChannel = async (channelId: string, pinCode?: string) => {
    if (!user?.id) return;

    try {
      setError(null);
      const { error } = await joinChannel(channelId, user.id, pinCode);
      if (error) throw error;

      setChannels((prev) =>
        prev.map((channel) =>
          channel.id === channelId
            ? {
                ...channel,
                is_member: true,
                member_count: channel.member_count + 1,
              }
            : channel
        )
      );
    } catch (err) {
      console.error("Failed to join channel:", err);
      const message =
        err instanceof Error ? err.message : "Failed to join cluster";
      setError(message);
    }
  };

  const handleLeaveChannel = async (channelId: string) => {
    if (!user?.id) return;

    try {
      setError(null);
      const { error } = await leaveChannel(channelId, user.id);
      if (error) throw error;

      setChannels((prev) =>
        prev.map((channel) =>
          channel.id === channelId
            ? {
                ...channel,
                is_member: false,
                member_count: Math.max(0, channel.member_count - 1),
              }
            : channel
        )
      );
    } catch (err) {
      console.error("Failed to leave channel:", err);
      setError(err instanceof Error ? err.message : "Failed to leave cluster");
    }
  };

  const handleViewChannel = (channelId: string) => {
    router.push(`/clusters/${channelId}`);
  };

  // import the type if you exported it from the dialog: CreateChannelForm
  // or just inline the shape:

  const handleCreateChannel = async (data: {
    name: string;
    description: string;
    access_type: "public" | "pin";
    pin_code?: string;
  }) => {
    if (!user?.id) return;

    try {
      const { data: newChannel, error } = await createChannel(data, user.id);
      if (error) throw error;

      if (newChannel) {
        const channelWithMembership: ChannelWithMembership = {
          ...newChannel,
          is_member: false,
          creator_name: user.display_name || user.email,
        };
        setChannels((prev) => [channelWithMembership, ...prev]);
      }
    } catch (err) {
      console.error("Failed to create channel:", err);
      setError(err instanceof Error ? err.message : "Failed to create cluster");
      throw err;
    }
  };

  return (
    <>
      {/* neon bg shared with dashboard/forums */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />

      <main className='min-h-screen bg-background/80 px-4 py-10 md:px-6'>
        <div className='max-w-7xl mx-auto space-y-8'>
          {/* Header */}
          <header className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-3xl md:text-4xl font-bold text-primary'>
                Clusters
              </h1>
              <p className='mt-1 text-sm md:text-base text-muted-foreground max-w-xl'>
                Topic-based spaces for announcements, resources, and ongoing
                discussions. Join clusters to keep them close on your dashboard.
              </p>
            </div>
          </header>

          {/* Error banner */}
          {error && (
            <Card className='border-destructive/40 bg-destructive/10'>
              <CardContent className='flex items-center gap-3 py-3 text-sm text-destructive'>
                <AlertCircle className='h-4 w-4 shrink-0' />
                <span>{error}</span>
              </CardContent>
            </Card>
          )}

          {/* Channel list */}
          <ChannelList
            channels={channels}
            isLoading={isLoading}
            onJoinChannel={handleJoinChannel}
            onLeaveChannel={handleLeaveChannel}
            onViewChannel={handleViewChannel}
            onCreateChannel={user?.is_admin ? handleCreateChannel : undefined}
            onRefresh={loadChannels}
            isAdmin={user?.is_admin || false}
          />
        </div>
      </main>
    </>
  );
}

export default function ChannelsPage() {
  return (
    <ProtectedRoute requireVerified={false}>
      <ChannelsContent />
    </ProtectedRoute>
  );
}
