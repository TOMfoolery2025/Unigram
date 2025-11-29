# System Prompt Improvements for Wiki Content Usage

## Problem
The chatbot was not consistently using the wiki article content from Hygraph CMS to answer questions, often saying "information not available" even when relevant articles existed.

## Root Cause Analysis
After investigation, I found:
1. ✅ Markdown content IS being fetched from Hygraph correctly via GraphQL
2. ✅ Content IS being passed to the LLM in the system prompt
3. ✅ Search IS working and finding relevant articles (tested with "campus life" query - found 3 articles)
4. ⚠️ The system prompt was initially TOO STRICT, causing the bot to be overly conservative
5. ⚠️ The system prompt needed better balance between accuracy and helpfulness

## Solution Implemented

### 1. Balanced Instructions Section
Replaced overly strict instructions with balanced guidance:

**Before (Too Strict):**
```
CRITICAL INSTRUCTIONS - READ CAREFULLY:
- You MUST base your answers EXCLUSIVELY on the wiki article content provided below
- DO NOT use your general knowledge or training data to answer questions
- DO NOT make assumptions or infer information not explicitly stated in the articles
```

**After (Balanced):**
```
IMPORTANT INSTRUCTIONS:
- Base your answers on the wiki article content provided below
- When you use information from an article, cite it using markdown links
- If the provided articles contain relevant information, use it to answer the question
- If the articles don't contain enough information to fully answer the question, say so and suggest what the user could search for
- You can make reasonable connections between information in the articles, but don't invent facts
- Be helpful and friendly while staying accurate to the source material
```

### 2. Improved Article Formatting
Changed the article presentation format to make it more prominent and clear:

**Before:**
```
Article 1: Title
Category: X
Slug: slug

Content:
[content]
---
```

**After:**
```
========================================
ARTICLE 1: Title
========================================
Category: X
Slug: slug
Link: /wiki/articles/slug

ARTICLE CONTENT (Use this to answer questions):
[content]
========================================
```

### 3. Improved Article Context Section
Changed from overly restrictive to encouraging usage:

**Before (Too Restrictive):**
```
========================================
WIKI ARTICLES DATABASE
========================================
The following articles are your ONLY source of information. You must answer questions based EXCLUSIVELY on this content.
[articles]

========================================
REMINDER: Answer ONLY using the article content above. If the information is not in these articles, say so clearly.
========================================
```

**After (Encouraging):**
```
========================================
WIKI ARTICLES FOR THIS QUERY
========================================
[articles]

IMPORTANT: Use the articles above to answer the user's question. These articles were specifically retrieved as relevant to their query. Extract and synthesize information from them to provide a helpful, accurate answer. Always cite which articles you're using.
========================================
```

### 4. Balanced Guidelines
Updated the guidelines to encourage helpfulness while maintaining accuracy:
- "Answer questions using the provided wiki content as your primary source"
- "Always cite your sources using markdown links"
- "If the answer requires information not in the provided articles, acknowledge this and suggest alternative searches"
- "Be friendly and supportive to students"

### 5. Added Debug Logging
Added console logging to the retrieval service to help diagnose issues:
- Logs number of search results found
- Logs which articles are being returned with their relevance scores
- Logs when no articles are found for a query

## Expected Behavior After Changes

The chatbot should now:
1. ✅ Use wiki article content confidently when articles are found
2. ✅ Extract and synthesize information from multiple articles
3. ✅ Cite sources using markdown links
4. ✅ Make reasonable connections between information in articles
5. ✅ Only say "information not available" when articles truly don't contain the answer
6. ✅ Be helpful and friendly while staying accurate
7. ✅ Suggest alternative searches when articles don't fully answer the question

## Testing

All existing tests pass:
- ✅ 31 tests in `lib/chat/llm.test.ts` pass
- ✅ No TypeScript errors
- ✅ System prompt generation works correctly for all scenarios

## Files Modified

- `lib/chat/llm.ts` - Improved `createSystemPrompt()` function with balanced instructions
- `lib/chat/retrieval.ts` - Added debug logging to track article retrieval

## Verification Steps

To verify the improvements are working:

1. **Test with "campus life" query:**
   - Expected: Bot should find and use the 3 articles (Campus Facilities, Campus Service, Budgeting for Students)
   - Bot should provide helpful information from these articles with citations

2. **Test with specific facility questions:**
   - Example: "Where can I study on campus?"
   - Expected: Bot should use Campus Facilities article to answer

3. **Test with questions not in articles:**
   - Expected: Bot should acknowledge lack of information and suggest alternative searches

4. **Check server logs:**
   - Look for `[Retrieval]` logs showing articles being found
   - Verify relevance scores are being calculated

5. **Test recommendations:**
   - Ask "What articles should I read about campus life?"
   - Expected: Bot should list 2-5 relevant articles with descriptions

## Debugging Tips

If the bot still says "information not available":

1. Check server logs for `[Retrieval]` messages to see if articles are being found
2. Verify the Hygraph search is working (articles should be found)
3. Check if the LLM is receiving the article content in the system prompt
4. Ensure the OpenAI API key is valid and has sufficient quota

## Related Requirements

This improvement addresses:
- Requirement 1.2: Answer questions using retrieved wiki content
- Requirement 1.3: Cite sources in responses
- Requirement 6.4: Handle no results gracefully
- Requirement 8.2: Create effective system prompts

## Key Insights

1. **The retrieval system was working correctly** - Hygraph search was finding relevant articles
2. **The problem was in the prompt** - Being too strict made the bot refuse to use available information
3. **Balance is key** - The bot needs to be accurate but also helpful and confident when using retrieved content
4. **Debug logging is essential** - Added logging helps diagnose future issues quickly

## Notes

The improvements maintain all existing functionality while making the bot more helpful and confident when using wiki content. The bot will now actively use the retrieved articles to answer questions, while still being honest when information is truly not available.
