'use client';

import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * ChatMessage component
 * Displays a single chat message with different styling for user and assistant messages
 * Requirements: 1.3, 3.1, 3.3, 9.3
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const formattedTime = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article
      className={cn(
        'flex w-full mb-3 md:mb-4 px-1 chat-message-container',
        isUser ? 'justify-end' : 'justify-start'
      )}
      aria-label={`${isUser ? 'Your' : 'Assistant'} message sent at ${formattedTime}`}
      role="article"
    >
      <div
        className={cn(
          // Mobile: More generous width for better readability on narrow screens
          'max-w-[92%] sm:max-w-[85%] md:max-w-[80%] rounded-lg',
          // Mobile: Optimized padding for touch screens
          'px-3 py-2.5 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3',
          'min-w-0 overflow-hidden',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {/* Message sender label for screen readers - Requirement 9.3 */}
        <span className="sr-only">{isUser ? 'You said:' : 'Assistant said:'}</span>

        {/* Message content - Optimized for mobile narrow screens */}
        <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden streaming-content" role="region" aria-label="Message content">
          {isUser ? (
            <p className="text-[15px] leading-relaxed md:text-sm whitespace-pre-wrap m-0 break-words overflow-wrap-anywhere">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="text-[15px] leading-relaxed md:text-sm mb-2 last:mb-0 break-words overflow-wrap-anywhere">{children}</p>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-primary underline hover:text-primary/80 break-words overflow-wrap-anywhere touch-manipulation inline-block max-w-full min-h-[44px] flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`External link: ${children}`}
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1.5 md:space-y-1 overflow-hidden" role="list">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1.5 md:space-y-1 overflow-hidden" role="list">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="break-words overflow-wrap-anywhere leading-relaxed">{children}</li>
                ),
                code: ({ className, children }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-background/50 px-1.5 py-0.5 rounded text-[13px] md:text-xs font-mono break-all max-w-full inline-block">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-background/50 p-2.5 md:p-2 rounded text-[13px] md:text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words" role="code">
                      {children}
                    </code>
                  );
                },
                strong: ({ children }) => (
                  <strong className="break-words overflow-wrap-anywhere font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="break-words overflow-wrap-anywhere">{children}</em>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Article sources - Requirements 1.3, 3.1, 3.3, 9.3, 9.1 - Optimized for mobile */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <nav className="mt-3 pt-3 border-t border-border/50" aria-label="Referenced wiki articles">
            <p className="text-xs font-semibold mb-2 opacity-70" id={`sources-${message.id}`}>Sources:</p>
            <ul className="flex flex-col gap-2 md:gap-1.5" role="list" aria-labelledby={`sources-${message.id}`}>
              {message.sources.map((source, index) => (
                <li key={index}>
                  <Link
                    href={`/wiki/articles/${source.slug}`}
                    className="text-[13px] md:text-xs hover:underline flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity touch-manipulation py-1.5 md:py-1 break-words min-h-[44px] md:min-h-0"
                    aria-label={`View source article: ${source.title}${source.category ? ` in ${source.category} category` : ''}`}
                  >
                    <span aria-hidden="true" className="shrink-0">📄</span>
                    <span className="break-words">
                      {source.title}
                      {source.category && (
                        <span className="opacity-60 block sm:inline" aria-label={`Category: ${source.category}`}>
                          <span className="hidden sm:inline"> • </span>
                          {source.category}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Timestamp */}
        <time
          className={cn(
            'text-xs mt-2 opacity-60 block',
            isUser ? 'text-right' : 'text-left'
          )}
          dateTime={new Date(message.createdAt).toISOString()}
          aria-label={`Sent at ${formattedTime}`}
        >
          {formattedTime}
        </time>
      </div>
    </article>
  );
}
