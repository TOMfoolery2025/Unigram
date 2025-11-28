'use client';

/**
 * Chat Context and Hooks
 * Provides React context for chat state management
 * Requirements: 1.1, 2.1, 5.4, 4.5, 4.6, 10.5, 10.6
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ChatMessage, ChatSession, ChatStreamChunk, ArticleSource } from '@/types/chat';
import { useAuth } from '@/lib/auth';

// LocalStorage keys for session persistence
const STORAGE_KEYS = {
  CURRENT_SESSION_ID: 'chat_current_session_id',
  SESSIONS_CACHE: 'chat_sessions_cache',
  MESSAGES_CACHE: 'chat_messages_cache',
} as const;

interface ChatContextType {
  // Session state
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoadingSessions: boolean;
  
  // Message state
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  
  // Streaming state
  isStreaming: boolean;
  
  // Error state
  error: string | null;
  
  // Session actions
  loadSessions: () => Promise<void>;
  createNewSession: (title?: string) => Promise<string | null>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Message actions
  sendMessage: (message: string) => Promise<void>;
  
  // Error actions
  clearError: () => void;
  retryLastMessage: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  
  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Message state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Store last message for retry
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  
  /**
   * Save session state to localStorage for quick restore
   * Requirement 4.5: Preserve session when closed
   */
  const saveToLocalStorage = useCallback((sessionId: string | null, sessionsData: ChatSession[], messagesData: ChatMessage[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      if (sessionId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, sessionId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
      }
      
      localStorage.setItem(STORAGE_KEYS.SESSIONS_CACHE, JSON.stringify(sessionsData));
      localStorage.setItem(STORAGE_KEYS.MESSAGES_CACHE, JSON.stringify(messagesData));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }, []);
  
  /**
   * Load session state from localStorage for quick restore
   * Requirement 4.6: Restore session when reopened
   */
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const savedSessionId = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
      const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS_CACHE);
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES_CACHE);
      
      return {
        sessionId: savedSessionId,
        sessions: savedSessions ? JSON.parse(savedSessions) : [],
        messages: savedMessages ? JSON.parse(savedMessages) : [],
      };
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      return null;
    }
  }, []);
  
  /**
   * Clear all chat data from memory and localStorage
   * Requirement 10.5: Clear in-memory data on logout
   */
  const clearAllChatData = useCallback(() => {
    setSessions([]);
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setLastMessage(null);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
        localStorage.removeItem(STORAGE_KEYS.SESSIONS_CACHE);
        localStorage.removeItem(STORAGE_KEYS.MESSAGES_CACHE);
      } catch (err) {
        console.error('Error clearing localStorage:', err);
      }
    }
  }, []);
  
  /**
   * Load all sessions for the authenticated user
   * Requirements: 5.4, 4.6, 10.6
   * - Load from database on mount
   * - Restore sessions on login
   */
  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoadingSessions(true);
      setError(null);
      
      // Requirement 4.6: Quick restore from localStorage while fetching from database
      const cached = loadFromLocalStorage();
      if (cached && cached.sessions.length > 0) {
        setSessions(cached.sessions);
        if (cached.sessionId) {
          setCurrentSessionId(cached.sessionId);
          setMessages(cached.messages);
        }
      }
      
      // Requirement 10.6: Load sessions from database on mount/login
      const response = await fetch('/api/chat/sessions');
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }
      
      const data = await response.json();
      setSessions(data);
      
      // If no current session and sessions exist, select the most recent
      if (!currentSessionId && data.length > 0) {
        setCurrentSessionId(data[0].id);
      }
      
      // Save to localStorage for quick restore next time
      saveToLocalStorage(currentSessionId || (data.length > 0 ? data[0].id : null), data, messages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chat sessions';
      setError(errorMessage);
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user, currentSessionId, loadFromLocalStorage, saveToLocalStorage, messages]);
  
  /**
   * Load messages for a specific session
   * Requirement 4.5: Save to localStorage for persistence
   */
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      const loadedMessages = data.messages || [];
      setMessages(loadedMessages);
      
      // Save to localStorage for quick restore
      saveToLocalStorage(sessionId, sessions, loadedMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
      console.error('Error loading messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [sessions, saveToLocalStorage]);
  
  /**
   * Create a new chat session
   * Requirements: 5.1, 5.3, 5.4, 4.5
   * - Clear context when starting new conversation (5.1)
   * - Ensure new responses don't reference old messages (5.3)
   * - Create new session in database (5.4)
   */
  const createNewSession = useCallback(async (title?: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      setIsLoadingSessions(true);
      setError(null);
      
      // Clear any previous error state and last message to ensure clean slate
      setLastMessage(null);
      
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'New Conversation' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const newSession = await response.json();
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setCurrentSessionId(newSession.id);
      
      // Requirement 5.1: Clear context when starting new conversation
      // Completely clear messages array to ensure no old context remains
      setMessages([]);
      
      // Save to localStorage with empty messages
      // This ensures that if the chat is closed and reopened, no old messages appear
      saveToLocalStorage(newSession.id, updatedSessions, []);
      
      return newSession.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create new conversation';
      setError(errorMessage);
      console.error('Error creating session:', err);
      return null;
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user, sessions, saveToLocalStorage]);
  
  /**
   * Switch to a different session
   * Requirements: 5.4, 4.5
   */
  const switchSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
    // loadMessages will save to localStorage
  }, [loadMessages]);
  
  /**
   * Delete a session
   * Requirements: 5.1, 4.5
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      const remainingSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(remainingSessions);
      
      // If deleted session was current, switch to another or clear
      if (currentSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          await switchSession(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
          // Clear localStorage when no sessions remain
          saveToLocalStorage(null, [], []);
        }
      } else {
        // Update localStorage with remaining sessions
        saveToLocalStorage(currentSessionId, remainingSessions, messages);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      console.error('Error deleting session:', err);
    }
  }, [currentSessionId, sessions, messages, switchSession, saveToLocalStorage]);
  
  /**
   * Send a message and handle streaming response
   * Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 4.5
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!user) return;
    
    let sessionId = currentSessionId;
    
    // Create a new session if none exists
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }
    
    try {
      setIsStreaming(true);
      setError(null);
      setLastMessage(message);
      
      // Add user message optimistically
      const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        sessionId,
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
          sessionId,
          message,
        }),
      });
      
      if (!response.ok) {
        // Handle rate limiting specifically (Requirement 1.1)
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          const waitTime = errorData.retryAfter || Math.ceil((errorData.waitTimeMs || 60000) / 1000);
          const minutes = Math.floor(waitTime / 60);
          const seconds = waitTime % 60;
          const timeDisplay = minutes > 0 
            ? `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
            : `${seconds} second${seconds !== 1 ? 's' : ''}`;
          throw new Error(`⏱️ Rate limit exceeded. Please wait ${timeDisplay} before trying again.`);
        }
        throw new Error('Failed to send message');
      }
      
      // Handle streaming response - Requirements: 2.1, 2.2, 2.3, 2.4
      await handleStreamingResponse(response, sessionId);
      
      // Reload messages to get final state from server (this will save to localStorage)
      await loadMessages(sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setIsStreaming(false);
    }
  }, [user, currentSessionId, createNewSession, loadMessages]);
  
  /**
   * Handle streaming response from the API
   * Parse Server-Sent Events and update UI incrementally
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  const handleStreamingResponse = async (response: Response, sessionId: string) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    let sources: ArticleSource[] = [];
    let hasReceivedFirstToken = false;
    
    if (!reader) {
      throw new Error('No response body');
    }
    
    try {
      // Requirement 2.2: Typing indicator is displayed before first token
      // (handled by isStreaming state in ChatMessageList component)
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Requirement 2.4: Mark message as complete when streaming finishes
          // Update final message with sources if available
          if (assistantContent) {
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { 
                    ...lastMsg, 
                    content: assistantContent,
                    sources: sources.length > 0 ? sources : undefined,
                  },
                ];
              }
              return prev;
            });
          }
          break;
        }
        
        // Requirement 2.1: Parse Server-Sent Events from API
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            // Skip done marker
            if (data === '[DONE]') continue;
            
            try {
              const parsed: ChatStreamChunk = JSON.parse(data);
              
              // Requirement 2.3, 7.3: Handle stream errors with retry information
              if (parsed.type === 'error') {
                const errorMsg = typeof parsed.data === 'string' ? parsed.data : 'Stream error occurred';
                const error: any = new Error(errorMsg);
                // Preserve retryable flag if present
                if ('retryable' in parsed) {
                  error.retryable = parsed.retryable;
                }
                throw error;
              }
              
              // Requirement 2.1: Update UI incrementally as tokens arrive
              if (parsed.type === 'content' && typeof parsed.data === 'string') {
                assistantContent += parsed.data;
                hasReceivedFirstToken = true;
                
                // Update assistant message incrementally
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  
                  // Update existing assistant message
                  if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('temp-assistant-')) {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMsg, content: assistantContent },
                    ];
                  } 
                  // Create new assistant message on first token
                  else {
                    return [
                      ...prev,
                      {
                        id: `temp-assistant-${Date.now()}`,
                        sessionId,
                        role: 'assistant',
                        content: assistantContent,
                        createdAt: new Date(),
                      },
                    ];
                  }
                });
              } 
              // Store sources for final message update
              else if (parsed.type === 'sources' && Array.isArray(parsed.data)) {
                sources = parsed.data;
              }
              // Handle done event
              else if (parsed.type === 'done') {
                // Stream completed successfully
                break;
              }
            } catch (e) {
              // Requirement 2.3: Handle parsing errors
              if (e instanceof Error) {
                console.error('Error parsing stream chunk:', e);
                throw e;
              } else {
                console.error('Unknown error parsing stream chunk:', e);
                throw new Error('Failed to parse stream response');
              }
            }
          }
        }
      }
    } catch (error) {
      // Requirement 2.3: Handle stream completion and errors
      console.error('Streaming error:', error);
      
      // Clean up any partial assistant message
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('temp-assistant-')) {
          // Remove incomplete message
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      // Re-throw to be caught by sendMessage error handler
      throw error;
    } finally {
      // Requirement 2.4: Ensure streaming state is cleared
      // (handled by finally block in sendMessage)
    }
  };
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Retry the last failed message
   * Requirement 2.3: Error handling with retry
   */
  const retryLastMessage = useCallback(async () => {
    if (lastMessage) {
      await sendMessage(lastMessage);
    }
  }, [lastMessage, sendMessage]);
  
  // Load messages when current session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId, loadMessages]);
  
  /**
   * Handle user authentication state changes
   * Requirements: 10.5, 10.6
   * - Clear data on logout
   * - Restore sessions on login
   */
  useEffect(() => {
    if (user) {
      // Requirement 10.6: Restore sessions on login
      loadSessions();
    } else {
      // Requirement 10.5: Clear in-memory data on logout
      clearAllChatData();
    }
  }, [user]); // Only depend on user to avoid infinite loops
  
  const value: ChatContextType = {
    sessions,
    currentSessionId,
    isLoadingSessions,
    messages,
    isLoadingMessages,
    isStreaming,
    error,
    loadSessions,
    createNewSession,
    switchSession,
    deleteSession,
    sendMessage,
    clearError,
    retryLastMessage,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to access chat context
 * Requirements: 1.1, 2.1, 5.4
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

/**
 * Hook for session management
 * Requirement 5.4: Session management
 */
export function useSessions() {
  const {
    sessions,
    currentSessionId,
    isLoadingSessions,
    loadSessions,
    createNewSession,
    switchSession,
    deleteSession,
  } = useChat();
  
  return {
    sessions,
    currentSessionId,
    isLoading: isLoadingSessions,
    loadSessions,
    createNewSession,
    switchSession,
    deleteSession,
  };
}
