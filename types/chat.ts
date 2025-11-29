// Chat types for Wiki Chatbot Integration

/**
 * Represents a chat session between a user and the chatbot
 */
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a single message in a chat session
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ArticleSource[];
  createdAt: Date;
}

/**
 * Represents a wiki article source cited in a chatbot response
 */
export interface ArticleSource {
  title: string;
  slug: string;
  category: string;
}

/**
 * Represents a chunk of data in a streaming chat response
 * Requirement 7.3: Include retry information for errors
 */
export interface ChatStreamChunk {
  type: 'content' | 'sources' | 'done' | 'error';
  data: string | ArticleSource[] | null;
  retryable?: boolean; // Whether the error can be retried
}

/**
 * Database row type for chat_sessions table
 */
export interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for chat_messages table
 */
export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ArticleSource[] | null;
  created_at: string;
}

/**
 * Insert type for chat_sessions table
 */
export interface ChatSessionInsert {
  id?: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Insert type for chat_messages table
 */
export interface ChatMessageInsert {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ArticleSource[] | null;
  created_at?: string;
}

/**
 * Update type for chat_sessions table
 */
export interface ChatSessionUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Update type for chat_messages table
 */
export interface ChatMessageUpdate {
  id?: string;
  session_id?: string;
  role?: 'user' | 'assistant';
  content?: string;
  sources?: ArticleSource[] | null;
  created_at?: string;
}
