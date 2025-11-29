'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessage } from './chat-message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isStreaming?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * ChatMessageList component
 * Renders list of messages with auto-scroll, typing indicator, and error handling
 * Requirements: 2.2, 9.4, 9.3
 */
export function ChatMessageList({
  messages,
  isStreaming = false,
  isLoading = false,
  error = null,
  onRetry,
}: ChatMessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message when new messages arrive - Requirement 9.4
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Announce new messages to screen readers - Requirement 9.3
  useEffect(() => {
    if (messages.length > 0 && announcementRef.current) {
      const lastMessage = messages[messages.length - 1];
      const announcement = lastMessage.role === 'user' 
        ? 'You sent a message' 
        : 'Assistant replied';
      announcementRef.current.textContent = announcement;
    }
  }, [messages]);

  return (
    <ScrollArea 
      className="flex-1 p-3 md:p-4 scroll-smooth-mobile overscroll-contain" 
      ref={scrollAreaRef} 
      role="region" 
      aria-label="Chat conversation"
    >
      {/* Screen reader announcement for new messages - Requirement 9.3 */}
      <div 
        ref={announcementRef}
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      />

      {/* Loading state */}
      {isLoading && messages.length === 0 && (
        <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            <p className="text-sm">Loading messages...</p>
          </div>
        </div>
      )}

      {/* Error state - Requirements 9.3, 7.3, 1.1 */}
      {error && (
        <div 
          className={cn(
            "mb-4 p-3 border rounded-lg",
            error.includes('Rate limit') 
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              : "bg-destructive/10 border-destructive/20"
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex flex-col gap-2">
            <p className={cn(
              "text-sm",
              error.includes('Rate limit')
                ? "text-amber-800 dark:text-amber-200"
                : "text-destructive"
            )}>
              {error}
            </p>
            {/* Requirement 7.3, 1.1: Provide retry functionality */}
            {onRetry && !error.includes('Rate limit') && (
              <button
                onClick={onRetry}
                className="text-xs text-destructive hover:text-destructive/80 underline self-start focus:outline-none focus:ring-2 focus:ring-destructive/50 rounded px-1"
                aria-label="Retry sending message"
              >
                Try again
              </button>
            )}
            {/* Requirement 1.1: Display wait time for rate limits */}
            {error.includes('Rate limit') && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Your request will be processed once the wait time has elapsed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && messages.length === 0 && !error && (
        <div className="flex items-center justify-center h-full px-4" role="status">
          <div className="text-center text-muted-foreground max-w-sm">
            <p className="text-sm md:text-base mb-2">
              👋 Welcome to the TUM Wiki Assistant!
            </p>
            <p className="text-xs md:text-sm">
              Ask me anything about TUM and I&apos;ll help you find information from
              the wiki.
            </p>
          </div>
        </div>
      )}

      {/* Messages list - Requirement 9.3 - Optimized spacing for mobile */}
      <div 
        role="log" 
        aria-label="Chat message history"
        aria-live="off"
        aria-relevant="additions"
        className="space-y-0 pb-2 min-h-0"
      >
        {messages.map((message, index) => (
          <ChatMessage 
            key={message.id} 
            message={message}
          />
        ))}
      </div>

      {/* Typing indicator during streaming - Requirements 2.2, 9.3 */}
      {isStreaming && (
        <div 
          className="flex w-full mb-4 justify-start"
          role="status"
          aria-live="polite"
          aria-label="Assistant is typing"
        >
          <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
            <div className="flex items-center gap-2">
              <div className="flex gap-1" aria-hidden="true">
                <span
                  className={cn(
                    'w-2 h-2 bg-foreground/40 rounded-full animate-bounce',
                    '[animation-delay:-0.3s]'
                  )}
                />
                <span
                  className={cn(
                    'w-2 h-2 bg-foreground/40 rounded-full animate-bounce',
                    '[animation-delay:-0.15s]'
                  )}
                />
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-muted-foreground">
                Assistant is typing...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor - Requirement 9.4 */}
      <div ref={messagesEndRef} aria-hidden="true" />
    </ScrollArea>
  );
}
