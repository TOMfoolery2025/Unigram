'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, ChatSession } from '@/types/chat';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';
import { SessionList } from './session-list';
import { WelcomeMessage } from './welcome-message';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
  userId: string;
  isAuthenticated: boolean;
}

/**
 * ChatWidget component
 * Floating chat button and expandable panel with session management
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */
export function ChatWidget({ userId, isAuthenticated }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat/sessions');
      if (!response.ok) throw new Error('Failed to load sessions');
      const data = await response.json();
      setSessions(data);
      
      // If no current session and sessions exist, select the most recent
      if (!currentSessionId && data.length > 0) {
        setCurrentSessionId(data[0].id);
      }
    } catch (err) {
      setError('Failed to load chat sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create session');
      const newSession = await response.json();
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setShowSessions(false);
    } catch (err) {
      setError('Failed to create new conversation');
      console.error('Error creating session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessions(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete session');
      
      setSessions(sessions.filter((s) => s.id !== sessionId));
      
      // If deleted session was current, switch to another or create new
      if (currentSessionId === sessionId) {
        const remainingSessions = sessions.filter((s) => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      setError('Failed to delete conversation');
      console.error('Error deleting session:', err);
    }
  };

  const handleSendMessage = async (message: string) => {
    // Create a new session if none exists
    if (!currentSessionId) {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/chat/sessions', {
          method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to create session');
        const newSession = await response.json();
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        setMessages([]);
        setShowSessions(false);
        setIsLoading(false);
        
        // Now send the message with the new session ID
        await sendMessageToSession(newSession.id, message);
        return;
      } catch (err) {
        setError('Failed to create new conversation');
        console.error('Error creating session:', err);
        setIsLoading(false);
        return;
      }
    }

    await sendMessageToSession(currentSessionId, message);
  };

  const sendMessageToSession = async (sessionId: string, message: string) => {

    try {
      setIsStreaming(true);
      setError(null);
      setLastMessage(message); // Store for retry - Requirement 7.3

      // Add user message optimistically
      const userMessage: ChatMessageType = {
        id: `temp-${Date.now()}`,
        sessionId: sessionId,
        role: 'user',
        content: message,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send message to API
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          message,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                
                // Requirement 7.3: Handle error events from stream
                if (parsed.type === 'error') {
                  const errorMsg = typeof parsed.data === 'string' ? parsed.data : 'Stream error occurred';
                  throw new Error(errorMsg);
                }
                
                if (parsed.type === 'content') {
                  assistantContent += parsed.data;
                  // Update assistant message
                  setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: assistantContent },
                      ];
                    } else {
                      return [
                        ...prev,
                        {
                          id: `temp-assistant-${Date.now()}`,
                          sessionId: sessionId,
                          role: 'assistant',
                          content: assistantContent,
                          createdAt: new Date(),
                        },
                      ];
                    }
                  });
                }
              } catch (e) {
                // Requirement 7.3: Log parsing errors
                console.error('Error parsing stream chunk:', e);
                if (e instanceof Error) {
                  throw e; // Re-throw to be caught by outer catch
                }
              }
            }
          }
        }
      }

      // Reload messages to get final state from server
      await loadMessages(sessionId);
    } catch (err: any) {
      // Requirement 7.3: Display user-friendly error messages
      let errorMessage = 'Failed to send message. Please try again.';
      
      // Check if this is an LLM service error with specific message
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      // Requirement 7.3: Log errors for monitoring
      console.error('Error sending message:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  // Requirement 7.3: Retry functionality
  const handleRetry = () => {
    if (lastMessage && currentSessionId) {
      setError(null);
      sendMessageToSession(currentSessionId, lastMessage);
    }
  };

  // Load sessions on mount
  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  // Keyboard navigation - Requirement 9.2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close chat - Requirement 9.2
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus management for modal - Requirement 9.2
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Store the element that had focus before opening
      const previouslyFocused = document.activeElement as HTMLElement;
      
      // Focus the close button when dialog opens
      closeButtonRef.current?.focus();

      // Trap focus within dialog
      const handleFocusTrap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !dialogRef.current) return;

        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      };

      document.addEventListener('keydown', handleFocusTrap);

      return () => {
        document.removeEventListener('keydown', handleFocusTrap);
        // Restore focus when dialog closes
        if (!isOpen && previouslyFocused) {
          previouslyFocused.focus();
        }
      };
    }
  }, [isOpen]);

  // Requirement 4.2: Only render for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating button - Requirements 4.1, 9.1, 9.3 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 md:h-16 md:w-16 rounded-full shadow-lg z-50 touch-manipulation active:scale-95 transition-transform"
          aria-label="Open TUM Wiki Assistant chat"
          aria-haspopup="dialog"
          aria-expanded={false}
        >
          <MessageSquare className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
          <span className="sr-only">Open chat assistant</span>
        </Button>
      )}

      {/* Chat panel overlay - Requirements 4.3, 4.5, 9.1, 9.2, 9.3 */}
      {isOpen && (
        <Card
          ref={dialogRef}
          className={cn(
            'fixed z-50 flex flex-col shadow-2xl transition-all duration-200 ease-in-out',
            // Mobile: Full screen with safe area support and proper height handling
            'inset-0 w-full h-full rounded-none chat-widget-mobile',
            // Tablet: Larger panel
            'md:inset-auto md:bottom-4 md:right-4 md:w-[500px] md:h-[700px] md:max-h-[calc(100vh-2rem)] md:rounded-lg',
            // Desktop: Standard size
            'lg:bottom-6 lg:right-6 lg:w-[420px] lg:h-[650px] lg:max-h-[calc(100vh-3rem)]'
          )}
          role="dialog"
          aria-label="TUM Wiki Assistant chat dialog"
          aria-modal="true"
          aria-describedby="chat-dialog-description"
        >
          {/* Header - Requirement 9.3, 9.1 */}
          <header className="flex items-center justify-between p-3 md:p-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSessions(!showSessions)}
                className="h-10 w-10 md:h-9 md:w-9 touch-manipulation"
                aria-label={showSessions ? 'Hide conversation list' : 'Show conversation list'}
                aria-expanded={showSessions}
                aria-controls="session-list-sidebar"
              >
                <Menu className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
              </Button>
              <h2 className="font-semibold text-base md:text-lg" id="chat-dialog-title">TUM Wiki Assistant</h2>
            </div>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-10 w-10 md:h-9 md:w-9 touch-manipulation"
              aria-label="Close chat dialog (Press Escape)"
            >
              <X className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
            </Button>
          </header>
          <p id="chat-dialog-description" className="sr-only">
            Chat interface for asking questions about TUM. Press Escape to close. Use Tab to navigate between elements.
          </p>

          {/* Content - Requirements 9.1, 9.3 */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Session list sidebar */}
            {showSessions && (
              <aside 
                id="session-list-sidebar"
                className={cn(
                  'border-r',
                  // Mobile: Full width overlay with animation
                  'absolute inset-0 z-10 bg-background w-full animate-in slide-in-from-left duration-200',
                  // Tablet and up: Sidebar
                  'md:relative md:w-64 md:z-auto md:animate-none'
                )}
                role="complementary"
                aria-label="Conversation history"
              >
                <SessionList
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSessionSelect={handleSessionSelect}
                  onNewSession={handleNewSession}
                  onDeleteSession={handleDeleteSession}
                  onClose={() => setShowSessions(false)}
                />
              </aside>
            )}

            {/* Chat area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0" role="main" aria-label="Chat conversation area">
              {/* Requirement 5.2: Show welcome message for new sessions */}
              {messages.length === 0 && !isLoading ? (
                <WelcomeMessage onQuestionClick={handleSendMessage} />
              ) : (
                <ChatMessageList
                  messages={messages}
                  isStreaming={isStreaming}
                  isLoading={isLoading}
                  error={error}
                  onRetry={handleRetry}
                />
              )}
              <ChatInput
                onSend={handleSendMessage}
                disabled={isStreaming}
              />
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
