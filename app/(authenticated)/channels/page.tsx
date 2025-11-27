/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { MainNav } from "@/components/navigation/main-nav";
import { ChannelList } from "@/components/channel";
import { ChannelWithMembership } from "@/types/channel";
import {
  getChannels,
  joinChannel,
  leaveChannel,
  createChannel,
} from "@/lib/channel";

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
      setError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadChannels();
    }
  }, [user?.id]);

  const handleJoinChannel = async (channelId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await joinChannel(channelId, user.id);
      if (error) throw error;

      // Update local state
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
      setError(err instanceof Error ? err.message : "Failed to join channel");
    }
  };

  const handleLeaveChannel = async (channelId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await leaveChannel(channelId, user.id);
      if (error) throw error;

      // Update local state
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
      setError(err instanceof Error ? err.message : "Failed to leave channel");
    }
  };

  const handleViewChannel = (channelId: string) => {
    router.push(`/channels/${channelId}`);
  };

  const handleCreateChannel = async (data: {
    name: string;
    description: string;
  }) => {
    if (!user?.id) return;

    try {
      const { data: newChannel, error } = await createChannel(data, user.id);
      if (error) throw error;

      if (newChannel) {
        // Add the new channel to the list
        const channelWithMembership: ChannelWithMembership = {
          ...newChannel,
          is_member: false,
          creator_name: user.display_name || user.email,
        };
        setChannels((prev) => [channelWithMembership, ...prev]);
      }
    } catch (err) {
      console.error("Failed to create channel:", err);
      setError(err instanceof Error ? err.message : "Failed to create channel");
      throw err; // Re-throw to handle in the dialog
    }
  };

  return (
    <>
      <MainNav />
      <main className='min-h-screen p-8 bg-gray-900'>
        <div className='max-w-7xl mx-auto'>
          {error && (
            <div className='mb-6 bg-red-900/20 border border-red-700 rounded-md p-4'>
              <p className='text-red-400'>{error}</p>
            </div>
          )}

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
    <ProtectedRoute requireVerified={true}>
      <ChannelsContent />
    </ProtectedRoute>
  );
}
