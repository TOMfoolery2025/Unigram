/** @format */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Hash, Users, ArrowLeft, Loader2 } from "lucide-react";
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
  const [messages, setMessages] = useState<ChannelMessageWithAuthor[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // ------- LOAD INITIAL MESSAGES -------
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

  // ------- REALTIME HANDLER -------
  const handleMessageUpdate = useCallback(
    (payload: MessageSubscriptionPayload) => {
      if (payload.eventType === "INSERT") {
        const newMessage: ChannelMessageWithAuthor = {
          ...payload.new,
          author_name: "Loading...",
          author_avatar: undefined,
        };

        setMessages((prev) => [...prev, newMessage]);

        // fetch full latest message (with author)
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

  // ------- SUBSCRIPTION SETUP -------
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

  // ------- LOAD WHEN MEMBERSHIP CHANGES -------
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // ------- ACTIONS -------
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
      throw err;
    }
  };

  const handleJoinChannel = async () => {
    try {
      setIsJoining(true);
      setError(null);
      const { error } = await joinChannel(channel.id, currentUserId);
      if (error) throw error;

      const updatedChannel = { ...channel, is_member: true };
      onChannelUpdate?.(updatedChannel);

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

      const updatedChannel = { ...channel, is_member: false };
      onChannelUpdate?.(updatedChannel);

      setMessages([]);
    } catch (err) {
      console.error("Failed to leave channel:", err);
      setError(err instanceof Error ? err.message : "Failed to leave channel");
    }
  };

  // ========================================
  //  VIEW: NOT A MEMBER YET
  // ========================================
  if (!channel.is_member) {
    return (
      <>
        {/* soft neon bg */}
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.08),transparent_55%)]' />

        <div className='flex h-full flex-col bg-background/85 overflow-hidden'>
          {/* header */}
          <header className='flex items-center gap-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur'>
            {onBack && (
              <Button
                variant='ghost'
                size='icon'
                onClick={onBack}
                className='text-muted-foreground hover:text-foreground'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            )}
            <div className='flex items-center gap-2'>
              <span className='inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <Hash className='h-4 w-4' />
              </span>
              <div>
                <h1 className='text-base font-semibold text-foreground md:text-lg'>
                  {channel.name}
                </h1>
                <p className='text-xs text-muted-foreground'>
                  Join to see messages and updates from this channel.
                </p>
              </div>
            </div>
          </header>

          {/* join prompt */}
          <main className='flex flex-1 items-center justify-center px-4 py-8'>
            <Card className='card-hover-glow w-full max-w-md border-border/60 bg-card/95'>
              <CardHeader className='space-y-2 text-center'>
                <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary'>
                  <Hash className='h-6 w-6' />
                </div>
                <CardTitle className='text-lg text-primary'>
                  Join #{channel.name}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {channel.description && (
                  <p className='text-center text-sm text-muted-foreground'>
                    {channel.description}
                  </p>
                )}

                <div className='flex items-center justify-center gap-4 text-xs text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Users className='h-3.5 w-3.5' />
                    <span>{channel.member_count} members</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <span className='h-2 w-2 rounded-full bg-primary' />
                    <span>Official channel</span>
                  </div>
                </div>

                {error && (
                  <div className='rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
                    {error}
                  </div>
                )}

                <div className='mt-2 flex gap-2'>
                  <Button
                    onClick={handleJoinChannel}
                    disabled={isJoining}
                    className='flex-1 bg-primary hover:bg-primary/90'>
                    {isJoining ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Joining…
                      </>
                    ) : (
                      "Join channel"
                    )}
                  </Button>
                  {onBack && (
                    <Button
                      variant='outline'
                      className='border-border/60 text-muted-foreground hover:bg-background/80'
                      type='button'
                      onClick={onBack}>
                      Back
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  // ========================================
  //  VIEW: MEMBER (CHAT)
  // ========================================
  return (
    <>
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.08),transparent_55%)]' />

      {/* full-height flex column, only messages area scrolls */}
      <div className='flex h-full flex-col bg-background/85 overflow-hidden'>
        {/* header */}
        <header className='flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur'>
          <div className='flex items-center gap-4'>
            {onBack && (
              <Button
                variant='ghost'
                size='icon'
                onClick={onBack}
                className='text-muted-foreground hover:text-foreground'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            )}

            <div className='flex items-center gap-2'>
              <span className='inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <Hash className='h-4 w-4' />
              </span>
              <div>
                <h1 className='text-base font-semibold text-foreground md:text-lg'>
                  #{channel.name}
                </h1>
                <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Users className='h-3.5 w-3.5' />
                    <span>{channel.member_count} members</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <span className='h-2 w-2 rounded-full bg-primary' />
                    <span>Official</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={handleLeaveChannel}
            className='border-border/60 text-xs text-muted-foreground hover:bg-background/80 md:text-sm'>
            Leave channel
          </Button>
        </header>

        {/* top-level error */}
        {error && (
          <div className='border-b border-destructive/50 bg-destructive/10 px-4 py-2 text-xs text-destructive'>
            {error}
          </div>
        )}

        {/* messages + input */}
        <div className='flex flex-1 min-h-0 flex-col'>
          <MessageList
            messages={messages}
            isLoading={isLoadingMessages}
            currentUserId={currentUserId}
            autoScroll
          />

          <div className='border-t border-border/60 bg-background/90'>
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={!channel.is_member}
              placeholder={`Message #${channel.name}`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
