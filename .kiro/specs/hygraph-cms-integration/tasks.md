# Implementation Plan

- [x] 1. Set up Hygraph project and install dependencies
  - Create Hygraph project and configure WikiArticle content model with title, slug, category, and rich text content fields
  - Install graphql-request and @graphcms/rich-text-react-renderer packages
  - Add Hygraph environment variables to .env.example and .env.local
  - _Requirements: 1.1, 3.1_

- [x] 2. Implement GraphQL client and error handling
- [x] 2.1 Create Hygraph client with authentication
  - Implement HygraphClient class in lib/hygraph/client.ts
  - Load configuration from environment variables with validation
  - Set up authentication headers for all requests
  - _Requirements: 3.1, 3.2_

- [ ]* 2.2 Write property test for authentication headers
  - **Property 4: Authentication headers are included in requests**
  - **Validates: Requirements 3.2**

- [x] 2.3 Implement error classes and retry logic
  - Create error classes (ConfigurationError, AuthenticationError, NetworkError, ContentNotFoundError) in lib/hygraph/errors.ts
  - Implement withRetry function with exponential backoff (3 attempts, 1s/2s/4s delays)
  - _Requirements: 3.3, 3.4, 3.5_

- [ ]* 2.4 Write property test for retry behavior
  - **Property 5: Network errors trigger retry with exponential backoff**
  - **Validates: Requirements 3.5**

- [ ]* 2.5 Write unit tests for error handling
  - Test ConfigurationError is thrown when environment variables are missing
  - Test AuthenticationError handling and logging
  - Test NetworkError retry logic
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 3. Implement caching layer
- [x] 3.1 Create simple cache with TTL
  - Implement SimpleCache class in lib/hygraph/cache.ts with get, set, invalidate, and clear methods
  - Add TTL-based expiration (default 5 minutes)
  - _Requirements: 6.1, 6.3_

- [x] 3.2 Add request deduplication
  - Implement request deduplication to prevent concurrent duplicate API calls
  - Track in-flight requests and return shared promises
  - _Requirements: 6.4_

- [ ]* 3.3 Write property test for cache TTL
  - **Property 8: Cache serves data within TTL**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 3.4 Write property test for cache expiration
  - **Property 9: Cache refreshes after expiration**
  - **Validates: Requirements 6.3**

- [ ]* 3.5 Write property test for request deduplication
  - **Property 10: Concurrent requests are deduplicated**
  - **Validates: Requirements 6.4**

- [ ]* 3.6 Write unit tests for cache operations
  - Test cache stores and retrieves data correctly
  - Test cache respects TTL
  - Test cache invalidation works
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Implement core data layer functions
- [x] 4.1 Create Hygraph types
  - Define HygraphWikiArticle, RichTextContent, WikiCategory, and WikiSearchResult types in types/hygraph.ts
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.2 Implement article fetching functions
  - Create getArticleBySlug function with GraphQL query in lib/hygraph/wiki.ts
  - Create getArticlesByCategory function with category filtering
  - Integrate caching for all fetch operations
  - _Requirements: 2.2, 2.3, 5.3_

- [ ]* 4.3 Write property test for category filtering
  - **Property 1: Category filtering returns only matching articles**
  - **Validates: Requirements 2.2**

- [ ]* 4.4 Write property test for published-only filtering
  - **Property 7: Published-only filtering**
  - **Validates: Requirements 5.3**

- [x] 4.5 Implement category aggregation
  - Create getAllCategories function that fetches all articles and aggregates by category
  - Return category names with article counts
  - _Requirements: 2.1_

- [x] 4.6 Implement search functionality
  - Create searchArticles function using Hygraph's _search filter
  - Return results with title, slug, category, and excerpt
  - _Requirements: 4.1, 4.2, 4.5_

- [ ]* 4.7 Write property test for search results
  - **Property 6: Search results contain required fields**
  - **Validates: Requirements 4.1, 4.2**

- [ ]* 4.8 Write unit tests for data layer functions
  - Test getArticleBySlug returns correct article
  - Test getArticlesByCategory filters correctly
  - Test getAllCategories aggregates correctly
  - Test searchArticles with empty query returns no results
  - Test article not found returns null
  - _Requirements: 2.2, 2.3, 2.5, 4.4_

- [x] 5. Update WikiHome component
- [x] 5.1 Refactor WikiHome to use Hygraph data
  - Update lib/hygraph/wiki.ts import instead of lib/wiki/articles
  - Replace getWikiCategories with getAllCategories from Hygraph
  - Update loading and error states
  - _Requirements: 2.1_

- [ ]* 5.2 Write unit tests for WikiHome component
  - Test component renders categories from Hygraph
  - Test loading state displays correctly
  - Test error state displays correctly
  - _Requirements: 2.1_

- [x] 6. Update WikiArticle component
- [x] 6.1 Implement rich text rendering
  - Install and configure @graphcms/rich-text-react-renderer
  - Create custom renderers for headings, paragraphs, lists, links, and images
  - Ensure images use Hygraph asset URLs
  - _Requirements: 2.3, 2.4_

- [ ]* 6.2 Write property test for content structure preservation
  - **Property 2: Article content rendering preserves structure**
  - **Validates: Requirements 2.3**

- [ ]* 6.3 Write property test for image URLs
  - **Property 3: Image URLs are correctly rendered**
  - **Validates: Requirements 2.4**

- [x] 6.4 Refactor WikiArticle to use Hygraph data
  - Update to use getArticleBySlug from lib/hygraph/wiki.ts
  - Replace content rendering with RichText component
  - Update loading and error states
  - Remove version history features (handled by Hygraph)
  - _Requirements: 2.3, 2.4, 2.5_

- [ ]* 6.5 Write unit tests for WikiArticle component
  - Test component renders article from Hygraph
  - Test rich text content renders correctly
  - Test images display with correct URLs
  - Test article not found shows error message
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 7. Update WikiArticleList component
- [x] 7.1 Refactor WikiArticleList to use Hygraph data
  - Update to use getArticlesByCategory from lib/hygraph/wiki.ts
  - Update article card rendering for Hygraph data structure
  - Update loading and error states
  - _Requirements: 2.2_

- [ ]* 7.2 Write unit tests for WikiArticleList component
  - Test component renders articles from Hygraph
  - Test category filtering works correctly
  - Test loading state displays correctly
  - _Requirements: 2.2_

- [x] 8. Update WikiSearch component
- [x] 8.1 Refactor WikiSearch to use Hygraph data
  - Update to use searchArticles from lib/hygraph/wiki.ts
  - Display search results with title, category, and excerpt
  - Handle empty query validation
  - Handle no results case
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 8.2 Write unit tests for WikiSearch component
  - Test search executes with valid query
  - Test search results display correctly
  - Test empty query does not execute search
  - Test no results message displays correctly
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Remove old wiki implementation
- [x] 10.1 Delete old wiki code files
  - Delete lib/wiki directory and all contents (articles.ts, articles.test.ts, versions.ts, versions.test.ts)
  - Delete components/wiki/version-history.tsx
  - Delete components/wiki/wiki-editor.tsx
  - _Requirements: 7.2_

- [x] 10.2 Remove wiki database types
  - Remove wiki_articles and wiki_versions types from types/database.types.ts
  - Remove wiki-related types from types/wiki.ts (keep file for Hygraph types)
  - _Requirements: 7.3_

- [x] 10.3 Update component exports
  - Update components/wiki/index.ts to remove deleted component exports
  - Verify no broken imports remain in codebase
  - _Requirements: 7.4, 7.5_

- [x] 10.4 Document database cleanup
  - Add note to supabase/migrations documenting that wiki tables should be dropped manually
  - Create a cleanup SQL script for removing wiki_articles and wiki_versions tables
  - _Requirements: 7.1_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
