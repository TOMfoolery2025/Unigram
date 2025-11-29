/**
 * Retrieval service for wiki chatbot
 * Handles article search, relevance ranking, and content extraction
 */

import { searchArticles, getArticleBySlug } from '@/lib/hygraph/wiki';
import type { HygraphWikiArticle } from '@/types/hygraph';
import type { ArticleSource } from '@/types/chat';

/**
 * Represents a retrieved article with relevance information
 */
export interface RetrievedArticle {
  article: HygraphWikiArticle;
  relevantContent: string;
  relevanceScore: number;
  source: ArticleSource;
}

/**
 * Calculate relevance score for an article based on query
 * Higher score means more relevant
 * 
 * @param article - The article to score
 * @param query - The search query
 * @returns Relevance score (0-100)
 */
function calculateRelevanceScore(
  article: HygraphWikiArticle,
  query: string
): number {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2);
  
  let score = 0;
  
  // Title matches are highly relevant (40 points max)
  const titleLower = article.title.toLowerCase();
  for (const term of queryTerms) {
    if (titleLower.includes(term)) {
      score += 10;
    }
  }
  
  // Exact title match bonus
  if (titleLower === queryLower) {
    score += 20;
  }
  
  // Content matches (30 points max)
  const contentLower = article.content.toLowerCase();
  for (const term of queryTerms) {
    const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
    score += Math.min(matches * 2, 10);
  }
  
  // Category relevance (10 points max)
  const categoryLower = article.category.toLowerCase();
  for (const term of queryTerms) {
    if (categoryLower.includes(term)) {
      score += 5;
    }
  }
  
  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Extract relevant sections from markdown content based on query keywords
 * 
 * @param content - The markdown content to extract from
 * @param query - The search query
 * @param isRecommendation - Whether this is for a recommendation query
 * @returns Extracted relevant content
 */
export function extractRelevantContent(
  content: string,
  query: string,
  isRecommendation: boolean = false
): string {
  // For recommendation queries, provide more complete content for better descriptions
  // Requirement 3.2: Return articles with brief descriptions
  if (isRecommendation) {
    // Extract first few paragraphs or up to 1500 characters for overview
    const firstParagraphs = content.split('\n\n').slice(0, 3).join('\n\n');
    const overview = firstParagraphs.length > 1500 
      ? firstParagraphs.substring(0, 1500) + '...'
      : firstParagraphs;
    return overview;
  }
  
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2);
  
  // Split content into sections (by headers)
  const sections = content.split(/(?=^#{1,6}\s)/m);
  
  // Score each section based on query term matches
  const scoredSections = sections.map(section => {
    const sectionLower = section.toLowerCase();
    let score = 0;
    
    for (const term of queryTerms) {
      const matches = (sectionLower.match(new RegExp(term, 'g')) || []).length;
      score += matches;
    }
    
    return { section, score };
  });
  
  // Sort by score and take top sections
  scoredSections.sort((a, b) => b.score - a.score);
  
  // Take top 3 most relevant sections or all if less than 3
  const relevantSections = scoredSections
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => s.section);
  
  // If no relevant sections found, return first 1000 characters
  if (relevantSections.length === 0) {
    return content.substring(0, 1000);
  }
  
  // Join relevant sections
  let extractedContent = relevantSections.join('\n\n');
  
  // Limit total length to avoid token limits (max 2000 characters per article)
  if (extractedContent.length > 2000) {
    extractedContent = extractedContent.substring(0, 2000) + '...';
  }
  
  return extractedContent;
}

/**
 * Get unique categories from retrieved articles
 * Requirement 1.5: Multi-category information
 * 
 * @param retrievedArticles - Array of retrieved articles
 * @returns Array of unique category names
 */
export function getUniqueCategories(
  retrievedArticles: RetrievedArticle[]
): string[] {
  const categories = new Set<string>();
  
  for (const retrieved of retrievedArticles) {
    categories.add(retrieved.article.category);
  }
  
  return Array.from(categories);
}

/**
 * Create a context string for LLM consumption from retrieved articles
 * Requirement 1.5: Include information from multiple categories when relevant
 * 
 * @param retrievedArticles - Array of retrieved articles
 * @returns Formatted context string
 */
export function createContextString(
  retrievedArticles: RetrievedArticle[]
): string {
  if (retrievedArticles.length === 0) {
    return 'No relevant articles found.';
  }
  
  // Get unique categories for logging
  const categories = getUniqueCategories(retrievedArticles);
  
  const contextParts = retrievedArticles.map((retrieved, index) => {
    const { article, relevantContent } = retrieved;
    
    return `
Article ${index + 1}: ${article.title}
Category: ${article.category}
Slug: ${article.slug}

Content:
${relevantContent}
---
`;
  });
  
  // Log multi-category retrieval for debugging
  if (categories.length > 1) {
    console.log(`Multi-category retrieval: ${categories.length} categories (${categories.join(', ')})`);
  }
  
  return contextParts.join('\n');
}

/**
 * Detect if a query is asking for article recommendations
 * Requirement 3.2: Detect recommendation requests in queries
 * 
 * @param query - The user's search query
 * @returns True if the query is asking for recommendations
 */
export function isRecommendationQuery(query: string): boolean {
  const queryLower = query.toLowerCase();
  
  const recommendationKeywords = [
    'recommend',
    'suggestion',
    'suggest',
    'what should i read',
    'what can i read',
    'articles about',
    'show me articles',
    'list articles',
    'what articles',
    'find articles',
  ];
  
  return recommendationKeywords.some(keyword => queryLower.includes(keyword));
}

/**
 * Detect if a query is about non-TUM topics (out-of-scope)
 * Requirements 7.1, 7.2: Detect non-TUM topics and redirect to TUM-related content
 * 
 * This function uses heuristics to identify queries that are clearly not about TUM:
 * - Mentions of other universities
 * - General knowledge questions unrelated to university life
 * - Topics that are clearly outside the scope of a university wiki
 * 
 * Note: This is a heuristic approach. The LLM will also help with final determination
 * based on whether relevant articles are found.
 * 
 * @param query - The user's search query
 * @returns True if the query appears to be out-of-scope
 */
export function isOutOfScopeQuery(query: string): boolean {
  const queryLower = query.toLowerCase();
  
  // Other universities (common ones that students might confuse)
  const otherUniversities = [
    'harvard',
    'stanford',
    'mit',
    'oxford',
    'cambridge',
    'yale',
    'princeton',
    'berkeley',
    'caltech',
    'eth zurich',
    'eth zürich',
    'lmu',
    'ludwig maximilian',
    'rwth aachen',
    'kit karlsruhe',
    'heidelberg university',
    'humboldt',
    'free university berlin',
    'university of',
  ];
  
  // Check for other universities
  for (const uni of otherUniversities) {
    if (queryLower.includes(uni)) {
      // But allow if TUM is also mentioned (comparison queries)
      if (!queryLower.includes('tum') && !queryLower.includes('technical university of munich')) {
        return true;
      }
    }
  }
  
  // General knowledge topics clearly unrelated to university
  const outOfScopeTopics = [
    'recipe',
    'cooking',
    'weather',
    'stock market',
    'cryptocurrency',
    'bitcoin',
    'movie',
    'tv show',
    'celebrity',
    'sports score',
    'football match',
    'game result',
    'how to fix',
    'repair',
    'medical advice',
    'legal advice',
    'tax',
    'investment',
  ];
  
  // Check for clearly out-of-scope topics
  for (const topic of outOfScopeTopics) {
    if (queryLower.includes(topic)) {
      // Allow if it's clearly in a TUM context
      if (!queryLower.includes('tum') && 
          !queryLower.includes('campus') && 
          !queryLower.includes('student') &&
          !queryLower.includes('university')) {
        return true;
      }
    }
  }
  
  // Questions that are clearly general knowledge
  const generalKnowledgePatterns = [
    /^what is the capital of/,
    /^who is the president of/,
    /^when did .* happen/,
    /^how do i (cook|make|build|fix)/,
    /^what's the weather/,
    /^tell me a joke/,
    /^write me a (story|poem|song)/,
  ];
  
  for (const pattern of generalKnowledgePatterns) {
    if (pattern.test(queryLower)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect if retrieved articles suggest an ambiguous query
 * Requirement 7.4: Detect ambiguous queries
 * 
 * A query is considered ambiguous if:
 * - Articles from 3+ different categories are retrieved with similar relevance scores
 * - The query is short (1-2 words) and matches multiple distinct topics
 * 
 * @param query - The user's search query
 * @param retrievedArticles - Articles retrieved for the query
 * @returns True if the query appears ambiguous
 */
export function isAmbiguousQuery(
  query: string,
  retrievedArticles: RetrievedArticle[]
): boolean {
  // Not ambiguous if no results or very few results
  if (retrievedArticles.length < 3) {
    return false;
  }
  
  // Check if query is short (1-2 words) - these are more likely to be ambiguous
  const queryWords = query.trim().split(/\s+/);
  const isShortQuery = queryWords.length <= 2;
  
  // Get unique categories
  const categories = getUniqueCategories(retrievedArticles);
  
  // If we have 3+ categories with similar relevance scores, it's likely ambiguous
  if (categories.length >= 3) {
    // Check if top articles have similar scores (within 20 points)
    const topScores = retrievedArticles.slice(0, 3).map(r => r.relevanceScore);
    const maxScore = Math.max(...topScores);
    const minScore = Math.min(...topScores);
    const scoreDifference = maxScore - minScore;
    
    // If scores are similar and query is short, it's ambiguous
    if (scoreDifference <= 20 && isShortQuery) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get category options for ambiguous queries
 * Requirement 7.4: Provide multiple interpretation options
 * 
 * @param retrievedArticles - Articles retrieved for the query
 * @returns Array of category names with example article titles
 */
export function getAmbiguityOptions(
  retrievedArticles: RetrievedArticle[]
): Array<{ category: string; exampleTitle: string }> {
  const categoryMap = new Map<string, string>();
  
  // Get one example article per category
  for (const retrieved of retrievedArticles) {
    if (!categoryMap.has(retrieved.article.category)) {
      categoryMap.set(retrieved.article.category, retrieved.article.title);
    }
  }
  
  return Array.from(categoryMap.entries()).map(([category, exampleTitle]) => ({
    category,
    exampleTitle,
  }));
}

/**
 * Retrieve and rank relevant articles for a query
 * Limits results to top 5 articles (or 2-5 for recommendation queries)
 * 
 * Requirement 1.5: Ensures retrieval searches across all categories and includes
 * information from multiple categories when relevant
 * 
 * @param query - The user's search query
 * @returns Array of retrieved articles with relevance scores (max 5)
 * 
 * Requirements: 6.3, 3.2, 1.5
 */
export async function retrieveRelevantArticles(
  query: string
): Promise<RetrievedArticle[]> {
  // Search for articles using Hygraph - searches across ALL categories
  // Requirement 1.5: Ensure retrieval searches across all categories
  const searchResults = await searchArticles(query);
  
  // If no results, return empty array
  if (searchResults.length === 0) {
    return [];
  }
  
  // Fetch full article content for each result
  const articlesWithScores: Array<{
    article: HygraphWikiArticle;
    score: number;
  }> = [];
  
  for (const result of searchResults) {
    const article = await getArticleBySlug(result.slug);
    
    if (article) {
      const score = calculateRelevanceScore(article, query);
      articlesWithScores.push({ article, score });
    }
  }
  
  // Sort by relevance score (highest first)
  articlesWithScores.sort((a, b) => b.score - a.score);
  
  // Requirement 1.5: When selecting top articles, ensure diversity across categories
  // This helps include information from multiple categories when relevant
  const topArticles = selectDiverseArticles(
    articlesWithScores,
    query
  );
  
  // Transform to RetrievedArticle format with extracted content
  const retrievedArticles: RetrievedArticle[] = topArticles.map(({ article, score }) => ({
    article,
    relevantContent: extractRelevantContent(article.content, query, isRecommendationQuery(query)),
    relevanceScore: score,
    source: {
      title: article.title,
      slug: article.slug,
      category: article.category,
    },
  }));
  
  // Log multi-category retrieval for monitoring
  const categories = getUniqueCategories(retrievedArticles);
  if (categories.length > 1) {
    console.log(`Multi-category retrieval for query "${query}": ${categories.length} categories (${categories.join(', ')})`);
  }
  
  // Log recommendation queries for monitoring
  if (isRecommendationQuery(query)) {
    console.log(`Recommendation query detected: "${query}" - Returning ${retrievedArticles.length} articles`);
  }
  
  return retrievedArticles;
}

/**
 * Select diverse articles from scored results, balancing relevance with category diversity
 * Requirement 1.5: Include information from multiple categories when relevant
 * 
 * Strategy:
 * - Always include the top 2 most relevant articles regardless of category
 * - For remaining slots, prefer articles from different categories if they have reasonable relevance
 * - This ensures multi-category coverage while maintaining quality
 * 
 * @param articlesWithScores - Articles sorted by relevance score
 * @param query - The search query
 * @returns Selected articles (max 5, or 2-5 for recommendations)
 */
function selectDiverseArticles(
  articlesWithScores: Array<{ article: HygraphWikiArticle; score: number }>,
  query: string
): Array<{ article: HygraphWikiArticle; score: number }> {
  const isRecommendation = isRecommendationQuery(query);
  const maxResults = 5;
  const minResults = isRecommendation ? 2 : 1;
  
  if (articlesWithScores.length === 0) {
    return [];
  }
  
  // If we have fewer articles than max, return all
  if (articlesWithScores.length <= maxResults) {
    return articlesWithScores;
  }
  
  const selected: Array<{ article: HygraphWikiArticle; score: number }> = [];
  const seenCategories = new Set<string>();
  
  // Phase 1: Always take top 2 most relevant articles
  const topTwo = articlesWithScores.slice(0, Math.min(2, articlesWithScores.length));
  selected.push(...topTwo);
  topTwo.forEach(item => seenCategories.add(item.article.category));
  
  // Phase 2: Fill remaining slots, preferring diverse categories
  // Only consider articles with reasonable relevance (score > 20)
  const remainingArticles = articlesWithScores.slice(2);
  const reasonableThreshold = 20;
  
  for (const item of remainingArticles) {
    if (selected.length >= maxResults) {
      break;
    }
    
    // Prefer articles from new categories if they meet the threshold
    if (!seenCategories.has(item.article.category) && item.score >= reasonableThreshold) {
      selected.push(item);
      seenCategories.add(item.article.category);
    }
  }
  
  // Phase 3: If we still have slots and haven't reached max, fill with highest scoring remaining
  if (selected.length < maxResults) {
    for (const item of remainingArticles) {
      if (selected.length >= maxResults) {
        break;
      }
      
      // Add if not already selected
      if (!selected.includes(item)) {
        selected.push(item);
      }
    }
  }
  
  // Ensure minimum results for recommendation queries
  if (isRecommendation && selected.length < minResults && articlesWithScores.length >= minResults) {
    const needed = minResults - selected.length;
    const additional = articlesWithScores
      .filter(item => !selected.includes(item))
      .slice(0, needed);
    selected.push(...additional);
  }
  
  return selected;
}
