'use client';

import { ChatSession } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onClose?: () => void;
}

/**
 * SessionList component
 * Displays list of chat sessions with switching and creation capabilities
 * Requirements: 5.1, 5.4
 */
export function SessionList({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onClose,
}: SessionListProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInMs = now.getTime() - sessionDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 24) {
      return sessionDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInDays < 7) {
      return sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return sessionDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with close button for mobile - Requirements 9.1, 9.3 */}
      <header className="p-3 md:p-4 border-b space-y-3 shrink-0">
        <div className="flex items-center justify-between md:hidden">
          <h3 className="font-semibold text-base" id="session-list-heading">Conversations</h3>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 touch-manipulation"
              aria-label="Close conversation list and return to chat"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>
        {/* New conversation button - Requirements 5.1, 9.3, 9.1 */}
        <Button
          onClick={onNewSession}
          className="w-full h-11 md:h-10 touch-manipulation active:scale-98 transition-transform"
          variant="default"
          aria-label="Start new conversation"
        >
          <Plus className="h-5 w-5 md:h-4 md:w-4 mr-2" aria-hidden="true" />
          <span className="text-sm md:text-base">New Conversation</span>
        </Button>
      </header>

      {/* Session list - Requirements 5.4, 9.3, 9.1 */}
      <ScrollArea className="flex-1 momentum-scroll" role="region" aria-label="Conversation list">
        <div className="p-2">
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8 px-4" role="status" aria-live="polite">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new conversation to begin</p>
            </div>
          ) : (
            <nav aria-labelledby="session-list-heading" aria-label="Your conversations">
              <ul className="space-y-1.5 md:space-y-1" role="list">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      className={cn(
                        'group relative rounded-lg p-3 md:p-2.5 w-full text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation active:scale-98',
                        currentSessionId === session.id && 'bg-accent'
                      )}
                      onClick={() => onSessionSelect(session.id)}
                      aria-label={`${currentSessionId === session.id ? 'Current conversation: ' : 'Switch to conversation: '}${session.title}, last updated ${formatDate(session.updatedAt)}`}
                      aria-current={currentSessionId === session.id ? 'page' : undefined}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {session.title}
                          </h4>
                          <time 
                            className="text-xs text-muted-foreground mt-1 block"
                            dateTime={new Date(session.updatedAt).toISOString()}
                            aria-label={`Last updated ${formatDate(session.updatedAt)}`}
                          >
                            {formatDate(session.updatedAt)}
                          </time>
                        </div>
                        {onDeleteSession && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 md:h-6 md:w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 touch-manipulation"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            aria-label={`Delete conversation: ${session.title}`}
                          >
                            <Trash2 className="h-4 w-4 md:h-3 md:w-3" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
