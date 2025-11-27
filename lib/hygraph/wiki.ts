/**
 * Hygraph wiki data layer
 * Provides functions to fetch and search wiki articles from Hygraph CMS
 */

import { getHygraphClient } from './client';
import { hygraphCache, requestDeduplicator } from './cache';
import { ContentNotFoundError } from './errors';
import type {
  HygraphWikiArticle,
  WikiCategory,
  WikiSearchResult,
} from '@/types/hygraph';

/**
 * GraphQL query to fetch a single article by slug
 */
const GET_ARTICLE_BY_SLUG_QUERY = `
  query GetArticleBySlug($slug: String!) {
    wikiArticle(where: { slug: $slug }, stage: PUBLISHED) {
      id
      title
      slug
      category
      content
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

/**
 * GraphQL query to fetch articles by category
 */
const GET_ARTICLES_BY_CATEGORY_QUERY = `
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
      content
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

/**
 * GraphQL query to fetch all articles (for category aggregation)
 */
const GET_ALL_ARTICLES_QUERY = `
  query GetAllArticles {
    wikiArticles(stage: PUBLISHED) {
      category
    }
  }
`;

/**
 * GraphQL query to search articles
 */
const SEARCH_ARTICLES_QUERY = `
  query SearchArticles($query: String!) {
    wikiArticles(
      where: { _search: $query }
      stage: PUBLISHED
    ) {
      id
      title
      slug
      category
      content
    }
  }
`;

/**
 * Fetch a single wiki article by slug
 * 
 * @param slug - The article slug
 * @returns The article or null if not found
 */
export async function getArticleBySlug(
  slug: string
): Promise<HygraphWikiArticle | null> {
  const cacheKey = `article:${slug}`;
  
  // Check cache first
  const cached = hygraphCache.get<HygraphWikiArticle>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Deduplicate concurrent requests
  return requestDeduplicator.deduplicate(cacheKey, async () => {
    const client = getHygraphClient();
    
    const response = await client.request<{
      wikiArticle: HygraphWikiArticle | null;
    }>(GET_ARTICLE_BY_SLUG_QUERY, { slug });
    
    const article = response.wikiArticle;
    
    // Cache the result (even if null)
    if (article) {
      hygraphCache.set(cacheKey, article);
    }
    
    return article;
  });
}

/**
 * Fetch all articles in a specific category
 * 
 * @param category - The category name
 * @returns Array of articles in the category
 */
export async function getArticlesByCategory(
  category: string
): Promise<HygraphWikiArticle[]> {
  const cacheKey = `category:${category}`;
  
  // Check cache first
  const cached = hygraphCache.get<HygraphWikiArticle[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Deduplicate concurrent requests
  return requestDeduplicator.deduplicate(cacheKey, async () => {
    const client = getHygraphClient();
    
    const response = await client.request<{
      wikiArticles: HygraphWikiArticle[];
    }>(GET_ARTICLES_BY_CATEGORY_QUERY, { category });
    
    const articles = response.wikiArticles || [];
    
    // Cache the result
    hygraphCache.set(cacheKey, articles);
    
    return articles;
  });
}

/**
 * Fetch all categories with article counts
 * 
 * @returns Array of categories with article counts
 */
export async function getAllCategories(): Promise<WikiCategory[]> {
  const cacheKey = 'all-categories';
  
  // Check cache first
  const cached = hygraphCache.get<WikiCategory[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Deduplicate concurrent requests
  return requestDeduplicator.deduplicate(cacheKey, async () => {
    const client = getHygraphClient();
    
    const response = await client.request<{
      wikiArticles: Array<{ category: string }>;
    }>(GET_ALL_ARTICLES_QUERY);
    
    const articles = response.wikiArticles || [];
    
    // Aggregate by category
    const categoryMap = new Map<string, number>();
    
    for (const article of articles) {
      const count = categoryMap.get(article.category) || 0;
      categoryMap.set(article.category, count + 1);
    }
    
    // Convert to array and sort by category name
    const categories: WikiCategory[] = Array.from(categoryMap.entries())
      .map(([category, articleCount]) => ({ category, articleCount }))
      .sort((a, b) => a.category.localeCompare(b.category));
    
    // Cache the result
    hygraphCache.set(cacheKey, categories);
    
    return categories;
  });
}

/**
 * Search for wiki articles
 * 
 * @param query - The search query string
 * @returns Array of search results with excerpts
 */
export async function searchArticles(
  query: string
): Promise<WikiSearchResult[]> {
  // Don't search if query is empty
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const cacheKey = `search:${query}`;
  
  // Check cache first
  const cached = hygraphCache.get<WikiSearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Deduplicate concurrent requests
  return requestDeduplicator.deduplicate(cacheKey, async () => {
    const client = getHygraphClient();
    
    const response = await client.request<{
      wikiArticles: Array<{
        id: string;
        title: string;
        slug: string;
        category: string;
        content: string;
      }>;
    }>(SEARCH_ARTICLES_QUERY, { query });
    
    const articles = response.wikiArticles || [];
    
    // Transform to search results with excerpts
    const results: WikiSearchResult[] = articles.map((article) => {
      // Create excerpt (first 200 characters of content)
      const excerpt = article.content.length > 200
        ? article.content.substring(0, 200) + '...'
        : article.content;
      
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt,
      };
    });
    
    // Cache the result
    hygraphCache.set(cacheKey, results);
    
    return results;
  });
}
