/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { ChannelView } from "@/components/channel";
import { ChannelWithMembership } from "@/types/channel";
import { getChannel } from "@/lib/channel";
import { Loader2 } from "lucide-react";

function ChannelPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<ChannelWithMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChannel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await getChannel(channelId, user?.id);

      if (error) throw error;

      if (!data) {
        throw new Error("Channel not found");
      }

      setChannel(data);
    } catch (err) {
      console.error("Failed to load channel:", err);
      setError(err instanceof Error ? err.message : "Failed to load channel");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && channelId) {
      loadChannel();
    }
  }, [user?.id, channelId]);

  const handleBack = () => {
    router.push("/channels");
  };

  const handleChannelUpdate = (updatedChannel: ChannelWithMembership) => {
    setChannel(updatedChannel);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-violet-400' />
          <p className='text-gray-400'>Loading channel...</p>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto'>
            <span className='text-red-400 text-xl'>!</span>
          </div>
          <h2 className='text-xl font-semibold text-white'>
            Channel Not Found
          </h2>
          <p className='text-gray-400'>
            {error || "The channel you're looking for doesn't exist."}
          </p>
          <button
            onClick={handleBack}
            className='px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-colors'>
            Back to Channels
          </button>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <p className='text-gray-400'>Please log in to view this channel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-screen'>
      <ChannelView
        channel={channel}
        currentUserId={user.id}
        onBack={handleBack}
        onChannelUpdate={handleChannelUpdate}
      />
    </div>
  );
}

export default function ChannelPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <ChannelPageContent />
    </ProtectedRoute>
  );
}
