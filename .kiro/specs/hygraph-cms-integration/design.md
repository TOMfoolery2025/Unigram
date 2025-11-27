# Design Document: Hygraph CMS Integration

## Overview

This design document outlines the architecture and implementation approach for integrating Hygraph CMS (formerly GraphCMS) to replace the current database-backed wiki system in the TUM Community Platform. The integration will separate content management from the application database, providing content managers with a dedicated CMS interface while maintaining a seamless user experience for wiki readers.

### Key Design Goals

1. **Separation of Concerns**: Decouple content management from application logic by using Hygraph as the single source of truth for wiki content
2. **Improved Authoring Experience**: Leverage Hygraph's rich text editor and asset management for better content creation
3. **Performance**: Implement caching strategies to minimize API calls and ensure fast page loads
4. **Maintainability**: Remove database-backed wiki code and simplify the codebase
5. **Backward Compatibility**: Maintain the existing user-facing wiki interface and navigation patterns

### Technology Stack

- **CMS**: Hygraph (headless CMS with GraphQL API)
- **GraphQL Client**: graphql-request (lightweight GraphQL client)
- **Caching**: In-memory cache with TTL (time-to-live)
- **Rich Text Rendering**: @graphcms/rich-text-react-renderer
- **Frontend**: Next.js 14 with React Server Components where applicable

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TUM Community Platform                    │
│                                                              │
│  ┌────────────────┐         ┌──────────────────────────┐   │
│  │  Wiki Pages    │────────▶│  Hygraph Data Layer      │   │
│  │  (Components)  │         │  (lib/hygraph/wiki.ts)   │   │
│  └────────────────┘         └──────────────────────────┘   │
│                                        │                     │
│                                        ▼                     │
│                             ┌──────────────────────────┐   │
│                             │  GraphQL Client          │   │
│                             │  (lib/hygraph/client.ts) │   │
│                             └──────────────────────────┘   │
│                                        │                     │
│                                        ▼                     │
│                             ┌──────────────────────────┐   │
│                             │  Cache Layer             │   │
│                             │  (5 min TTL)             │   │
│                             └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   Hygraph CMS API   │
                              │   (GraphQL)         │
                              └─────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  Content Models     │
                              │  - WikiArticle      │
                              │  - Assets           │
                              └─────────────────────┘
```

### Component Layers

1. **Presentation Layer** (`components/wiki/`)
   - React components for displaying wiki content
   - Reuse existing component structure with updated data sources
   - Handle loading states and error boundaries

2. **Data Layer** (`lib/hygraph/`)
   - GraphQL queries and mutations
   - Data transformation and normalization
   - Error handling and retry logic

3. **Client Layer** (`lib/hygraph/client.ts`)
   - GraphQL client configuration
   - Authentication and request headers
   - Request/response interceptors

4. **Cache Layer** (in-memory)
   - Simple TTL-based caching
   - Cache invalidation strategies
   - Request deduplication

## Components and Interfaces

### Hygraph Content Model

The WikiArticle content model in Hygraph will have the following structure:

```graphql
type WikiArticle {
  id: ID!
  title: String!
  slug: String! @unique
  category: String!
  content: RichText!
  stage: Stage! # DRAFT or PUBLISHED
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime
}
```

### GraphQL Client Interface

```typescript
// lib/hygraph/client.ts

export interface HygraphConfig {
  endpoint: string;
  token: string;
}

export class HygraphClient {
  constructor(config: HygraphConfig);
  
  request<T>(query: string, variables?: Record<string, any>): Promise<T>;
  
  setHeaders(headers: Record<string, string>): void;
}
```

### Data Layer Interface

```typescript
// lib/hygraph/wiki.ts

export interface WikiArticleData {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: any; // Rich text AST
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface WikiCategoryData {
  category: string;
  articleCount: number;
}

export interface WikiSearchResultData {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
}

// Fetch functions
export async function getArticleBySlug(
  slug: string
): Promise<WikiArticleData | null>;

export async function getArticlesByCategory(
  category: string
): Promise<WikiArticleData[]>;

export async function getAllCategories(): Promise<WikiCategoryData[]>;

export async function searchArticles(
  query: string
): Promise<WikiSearchResultData[]>;
```

### Cache Interface

```typescript
// lib/hygraph/cache.ts

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  
  get<T>(key: string): T | null;
  
  set<T>(key: string, data: T, ttl?: number): void;
  
  invalidate(key: string): void;
  
  clear(): void;
}
```

## Data Models

### WikiArticle Type

```typescript
// types/hygraph.ts

export interface HygraphWikiArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: RichTextContent;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface RichTextContent {
  json: any; // Rich text AST
  html: string; // Pre-rendered HTML
  text: string; // Plain text for excerpts
}

export interface WikiCategory {
  category: string;
  articleCount: number;
}

export interface WikiSearchResult {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
}
```

### GraphQL Query Examples

```graphql
# Get article by slug
query GetArticleBySlug($slug: String!) {
  wikiArticle(where: { slug: $slug }, stage: PUBLISHED) {
    id
    title
    slug
    category
    content {
      json
      html
      text
    }
    createdAt
    updatedAt
    publishedAt
  }
}

# Get articles by category
query GetArticlesByCategory($category: String!) {
  wikiArticles(
    where: { category: $category }
    stage: PUBLISHED
    orderBy: title_ASC
  ) {
    id
    title
    slug
    category
    content {
      text
    }
    updatedAt
  }
}

# Get all categories with counts
query GetAllCategories {
  wikiArticles(stage: PUBLISHED) {
    category
  }
}

# Search articles
query SearchArticles($query: String!) {
  wikiArticles(
    where: {
      _search: $query
    }
    stage: PUBLISHED
  ) {
    id
    title
    slug
    category
    content {
      text
    }
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Category filtering returns only matching articles

*For any* category string, when fetching articles by category, all returned articles should have that exact category value.

**Validates: Requirements 2.2**

### Property 2: Article content rendering preserves structure

*For any* article fetched from Hygraph, when rendering the rich text content, the output should preserve all structural elements (headings, paragraphs, lists, links) present in the source content.

**Validates: Requirements 2.3**

### Property 3: Image URLs are correctly rendered

*For any* article containing images, all image elements in the rendered output should use Hygraph's asset delivery URLs (containing the Hygraph CDN domain).

**Validates: Requirements 2.4**

### Property 4: Authentication headers are included in requests

*For any* GraphQL request made to Hygraph, the request headers should include the authentication token.

**Validates: Requirements 3.2**

### Property 5: Network errors trigger retry with exponential backoff

*For any* network error during a Hygraph API request, the system should retry the request up to three times with exponentially increasing delays between attempts.

**Validates: Requirements 3.5**

### Property 6: Search results contain required fields

*For any* search query that returns results, each result should include the article title, category, and content excerpt.

**Validates: Requirements 4.1, 4.2**

### Property 7: Published-only filtering

*For any* article fetch operation (unless explicitly requesting drafts), all returned articles should have stage equal to PUBLISHED.

**Validates: Requirements 5.3**

### Property 8: Cache serves data within TTL

*For any* article request, if the article exists in cache and the cache entry is less than 5 minutes old, the data should be served from cache without making an API request.

**Validates: Requirements 6.1, 6.2**

### Property 9: Cache refreshes after expiration

*For any* cached article, if the cache entry is older than 5 minutes, requesting the article should trigger a fresh API call and update the cache with new data.

**Validates: Requirements 6.3**

### Property 10: Concurrent requests are deduplicated

*For any* article slug, if multiple requests for the same article occur simultaneously (within 100ms), only one API request should be made to Hygraph, and all callers should receive the same result.

**Validates: Requirements 6.4**

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing or invalid environment variables
   - Malformed API endpoint URLs
   - Strategy: Fail fast at application startup with clear error messages

2. **Authentication Errors**
   - Invalid or expired API tokens
   - Insufficient permissions
   - Strategy: Log errors, return null data, display user-friendly error messages

3. **Network Errors**
   - Connection timeouts
   - DNS resolution failures
   - Intermittent connectivity issues
   - Strategy: Retry with exponential backoff (3 attempts), then fail gracefully

4. **GraphQL Errors**
   - Query syntax errors
   - Invalid field selections
   - Strategy: Log full error details, return null data, alert developers

5. **Content Errors**
   - Article not found
   - Malformed rich text content
   - Strategy: Display appropriate user messages, log for investigation

### Error Handling Implementation

```typescript
// lib/hygraph/errors.ts

export class HygraphError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'HygraphError';
  }
}

export class ConfigurationError extends HygraphError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
  }
}

export class AuthenticationError extends HygraphError {
  constructor(message: string, originalError?: Error) {
    super(message, 'AUTHENTICATION_ERROR', originalError);
  }
}

export class NetworkError extends HygraphError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', originalError);
  }
}

export class ContentNotFoundError extends HygraphError {
  constructor(slug: string) {
    super(`Article not found: ${slug}`, 'CONTENT_NOT_FOUND');
  }
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication or configuration errors
      if (
        error instanceof AuthenticationError ||
        error instanceof ConfigurationError
      ) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Configuration Tests**
   - Test that missing environment variables throw ConfigurationError
   - Test that client initializes correctly with valid config
   - Test that invalid URLs are rejected

2. **Error Handling Tests**
   - Test that authentication errors are caught and logged
   - Test that network errors trigger retry logic
   - Test that content not found returns null gracefully

3. **Cache Tests**
   - Test that cache stores and retrieves data correctly
   - Test that cache respects TTL
   - Test that cache invalidation works

4. **Rich Text Rendering Tests**
   - Test that headings are rendered correctly
   - Test that lists are rendered correctly
   - Test that images use correct URLs
   - Test that links are preserved

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript property-based testing library):

1. **Category Filtering Property** (Property 1)
   - Generate random category names
   - Fetch articles by category
   - Verify all results have the specified category

2. **Content Structure Preservation Property** (Property 2)
   - Generate random rich text content structures
   - Render the content
   - Verify all structural elements are present in output

3. **Image URL Property** (Property 3)
   - Generate articles with random numbers of images
   - Render the content
   - Verify all image URLs contain Hygraph CDN domain

4. **Authentication Header Property** (Property 4)
   - Generate random GraphQL queries
   - Intercept requests
   - Verify auth token is in headers

5. **Retry Behavior Property** (Property 5)
   - Simulate random network errors
   - Verify retry count and delays match exponential backoff

6. **Search Results Property** (Property 6)
   - Generate random search queries
   - Verify all results contain title, category, and excerpt

7. **Published Filter Property** (Property 7)
   - Fetch articles with various filters
   - Verify all results have PUBLISHED stage

8. **Cache TTL Property** (Property 8)
   - Generate random article requests
   - Verify cache hits within TTL window

9. **Cache Expiration Property** (Property 9)
   - Request articles after cache expiration
   - Verify fresh API calls are made

10. **Request Deduplication Property** (Property 10)
    - Generate concurrent requests for same article
    - Verify only one API call is made

### Testing Configuration

- Each property-based test will run a minimum of 100 iterations
- Each test will be tagged with: `**Feature: hygraph-cms-integration, Property {number}: {property_text}**`
- Tests will use mocked Hygraph responses to avoid external dependencies
- Integration tests will use a test Hygraph project with sample data

## Implementation Phases

### Phase 1: Setup and Configuration

1. Install dependencies (graphql-request, @graphcms/rich-text-react-renderer)
2. Create Hygraph project and content model
3. Set up environment variables
4. Implement GraphQL client with authentication

### Phase 2: Core Data Layer

1. Implement article fetching functions
2. Implement category aggregation
3. Implement search functionality
4. Add error handling and retry logic

### Phase 3: Caching Layer

1. Implement simple in-memory cache
2. Add TTL-based expiration
3. Implement request deduplication
4. Add cache invalidation

### Phase 4: Component Updates

1. Update WikiHome component to use Hygraph data
2. Update WikiArticle component to render Hygraph content
3. Update WikiSearch component to query Hygraph
4. Update WikiArticleList component for category views

### Phase 5: Testing

1. Write unit tests for all data layer functions
2. Write property-based tests for correctness properties
3. Perform integration testing with real Hygraph instance
4. Test error scenarios and edge cases

### Phase 6: Cleanup

1. Remove old lib/wiki directory
2. Remove wiki-related database types
3. Remove wiki database tables from Supabase
4. Update documentation

## Migration Considerations

### Content Model Setup in Hygraph

The WikiArticle model should be configured with:

- **Title** (Single line text, required)
- **Slug** (Single line text, required, unique)
- **Category** (Single line text, required)
- **Content** (Rich text, required)
- **Stage** (System field: DRAFT/PUBLISHED)

### Environment Variables

Add to `.env.local`:

```bash
# Hygraph Configuration
NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://api-region.hygraph.com/v2/project-id/master
HYGRAPH_TOKEN=your-permanent-auth-token
```

### Rich Text Rendering

Hygraph's rich text content will be rendered using their official renderer:

```typescript
import { RichText } from '@graphcms/rich-text-react-renderer';

<RichText
  content={article.content.json}
  renderers={{
    h1: ({ children }) => <h1 className="text-3xl font-bold">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold">{children}</h2>,
    p: ({ children }) => <p className="mb-4">{children}</p>,
    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="max-w-full h-auto" />
    ),
  }}
/>
```

## Performance Considerations

1. **Caching Strategy**: 5-minute TTL balances freshness with API usage
2. **Request Deduplication**: Prevents thundering herd problem
3. **Lazy Loading**: Load article content only when needed
4. **Image Optimization**: Use Hygraph's image transformation API for responsive images
5. **GraphQL Query Optimization**: Request only needed fields to minimize payload size

## Security Considerations

1. **API Token Protection**: Store token in server-side environment variables only
2. **Content Sanitization**: Hygraph content is trusted, but still sanitize before rendering
3. **Rate Limiting**: Implement client-side rate limiting to prevent API abuse
4. **Error Message Sanitization**: Don't expose internal errors to end users
