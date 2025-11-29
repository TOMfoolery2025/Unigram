# Conversation Isolation Implementation

## Overview

This document describes how conversation isolation is implemented in the wiki chatbot integration, ensuring that new conversations don't reference old messages and each session maintains its own independent context.

**Requirements Addressed:**
- Requirement 5.1: Clear context when starting new conversation
- Requirement 5.3: Ensure new responses don't reference old messages

## Implementation Details

### 1. Database-Level Isolation

**Schema Design:**
- Each chat session has a unique `id` (UUID) in the `chat_sessions` table
- Each message is associated with a specific session via `session_id` foreign key in `chat_messages` table
- Foreign key constraint: `REFERENCES public.chat_sessions(id) ON DELETE CASCADE`

**Location:** `supabase/migrations/20240101000004_chat_tables.sql`

```sql
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Isolation Guarantee:** Messages from different sessions are completely isolated at the database level. Queries for messages always filter by `session_id`.

### 2. Service Layer Isolation

**Session Service** (`lib/chat/sessions.ts`):
- `createSession(userId, title)`: Creates a new session with a unique ID
- `getSession(sessionId, userId)`: Retrieves a specific session with ownership verification
- `listSessions(userId)`: Lists all sessions for a user

**Message Service** (`lib/chat/messages.ts`):
- `getMessages(sessionId)`: Retrieves messages **only** for the specified session
  ```typescript
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)  // ← Filters by session
    .order('created_at', { ascending: true });
  ```
- `saveMessage(sessionId, userId, role, content, sources)`: Saves messages to a specific session

**Isolation Guarantee:** The service layer enforces session-based filtering for all message operations.

### 3. API Route Isolation

**Message API** (`app/api/chat/message/route.ts`):

When a user sends a message:
1. Verifies session ownership
2. Saves the user message to the database
3. Retrieves conversation history using `getMessages(sessionId)` ← **Only gets messages from current session**
4. Passes session-specific history to the LLM
5. Saves the assistant response to the same session

```typescript
// Get conversation history for context
const messages = await getMessages(sessionId);
const conversationHistory = messages.map(m => ({
  role: m.role,
  content: m.content,
}));

// Generate streaming response using LLM service
const responseGenerator = generateResponse(
  message.trim(),
  retrievedArticles,
  conversationHistory.slice(0, -1) // Exclude the message we just added
);
```

**Isolation Guarantee:** The LLM only receives messages from the current session as context.

### 4. Client-Side Isolation

**Chat Context** (`lib/chat/chat-context.tsx`):

The `createNewSession` function ensures complete isolation:

```typescript
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
```

**Key Actions:**
1. Creates a new session in the database (new unique ID)
2. Clears the messages array: `setMessages([])`
3. Saves empty messages to localStorage: `saveToLocalStorage(newSession.id, updatedSessions, [])`
4. Clears last message state: `setLastMessage(null)`

**Isolation Guarantee:** When a new session is created, the client state is completely cleared, ensuring no old messages are displayed or sent to the API.

### 5. LLM Context Isolation

**LLM Service** (`lib/chat/llm.ts`):

The `generateResponse` function receives conversation history as a parameter:

```typescript
export async function* generateResponse(
  userMessage: string,
  retrievedArticles: RetrievedArticle[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): AsyncGenerator<string, ArticleSource[], void> {
  const client = getOpenAIClient();
  const config = loadLLMConfig();
  
  // Create system prompt with retrieved articles
  const systemPrompt = createSystemPrompt(retrievedArticles);
  
  // Format conversation history
  const historyMessages = formatConversationHistory(conversationHistory);
  
  // Build messages array
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,  // ← Only includes session-specific history
    { role: 'user', content: userMessage },
  ];
  
  // Create streaming completion
  const stream = await client.chat.completions.create({
    model: config.model,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  });
  
  // ... streaming logic
}
```

**Isolation Guarantee:** The LLM only receives the conversation history passed to it, which is session-specific due to the API route filtering.

## Isolation Flow Diagram

```
User clicks "New Conversation"
         ↓
createNewSession() called
         ↓
POST /api/chat/sessions
         ↓
Database creates new session with unique ID
         ↓
Client receives new session ID
         ↓
Client clears messages array: setMessages([])
         ↓
Client saves empty messages to localStorage
         ↓
User sends first message in new session
         ↓
POST /api/chat/message with new sessionId
         ↓
API calls getMessages(newSessionId)
         ↓
Database returns empty array (new session has no messages)
         ↓
LLM receives empty conversation history
         ↓
LLM generates response without any old context
         ↓
Response saved to new session
```

## Testing

**Test File:** `lib/chat/conversation-isolation.test.ts`

The test suite verifies:
1. ✅ Session service functions exist and are properly typed
2. ✅ Message service functions filter by session ID
3. ✅ Chat context clears messages on new session creation
4. ✅ API routes retrieve session-specific history
5. ✅ LLM receives only session-specific context
6. ✅ Database schema enforces foreign key constraints

All tests pass, confirming the implementation is correct.

## Verification Checklist

- [x] Database schema has `session_id` foreign key in `chat_messages` table
- [x] `getMessages()` filters by `session_id` in database query
- [x] `createNewSession()` clears messages array with `setMessages([])`
- [x] `createNewSession()` saves empty messages to localStorage
- [x] Message API calls `getMessages(sessionId)` to get session-specific history
- [x] LLM receives conversation history parameter that is session-specific
- [x] Each session has a unique UUID identifier
- [x] Session ownership is verified before message retrieval

## Conclusion

The conversation isolation implementation is **complete and correct**. The system ensures that:

1. **New sessions start with a clean slate** - No messages from previous sessions
2. **Messages are isolated by session** - Database queries filter by `session_id`
3. **LLM context is session-specific** - Only receives messages from the current session
4. **Client state is cleared** - Messages array and localStorage are reset on new session creation

This implementation satisfies Requirements 5.1 and 5.3, ensuring that new conversations don't reference old messages and each session maintains its own independent context.
