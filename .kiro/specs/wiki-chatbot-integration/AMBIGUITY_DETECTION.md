# Ambiguity Detection Implementation

## Overview

The ambiguity detection feature (Requirement 7.4) enables the chatbot to identify when a user's query could refer to multiple distinct topics and ask clarifying questions before providing a definitive answer.

## Implementation Details

### Detection Logic

**Location**: `lib/chat/retrieval.ts`

The `isAmbiguousQuery()` function detects ambiguous queries based on:

1. **Multiple Categories**: Query matches articles from 3+ different categories
2. **Similar Relevance Scores**: Top articles have similar relevance scores (within 20 points)
3. **Short Query**: Query is 1-2 words (more likely to be ambiguous)

```typescript
export function isAmbiguousQuery(
  query: string,
  retrievedArticles: RetrievedArticle[]
): boolean
```

**Example Ambiguous Queries**:
- "registration" → Could mean course registration, event registration, or student ID registration
- "access card" → Could mean library access, building access, or system access
- "support" → Could mean academic support, IT support, or student services

### Interpretation Options

**Location**: `lib/chat/retrieval.ts`

The `getAmbiguityOptions()` function extracts category options with example article titles:

```typescript
export function getAmbiguityOptions(
  retrievedArticles: RetrievedArticle[]
): Array<{ category: string; exampleTitle: string }>
```

This provides the LLM with structured information about the different interpretations available.

### API Integration

**Location**: `app/api/chat/message/route.ts`

The chat message endpoint:
1. Calls `isAmbiguousQuery()` to detect ambiguity
2. Calls `getAmbiguityOptions()` to get interpretation options
3. Passes the `isAmbiguous` flag to `generateResponse()`
4. Logs ambiguous queries for monitoring

```typescript
const isAmbiguous = isAmbiguousQuery(message.trim(), retrievedArticles);
if (isAmbiguous) {
  const options = getAmbiguityOptions(retrievedArticles);
  console.log(`Ambiguous query detected: "${message.trim()}" - ${options.length} interpretations`);
}
```

### LLM Prompt Instructions

**Location**: `lib/chat/llm.ts`

When `isAmbiguous` is true, the system prompt includes special instructions:

```typescript
const ambiguityInstructions = isAmbiguous
  ? `\n\nIMPORTANT: This query appears ambiguous - it could refer to multiple distinct topics. Before providing a detailed answer:
1. Acknowledge that the query could have multiple interpretations
2. List the different categories/topics where relevant information was found
3. Ask the user which specific topic they're interested in
4. Provide a brief preview of what information is available in each category
5. Example: "I found information about 'registration' in multiple areas. Are you asking about: 1) Course registration, 2) Event registration, or 3) Student ID registration?"
6. Keep the clarification friendly and concise`
  : '';
```

### General Guidelines

The system prompt always includes general ambiguity handling guidelines:

```
Ambiguity Detection and Clarification (Requirement 7.4):
- When a query could refer to multiple distinct topics or interpretations, detect this ambiguity
- Before providing a definitive answer, ask clarifying questions to understand what the user is looking for
- Provide multiple interpretation options for the user to choose from
- Example: "I found information about 'registration' in multiple contexts. Are you asking about: 1) Course registration, 2) Event registration, or 3) Student registration at TUM?"
- Only ask for clarification when genuinely ambiguous - don't over-clarify simple queries
- After clarification, provide a focused answer based on the user's choice
```

## Testing

### Unit Tests

**Location**: `lib/chat/retrieval.test.ts`

Tests for ambiguity detection functions:
- ✅ Detects ambiguous queries with 3+ categories and similar scores
- ✅ Does not detect ambiguity with fewer than 3 articles
- ✅ Does not detect ambiguity with long specific queries
- ✅ Does not detect ambiguity when scores differ significantly
- ✅ Handles empty results gracefully
- ✅ Detects ambiguity with two-word queries and multiple categories

Tests for ambiguity options:
- ✅ Extracts category options with example titles
- ✅ Returns one option per category
- ✅ Handles empty articles
- ✅ Handles single category

**Location**: `lib/chat/llm.test.ts`

Tests for LLM prompt generation:
- ✅ Includes ambiguity instructions when isAmbiguous is true
- ✅ Does not include ambiguity instructions when isAmbiguous is false
- ✅ Includes general ambiguity handling guidelines
- ✅ Provides example clarification format

## Example Flow

### User Query: "registration"

1. **Retrieval**: System finds articles about:
   - Course Registration (Academics, score: 50)
   - Event Registration (Campus Life, score: 48)
   - Student ID Registration (Services, score: 47)

2. **Detection**: `isAmbiguousQuery()` returns `true` because:
   - 3 different categories
   - Similar scores (within 20 points)
   - Short query (1 word)

3. **Options**: `getAmbiguityOptions()` returns:
   ```typescript
   [
     { category: 'Academics', exampleTitle: 'Course Registration' },
     { category: 'Campus Life', exampleTitle: 'Event Registration' },
     { category: 'Services', exampleTitle: 'Student ID Registration' }
   ]
   ```

4. **LLM Response**: The chatbot responds with:
   ```
   I found information about "registration" in multiple areas. Are you asking about:
   
   1) Course registration (Academics) - How to register for classes
   2) Event registration (Campus Life) - How to sign up for campus events
   3) Student ID registration (Services) - How to get your student ID card
   
   Which one would you like to know more about?
   ```

5. **User Clarification**: User responds "course registration"

6. **Focused Answer**: Chatbot provides detailed information about course registration

## Benefits

1. **Better User Experience**: Users get relevant answers faster by clarifying intent upfront
2. **Reduced Confusion**: Prevents the chatbot from providing information about the wrong topic
3. **Efficient Conversations**: Saves time by avoiding back-and-forth corrections
4. **Comprehensive Coverage**: Ensures users are aware of all available information on a topic

## Configuration

No configuration required. The ambiguity detection is automatic based on:
- Number of categories (threshold: 3+)
- Score similarity (threshold: 20 points)
- Query length (threshold: 2 words)

These thresholds can be adjusted in `lib/chat/retrieval.ts` if needed.

## Monitoring

Ambiguous queries are logged for monitoring:

```typescript
console.log(`Ambiguous query detected: "${message.trim()}" - ${options.length} interpretations`);
```

This helps track:
- How often ambiguity occurs
- Which queries are commonly ambiguous
- Whether thresholds need adjustment

## Future Enhancements

1. **Machine Learning**: Use ML to improve ambiguity detection accuracy
2. **User Preferences**: Remember user's past clarifications to reduce future prompts
3. **Context Awareness**: Use conversation history to reduce ambiguity
4. **Dynamic Thresholds**: Adjust thresholds based on query patterns
5. **Feedback Loop**: Allow users to report when clarification was unnecessary
