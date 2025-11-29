/**
 * LLM Service for Wiki Chatbot
 * Handles OpenAI API integration and response generation
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 1.2, 1.3, 1.4
 */

import OpenAI from 'openai';
import type { ArticleSource } from '@/types/chat';
import type { RetrievedArticle } from './retrieval';
import { loadChatbotConfig } from './config';
import { llmBackoff } from './rate-limit';

/**
 * LLM message format for conversation history
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Configuration for LLM service
 */
export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
}

/**
 * Load LLM configuration from environment variables
 * Uses safe defaults if configuration is missing or invalid
 * Requirements: 8.1, 8.5
 */
export function loadLLMConfig(): LLMConfig {
  const config = loadChatbotConfig();
  return {
    model: config.openai.model,
    temperature: config.openai.temperature,
    maxTokens: config.openai.maxTokens,
    apiKey: config.openai.apiKey,
  };
}

/**
 * Create OpenAI client instance
 * Requirements: 8.1
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const config = loadLLMConfig();
    openaiClient = new OpenAI({
      apiKey: config.apiKey,
    });
  }
  return openaiClient;
}

/**
 * Get suggested categories for no-results scenarios
 * Requirement 6.4: Suggest browsing categories when no results found
 * 
 * @param availableCategories - List of all available wiki categories
 * @returns Formatted string of category suggestions
 */
function getCategorySuggestions(availableCategories: string[]): string {
  if (availableCategories.length === 0) {
    // Fallback to common categories if none provided
    return 'Academics, Campus Life, Student Services, Events, Resources';
  }
  
  // Return up to 5 categories for suggestions
  return availableCategories.slice(0, 5).join(', ');
}

/**
 * Create system prompt for wiki chatbot
 * Requirements: 8.2, 3.2, 1.5, 6.4, 7.4, 7.1, 7.2
 */
export function createSystemPrompt(
  retrievedArticles: RetrievedArticle[],
  isRecommendationQuery: boolean = false,
  isAmbiguous: boolean = false,
  availableCategories: string[] = [],
  isOutOfScope: boolean = false
): string {
  // Requirement 1.5: Identify unique categories in retrieved articles
  const categories = new Set<string>();
  retrievedArticles.forEach(r => categories.add(r.article.category));
  const categoryList = Array.from(categories);
  
  // Requirement 6.4: Handle no results gracefully
  const hasResults = retrievedArticles.length > 0;
  const articlesContext = hasResults
    ? retrievedArticles.map((retrieved, index) => {
        const { article, relevantContent } = retrieved;
        return `
========================================
ARTICLE ${index + 1}: ${article.title}
========================================
Category: ${article.category}
Slug: ${article.slug}
Link: /wiki/articles/${article.slug}

ARTICLE CONTENT (Use this to answer questions):
${relevantContent}
========================================`;
      }).join('\n\n')
    : 'No relevant articles found in the wiki.';
  
  // Requirement 1.5: Add explicit multi-category context when applicable
  const multiCategoryContext = categoryList.length > 1
    ? `\n\nNOTE: The articles provided span ${categoryList.length} different categories: ${categoryList.join(', ')}. 
Make sure to synthesize information from all relevant categories to provide a comprehensive answer. 
Cite sources from different categories when they contribute to the answer.`
    : '';
  
  // Add specific instructions for recommendation queries
  const recommendationInstructions = isRecommendationQuery
    ? `\n\nIMPORTANT: The user is asking for article recommendations. Please:
1. List 2-5 relevant articles from the provided wiki articles
2. Format each as: **[Article Title](/wiki/articles/slug)** - Brief description (1-2 sentences) [Category: category-name]
3. Make descriptions informative and help users understand what each article covers
4. Order recommendations by relevance to the user's query
5. If articles span multiple categories, highlight this diversity in your recommendations`
    : '';
  
  // Add specific instructions for ambiguous queries (Requirement 7.4)
  const ambiguityInstructions = isAmbiguous
    ? `\n\nIMPORTANT: This query appears ambiguous - it could refer to multiple distinct topics. Before providing a detailed answer:
1. Acknowledge that the query could have multiple interpretations
2. List the different categories/topics where relevant information was found
3. Ask the user which specific topic they're interested in
4. Provide a brief preview of what information is available in each category
5. Example: "I found information about '${retrievedArticles[0]?.article.title.split(' ')[0] || 'your query'}' in multiple areas. Are you asking about: 1) [Category 1 topic], 2) [Category 2 topic], or 3) [Category 3 topic]?"
6. Keep the clarification friendly and concise`
    : '';
  
  // Add specific instructions for out-of-scope queries (Requirements 7.1, 7.2)
  const outOfScopeInstructions = isOutOfScope
    ? `\n\nIMPORTANT: This query appears to be about non-TUM topics or outside the scope of this wiki. Please:
1. Politely acknowledge that the question is outside the scope of the TUM wiki
2. Explain that you're specifically designed to help with TUM-related questions
3. Suggest relevant TUM-related topics or categories the user might be interested in instead
4. Provide 2-3 specific examples of TUM topics you can help with
5. Available categories to suggest: ${getCategorySuggestions(availableCategories)}
6. Example responses:
   * "I'm specifically designed to help with TUM-related questions, so I can't answer questions about [other university/topic]. However, I'd be happy to help you with TUM topics like course registration, campus facilities, or student services. Would you like to explore any of these areas?"
   * "That's outside my area of expertise - I focus on TUM (Technical University of Munich) information. I can help you with topics like academics, campus life, events, and student resources at TUM. What would you like to know about TUM?"
7. Keep the tone friendly and helpful, not dismissive
8. Always offer to help with TUM-related alternatives`
    : '';
  
  const noResultsInstructions = !hasResults 
    ? `\n\nNo articles found. Suggest 2-3 alternative search terms or browse categories: ${getCategorySuggestions(availableCategories)}`
    : '';

  const baseInstructions = hasResults 
    ? 'Use the wiki articles below to answer. Always cite sources using: [Article Title](/wiki/articles/slug)'
    : 'No relevant articles found.';

  return `You are a helpful assistant for the TUM Community Platform wiki.

${baseInstructions}

${hasResults ? `WIKI ARTICLES:
${articlesContext}` : ''}${noResultsInstructions}${recommendationInstructions}${ambiguityInstructions}${outOfScopeInstructions}${multiCategoryContext}`;
}

/**
 * Format conversation history for LLM context
 * Requirements: 1.4
 */
export function formatConversationHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): LLMMessage[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Custom error class for LLM service errors
 * Requirement 7.3
 */
export class LLMServiceError extends Error {
  constructor(
    message: string,
    public readonly originalError?: any,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'LLMServiceError';
  }
}

/**
 * Generate streaming response using OpenAI API with RAG (Retrieval-Augmented Generation)
 * 
 * This function implements the complete RAG pipeline:
 * 1. Combines retrieved article content with user query via system prompt
 * 2. Formats conversation history to maintain context across messages
 * 3. Generates streaming responses with source citations
 * 
 * The function yields response tokens as they arrive (streaming) and returns
 * article sources after the stream completes for citation purposes.
 * 
 * @param userMessage - The user's current question or message
 * @param retrievedArticles - Relevant wiki articles retrieved for this query
 * @param conversationHistory - Previous messages in the conversation for context
 * @param isRecommendationQuery - Whether this is a recommendation request
 * @returns AsyncGenerator that yields response tokens and returns article sources
 * @throws {LLMServiceError} When the LLM service fails
 * 
 * @example
 * ```typescript
 * const articles = await retrieveRelevantArticles(query);
 * const generator = generateResponse(query, articles, history);
 * 
 * // Stream response tokens
 * let fullResponse = '';
 * for await (const token of generator) {
 *   fullResponse += token;
 *   // Send token to client
 * }
 * 
 * // Get sources after streaming completes
 * const result = await generator.return(undefined);
 * const sources = result.value;
 * ```
 * 
 * Requirements: 1.2, 1.3, 1.4, 8.2, 8.3, 8.4, 3.2, 7.3
 */
export async function* generateResponse(
  userMessage: string,
  retrievedArticles: RetrievedArticle[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  isRecommendationQuery: boolean = false,
  isAmbiguous: boolean = false,
  availableCategories: string[] = [],
  isOutOfScope: boolean = false
): AsyncGenerator<string, ArticleSource[], void> {
  try {
    const client = getOpenAIClient();
    const config = loadLLMConfig();
    
    // Create system prompt with retrieved articles
    const systemPrompt = createSystemPrompt(retrievedArticles, isRecommendationQuery, isAmbiguous, availableCategories, isOutOfScope);
    
    console.log(`[LLM] Generating response with ${retrievedArticles.length} articles`);
    console.log(`[LLM] System prompt length: ${systemPrompt.length} characters`);
    if (retrievedArticles.length > 0) {
      console.log(`[LLM] First article content preview:`, retrievedArticles[0].relevantContent.substring(0, 200));
    }
    
    // Format conversation history
    const historyMessages = formatConversationHistory(conversationHistory);
    
    // Build messages array
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userMessage },
    ];
    
    // Create streaming completion with error handling and exponential backoff
    // Requirement 1.1: Add exponential backoff for LLM retries
    let stream;
    try {
      stream = await llmBackoff.executeWithRetry(
        async () => {
          return await client.chat.completions.create({
            model: config.model,
            messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            stream: true,
          });
        },
        (error: any) => {
          // Only retry on specific retryable errors
          return (
            error.status === 429 || // Rate limit
            error.status === 503 || // Service unavailable
            error.status === 500 || // Internal server error
            error.code === 'ECONNRESET' || // Connection reset
            error.code === 'ETIMEDOUT' // Timeout
          );
        }
      );
    } catch (error: any) {
      // Requirement 7.3: Catch API errors and provide user-friendly messages
      // Log detailed error information for monitoring
      console.error('LLM API error:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        timestamp: new Date().toISOString(),
      });
      
      // Determine if error is retryable
      const isRetryable = 
        error.status === 429 || // Rate limit
        error.status === 503 || // Service unavailable
        error.status === 500 || // Internal server error
        error.code === 'ECONNRESET' || // Connection reset
        error.code === 'ETIMEDOUT'; // Timeout
      
      if (error.status === 401) {
        throw new LLMServiceError(
          'Authentication failed. Please check your API key configuration.',
          error,
          false
        );
      } else if (error.status === 429) {
        throw new LLMServiceError(
          'Rate limit exceeded. Please try again in a moment.',
          error,
          true
        );
      } else if (error.status === 503 || error.status === 500) {
        throw new LLMServiceError(
          'The AI service is temporarily unavailable. Please try again later.',
          error,
          true
        );
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        throw new LLMServiceError(
          'Request timed out. Please try again.',
          error,
          true
        );
      } else {
        throw new LLMServiceError(
          'Failed to generate response. Please try again.',
          error,
          isRetryable
        );
      }
    }
    
    // Stream response tokens
    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      // Requirement 7.3: Handle streaming errors with detailed logging
      console.error('LLM streaming error:', {
        message: error.message,
        name: error.name,
        timestamp: new Date().toISOString(),
      });
      throw new LLMServiceError(
        'Connection interrupted while receiving response. Please try again.',
        error,
        true
      );
    }
    
    // Return sources after streaming completes
    const sources: ArticleSource[] = retrievedArticles.map(r => r.source);
    return sources;
  } catch (error: any) {
    // Re-throw LLMServiceError as-is
    if (error instanceof LLMServiceError) {
      throw error;
    }
    
    // Wrap unexpected errors with detailed logging for monitoring
    console.error('Unexpected error in generateResponse:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw new LLMServiceError(
      'An unexpected error occurred. Please try again.',
      error,
      true
    );
  }
}

/**
 * Generate a title for a chat session based on the first user message
 * Uses a simpler, non-streaming call
 * Requirements: 5.1
 */
export async function generateTitle(firstMessage: string): Promise<string> {
  const client = getOpenAIClient();
  const config = loadLLMConfig();
  
  const prompt = `Generate a short, concise title (max 6 words) for a chat conversation that starts with this message: "${firstMessage}"
  
Only return the title, nothing else.`;
  
  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 20,
    });
    
    const title = completion.choices[0]?.message?.content?.trim();
    
    // Fallback to truncated first message if generation fails
    if (!title) {
      return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
    }
    
    return title;
  } catch (error) {
    console.error('Failed to generate title:', error);
    // Fallback to truncated first message
    return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
  }
}
