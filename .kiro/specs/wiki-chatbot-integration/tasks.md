# Implementation Plan

- [x] 1. Set up database schema and types
  - Create Supabase migration for chat_sessions and chat_messages tables
  - Add RLS policies for chat tables to ensure users can only access their own sessions
  - Create TypeScript types in types/chat.ts
  - _Requirements: 10.3, 10.4_

- [x] 2. Implement chat service layer
- [x] 2.1 Create chat session management
  - Implement functions to create, retrieve, list, and delete chat sessions
  - Add database operations for sessions with proper error handling
  - _Requirements: 10.3, 10.4_

- [ ]* 2.2 Write property test for session ownership and persistence
  - **Property 28: Session ownership and persistence**
  - **Validates: Requirements 10.3, 10.4**

- [x] 2.3 Create chat message storage
  - Implement functions to save and retrieve messages from database
  - Handle message sources (article citations) as JSONB
  - _Requirements: 1.3, 10.4_

- [ ]* 2.4 Write property test for session persistence round-trip
  - **Property 12: Session persistence round-trip**
  - **Validates: Requirements 4.5, 4.6**

- [x] 3. Implement retrieval service
- [x] 3.1 Create article search and retrieval
  - Build retrieval service that uses existing Hygraph search API
  - Implement relevance ranking for search results
  - Limit retrieval to top 5 articles
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 3.2 Write property test for retrieval limit
  - **Property 17: Retrieval limit enforcement**
  - **Validates: Requirements 6.3**

- [x] 3.3 Implement markdown content extraction
  - Parse markdown content from retrieved articles
  - Extract relevant sections based on query keywords
  - Create context strings for LLM consumption
  - _Requirements: 6.5_

- [ ]* 3.4 Write property test for content extraction
  - **Property 18: Markdown content extraction**
  - **Validates: Requirements 6.5**

- [x] 4. Implement LLM service
- [x] 4.1 Create OpenAI API integration
  - Set up OpenAI client with configuration from environment variables
  - Implement streaming response handling
  - Create system prompt template for wiki chatbot
  - _Requirements: 8.1, 8.2_

- [ ]* 4.2 Write property test for model configuration
  - **Property 20: Model configuration**
  - **Validates: Requirements 8.2**

- [x] 4.3 Implement response generation with RAG
  - Combine retrieved article content with user query
  - Format conversation history for context
  - Generate streaming responses with source citations
  - _Requirements: 1.2, 1.3, 1.4_

- [ ]* 4.4 Write property test for source citations
  - **Property 3: Source citation with links**
  - **Validates: Requirements 1.3, 3.1, 3.3**

- [ ]* 4.5 Write property test for context preservation
  - **Property 4: Context preservation**
  - **Validates: Requirements 1.4**

- [x] 4.4 Add configuration for temperature and token limits
  - Load temperature and max tokens from environment variables
  - Apply configuration to LLM API calls
  - Implement fallback to safe defaults
  - _Requirements: 8.3, 8.4, 8.5_

- [ ]* 4.5 Write property test for token limit enforcement
  - **Property 22: Token limit enforcement**
  - **Validates: Requirements 8.4**

- [x] 5. Create API routes
- [x] 5.1 Implement POST /api/chat/message endpoint
  - Verify user authentication
  - Validate request payload
  - Retrieve relevant articles using retrieval service
  - Generate streaming response using LLM service
  - Save messages to database
  - Return Server-Sent Events stream
  - _Requirements: 1.1, 1.2, 2.1, 10.2_

- [ ]* 5.2 Write property test for authentication verification
  - **Property 27: Authentication verification**
  - **Validates: Requirements 10.2**

- [ ]* 5.3 Write property test for response streaming
  - **Property 6: Response streaming**
  - **Validates: Requirements 2.1**

- [x] 5.4 Implement GET /api/chat/sessions endpoint
  - Verify user authentication
  - Retrieve all sessions for authenticated user
  - Return sessions with message counts
  - _Requirements: 5.4, 10.3_

- [x] 5.5 Implement POST /api/chat/sessions endpoint
  - Verify user authentication
  - Create new chat session for user
  - Return created session
  - _Requirements: 5.1, 10.3_

- [x] 5.6 Implement DELETE /api/chat/sessions/[id] endpoint
  - Verify user authentication and session ownership
  - Delete session and associated messages
  - Return success response
  - _Requirements: 5.1_

- [x] 5.7 Implement GET /api/chat/sessions/[id] endpoint
  - Verify user authentication and session ownership
  - Retrieve session with all messages
  - Return session data
  - _Requirements: 4.6, 10.3_

- [x] 6. Build chat UI components
- [x] 6.1 Create ChatMessage component
  - Display user and assistant messages with different styling
  - Render markdown content in assistant messages
  - Display article source citations as clickable links
  - Show timestamps
  - _Requirements: 1.3, 3.1, 3.3_

- [ ]* 6.2 Write property test for article link navigation
  - **Property 11: Article link navigation**
  - **Validates: Requirements 3.4**

- [x] 6.3 Create ChatMessageList component
  - Render list of messages in conversation
  - Auto-scroll to latest message when new messages arrive
  - Display typing indicator during streaming
  - Handle loading and error states
  - _Requirements: 2.2, 9.4_

- [ ]* 6.4 Write property test for auto-scroll
  - **Property 26: Auto-scroll on new message**
  - **Validates: Requirements 9.4**

- [x] 6.5 Create ChatInput component
  - Text input with send button
  - Disable input during streaming
  - Handle Enter key to send (Shift+Enter for new line)
  - Validate non-empty messages
  - _Requirements: 1.1_

- [ ]* 6.6 Write unit tests for input validation
  - Test empty message prevention
  - Test keyboard shortcuts
  - Test disabled state during streaming
  - _Requirements: 1.1_

- [x] 6.7 Create ChatWidget component
  - Floating button to open/close chat
  - Expandable chat panel overlay
  - Only render for authenticated users
  - Maintain chat state when closed
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 6.8 Write unit tests for authentication display
  - Test widget not displayed for guests
  - Test widget displayed for authenticated users
  - _Requirements: 4.1, 4.2_

- [x] 6.9 Create SessionList component
  - Display list of user's chat sessions
  - Allow switching between sessions
  - Show session titles and timestamps
  - Provide "new conversation" button
  - _Requirements: 5.1, 5.4_

- [ ]* 6.10 Write property test for multi-session switching
  - **Property 16: Multi-session switching**
  - **Validates: Requirements 5.4**

- [-] 7. Implement chat state management
- [x] 7.1 Create chat context and hooks
  - Build React context for chat state
  - Create useChat hook for message sending
  - Create useSessions hook for session management
  - Handle streaming state and errors
  - _Requirements: 1.1, 2.1, 5.4_

- [x] 7.2 Implement streaming message handler
  - Parse Server-Sent Events from API
  - Update UI incrementally as tokens arrive
  - Handle stream completion and errors
  - Display typing indicator before first token
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 7.3 Write property test for typing indicator
  - **Property 7: Typing indicator**
  - **Validates: Requirements 2.2**

- [ ]* 7.4 Write property test for completion state
  - **Property 9: Completion state**
  - **Validates: Requirements 2.4**

- [ ]* 7.5 Write property test for error handling
  - **Property 8: Error handling with retry**
  - **Validates: Requirements 2.3**

- [x] 7.6 Implement session persistence
  - Save session state to localStorage for quick restore
  - Load sessions from database on mount
  - Clear in-memory data on logout
  - Restore sessions on login
  - _Requirements: 4.5, 4.6, 10.5, 10.6_

- [ ]* 7.7 Write property test for logout data clearing
  - **Property 29: Logout data clearing**
  - **Validates: Requirements 10.5**

- [ ]* 7.8 Write property test for login session restoration
  - **Property 30: Login session restoration**
  - **Validates: Requirements 10.6**

- [x] 8. Integrate chat widget into wiki pages
- [x] 8.1 Add ChatWidget to wiki layout
  - Import and render ChatWidget in wiki pages
  - Pass authentication state from auth provider
  - Ensure widget doesn't block wiki navigation
  - _Requirements: 4.1, 4.3, 4.4_

- [ ]* 8.2 Write property test for non-blocking overlay
  - **Property 13: Chat overlay non-blocking**
  - **Validates: Requirements 4.4**

- [x] 8.3 Add welcome message and suggested questions
  - Display welcome message in new sessions
  - Show 3-5 suggested questions based on popular topics
  - Make suggestions clickable to auto-fill input
  - _Requirements: 5.2_

- [ ]* 8.4 Write property test for welcome message
  - **Property 15: Welcome message on new session**
  - **Validates: Requirements 5.2**

- [x] 9. Implement accessibility features
- [x] 9.1 Add ARIA labels and roles
  - Add appropriate ARIA labels to all interactive elements
  - Use semantic HTML elements
  - Announce new messages to screen readers
  - _Requirements: 9.3_

- [ ]* 9.2 Write property test for screen reader accessibility
  - **Property 25: Screen reader accessibility**
  - **Validates: Requirements 9.3**

- [x] 9.3 Implement keyboard navigation
  - Ensure all features work with keyboard only
  - Add focus management for modal/overlay
  - Support Escape key to close chat
  - Add keyboard shortcuts documentation
  - _Requirements: 9.2_

- [ ]* 9.4 Write property test for keyboard accessibility
  - **Property 24: Keyboard accessibility**
  - **Validates: Requirements 9.2**

- [x] 9.5 Make interface responsive
  - Implement mobile-friendly chat layout
  - Adjust chat panel size for tablets
  - Ensure touch interactions work properly
  - Test on various screen sizes
  - _Requirements: 9.1_

- [ ]* 9.6 Write property test for responsive rendering
  - **Property 23: Responsive rendering**
  - **Validates: Requirements 9.1**

- [x] 10. Add advanced features
- [x] 10.1 Implement new conversation isolation
  - Clear context when starting new conversation
  - Ensure new responses don't reference old messages
  - Create new session in database
  - _Requirements: 5.1, 5.3_

- [ ]* 10.2 Write property test for conversation isolation
  - **Property 14: New conversation isolation**
  - **Validates: Requirements 5.1, 5.3**

- [x] 10.3 Implement article recommendations
  - Detect recommendation requests in queries
  - Return 2-5 relevant articles with descriptions
  - Format recommendations with links
  - _Requirements: 3.2_

- [ ]* 10.4 Write property test for recommendation count
  - **Property 10: Recommendation count**
  - **Validates: Requirements 3.2**

- [x] 10.5 Add multi-category response handling
  - Ensure retrieval searches across all categories
  - Include information from multiple categories when relevant
  - Cite sources from different categories
  - _Requirements: 1.5_

- [ ]* 10.6 Write property test for multi-category information
  - **Property 5: Multi-category information**
  - **Validates: Requirements 1.5**

- [x] 11. Implement error handling and edge cases
- [x] 11.1 Handle no results gracefully
  - Detect when no articles match query
  - Provide helpful message suggesting alternatives
  - Suggest browsing categories
  - _Requirements: 6.4_

- [x] 11.2 Handle out-of-scope queries
  - Detect non-TUM topics
  - Politely redirect to TUM-related content
  - Suggest relevant wiki categories
  - _Requirements: 7.1, 7.2_

- [x] 11.3 Handle LLM service failures
  - Catch API errors and timeouts
  - Display user-friendly error messages
  - Provide retry functionality
  - Log errors for monitoring
  - _Requirements: 7.3_

- [x] 11.4 Implement ambiguity detection
  - Detect ambiguous queries using LLM
  - Ask clarifying questions before answering
  - Provide multiple interpretation options
  - _Requirements: 7.4_

- [ ]* 11.5 Write property test for ambiguity clarification
  - **Property 19: Ambiguity clarification**
  - **Validates: Requirements 7.4**

- [x] 12. Add configuration and environment setup
- [x] 12.1 Create environment variables documentation
  - Document required OpenAI API key
  - Document optional configuration (model, temperature, max tokens)
  - Provide example .env.local file
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 12.2 Implement configuration loading
  - Load all config from environment variables at startup
  - Validate configuration values
  - Use safe defaults for optional settings
  - Log warnings for invalid config
  - _Requirements: 8.1, 8.5_

- [ ]* 12.3 Write unit test for configuration loading
  - Test environment variable loading
  - Test default value fallback
  - Test invalid configuration handling
  - _Requirements: 8.1, 8.5_

- [x] 13. Performance optimization
- [x] 13.1 Implement caching for article retrieval
  - Cache Hygraph search results (2 minute TTL)
  - Cache article content (5 minute TTL)
  - Use existing Hygraph cache infrastructure
  - _Requirements: 6.1, 6.2_

- [x] 13.2 Add rate limiting
  - Implement per-user rate limits for chat API
  - Add exponential backoff for LLM retries
  - Display wait times to users when rate limited
  - _Requirements: 1.1_

- [ ]* 13.3 Write property test for response time
  - **Property 1: Response time performance**
  - **Validates: Requirements 1.1**

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
