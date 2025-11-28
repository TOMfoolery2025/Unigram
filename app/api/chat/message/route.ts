/**
 * Chat Message API Endpoint
 * Handles sending messages and receiving streaming responses
 * Requirements: 1.1, 1.2, 2.1, 10.2
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retrieveRelevantArticles } from '@/lib/chat/retrieval';
import { generateResponse } from '@/lib/chat/llm';
import { saveMessage, getMessages } from '@/lib/chat/messages';
import { getSession } from '@/lib/chat/sessions';
import { chatRateLimiter } from '@/lib/chat/rate-limit';
import type { ArticleSource } from '@/types/chat';

/**
 * POST /api/chat/message
 * Send a message and receive a streaming response
 */
export async function POST(request: Request) {
  try {
    // 1. Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 1.5. Check rate limit (Requirement 1.1)
    const rateLimitResult = chatRateLimiter.checkLimit(user.id);
    if (!rateLimitResult.allowed) {
      const waitTimeSeconds = Math.ceil((rateLimitResult.waitTimeMs || 0) / 1000);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many requests. Please wait ${waitTimeSeconds} seconds before trying again.`,
          waitTimeMs: rateLimitResult.waitTimeMs,
          retryAfter: waitTimeSeconds,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': waitTimeSeconds.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.waitTimeMs || 0)).toISOString(),
          }
        }
      );
    }
    
    // 2. Validate request payload
    const body = await request.json();
    const { sessionId, message } = body;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    // Verify session ownership
    try {
      await getSession(sessionId, user.id);
    } catch (error: any) {
      if (error.name === 'SessionNotFoundError') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      if (error.name === 'SessionPermissionError') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      throw error;
    }
    
    // 3. Save user message to database
    await saveMessage(sessionId, user.id, 'user', message.trim());
    
    // 4. Retrieve relevant articles using retrieval service
    const retrievedArticles = await retrieveRelevantArticles(message.trim());
    
    // Requirement 6.4: If no articles found, fetch available categories for suggestions
    let availableCategories: string[] = [];
    if (retrievedArticles.length === 0) {
      console.log(`No articles found for query: "${message.trim()}"`);
      
      // Fetch available categories to help with suggestions
      const { getAllCategories } = await import('@/lib/hygraph/wiki');
      try {
        const categories = await getAllCategories();
        availableCategories = categories.map(c => c.category);
      } catch (error) {
        console.error('Failed to fetch categories for no-results handling:', error);
        // Continue with empty array - system will use fallback categories
      }
    }
    
    // 5. Get conversation history for context
    const messages = await getMessages(sessionId);
    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    
    // 6. Detect if this is a recommendation query, ambiguous query, or out-of-scope query
    // Import the detection functions
    const { isRecommendationQuery, isAmbiguousQuery, getAmbiguityOptions, isOutOfScopeQuery } = await import('@/lib/chat/retrieval');
    const isRecommendation = isRecommendationQuery(message.trim());
    
    // Requirement 7.4: Detect ambiguous queries
    const isAmbiguous = isAmbiguousQuery(message.trim(), retrievedArticles);
    if (isAmbiguous) {
      const options = getAmbiguityOptions(retrievedArticles);
      console.log(`Ambiguous query detected: "${message.trim()}" - ${options.length} interpretations`);
    }
    
    // Requirements 7.1, 7.2: Detect out-of-scope queries
    const isOutOfScope = isOutOfScopeQuery(message.trim());
    // Also consider it out-of-scope if no articles found and query doesn't seem TUM-related
    const likelyOutOfScope = isOutOfScope || (retrievedArticles.length === 0 && !message.toLowerCase().includes('tum'));
    if (likelyOutOfScope) {
      console.log(`Out-of-scope query detected: "${message.trim()}"`);
      
      // Fetch available categories for redirection suggestions
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
    
    // 7. Generate streaming response using LLM service
    const responseGenerator = generateResponse(
      message.trim(),
      retrievedArticles,
      conversationHistory.slice(0, -1), // Exclude the message we just added
      isRecommendation,
      isAmbiguous,
      availableCategories,
      likelyOutOfScope
    );
    
    // 8. Create Server-Sent Events stream
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          let sources: ArticleSource[] = [];
          
          // Manually iterate through the generator to capture both yielded values and return value
          let result = await responseGenerator.next();
          
          while (!result.done) {
            const token = result.value;
            fullResponse += token;
            
            // Send content chunk
            const data = JSON.stringify({
              type: 'content',
              data: token,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            
            result = await responseGenerator.next();
          }
          
          // When done is true, result.value contains the return value (sources)
          if (result.value && Array.isArray(result.value)) {
            sources = result.value;
          }
          
          // 9. Save assistant message to database
          await saveMessage(
            sessionId,
            user.id,
            'assistant',
            fullResponse,
            sources.length > 0 ? sources : undefined
          );
          
          // Send sources
          if (sources.length > 0) {
            const sourcesData = JSON.stringify({
              type: 'sources',
              data: sources,
            });
            controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
          }
          
          // Send done signal
          const doneData = JSON.stringify({
            type: 'done',
            data: null,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          
          controller.close();
        } catch (error: any) {
          // Requirement 7.3: Handle LLM service failures with user-friendly messages
          // Log detailed error information for monitoring
          console.error('Error in streaming response:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            sessionId,
            userId: user.id,
            timestamp: new Date().toISOString(),
          });
          
          // Import LLMServiceError to check error type
          const { LLMServiceError } = await import('@/lib/chat/llm');
          
          let errorMessage = 'Failed to generate response. Please try again.';
          let isRetryable = true;
          
          if (error instanceof LLMServiceError) {
            errorMessage = error.message;
            isRetryable = error.isRetryable;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          // Send error to client with retry information
          const errorData = JSON.stringify({
            type: 'error',
            data: errorMessage,
            retryable: isRetryable,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          
          controller.close();
        }
      },
    });
    
    // Return streaming response with rate limit headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Remaining': (rateLimitResult.remaining || 0).toString(),
      },
    });
    
  } catch (error: any) {
    // Requirement 7.3: Log errors for monitoring
    console.error('Error in chat message endpoint:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
