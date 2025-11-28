# Design Document: Wiki Chatbot Integration

## Overview

The wiki chatbot integration adds an AI-powered conversational interface to the TUM Community Platform wiki. The chatbot enables authenticated users to ask natural language questions about wiki content and receive contextual, cited responses. The system uses a Retrieval-Augmented Generation (RAG) approach, combining Hygraph's existing search capabilities with a Large Language Model (LLM) to provide accurate, source-backed answers.

The chatbot will be implemented as a floating widget accessible from the wiki pages, with a clean, responsive UI that integrates seamlessly with the existing design system. Chat sessions will be persisted to Supabase for authenticated users, allowing conversation history to be maintained across sessions.

### Key Design Goals

1. **Authentication-First**: Only authenticated TUM students can access the chatbot
2. **Source Attribution**: All responses must cite wiki articles used as sources
3. **Real-time Experience**: Streaming responses for immediate feedback
4. **Efficient Retrieval**: Leverage existing Hygraph search with intelligent content extraction
5. **Seamless Integration**: Consistent with existing UI/UX patterns and tech stack

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────────┐  ┌──────────────────┐                  │
│  │  Wiki Pages    │  │  Chat Widget UI  │                  │
│  │  (React)       │  │  (React)         │                  │
│  └────────┬───────┘  └────────┬─────────┘                  │
│           │                    │                             │
└───────────┼────────────────────┼─────────────────────────────┘
            │                    │
            │                    │ API Calls
            │                    ▼
┌───────────┼────────────────────────────────────────────────┐
│           │         API Layer (Next.js)                     │
│           │                                                  │
│  ┌────────▼────────┐  ┌──────────────────────────────┐    │
│  │  Wiki API       │  │  Chatbot API                  │    │
│  │  Routes         │  │  - /api/chat/message          │    │
│  │                 │  │  - /api/chat/sessions         │    │
│  └────────┬────────┘  └──────────┬───────────────────┘    │
│           │                       │                         │
└───────────┼───────────────────────┼─────────────────────────┘
            │                       │
            │                       │
            ▼                       ▼
┌──────────────────┐    ┌──────────────────────────────────┐
│   Hygraph CMS    │    │     Service Layer                 │
│   - GraphQL API  │    │  ┌────────────────────────────┐  │
│   - Wiki Content │    │  │  Chat Service              │  │
│   - Search       │    │  │  - Message handling        │  │
└──────────────────┘    │  │  - Context management      │  │
                        │  └────────┬───────────────────┘  │
                        │           │                       │
                        │  ┌────────▼───────────────────┐  │
                        │  │  Retrieval Service         │  │
                        │  │  - Article search          │  │
                        │  │  - Content extraction      │  │
                        │  └────────┬───────────────────┘  │
                        │           │                       │
                        │  ┌────────▼───────────────────┐  │
                        │  │  LLM Service               │  │
                        │  │  - OpenAI/Anthropic API    │  │
                        │  │  - Streaming responses     │  │
                        │  └────────────────────────────┘  │
                        └──────────────────────────────────┘
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │   Supabase Database  │
                        │   - chat_sessions    │
                        │   - chat_messages    │
                        └──────────────────────┘
```

### Technology Stack

- **Frontend**: React, Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (App Router)
- **Database**: Supabase (PostgreSQL)
- **CMS**: Hygraph (GraphQL API)
- **LLM Provider**: OpenAI API (GPT-4 or GPT-3.5-turbo)
- **Authentication**: Supabase Auth (existing)
- **Testing**: Vitest, React Testing Library

## Components and Interfaces

### 1. Chat Widget Component

**Location**: `components/wiki/chat-widget.tsx`

A floating button and expandable chat interface that appears on wiki pages for authenticated users.

```typescript
interface ChatWidgetProps {
  userId: string;
  isAuthenticated: boolean;
}

interface ChatWidgetState {
  isOpen: boolean;
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
}
```

### 2. Chat Message List Component

**Location**: `components/wiki/chat-message-list.tsx`

Displays the conversation history with proper formatting for user and assistant messages.

```typescript
interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ArticleSource[];
  timestamp: Date;
}

interface ArticleSource {
  title: string;
  slug: string;
  category: string;
}
```

### 3. Chat Input Component

**Location**: `components/wiki/chat-input.tsx`

Text input with send button and keyboard shortcuts.

```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}
```

### 4. Chat Service

**Location**: `lib/chat/chat-service.ts`

Core business logic for handling chat interactions.

```typescript
interface ChatService {
  sendMessage(
    sessionId: string,
    userId: string,
    message: string
  ): Promise<AsyncIterable<string>>;
  
  createSession(userId: string): Promise<ChatSession>;
  
  getSession(sessionId: string, userId: string): Promise<ChatSession | null>;
  
  listSessions(userId: string): Promise<ChatSession[]>;
  
  deleteSession(sessionId: string, userId: string): Promise<void>;
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}
```

### 5. Retrieval Service

**Location**: `lib/chat/retrieval-service.ts`

Handles article search and content extraction from Hygraph.

```typescript
interface RetrievalService {
  retrieveRelevantArticles(query: string): Promise<RetrievedArticle[]>;
  
  extractRelevantSections(
    article: HygraphWikiArticle,
    query: string
  ): string;
}

interface RetrievedArticle {
  article: HygraphWikiArticle;
  relevantContent: string;
  relevanceScore: number;
}
```

### 6. LLM Service

**Location**: `lib/chat/llm-service.ts`

Interfaces with the OpenAI API for generating responses.

```typescript
interface LLMService {
  generateResponse(
    messages: LLMMessage[],
    context: string,
    sources: ArticleSource[]
  ): AsyncIterable<string>;
  
  generateTitle(firstMessage: string): Promise<string>;
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
}
```

### 7. API Routes

**Chat Message Endpoint**: `app/api/chat/message/route.ts`

```typescript
// POST /api/chat/message
interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

// Returns: Server-Sent Events stream
```

**Chat Sessions Endpoint**: `app/api/chat/sessions/route.ts`

```typescript
// GET /api/chat/sessions
// Returns: ChatSession[]

// POST /api/chat/sessions
// Returns: ChatSession

// DELETE /api/chat/sessions/[id]
// Returns: { success: boolean }
```

## Data Models

### Database Schema

**chat_sessions table**

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
```

**chat_messages table**

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

### TypeScript Types

**Location**: `types/chat.ts`

```typescript
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ArticleSource[];
  createdAt: Date;
}

export interface ArticleSource {
  title: string;
  slug: string;
  category: string;
}

export interface ChatStreamChunk {
  type: 'content' | 'sources' | 'done' | 'error';
  data: string | ArticleSource[] | null;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified:

- **Redundancy 1**: Properties 1.3 (cite sources) and 3.1 (clickable links) both test source attribution. These can be combined into a single comprehensive property about source citation format.
- **Redundancy 2**: Properties 4.2 and 10.1 both test that guests cannot access the chatbot. These are duplicate and can be consolidated.
- **Redundancy 3**: Properties 4.5 (preserve session on close) and 4.6 (restore on reopen) form a round-trip property that can be combined.
- **Redundancy 4**: Properties 10.3 (associate sessions with user ID) and 10.4 (persist with user ID) both test session ownership and can be combined.

The following properties represent the unique, non-redundant correctness guarantees:

### Core Functionality Properties

**Property 1: Response time performance**
*For any* authenticated user query, the chatbot should return a complete response within 5 seconds of receiving the query.
**Validates: Requirements 1.1**

**Property 2: Article retrieval and synthesis**
*For any* user query about topics covered in wiki articles, the chatbot should retrieve relevant articles from Hygraph using the GraphQL API and include information from those articles in the response.
**Validates: Requirements 1.2, 6.1, 6.2**

**Property 3: Source citation with links**
*For any* chatbot response that uses wiki article content, the response should include properly formatted citations with clickable links containing both article title and category.
**Validates: Requirements 1.3, 3.1, 3.3**

**Property 4: Context preservation**
*For any* chat session with multiple messages, when a follow-up question is asked, the chatbot's response should demonstrate awareness of previous messages in the conversation.
**Validates: Requirements 1.4**

**Property 5: Multi-category information**
*For any* query that matches articles from multiple categories, the chatbot response should include information from at least two different categories when relevant articles exist in multiple categories.
**Validates: Requirements 1.5**

### Streaming and Real-time Properties

**Property 6: Response streaming**
*For any* chatbot response, the content should be delivered in multiple chunks (streaming) rather than a single complete message.
**Validates: Requirements 2.1**

**Property 7: Typing indicator**
*For any* initiated chatbot request, a typing indicator should be displayed in the UI before the first content token arrives.
**Validates: Requirements 2.2**

**Property 8: Error handling with retry**
*For any* streaming error (network failure, API error), the UI should display an error message and provide a retry mechanism.
**Validates: Requirements 2.3**

**Property 9: Completion state**
*For any* completed streaming response, the message should be marked as complete and the input field should be re-enabled for user interaction.
**Validates: Requirements 2.4**

### Recommendation and Navigation Properties

**Property 10: Recommendation count**
*For any* user request for article recommendations, the chatbot should suggest between 2 and 5 articles inclusive, each with a brief description.
**Validates: Requirements 3.2**

**Property 11: Article link navigation**
*For any* article link in a chatbot response, clicking the link should navigate to the correct article page with the matching slug.
**Validates: Requirements 3.4**

### UI and Session Management Properties

**Property 12: Session persistence round-trip**
*For any* chat session, closing the chat interface and then reopening it should restore all messages from that session.
**Validates: Requirements 4.5, 4.6**

**Property 13: Chat overlay non-blocking**
*For any* open chat interface, users should be able to navigate to different wiki pages without closing the chat.
**Validates: Requirements 4.4**

**Property 14: New conversation isolation**
*For any* chat session, after clicking "new conversation", the chatbot's responses should not reference any messages from the previous session.
**Validates: Requirements 5.1, 5.3**

**Property 15: Welcome message on new session**
*For any* newly created chat session, the interface should display a welcome message with suggested questions.
**Validates: Requirements 5.2**

**Property 16: Multi-session switching**
*For any* user with multiple chat sessions, the UI should allow switching between sessions and display the correct message history for each.
**Validates: Requirements 5.4**

### Retrieval and Content Processing Properties

**Property 17: Retrieval limit enforcement**
*For any* query that matches more than 5 articles, the retrieval system should fetch at most 5 articles ranked by relevance.
**Validates: Requirements 6.3**

**Property 18: Markdown content extraction**
*For any* retrieved article, the system should parse the markdown content and extract relevant sections based on the query.
**Validates: Requirements 6.5**

**Property 19: Ambiguity clarification**
*For any* ambiguous query (queries that could refer to multiple distinct topics), the chatbot should ask clarifying questions before providing a definitive answer.
**Validates: Requirements 7.4**

### Configuration Properties

**Property 20: Model configuration**
*For any* configured LLM model name in environment variables, the chatbot should use that specific model when making API calls to the LLM service.
**Validates: Requirements 8.2**

**Property 21: Temperature configuration**
*For any* configured temperature value, the chatbot should pass that temperature parameter to the LLM API.
**Validates: Requirements 8.3**

**Property 22: Token limit enforcement**
*For any* configured max tokens limit, chatbot responses should not exceed that token count.
**Validates: Requirements 8.4**

### Accessibility and UX Properties

**Property 23: Responsive rendering**
*For any* viewport size (mobile, tablet, desktop), the chat interface should render with appropriate layout and remain fully functional.
**Validates: Requirements 9.1**

**Property 24: Keyboard accessibility**
*For any* chatbot feature (sending messages, opening/closing chat, switching sessions), the action should be performable using only keyboard input.
**Validates: Requirements 9.2**

**Property 25: Screen reader accessibility**
*For any* chat interface element, appropriate ARIA labels and roles should be present for screen reader users.
**Validates: Requirements 9.3**

**Property 26: Auto-scroll on new message**
*For any* new message added to the chat (user or assistant), the message list should automatically scroll to show the latest message.
**Validates: Requirements 9.4**

### Authentication and Security Properties

**Property 27: Authentication verification**
*For any* chatbot API request, the system should verify the user is authenticated before processing the request.
**Validates: Requirements 10.2**

**Property 28: Session ownership and persistence**
*For any* created chat session, it should be associated with the authenticated user's ID and persisted to the database, and retrieving sessions should only return sessions owned by that user.
**Validates: Requirements 10.3, 10.4**

**Property 29: Logout data clearing**
*For any* user logout action, all in-memory chat session data should be cleared from the client.
**Validates: Requirements 10.5**

**Property 30: Login session restoration**
*For any* user who logs out and then logs back in, their previous chat sessions should be retrievable from the database.
**Validates: Requirements 10.6**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Unauthenticated access attempts
   - Expired session tokens
   - Invalid user permissions

2. **LLM Service Errors**
   - API rate limits exceeded
   - Service unavailable (503)
   - Invalid API key
   - Timeout errors

3. **Retrieval Errors**
   - Hygraph API failures
   - Network connectivity issues
   - Invalid GraphQL queries
   - No articles found

4. **Database Errors**
   - Connection failures
   - Query timeouts
   - Constraint violations
   - Transaction failures

5. **Validation Errors**
   - Empty messages
   - Message too long
   - Invalid session ID
   - Malformed requests

### Error Handling Strategies

**Client-Side Error Handling**

```typescript
interface ErrorState {
  type: 'auth' | 'network' | 'llm' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
  retryAction?: () => void;
}
```

- Display user-friendly error messages
- Provide retry buttons for transient errors
- Log errors to console for debugging
- Maintain chat state to prevent data loss

**Server-Side Error Handling**

- Catch and log all errors with context
- Return appropriate HTTP status codes
- Provide actionable error messages
- Implement exponential backoff for retries
- Use circuit breakers for external services

**Graceful Degradation**

- If LLM service fails, show cached responses or fallback messages
- If retrieval fails, allow basic chat without article context
- If database fails, maintain session in memory temporarily
- Always allow users to close/clear chat to recover

## Testing Strategy

### Dual Testing Approach

The chatbot integration will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing

**Testing Framework**: Vitest with React Testing Library

**Unit Test Coverage**:

1. **Component Tests**
   - Chat widget open/close behavior
   - Message rendering with different content types
   - Input field validation and submission
   - Source link formatting and clicks
   - Loading states and error displays

2. **Service Tests**
   - Chat service message handling
   - Session creation and retrieval
   - Retrieval service article search
   - LLM service API integration
   - Database operations (CRUD)

3. **API Route Tests**
   - Authentication middleware
   - Request validation
   - Response formatting
   - Error handling
   - Streaming setup

4. **Integration Tests**
   - End-to-end message flow
   - Session persistence across page reloads
   - Authentication integration
   - Hygraph API integration

**Example Unit Test**:

```typescript
describe('ChatWidget', () => {
  it('should not display for unauthenticated users', () => {
    render(<ChatWidget isAuthenticated={false} userId="" />);
    expect(screen.queryByRole('button', { name: /chat/i })).not.toBeInTheDocument();
  });
  
  it('should display for authenticated users', () => {
    render(<ChatWidget isAuthenticated={true} userId="user-123" />);
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
  });
});
```

### Property-Based Testing

**Testing Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property-based test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property Test Requirements**:

- Each property-based test MUST be tagged with a comment explicitly referencing the correctness property from this design document
- Tag format: `// Feature: wiki-chatbot-integration, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Property Test Coverage**:

1. **Response Properties**
   - Property 1: Response time < 5 seconds for all queries
   - Property 3: All responses with article content include citations
   - Property 5: Multi-category queries return multi-category information

2. **Streaming Properties**
   - Property 6: All responses are streamed in multiple chunks
   - Property 9: All completed streams enable user interaction

3. **Session Properties**
   - Property 12: Close-then-reopen preserves all messages
   - Property 14: New conversation clears context
   - Property 28: Session ownership and persistence round-trip

4. **Retrieval Properties**
   - Property 17: Never retrieve more than 5 articles
   - Property 18: All retrieved articles have extracted content

5. **Configuration Properties**
   - Property 20: Model name configuration is respected
   - Property 22: Token limits are enforced

**Example Property Test**:

```typescript
import fc from 'fast-check';

// Feature: wiki-chatbot-integration, Property 3: Source citation with links
describe('Property: Source citation', () => {
  it('should include citations for all responses using article content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }), // random queries
        async (query) => {
          const response = await chatService.sendMessage(sessionId, userId, query);
          const fullResponse = await collectStream(response);
          
          // If response used articles, it must have sources
          if (fullResponse.includes('according to') || fullResponse.includes('based on')) {
            expect(fullResponse).toMatch(/\[.*\]\(\/wiki\/articles\/.*\)/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Data Management

**Mock Data**:
- Create mock Hygraph responses for testing
- Use test database with sample chat sessions
- Mock LLM responses for predictable testing

**Test Fixtures**:
- Sample wiki articles covering various categories
- Pre-built chat sessions with different states
- User authentication test accounts

### Performance Testing

- Measure response times under load
- Test streaming performance with large responses
- Verify database query performance
- Monitor memory usage during long sessions

### Accessibility Testing

- Automated ARIA validation with axe-core
- Keyboard navigation testing
- Screen reader compatibility testing
- Color contrast verification

## Implementation Notes

### LLM Provider Selection

**Recommended**: OpenAI GPT-4-turbo or GPT-3.5-turbo

**Rationale**:
- Excellent instruction following
- Good citation capabilities
- Streaming support
- Reasonable cost
- Reliable API

**Alternative**: Anthropic Claude (if OpenAI unavailable)

### Prompt Engineering

The system prompt should:
- Instruct the LLM to only use provided wiki content
- Require citation of sources
- Encourage asking clarifying questions
- Maintain a helpful, student-friendly tone
- Stay focused on TUM-related topics

**Example System Prompt**:

```
You are a helpful assistant for the TUM Community Platform wiki. Your role is to answer questions about TUM (Technical University of Munich) using ONLY the information provided in the wiki articles below.

Guidelines:
- Only answer questions using the provided wiki content
- Always cite your sources using [Article Title](slug) format
- If the answer isn't in the provided articles, say so and suggest browsing categories
- Ask clarifying questions if the query is ambiguous
- Be friendly and supportive to students
- Stay focused on TUM-related topics

Wiki Articles:
{retrieved_articles}

Previous Conversation:
{conversation_history}
```

### Caching Strategy

- Cache Hygraph article content (5 minute TTL)
- Cache search results (2 minute TTL)
- Don't cache LLM responses (always fresh)
- Cache session data in memory with database backup

### Rate Limiting

- Limit API calls to LLM service (e.g., 10 requests/minute per user)
- Implement exponential backoff for retries
- Queue requests during high load
- Display wait times to users

### Security Considerations

- Validate all user inputs
- Sanitize markdown content before rendering
- Use parameterized database queries
- Store API keys in environment variables
- Implement CORS properly
- Rate limit API endpoints
- Log security events

### Scalability Considerations

- Use connection pooling for database
- Implement request queuing for LLM calls
- Consider caching layer (Redis) for high traffic
- Monitor API usage and costs
- Implement graceful degradation under load

## Future Enhancements

1. **Multi-language Support**: Detect user language and respond accordingly
2. **Voice Input**: Allow voice queries via Web Speech API
3. **Image Understanding**: Process images in wiki articles
4. **Feedback System**: Allow users to rate responses
5. **Analytics Dashboard**: Track popular queries and topics
6. **Suggested Follow-ups**: Proactively suggest related questions
7. **Export Conversations**: Allow users to download chat history
8. **Collaborative Sessions**: Share chat sessions with other users
