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

  const [joinPin, setJoinPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // inside ChannelView component

  const [isLeaving, setIsLeaving] = useState(false);

  // ...

  const handleLeaveChannel = async () => {
    if (isLeaving) return;
    try {
      setError(null);
      setIsLeaving(true);

      const { error } = await leaveChannel(channel.id, currentUserId);
      if (error) throw error;

      const updatedChannel = { ...channel, is_member: false };
      onChannelUpdate?.(updatedChannel);

      // UX: go back to channels list if we have a back handler
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error("Failed to leave channel:", err);
      setError(err instanceof Error ? err.message : "Failed to leave channel");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping) setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500); // 1.5s after last keystroke
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  /* ---------------- LOAD INITIAL MESSAGES ---------------- */

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

  /* ---------------- REALTIME HANDLER ---------------- */

  const handleMessageUpdate = useCallback(
    (payload: MessageSubscriptionPayload) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;

        setMessages((prev) => {
          // avoid duplicates (because we do optimistic update on send)
          if (prev.some((m) => m.id === inserted.id)) return prev;

          const messageWithAuthor: ChannelMessageWithAuthor = {
            ...inserted,
            author_name:
              inserted.author_id === currentUserId ? "You" : "Unknown User",
            author_avatar: undefined,
          };

          return [...prev, messageWithAuthor];
        });

        return;
      }

      if (payload.eventType === "UPDATE") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
          )
        );
        return;
      }

      if (payload.eventType === "DELETE") {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.new.id));
        return;
      }
    },
    [currentUserId]
  );

  /* ---------------- SUBSCRIPTION SETUP ---------------- */

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

  /* ---------------- LOAD WHEN MEMBERSHIP CHANGES ---------------- */

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  /* ---------------- ACTIONS ---------------- */

  const handleSendMessage = async (content: string) => {
    try {
      setError(null);
      const { data: newMessage, error } = await sendMessage(
        { channel_id: channel.id, content },
        currentUserId
      );

      if (error) throw error;

      if (newMessage) {
        const messageWithAuthor: ChannelMessageWithAuthor = {
          ...newMessage,
          author_name: "You",
          author_avatar: undefined,
        };
        setMessages((prev) => [...prev, messageWithAuthor]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      throw err;
    }
  };

  const handleJoinChannel = async () => {
    try {
      setError(null);
      setPinError(null);

      let pinToSend: string | undefined;

      if (channel.access_type === "pin") {
        if (!/^\d{4}$/.test(joinPin)) {
          setPinError("Please enter the 4-digit channel PIN.");
          return;
        }
        pinToSend = joinPin;
      }

      setIsJoining(true);
      const { error } = await joinChannel(channel.id, currentUserId, pinToSend);
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

  /* ============================================================
   *  VIEW: NOT A MEMBER YET
   * ============================================================
   */

  if (!channel.is_member) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.14),transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),transparent_55%)]' />

        {/* Centered card like a chat window */}
        <div className='flex h-full items-center justify-center bg-background/70 px-2 md:px-6'>
          <div className='flex h-[calc(100vh-4rem)] max-h-[760px] w-full max-w-4xl flex-col rounded-3xl border border-border/60 bg-card shadow-xl overflow-hidden'>
            {/* header */}
            <header className='flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur'>
              {onBack && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onBack}
                  className='text-muted-foreground hover:text-foreground'>
                  <ArrowLeft className='h-4 w-4' />
                </Button>
              )}

              <div className='flex items-center gap-3'>
                <span className='inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <Hash className='h-4 w-4' />
                </span>
                <div>
                  <h1 className='text-sm font-semibold text-foreground md:text-base'>
                    {channel.name}
                  </h1>
                  <p className='text-xs text-muted-foreground'>
                    Join to see messages and updates from this channel.
                  </p>
                </div>
              </div>
            </header>

            {/* join content inside card */}
            <main className='flex flex-1 items-center justify-center px-6 py-8 bg-background/50'>
              <Card className='w-full max-w-md border-border/60 bg-card/95 shadow-md'>
                <CardHeader className='space-y-2 text-center'>
                  <div className='mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary'>
                    <Hash className='h-6 w-6' />
                  </div>
                  <CardTitle className='text-lg text-foreground'>
                    Join #{channel.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className='space-y-5'>
                  {channel.description && (
                    <p className='text-sm text-muted-foreground text-center'>
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

                  {channel.access_type === "pin" && (
                    <div className='space-y-2'>
                      <label className='text-xs font-medium text-foreground/90'>
                        Channel PIN
                      </label>
                      <div className='flex items-center gap-2'>
                        <input
                          type='password'
                          inputMode='numeric'
                          maxLength={4}
                          value={joinPin}
                          onChange={(e) => {
                            const next = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4);
                            setJoinPin(next);
                            if (pinError) setPinError(null);
                          }}
                          className='w-28 rounded-md border border-border/60 bg-background px-3 py-2 text-center text-sm tracking-[0.35em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/70'
                          placeholder='••••'
                        />
                        <span className='text-xs text-muted-foreground'>
                          Only people with this 4-digit PIN can join.
                        </span>
                      </div>
                      {pinError && (
                        <p className='text-xs text-destructive'>{pinError}</p>
                      )}
                    </div>
                  )}

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
                        type='button'
                        variant='outline'
                        className='border-border/60 text-muted-foreground hover:bg-background/80'
                        onClick={onBack}>
                        Back
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </>
    );
  }

  /* ============================================================
   *  VIEW: MEMBER (CHAT)
   * ============================================================
   */

  return (
    <>
      <div className='card-hover-glow card-hover-glow:hover  pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.14),transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),transparent_55%)]' />

      {/* Centered chat window; only inner messages area scrolls */}
      <div className='flex h-full items-center justify-center bg-background/70 px-2 md:px-6'>
        <div className='flex h-[calc(100vh-4rem)] max-h-[760px] w-full max-w-4xl card-hover-glow card-hover-glow:hover flex-col rounded-3xl border border-border/60 bg-card shadow-xl overflow-hidden'>
          {/* header bar */}
          <header className='flex items-center justify-between border-b border-border/60 bg-background/60 px-5 py-4'>
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

              <div className='flex items-center gap-3'>
                <span className='inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <Hash className='h-4 w-4' />
                </span>
                <div>
                  <h1 className='text-sm font-semibold text-foreground md:text-base'>
                    #{channel.name}
                  </h1>
                  <div className='flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <Users className='h-3.5 w-3.5' />
                      <span>{channel.member_count} members</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span className='h-1.5 w-1.5 rounded-full bg-primary' />
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
              disabled={isLeaving}
              className='border-border/60 text-xs text-muted-foreground hover:bg-background/80 md:text-sm'>
              {isLeaving ? "Leaving…" : "Leave channel"}
            </Button>
          </header>

          {/* error banner (inside card) */}
          {error && (
            <div className='border-b border-destructive/50 bg-destructive/10 px-5 py-2 text-xs text-destructive'>
              {error}
            </div>
          )}

          {/* messages + input; only this middle area scrolls */}
          <div className='flex flex-1 min-h-0 flex-col'>
            <MessageList
              messages={messages}
              isLoading={isLoadingMessages}
              currentUserId={currentUserId}
              autoScroll
            />

            {/* typing indicator */}
            {isTyping && (
              <div className='px-4 pb-1 text-[11px] text-muted-foreground'>
                <span className='inline-flex items-center gap-1'>
                  <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-primary' />
                  Typing…
                </span>
              </div>
            )}

            <div className='border-t border-border/60 bg-card/95 px-4 py-3'>
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!channel.is_member}
                placeholder={`Message #${channel.name}`}
                onTyping={handleTyping}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
