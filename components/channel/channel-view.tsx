/** @format */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Hash, Users, ArrowLeft, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import {
  ChannelWithMembership,
  ChannelMessageWithAuthor,
  MessageSubscriptionPayload,
} from "@/types/channel";
import {
  getChannelMessages,
  sendMessage,
  subscribeToChannelMessages,
  unsubscribeFromChannelMessages,
} from "@/lib/channel/messages";
import { joinChannel, leaveChannel } from "@/lib/channel/channels";

interface ChannelViewProps {
  channel: ChannelWithMembership;
  currentUserId: string;
  onBack?: () => void;
  onChannelUpdate?: (channel: ChannelWithMembership) => void;
}

export function ChannelView({
  channel,
  currentUserId,
  onBack,
  onChannelUpdate,
}: ChannelViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChannelMessageWithAuthor[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!channel.is_member) return;

    try {
      setIsLoadingMessages(true);
      setError(null);
      const { data, error } = await getChannelMessages(
        channel.id,
        currentUserId
      );

      if (error) throw error;

      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [channel.id, channel.is_member, currentUserId]);

  // Handle real-time message updates
  const handleMessageUpdate = useCallback(
    (payload: MessageSubscriptionPayload) => {
      if (payload.eventType === "INSERT") {
        // Add new message with author info
        const newMessage: ChannelMessageWithAuthor = {
          ...payload.new,
          author_name: "Loading...", // Will be updated when we fetch full message
          author_avatar: undefined,
        };

        setMessages((prev) => [...prev, newMessage]);

        // Fetch full message with author info
        getChannelMessages(channel.id, currentUserId, {
          sortBy: "created_at",
          sortOrder: "desc",
          limit: 1,
        }).then(({ data }) => {
          if (data && data.length > 0) {
            const fullMessage = data[0];
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? fullMessage : msg))
            );
          }
        });
      } else if (payload.eventType === "UPDATE") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
          )
        );
      } else if (payload.eventType === "DELETE") {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.new.id));
      }
    },
    [channel.id, currentUserId]
  );

  // Set up real-time subscription
  useEffect(() => {
    if (channel.is_member) {
      subscriptionRef.current = subscribeToChannelMessages(
        channel.id,
        handleMessageUpdate
      );
    }

    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromChannelMessages(subscriptionRef.current);
      }
    };
  }, [channel.id, channel.is_member, handleMessageUpdate]);

  // Load messages when component mounts or membership changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSendMessage = async (content: string) => {
    try {
      setError(null);
      const { error } = await sendMessage(
        {
          channel_id: channel.id,
          content,
        },
        currentUserId
      );

      if (error) throw error;
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      throw err; // Re-throw to handle in MessageInput
    }
  };

  const handleJoinChannel = async () => {
    try {
      setIsJoining(true);
      setError(null);
      const { error } = await joinChannel(channel.id, currentUserId);

      if (error) throw error;

      // Update channel membership status
      const updatedChannel = { ...channel, is_member: true };
      onChannelUpdate?.(updatedChannel);

      // Load messages after joining
      await loadMessages();
    } catch (err) {
      console.error("Failed to join channel:", err);
      setError(err instanceof Error ? err.message : "Failed to join channel");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveChannel = async () => {
    try {
      setError(null);
      const { error } = await leaveChannel(channel.id, currentUserId);

      if (error) throw error;

      // Update channel membership status
      const updatedChannel = { ...channel, is_member: false };
      onChannelUpdate?.(updatedChannel);

      // Clear messages
      setMessages([]);
    } catch (err) {
      console.error("Failed to leave channel:", err);
      setError(err instanceof Error ? err.message : "Failed to leave channel");
    }
  };

  if (!channel.is_member) {
    return (
      <div className='flex flex-col h-full bg-gray-900'>
        {/* Header */}
        <div className='flex items-center gap-4 p-4 bg-gray-800 border-b border-gray-700'>
          {onBack && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onBack}
              className='text-gray-400 hover:text-white'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          )}
          <div className='flex items-center gap-2'>
            <Hash className='h-5 w-5 text-violet-400' />
            <h1 className='text-lg font-semibold text-white'>{channel.name}</h1>
          </div>
        </div>

        {/* Join prompt */}
        <div className='flex-1 flex items-center justify-center p-8'>
          <Card className='bg-gray-800 border-gray-700 max-w-md w-full'>
            <CardHeader className='text-center'>
              <div className='mx-auto w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center mb-4'>
                <Hash className='h-6 w-6 text-white' />
              </div>
              <CardTitle className='text-violet-400'>{channel.name}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-gray-400 text-center'>{channel.description}</p>

              <div className='flex items-center justify-center gap-4 text-sm text-gray-500'>
                <div className='flex items-center gap-1'>
                  <Users className='h-4 w-4' />
                  <span>{channel.member_count} members</span>
                </div>
                <div className='flex items-center gap-1'>
                  <div className='w-2 h-2 bg-violet-400 rounded-full'></div>
                  <span>Official Channel</span>
                </div>
              </div>

              {error && (
                <div className='bg-red-900/20 border border-red-700 rounded-md p-3'>
                  <p className='text-red-400 text-sm'>{error}</p>
                </div>
              )}

              <div className='flex gap-2'>
                <Button
                  onClick={handleJoinChannel}
                  disabled={isJoining}
                  className='flex-1 bg-violet-600 hover:bg-violet-700'>
                  {isJoining ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Joining...
                    </>
                  ) : (
                    "Join Channel"
                  )}
                </Button>
                {onBack && (
                  <Button
                    variant='outline'
                    onClick={onBack}
                    className='border-gray-600 text-gray-300 hover:bg-gray-700'>
                    Back
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-gray-900'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700'>
        <div className='flex items-center gap-4'>
          {onBack && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onBack}
              className='text-gray-400 hover:text-white'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          )}
          <div className='flex items-center gap-2'>
            <Hash className='h-5 w-5 text-violet-400' />
            <h1 className='text-lg font-semibold text-white'>{channel.name}</h1>
          </div>
          <div className='flex items-center gap-4 text-sm text-gray-400'>
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4' />
              <span>{channel.member_count}</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-2 h-2 bg-violet-400 rounded-full'></div>
              <span>Official</span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleLeaveChannel}
            className='border-gray-600 text-gray-300 hover:bg-gray-700'>
            Leave Channel
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className='bg-red-900/20 border-b border-red-700 p-3'>
          <p className='text-red-400 text-sm'>{error}</p>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        currentUserId={currentUserId}
        autoScroll={true}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!channel.is_member}
        placeholder={`Message #${channel.name}`}
      />
    </div>
  );
}
