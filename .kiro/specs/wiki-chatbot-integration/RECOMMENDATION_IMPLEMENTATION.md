# Article Recommendation Implementation Summary

## Overview

Task 10.3 has been successfully implemented to add article recommendation functionality to the wiki chatbot. The implementation enables the chatbot to detect when users are asking for article recommendations and respond with 2-5 relevant articles formatted with descriptions and links.

## Implementation Details

### 1. Recommendation Query Detection

**Location**: `lib/chat/retrieval.ts`

Added `isRecommendationQuery()` function that detects recommendation requests by checking for keywords:
- "recommend"
- "suggestion" / "suggest"
- "what should i read"
- "what can i read"
- "articles about"
- "show me articles"
- "list articles"
- "what articles"
- "find articles"

### 2. Enhanced Content Extraction

**Location**: `lib/chat/retrieval.ts`

Modified `extractRelevantContent()` to accept an `isRecommendation` parameter:
- For recommendation queries: Provides fuller article content (first 3 paragraphs, up to 1500 chars) to enable better descriptions
- For regular queries: Continues to extract targeted relevant sections based on query terms

This ensures the LLM has enough context to write informative 1-2 sentence descriptions for each recommended article.

### 3. Retrieval Logic Enhancement

**Location**: `lib/chat/retrieval.ts`

Updated `retrieveRelevantArticles()` to:
- Detect recommendation queries using `isRecommendationQuery()`
- Return 2-5 articles for recommendation queries (vs up to 5 for regular queries)
- Ensure minimum of 2 articles for recommendations when available
- Pass the `isRecommendation` flag to `extractRelevantContent()`
- Log recommendation queries for monitoring

### 4. System Prompt Enhancement

**Location**: `lib/chat/llm.ts`

Enhanced `createSystemPrompt()` to:
- Accept an `isRecommendationQuery` parameter
- Include special instructions when handling recommendation requests:
  - Explicitly tells the LLM the user is asking for recommendations
  - Specifies the format: **[Article Title](/wiki/articles/slug)** - Brief description (1-2 sentences) [Category: category-name]
  - Instructs to list 2-5 relevant articles
  - Requests informative descriptions
  - Asks to order by relevance

### 5. LLM Service Update

**Location**: `lib/chat/llm.ts`

Updated `generateResponse()` to:
- Accept an `isRecommendationQuery` parameter
- Pass it to `createSystemPrompt()` for proper prompt formatting

### 6. API Route Integration

**Location**: `app/api/chat/message/route.ts`

Modified the POST endpoint to:
- Import and use `isRecommendationQuery()` function
- Detect if the user's message is a recommendation request
- Pass the `isRecommendation` flag to `generateResponse()`

## Testing

### Unit Tests Added

**Retrieval Tests** (`lib/chat/retrieval.test.ts`):
- ✅ Test recommendation query detection with various keywords
- ✅ Test non-recommendation queries are not detected
- ✅ Test fuller content extraction for recommendation queries
- ✅ Test 2-5 article limit for recommendation queries

**LLM Tests** (`lib/chat/llm.test.ts`):
- ✅ Test system prompt includes special instructions for recommendations
- ✅ Test system prompt doesn't include special instructions for regular queries

### Test Results

All tests passing:
- 12/12 retrieval tests ✅
- 19/19 LLM tests ✅
- No TypeScript diagnostics ✅

## Requirements Validation

**Requirement 3.2**: "WHEN a user asks for recommendations THEN the Chatbot SHALL suggest 2-5 relevant articles with brief descriptions"

✅ **Detection**: `isRecommendationQuery()` detects recommendation requests
✅ **Count**: Retrieval logic ensures 2-5 articles are returned
✅ **Descriptions**: System prompt instructs LLM to provide 1-2 sentence descriptions
✅ **Format**: Articles formatted with links in markdown: `[Title](/wiki/articles/slug)`
✅ **Category**: System prompt instructs to include category information

## Example Usage

### User Query
```
"Can you recommend some articles about campus life at TUM?"
```

### System Behavior
1. `isRecommendationQuery()` returns `true`
2. `retrieveRelevantArticles()` fetches 2-5 relevant articles about campus life
3. `extractRelevantContent()` provides fuller article overviews (not just targeted sections)
4. `createSystemPrompt()` includes special recommendation formatting instructions
5. LLM generates response like:

```markdown
Here are some recommended articles about campus life at TUM:

**[Student Housing Options](/wiki/articles/student-housing)** - Learn about various accommodation options available for TUM students, including dormitories, shared apartments, and private housing. [Category: Campus Life]

**[Campus Facilities and Services](/wiki/articles/campus-facilities)** - Discover the libraries, sports facilities, cafeterias, and other services available on TUM campuses. [Category: Campus Life]

**[Student Organizations and Clubs](/wiki/articles/student-organizations)** - Explore the diverse range of student clubs, societies, and organizations you can join to enhance your university experience. [Category: Student Life]
```

## Files Modified

1. `lib/chat/retrieval.ts` - Enhanced content extraction and retrieval logic
2. `lib/chat/llm.ts` - Enhanced system prompt with recommendation instructions
3. `app/api/chat/message/route.ts` - Added recommendation detection
4. `lib/chat/retrieval.test.ts` - Added recommendation tests
5. `lib/chat/llm.test.ts` - Added recommendation prompt tests

## Monitoring and Logging

Added console logging for recommendation queries:
```
Recommendation query detected: "recommend articles about test" - Returning 5 articles
```

This helps track usage patterns and debug recommendation behavior.

## Future Enhancements

Potential improvements for future iterations:
1. Machine learning-based recommendation ranking
2. User preference tracking for personalized recommendations
3. Related article suggestions based on reading history
4. Category-specific recommendation strategies
5. A/B testing different recommendation formats
