/**
 * Chat Service Layer
 * Exports all chat-related functionality
 */

// Session management
export {
  createSession,
  getSession,
  listSessions,
  deleteSession,
  touchSession,
  updateSessionTitle,
  SessionNotFoundError,
  SessionPermissionError,
} from './sessions';

// Message storage
export {
  saveMessage,
  getMessages,
  getMessage,
  getMessageCount,
  deleteMessage,
  getLatestMessage,
  saveMessages,
  MessageNotFoundError,
} from './messages';

// Article retrieval
export {
  retrieveRelevantArticles,
  extractRelevantContent,
  createContextString,
  type RetrievedArticle,
} from './retrieval';

// LLM service
export {
  generateResponse,
  generateTitle,
  loadLLMConfig,
  createSystemPrompt,
  formatConversationHistory,
  type LLMMessage,
  type LLMConfig,
} from './llm';

// Chat context and hooks
export {
  ChatProvider,
  useChat,
  useSessions,
} from './chat-context';

// Configuration
export {
  loadChatbotConfig,
  validateChatbotConfig,
  getConfigSummary,
  type ChatbotConfig,
} from './config';
