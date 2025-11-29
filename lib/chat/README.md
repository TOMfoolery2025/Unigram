# Chat Service Layer

This module provides the complete chat functionality for the wiki chatbot integration.

## Components

### Session Management (`sessions.ts`)
- Create, retrieve, list, and delete chat sessions
- Associate sessions with authenticated users
- Update session timestamps and titles

### Message Storage (`messages.ts`)
- Save and retrieve chat messages
- Support for user and assistant messages
- Article source citations stored as JSONB

### Article Retrieval (`retrieval.ts`)
- Search wiki articles using Hygraph API
- Rank articles by relevance
- Extract relevant content sections
- Limit to top 5 articles

### LLM Service (`llm.ts`)
- OpenAI API integration
- Streaming response generation
- RAG (Retrieval-Augmented Generation)
- Configuration management

## Usage Example

```typescript
import {
  createSession,
  saveMessage,
  retrieveRelevantArticles,
  generateResponse,
} from '@/lib/chat';

// Create a new chat session
const session = await createSession(userId);

// User asks a question
const userQuery = "What are the admission requirements for TUM?";

// Save user message
await saveMessage(session.id, userId, 'user', userQuery);

// Retrieve relevant articles
const articles = await retrieveRelevantArticles(userQuery);

// Generate streaming response
const responseGenerator = generateResponse(
  userQuery,
  articles,
  [] // conversation history
);

// Stream response tokens
let fullResponse = '';
for await (const token of responseGenerator) {
  fullResponse += token;
  // Send token to client via SSE
}

// Get sources after streaming completes
const sources = await responseGenerator.return(undefined);

// Save assistant message with sources
await saveMessage(
  session.id,
  userId,
  'assistant',
  fullResponse,
  sources.value
);
```

## Configuration

Set the following environment variables:

```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional (with defaults)
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000
```

## Testing

Run tests with:

```bash
npm test -- lib/chat/
```

## Requirements Coverage

- **1.1-1.5**: Core chatbot functionality with context and multi-category support
- **6.1-6.5**: Article retrieval and content extraction
- **8.1-8.5**: LLM configuration and management
- **10.3-10.4**: Session and message persistence
