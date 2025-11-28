# No Results Handling Implementation

## Overview
Implemented graceful handling for queries that return no matching articles, as specified in Requirement 6.4.

## Implementation Details

### Changes Made

1. **Enhanced System Prompt (lib/chat/llm.ts)**
   - Added `availableCategories` parameter to `createSystemPrompt()` function
   - Created `getCategorySuggestions()` helper function to format category suggestions
   - Enhanced "No Results Handling" section in system prompt with:
     - Instructions to suggest 2-3 alternative search terms
     - Guidance to recommend browsing specific wiki categories
     - Example responses for the LLM to follow
     - Instructions to provide actionable next steps

2. **Updated LLM Service (lib/chat/llm.ts)**
   - Modified `generateResponse()` to accept `availableCategories` parameter
   - System prompt now includes available categories when no results are found
   - Falls back to common categories (Academics, Campus Life, Student Services, Events, Resources) if none provided

3. **Enhanced API Route (app/api/chat/message/route.ts)**
   - Added logic to fetch available categories when no articles are retrieved
   - Passes categories to `generateResponse()` for better suggestions
   - Gracefully handles category fetch failures with fallback

4. **Updated Tests (lib/chat/llm.test.ts)**
   - Added test for category suggestions when no articles found
   - Added test for fallback categories
   - Updated all existing tests to include new optional parameter

## How It Works

When a user query returns no matching articles:

1. The retrieval service returns an empty array
2. The API route detects this and fetches available wiki categories
3. The categories are passed to the LLM service
4. The system prompt instructs the LLM to:
   - Acknowledge that no articles were found
   - Analyze the query to suggest 2-3 alternative search terms
   - Recommend browsing specific categories
   - Provide actionable next steps

## Example Behavior

**User Query:** "dormitory food"
**No articles found**

**Expected Response:**
"I couldn't find any articles matching 'dormitory food'. You might try searching for 'student housing' or 'campus dining'. You can also browse our Campus Life or Student Services categories."

## Requirements Satisfied

✅ **Requirement 6.4:** WHEN no articles match the query THEN the Chatbot SHALL inform the user and suggest alternative search terms

The implementation:
- Detects when no articles match
- Informs the user politely
- Suggests alternative search terms (2-3 suggestions)
- Recommends browsing categories
- Provides actionable next steps

## Testing

All existing tests pass:
- ✅ lib/chat/llm.test.ts (24 tests)
- ✅ lib/chat/retrieval.test.ts (17 tests)

New tests added:
- Test for category suggestions when no articles found
- Test for fallback categories when none provided
