# Out-of-Scope Query Handling Implementation

## Overview

This document describes the implementation of out-of-scope query handling for the wiki chatbot, addressing Requirements 7.1 and 7.2.

## Requirements

- **7.1**: WHEN a user asks about topics not covered in the wiki THEN the Chatbot SHALL acknowledge the limitation and suggest browsing categories
- **7.2**: WHEN a user asks inappropriate or off-topic questions THEN the Chatbot SHALL politely redirect to TUM-related topics

## Implementation

### 1. Detection Function (`isOutOfScopeQuery`)

**Location**: `lib/chat/retrieval.ts`

The `isOutOfScopeQuery` function uses heuristics to identify queries that are clearly not about TUM:

#### Detection Categories

1. **Other Universities**
   - Detects mentions of other universities (Harvard, Stanford, MIT, Oxford, Cambridge, etc.)
   - Allows comparison queries that also mention TUM (e.g., "Compare TUM with Harvard")
   - Examples:
     - ✅ Detected: "What are the admission requirements for Harvard?"
     - ❌ Not detected: "Compare TUM with Stanford"

2. **General Knowledge Topics**
   - Detects topics clearly unrelated to university life:
     - Weather, cooking, stock market, cryptocurrency
     - Movies, TV shows, celebrities
     - Repair/fix instructions
     - Medical/legal advice
   - Allows these topics in university context (e.g., "student cooking recipes")
   - Examples:
     - ✅ Detected: "What is the weather today?"
     - ❌ Not detected: "TUM campus weather"

3. **General Knowledge Questions**
   - Pattern-based detection for common general knowledge questions:
     - "What is the capital of..."
     - "Who is the president of..."
     - "Tell me a joke"
     - "Write me a story"
   - Examples:
     - ✅ Detected: "What is the capital of France?"
     - ❌ Not detected: "What is TUM?"

### 2. API Integration

**Location**: `app/api/chat/message/route.ts`

The API route integrates out-of-scope detection into the message processing flow:

```typescript
// Detect out-of-scope queries
const isOutOfScope = isOutOfScopeQuery(message.trim());

// Also consider it out-of-scope if no articles found and query doesn't seem TUM-related
const likelyOutOfScope = isOutOfScope || 
  (retrievedArticles.length === 0 && !message.toLowerCase().includes('tum'));

// Fetch available categories for redirection suggestions
if (likelyOutOfScope) {
  console.log(`Out-of-scope query detected: "${message.trim()}"`);
  
  if (availableCategories.length === 0) {
    const { getAllCategories } = await import('@/lib/hygraph/wiki');
    try {
      const categories = await getAllCategories();
      availableCategories = categories.map(c => c.category);
    } catch (error) {
      console.error('Failed to fetch categories for out-of-scope handling:', error);
    }
  }
}

// Pass to LLM service
const responseGenerator = generateResponse(
  message.trim(),
  retrievedArticles,
  conversationHistory.slice(0, -1),
  isRecommendation,
  isAmbiguous,
  availableCategories,
  likelyOutOfScope  // New parameter
);
```

### 3. LLM System Prompt

**Location**: `lib/chat/llm.ts`

The system prompt includes specific instructions for handling out-of-scope queries:

#### General Guidelines (Always Present)

```
Out-of-Scope Query Handling (Requirements 7.1, 7.2):
- This wiki is specifically about TUM (Technical University of Munich) topics
- If a user asks about non-TUM topics (other universities, general knowledge, unrelated subjects), 
  politely acknowledge the limitation
- Redirect users to TUM-related content that might be helpful
- Suggest relevant wiki categories they can explore
- Example: "I'm specifically designed to help with TUM-related questions. While I can't answer 
  that, I can help you with topics like [TUM-related examples]. Would you like to explore our 
  categories?"
- Stay friendly and helpful even when declining to answer
```

#### Specific Instructions (When Out-of-Scope Detected)

When `isOutOfScope` is true, additional instructions are added:

```
IMPORTANT: This query appears to be about non-TUM topics or outside the scope of this wiki. Please:
1. Politely acknowledge that the question is outside the scope of the TUM wiki
2. Explain that you're specifically designed to help with TUM-related questions
3. Suggest relevant TUM-related topics or categories the user might be interested in instead
4. Provide 2-3 specific examples of TUM topics you can help with
5. Available categories to suggest: [list of categories]
6. Example responses:
   * "I'm specifically designed to help with TUM-related questions, so I can't answer questions 
     about [other university/topic]. However, I'd be happy to help you with TUM topics like 
     course registration, campus facilities, or student services. Would you like to explore 
     any of these areas?"
   * "That's outside my area of expertise - I focus on TUM (Technical University of Munich) 
     information. I can help you with topics like academics, campus life, events, and student 
     resources at TUM. What would you like to know about TUM?"
7. Keep the tone friendly and helpful, not dismissive
8. Always offer to help with TUM-related alternatives
```

## User Experience

### Example Interactions

#### Example 1: Other University Query

**User**: "What are the admission requirements for Harvard?"

**Chatbot**: "I'm specifically designed to help with TUM-related questions, so I can't provide information about Harvard's admission requirements. However, I'd be happy to help you with TUM admission requirements, application processes, or program information. Would you like to know about TUM's admission criteria?"

#### Example 2: General Knowledge Query

**User**: "What's the weather like today?"

**Chatbot**: "That's outside my area of expertise - I focus on TUM (Technical University of Munich) information. I can help you with topics like campus facilities, student services, events, and academic programs at TUM. What would you like to know about TUM?"

#### Example 3: Comparison Query (Allowed)

**User**: "How does TUM compare to MIT?"

**Chatbot**: *Provides information about TUM's strengths and characteristics from wiki articles*

## Testing

### Unit Tests

**Location**: `lib/chat/retrieval.test.ts`

Tests cover:
- Detection of queries about other universities
- Allowing comparison queries that mention TUM
- Detection of general knowledge topics
- Allowing general topics in university context
- Detection of general knowledge questions
- Not flagging TUM-related queries
- Not flagging university-related queries

**Location**: `lib/chat/llm.test.ts`

Tests cover:
- Including out-of-scope instructions when flag is true
- Not including instructions when flag is false
- General out-of-scope handling guidelines always present

### Test Results

All tests passing:
- `lib/chat/retrieval.test.ts`: 24 tests passed
- `lib/chat/llm.test.ts`: 27 tests passed

## Design Decisions

### 1. Heuristic-Based Detection

We use heuristics rather than ML-based classification because:
- Simpler and more maintainable
- Faster (no API calls)
- More predictable behavior
- Easy to extend with new patterns

### 2. Two-Level Detection

The system uses two levels of detection:
1. **Explicit detection**: Pattern matching in `isOutOfScopeQuery`
2. **Implicit detection**: No articles found + no TUM mention

This catches both obvious out-of-scope queries and edge cases.

### 3. LLM as Final Arbiter

The LLM receives the out-of-scope flag as guidance but can still:
- Provide nuanced responses
- Handle edge cases gracefully
- Maintain conversational context
- Adjust tone appropriately

### 4. Category Suggestions

When redirecting users, we provide:
- Available wiki categories
- Specific examples of TUM topics
- Actionable next steps

This helps users find relevant information even when their initial query was out-of-scope.

## Future Enhancements

Potential improvements:
1. **Learning from user feedback**: Track which redirections are helpful
2. **More sophisticated patterns**: Add more detection patterns based on usage
3. **Context-aware detection**: Consider conversation history
4. **Multilingual support**: Detect out-of-scope queries in multiple languages

## Related Requirements

- **Requirement 6.4**: No results handling (complementary to out-of-scope)
- **Requirement 7.3**: Error handling (different from out-of-scope)
- **Requirement 7.4**: Ambiguity detection (different from out-of-scope)
