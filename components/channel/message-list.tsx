/** @format */

"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { User, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelMessageWithAuthor } from "@/types/channel";
import Image from "next/image";

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

  return (
    <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className='flex-shrink-0'>
        {firstMessage.author_avatar ? (
          <div className='relative w-8 h-8 rounded-full overflow-hidden'>
            <Image
              src={firstMessage.author_avatar}
              alt={firstMessage.author_name || "User"}
              fill
              sizes="32px"
              className='object-cover'
            />
          </div>
        ) : (
          <div className='w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center'>
            <User className='h-4 w-4 text-white' />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className={`flex-1 max-w-[70%] space-y-1`}>
        {/* Author and timestamp */}
        <div
          className={`flex items-center gap-2 text-xs text-gray-400 ${
            isOwnMessage ? "flex-row-reverse" : ""
          }`}>
          <span className='font-medium'>
            {isOwnMessage ? "You" : firstMessage.author_name || "Unknown User"}
          </span>
          <span>{formatMessageTime(firstMessage.created_at)}</span>
        </div>

        {/* Message bubbles */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg break-words ${
              isOwnMessage
                ? "bg-violet-600 text-white ml-auto"
                : "bg-gray-700 text-gray-100"
            }`}>
            <p className='text-sm whitespace-pre-wrap'>{message.content}</p>
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

  // Group consecutive messages from the same author
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

  // Check if user is near bottom to determine auto-scroll behavior
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);

    // Load more messages when scrolled to top
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

  // Group messages by date for date separators
  const messagesWithDates = groupedMessages.reduce((acc, group) => {
    const messageDate = format(new Date(group[0].created_at), "yyyy-MM-dd");
    const lastItem = acc[acc.length - 1];

    if (
      !lastItem ||
      lastItem.type !== "date" ||
      lastItem.date !== messageDate
    ) {
      acc.push({
        type: "date" as const,
        date: messageDate,
        displayDate: formatDateSeparator(group[0].created_at),
      });
    }

    acc.push({
      type: "messages" as const,
      messages: group,
    });

    return acc;
  }, [] as Array<{ type: "date"; date: string; displayDate: string } | { type: "messages"; messages: ChannelMessageWithAuthor[] }>);

  if (isLoading && messages.length === 0) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-900'>
        <div className='text-center space-y-2'>
          <Loader2 className='h-6 w-6 animate-spin mx-auto text-violet-400' />
          <p className='text-gray-400'>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-900'>
        <div className='text-center space-y-2'>
          <div className='w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto'>
            <User className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-white'>No messages yet</h3>
          <p className='text-gray-400'>
            Be the first to start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className='flex-1 overflow-y-auto bg-gray-900 p-4 space-y-4'>
      {/* Load more indicator */}
      {hasMore && (
        <div className='text-center py-2'>
          <div className='text-sm text-gray-400'>
            {isLoading ? (
              <div className='flex items-center justify-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Loading more messages...
              </div>
            ) : (
              "Scroll up to load more messages"
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {messagesWithDates.map((item, index) => {
        if (item.type === "date") {
          return (
            <div key={item.date} className='flex justify-center py-2'>
              <div className='bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300'>
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
