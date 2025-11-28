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
    <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div 
        className={`flex-shrink-0 ${!isOwnMessage ? 'cursor-pointer' : ''}`}
        onClick={handleAuthorClick}
      >
        <UserAvatar
          userId={firstMessage.author_id}
          displayName={firstMessage.author_name}
          avatarUrl={firstMessage.author_avatar}
          size="sm"
        />
      </div>

      {/* Messages */}
      <div className='flex-1 max-w-[75%] space-y-1 md:max-w-[65%]'>
        {/* Author + timestamp */}
        <div
          className={`flex items-center gap-2 text-[11px] text-muted-foreground ${
            isOwnMessage ? "flex-row-reverse text-right" : ""
          }`}>
          <span 
            className={`font-medium text-foreground/90 ${!isOwnMessage ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
            onClick={handleAuthorClick}
          >
            {isOwnMessage ? "You" : firstMessage.author_name || "Unknown User"}
          </span>
          <span>{formatMessageTime(firstMessage.created_at)}</span>
        </div>

        {/* Message bubbles */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`inline-block break-words rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
              isOwnMessage
                ? "ml-auto bg-primary text-primary-foreground"
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

  const formatDateSeparator = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return "Today";
    } else if (isYesterday(messageDate)) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMMM d, yyyy");
    }
  };

  // Group messages by date for separators
  const messagesWithDates = groupedMessages.reduce((acc, group) => {
    const messageDateKey = format(new Date(group[0].created_at), "yyyy-MM-dd");
    const lastItem = acc[acc.length - 1];

    if (
      !lastItem ||
      lastItem.type !== "date" ||
      lastItem.date !== messageDateKey
    ) {
      acc.push({
        type: "date" as const,
        date: messageDateKey,
        displayDate: formatDateSeparator(group[0].created_at),
      });
    }

    acc.push({
      type: "messages" as const,
      messages: group,
    });

    return acc;
  }, [] as Array<{ type: "date"; date: string; displayDate: string } | { type: "messages"; messages: ChannelMessageWithAuthor[] }>);

  // Initial loading (no messages yet)
  if (isLoading && messages.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center bg-background/90'>
        <div className='text-center space-y-2'>
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
      className='flex-1 min-h-0 overflow-y-auto bg-background/90 px-3 py-4 md:px-4 space-y-4'>
      {/* Load more indicator */}
      {hasMore && (
        <div className='py-2 text-center text-xs text-muted-foreground'>
          {isLoading ? (
            <div className='inline-flex items-center gap-2'>
              <Loader2 className='h-3 w-3 animate-spin' />
              <span>Loading older messages…</span>
            </div>
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
  );
}
