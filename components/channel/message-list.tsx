/** @format */

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import { User, Loader2 } from "lucide-react";
import { ChannelMessageWithAuthor } from "@/types/channel";
import Image from "next/image";
import { UserAvatar } from "@/components/profile/user-avatar";

interface MessageListProps {
  messages: ChannelMessageWithAuthor[];
  isLoading?: boolean;
  currentUserId?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  autoScroll?: boolean;
}

interface MessageGroupProps {
  messages: ChannelMessageWithAuthor[];
  currentUserId?: string;
}

function MessageGroup({ messages, currentUserId }: MessageGroupProps) {
  const router = useRouter();

  if (messages.length === 0) return null;

  const firstMessage = messages[0];
  const isOwnMessage = firstMessage.author_id === currentUserId;

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`;
    } else {
      return format(date, "MMM d, HH:mm");
    }
  };

  const handleAuthorClick = () => {
    if (firstMessage.author_id && !isOwnMessage) {
      router.push(`/profile/${firstMessage.author_id}`);
    }
  };

  return (
    <div
      className={`group flex gap-3 px-2 py-1 rounded-2xl transition-colors ${
        isOwnMessage ? "flex-row-reverse" : ""
      } hover:bg-[rgba(148,163,184,0.12)]`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 ${!isOwnMessage ? "cursor-pointer" : ""}`}
        onClick={handleAuthorClick}>
        <UserAvatar
          userId={firstMessage.author_id}
          displayName={firstMessage.author_name}
          avatarUrl={firstMessage.author_avatar}
          size='sm'
        />
      </div>

      {/* Messages */}
      <div
        className={`flex max-w-[75%] flex-col space-y-1 md:max-w-[65%] ${
          isOwnMessage ? "items-end text-right" : ""
        }`}>
        {/* Author + timestamp */}
        <div
          className={`flex items-center gap-2 text-[11px] text-muted-foreground ${
            isOwnMessage ? "flex-row-reverse text-right" : ""
          }`}>
          <span
            className={`font-medium text-foreground/90 ${
              !isOwnMessage
                ? "cursor-pointer hover:text-primary transition-colors"
                : ""
            }`}
            onClick={handleAuthorClick}>
            {isOwnMessage ? "You" : firstMessage.author_name || "Unknown User"}
          </span>
          <span>{formatMessageTime(firstMessage.created_at)}</span>
        </div>

        {/* Message bubbles */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`w-fit max-w-full break-words rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
              isOwnMessage
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
            <p className='whitespace-pre-wrap'>{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  isLoading = false,
  currentUserId,
  onLoadMore,
  hasMore = false,
  autoScroll = true,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Group consecutive messages from the same author within 5 minutes
  const groupedMessages = messages.reduce((groups, message) => {
    const lastGroup = groups[groups.length - 1];

    if (
      lastGroup &&
      lastGroup.length > 0 &&
      lastGroup[0].author_id === message.author_id &&
      new Date(message.created_at).getTime() -
        new Date(lastGroup[lastGroup.length - 1].created_at).getTime() <
        300000 // 5 minutes
    ) {
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }

    return groups;
  }, [] as ChannelMessageWithAuthor[][]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll, shouldAutoScroll]);

  // Scroll handler for autoScroll + loadMore
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);

    // Load more when scrolled to top
    if (scrollTop === 0 && hasMore && onLoadMore) {
      onLoadMore();
    }
  };
  // How many distinct calendar days are in this chat?
  const hasMultipleDates =
    new Set(messages.map((m) => format(new Date(m.created_at), "yyyy-MM-dd")))
      .size > 1;

  const formatDateSeparator = (date: string, hasMultipleDates: boolean) => {
    const messageDate = new Date(date);

    // If all messages are from today -> don't show any date chip
    if (isToday(messageDate)) {
      return hasMultipleDates ? "Today" : null;
    }

    if (isYesterday(messageDate)) {
      return "Yesterday";
    }

    return format(messageDate, "MMMM d, yyyy"); // e.g. "March 3, 2025"
  };

  // Group messages by date for separators
  // Group messages by date for separators (one chip per day, no chip for today)
  // Group messages by date for separators (Instagram-style)
  const messagesWithDates: Array<
    | { type: "date"; date: string; displayDate: string }
    | { type: "messages"; messages: ChannelMessageWithAuthor[] }
  > = [];

  let lastDateKey: string | null = null;

  for (const group of groupedMessages) {
    const first = group[0];
    const dateKey = format(new Date(first.created_at), "yyyy-MM-dd");

    // Only when the date changes
    if (dateKey !== lastDateKey) {
      const displayDate = formatDateSeparator(
        first.created_at,
        hasMultipleDates
      );

      // Only push a chip if we actually have a label (no chip for today if it's the only day)
      if (displayDate) {
        messagesWithDates.push({
          type: "date",
          date: dateKey,
          displayDate,
        });
      }

      lastDateKey = dateKey;
    }

    messagesWithDates.push({
      type: "messages",
      messages: group,
    });
  }

  // Initial loading (no messages yet)
  if (isLoading && messages.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center bg-background/90'>
        <div className='space-y-2 text-center'>
          <Loader2 className='mx-auto h-6 w-6 animate-spin text-primary' />
          <p className='text-sm text-muted-foreground'>Loading messages…</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center bg-background/90 px-4'>
        <div className='space-y-3 text-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
            <User className='h-6 w-6 text-muted-foreground' />
          </div>
          <div>
            <h3 className='text-base font-semibold text-foreground'>
              No messages yet
            </h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              Be the first to start the conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className='flex-1 min-h-0 overflow-y-auto bg-background/90 px-3 py-4 md:px-4'>
      {/* inner flex column so content hugs the bottom when short */}
      <div className='flex min-h-full flex-col justify-end space-y-4'>
        {/* Load more indicator */}
        {hasMore && (
          <div className='py-2 text-center text-xs text-muted-foreground'>
            {isLoading ? (
              <span className='inline-flex items-center gap-2'>
                <Loader2 className='h-3 w-3 animate-spin' />
                <span>Loading older messages…</span>
              </span>
            ) : (
              "Scroll up to load more messages"
            )}
          </div>
        )}

        {/* Messages with date separators */}
        {messagesWithDates.map((item, index) => {
          if (item.type === "date") {
            return (
              <div key={item.date} className='flex justify-center py-1'>
                <div className='rounded-full border border-border/60 bg-muted px-3 py-1 text-[11px] text-muted-foreground'>
                  {item.displayDate}
                </div>
              </div>
            );
          }

          return (
            <MessageGroup
              key={`group-${index}`}
              messages={item.messages}
              currentUserId={currentUserId}
            />
          );
        })}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
