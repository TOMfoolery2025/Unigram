/**
 * Tests for retrieval service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  retrieveRelevantArticles,
  extractRelevantContent,
  createContextString,
  isRecommendationQuery,
  isOutOfScopeQuery,
  isAmbiguousQuery,
  getAmbiguityOptions,
  getUniqueCategories,
  type RetrievedArticle,
} from './retrieval';
import * as wikiModule from '@/lib/hygraph/wiki';
import type { HygraphWikiArticle } from '@/types/hygraph';
import type { WikiSearchResult } from '@/types/hygraph';

// Mock the hygraph wiki module
vi.mock('@/lib/hygraph/wiki', () => ({
  searchArticles: vi.fn(),
  getArticleBySlug: vi.fn(),
}));

describe('Retrieval Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isRecommendationQuery', () => {
    it('should detect recommendation keywords', () => {
      expect(isRecommendationQuery('Can you recommend some articles?')).toBe(true);
      expect(isRecommendationQuery('What should I read about TUM?')).toBe(true);
      expect(isRecommendationQuery('Suggest articles about campus life')).toBe(true);
      expect(isRecommendationQuery('Show me articles on academics')).toBe(true);
      expect(isRecommendationQuery('List articles about events')).toBe(true);
    });

    it('should not detect non-recommendation queries', () => {
      expect(isRecommendationQuery('What is TUM?')).toBe(false);
      expect(isRecommendationQuery('Tell me about the campus')).toBe(false);
      expect(isRecommendationQuery('How do I register for courses?')).toBe(false);
    });
  });

  // Requirements 7.1, 7.2: Out-of-scope query detection
  describe('isOutOfScopeQuery', () => {
    it('should detect queries about other universities', () => {
      expect(isOutOfScopeQuery('What are the admission requirements for Harvard?')).toBe(true);
      expect(isOutOfScopeQuery('Tell me about Stanford University')).toBe(true);
      expect(isOutOfScopeQuery('How do I apply to MIT?')).toBe(true);
      expect(isOutOfScopeQuery('What is the ranking of Oxford?')).toBe(true);
      expect(isOutOfScopeQuery('LMU Munich campus')).toBe(true);
    });

    it('should allow comparison queries that mention TUM', () => {
      expect(isOutOfScopeQuery('Compare TUM with Harvard')).toBe(false);
      expect(isOutOfScopeQuery('TUM vs MIT rankings')).toBe(false);
      expect(isOutOfScopeQuery('How does TUM compare to Stanford?')).toBe(false);
    });

    it('should detect general knowledge topics unrelated to university', () => {
      expect(isOutOfScopeQuery('What is the weather today?')).toBe(true);
      expect(isOutOfScopeQuery('Tell me a recipe for pasta')).toBe(true);
      expect(isOutOfScopeQuery('What is the stock market doing?')).toBe(true);
      expect(isOutOfScopeQuery('How to fix my car')).toBe(true);
      expect(isOutOfScopeQuery('Medical advice for headache')).toBe(true);
    });

    it('should allow general topics in university context', () => {
      expect(isOutOfScopeQuery('TUM campus weather')).toBe(false);
      expect(isOutOfScopeQuery('Student cooking recipes')).toBe(false);
      expect(isOutOfScopeQuery('University investment opportunities')).toBe(false);
    });

    it('should detect clearly general knowledge questions', () => {
      expect(isOutOfScopeQuery('What is the capital of France?')).toBe(true);
      expect(isOutOfScopeQuery('Who is the president of USA?')).toBe(true);
      expect(isOutOfScopeQuery('Tell me a joke')).toBe(true);
      expect(isOutOfScopeQuery('Write me a story')).toBe(true);
    });

    it('should not flag TUM-related queries as out-of-scope', () => {
      expect(isOutOfScopeQuery('What is TUM?')).toBe(false);
      expect(isOutOfScopeQuery('How do I register for courses at TUM?')).toBe(false);
      expect(isOutOfScopeQuery('Tell me about TUM campus life')).toBe(false);
      expect(isOutOfScopeQuery('TUM admission requirements')).toBe(false);
      expect(isOutOfScopeQuery('Where is the TUM library?')).toBe(false);
    });

    it('should not flag university-related queries as out-of-scope', () => {
      expect(isOutOfScopeQuery('How do I register for courses?')).toBe(false);
      expect(isOutOfScopeQuery('Where is the student cafeteria?')).toBe(false);
      expect(isOutOfScopeQuery('What events are happening on campus?')).toBe(false);
    });
  });

  describe('extractRelevantContent', () => {
    it('should extract sections containing query terms', () => {
      const content = `# Introduction
This is about TUM campus.

# Location
The TUM campus is in Munich.

# History
Founded many years ago.`;

      const result = extractRelevantContent(content, 'TUM campus', false);
      
      expect(result).toContain('TUM campus');
      expect(result.length).toBeLessThanOrEqual(2000);
    });

    it('should provide fuller content for recommendation queries', () => {
      const content = `# Introduction
This is the first paragraph about TUM.

This is the second paragraph with more details.

This is the third paragraph with even more information.

# Section 2
More content here.`;

      const result = extractRelevantContent(content, 'TUM', true);
      
      // Should include first few paragraphs for overview
      expect(result).toContain('first paragraph');
      expect(result).toContain('second paragraph');
      expect(result.length).toBeLessThanOrEqual(1503); // 1500 + '...'
    });

    it('should limit content to 2000 characters', () => {
      const longContent = 'a'.repeat(5000);
      const result = extractRelevantContent(longContent, 'test', false);
      
      expect(result.length).toBeLessThanOrEqual(2003); // 2000 + '...'
    });

    it('should return first 1000 chars if no relevant sections found', () => {
      const content = 'x'.repeat(2000);
      const result = extractRelevantContent(content, 'nonexistent', false);
      
      expect(result.length).toBe(1000);
    });
  });

  describe('getUniqueCategories', () => {
    it('should return unique categories from retrieved articles', () => {
      const articles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Article 1',
            slug: 'article-1',
            category: 'Academics',
            content: 'Content',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            publishedAt: '2024-01-01',
          },
          relevantContent: 'Content',
          relevanceScore: 50,
          source: { title: 'Article 1', slug: 'article-1', category: 'Academics' },
        },
        {
          article: {
            id: '2',
            title: 'Article 2',
            slug: 'article-2',
            category: 'Campus Life',
            content: 'Content',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            publishedAt: '2024-01-01',
          },
          relevantContent: 'Content',
          relevanceScore: 45,
          source: { title: 'Article 2', slug: 'article-2', category: 'Campus Life' },
        },
        {
          article: {
            id: '3',
            title: 'Article 3',
            slug: 'article-3',
            category: 'Academics',
            content: 'Content',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            publishedAt: '2024-01-01',
          },
          relevantContent: 'Content',
          relevanceScore: 40,
          source: { title: 'Article 3', slug: 'article-3', category: 'Academics' },
        },
      ];

      const result = getUniqueCategories(articles);
      
      expect(result).toHaveLength(2);
      expect(result).toContain('Academics');
      expect(result).toContain('Campus Life');
    });

    it('should return empty array for no articles', () => {
      const result = getUniqueCategories([]);
      expect(result).toEqual([]);
    });
  });

  describe('createContextString', () => {
    it('should format articles into context string', () => {
      const articles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Test Article',
            slug: 'test-article',
            category: 'General',
            content: 'Full content',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            publishedAt: '2024-01-01',
          },
          relevantContent: 'Relevant content here',
          relevanceScore: 50,
          source: {
            title: 'Test Article',
            slug: 'test-article',
            category: 'General',
          },
        },
      ];

      const result = createContextString(articles);
      
      expect(result).toContain('Test Article');
      expect(result).toContain('General');
      expect(result).toContain('test-article');
      expect(result).toContain('Relevant content here');
    });

    it('should return message when no articles provided', () => {
      const result = createContextString([]);
      expect(result).toBe('No relevant articles found.');
    });

    it('should log multi-category retrieval', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const articles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Article 1',
            slug: 'article-1',
            category: 'Academics',
            content: 'Content',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            publishedAt: '2024-01-01',
          },
          relevantContent: 'Content',
          relevanceScore: 50,
          source: { title: 'Article 1', slug: 'article-1', category: 'Academics' },
        },
        {
          article: {
            id: '2',
            title: 'Article 2',
            slug: 'article-2',
            category: 'Campus Life',
            content: 'Content',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            publishedAt: '2024-01-01',
          },
          relevantContent: 'Content',
          relevanceScore: 45,
          source: { title: 'Article 2', slug: 'article-2', category: 'Campus Life' },
        },
      ];

      createContextString(articles);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Multi-category retrieval: 2 categories')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('retrieveRelevantArticles', () => {
    it('should return empty array when no search results', async () => {
      vi.mocked(wikiModule.searchArticles).mockResolvedValue([]);

      const result = await retrieveRelevantArticles('test query');
      
      expect(result).toEqual([]);
    });

    it('should limit results to 5 articles', async () => {
      const searchResults: WikiSearchResult[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `Article ${i}`,
        slug: `article-${i}`,
        category: 'Test',
        excerpt: 'Excerpt',
      }));

      const mockArticle = (i: number): HygraphWikiArticle => ({
        id: `${i}`,
        title: `Article ${i}`,
        slug: `article-${i}`,
        category: 'Test',
        content: `Content for article ${i}`,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        publishedAt: '2024-01-01',
      });

      vi.mocked(wikiModule.searchArticles).mockResolvedValue(searchResults);
      vi.mocked(wikiModule.getArticleBySlug).mockImplementation(async (slug) => {
        const index = parseInt(slug.split('-')[1]);
        return mockArticle(index);
      });

      const result = await retrieveRelevantArticles('test');
      
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should return 2-5 articles for recommendation queries', async () => {
      const searchResults: WikiSearchResult[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `Article ${i}`,
        slug: `article-${i}`,
        category: 'Test',
        excerpt: 'Excerpt',
      }));

      const mockArticle = (i: number): HygraphWikiArticle => ({
        id: `${i}`,
        title: `Article ${i}`,
        slug: `article-${i}`,
        category: 'Test',
        content: `Content for article ${i}`,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        publishedAt: '2024-01-01',
      });

      vi.mocked(wikiModule.searchArticles).mockResolvedValue(searchResults);
      vi.mocked(wikiModule.getArticleBySlug).mockImplementation(async (slug) => {
        const index = parseInt(slug.split('-')[1]);
        return mockArticle(index);
      });

      const result = await retrieveRelevantArticles('recommend articles about test');
      
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should include extracted content for each article', async () => {
      const searchResults: WikiSearchResult[] = [
        {
          id: '1',
          title: 'Test Article',
          slug: 'test-article',
          category: 'General',
          excerpt: 'Excerpt',
        },
      ];

      const mockArticle: HygraphWikiArticle = {
        id: '1',
        title: 'Test Article',
        slug: 'test-article',
        category: 'General',
        content: '# Test\nThis is test content about testing.',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        publishedAt: '2024-01-01',
      };

      vi.mocked(wikiModule.searchArticles).mockResolvedValue(searchResults);
      vi.mocked(wikiModule.getArticleBySlug).mockResolvedValue(mockArticle);

      const result = await retrieveRelevantArticles('test');
      
      expect(result.length).toBe(1);
      expect(result[0].relevantContent).toBeTruthy();
      expect(result[0].source.title).toBe('Test Article');
      expect(result[0].source.slug).toBe('test-article');
    });

    // Requirement 1.5: Multi-category response handling
    it('should retrieve articles from multiple categories when relevant', async () => {
      const searchResults: WikiSearchResult[] = [
        {
          id: '1',
          title: 'Academic Support',
          slug: 'academic-support',
          category: 'Academics',
          excerpt: 'Academic help',
        },
        {
          id: '2',
          title: 'Student Services',
          slug: 'student-services',
          category: 'Services',
          excerpt: 'Student support',
        },
        {
          id: '3',
          title: 'Campus Life',
          slug: 'campus-life',
          category: 'Campus',
          excerpt: 'Campus activities',
        },
      ];

      const mockArticle = (id: string, title: string, category: string, slug: string): HygraphWikiArticle => ({
        id,
        title,
        slug,
        category,
        content: `# ${title}\nContent about ${title.toLowerCase()} with student support information.`,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        publishedAt: '2024-01-01',
      });

      vi.mocked(wikiModule.searchArticles).mockResolvedValue(searchResults);
      vi.mocked(wikiModule.getArticleBySlug).mockImplementation(async (slug) => {
        const result = searchResults.find(r => r.slug === slug);
        if (!result) return null;
        return mockArticle(result.id, result.title, result.category, result.slug);
      });

      const result = await retrieveRelevantArticles('student support');
      
      // Should retrieve articles from multiple categories
      const categories = new Set(result.map(r => r.article.category));
      expect(categories.size).toBeGreaterThan(1);
      
      // Each article should have category information in source
      result.forEach(article => {
        expect(article.source.category).toBeTruthy();
      });
    });

    it('should prefer category diversity when articles have similar relevance', async () => {
      const searchResults: WikiSearchResult[] = [
        {
          id: '1',
          title: 'Article A1',
          slug: 'article-a1',
          category: 'CategoryA',
          excerpt: 'Test content',
        },
        {
          id: '2',
          title: 'Article A2',
          slug: 'article-a2',
          category: 'CategoryA',
          excerpt: 'Test content',
        },
        {
          id: '3',
          title: 'Article B1',
          slug: 'article-b1',
          category: 'CategoryB',
          excerpt: 'Test content',
        },
        {
          id: '4',
          title: 'Article C1',
          slug: 'article-c1',
          category: 'CategoryC',
          excerpt: 'Test content',
        },
      ];

      const mockArticle = (id: string, title: string, category: string, slug: string): HygraphWikiArticle => ({
        id,
        title,
        slug,
        category,
        content: `# ${title}\nTest content with similar relevance.`,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        publishedAt: '2024-01-01',
      });

      vi.mocked(wikiModule.searchArticles).mockResolvedValue(searchResults);
      vi.mocked(wikiModule.getArticleBySlug).mockImplementation(async (slug) => {
        const result = searchResults.find(r => r.slug === slug);
        if (!result) return null;
        return mockArticle(result.id, result.title, result.category, result.slug);
      });

      const result = await retrieveRelevantArticles('test');
      
      // Should include articles from different categories
      const categories = new Set(result.map(r => r.article.category));
      
      // With 4 articles from 3 categories, we should get at least 2 different categories
      expect(categories.size).toBeGreaterThanOrEqual(2);
    });
  });

  // Requirement 7.4: Ambiguity detection and clarification
  describe('isAmbiguousQuery', () => {
    const createMockArticle = (id: string, title: string, category: string, slug: string): HygraphWikiArticle => ({
      id,
      title,
      slug,
      category,
      content: `Content for ${title}`,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      publishedAt: '2024-01-01',
    });

    it('should detect ambiguous queries with 3+ categories and similar scores', () => {
      const articles: RetrievedArticle[] = [
        {
          article: createMockArticle('1', 'Course Registration', 'Academics', 'course-reg'),
          relevantContent: 'Content 1',
          relevanceScore: 50,
          source: { title: 'Course Registration', slug: 'course-reg', category: 'Academics' },
        },
        {
          article: createMockArticle('2', 'Event Registration', 'Campus Life', 'event-reg'),
          relevantContent: 'Content 2',
          relevanceScore: 48,
          source: { title: 'Event Registration', slug: 'event-reg', category: 'Campus Life' },
        },
        {
          article: createMockArticle('3', 'Student ID Registration', 'Services', 'id-reg'),
          relevantContent: 'Content 3',
          relevanceScore: 47,
          source: { title: 'Student ID Registration', slug: 'id-reg', category: 'Services' },
        },
      ];

      // Short query with multiple categories and similar scores
      expect(isAmbiguousQuery('registration', articles)).toBe(true);
    });

    it('should not detect ambiguity with fewer than 3 articles', () => {
      const articles: RetrievedArticle[] = [
        {
          article: createMockArticle('1', 'Article 1', 'Academics', 'article-1'),
          relevantContent: 'Content 1',
          relevanceScore: 50,
          source: { title: 'Article 1', slug: 'article-1', category: 'Academics' },
        },
        {
          article: createMockArticle('2', 'Article 2', 'Campus Life', 'article-2'),
          relevantContent: 'Content 2',
          relevanceScore: 48,
          source: { title: 'Article 2', slug: 'article-2', category: 'Campus Life' },
        },
      ];

      expect(isAmbiguousQuery('test', articles)).toBe(false);
    });

    it('should not detect ambiguity with long specific queries', () => {
      const articles: RetrievedArticle[] = [
        {
          article: createMockArticle('1', 'Article 1', 'Academics', 'article-1'),
          relevantContent: 'Content 1',
          relevanceScore: 50,
          source: { title: 'Article 1', slug: 'article-1', category: 'Academics' },
        },
        {
          article: createMockArticle('2', 'Article 2', 'Campus Life', 'article-2'),
          relevantContent: 'Content 2',
          relevanceScore: 48,
          source: { title: 'Article 2', slug: 'article-2', category: 'Campus Life' },
        },
        {
          article: createMockArticle('3', 'Article 3', 'Services', 'article-3'),
          relevantContent: 'Content 3',
          relevanceScore: 47,
          source: { title: 'Article 3', slug: 'article-3', category: 'Services' },
        },
      ];

      // Long specific query should not be ambiguous
      expect(isAmbiguousQuery('How do I register for courses in the computer science department?', articles)).toBe(false);
    });

    it('should not detect ambiguity when scores differ significantly', () => {
      const articles: RetrievedArticle[] = [
        {
          article: createMockArticle('1', 'Article 1', 'Academics', 'article-1'),
          relevantContent: 'Content 1',
          relevanceScore: 80,
          source: { title: 'Article 1', slug: 'article-1', category: 'Academics' },
        },
        {
          article: createMockArticle('2', 'Article 2', 'Campus Life', 'article-2'),
          relevantContent: 'Content 2',
          relevanceScore: 40,
          source: { title: 'Article 2', slug: 'article-2', category: 'Campus Life' },
        },
        {
          article: createMockArticle('3', 'Article 3', 'Services', 'article-3'),
          relevantContent: 'Content 3',
          relevanceScore: 30,
          source: { title: 'Article 3', slug: 'article-3', category: 'Services' },
        },
      ];

      // Clear winner, not ambiguous (score difference > 20)
      expect(isAmbiguousQuery('test', articles)).toBe(false);
    });

    it('should not detect ambiguity with empty results', () => {
      expect(isAmbiguousQuery('test', [])).toBe(false);
    });

    it('should detect ambiguity with two-word queries and multiple categories', () => {
      const articles: RetrievedArticle[] = [
        {
          article: createMockArticle('1', 'Library Access', 'Services', 'library-access'),
          relevantContent: 'Content 1',
          relevanceScore: 55,
          source: { title: 'Library Access', slug: 'library-access', category: 'Services' },
        },
        {
          article: createMockArticle('2', 'Building Access', 'Campus Life', 'building-access'),
          relevantContent: 'Content 2',
          relevanceScore: 53,
          source: { title: 'Building Access', slug: 'building-access', category: 'Campus Life' },
        },
        {
          article: createMockArticle('3', 'System Access', 'IT', 'system-access'),
          relevantContent: 'Content 3',
          relevanceScore: 52,
          source: { title: 'System Access', slug: 'system-access', category: 'IT' },
        },
      ];

      // Two-word query with similar scores across categories
      expect(isAmbiguousQuery('access card', articles)).toBe(true);
    });
  });

  describe('getAmbiguityOptions', () => {
    const createMockArticle = (id: string, title: string, category: string, slug: string): HygraphWikiArticle => ({
      id,
      title,
      slug,
      category,
      content: `Content for ${title}`,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      publishedAt: '2024-01-01',
    });

    it('should extract category options with example titles', () => {
      const articles: RetrievedArticle[] = [
        {
          article: createMockArticle('1', 'Course Registration', 'Academics', 'course-reg'),
          relevantContent: 'Content 1',
          relevanceScore: 50,
          source: { title: 'Course Registration', slug: 'course-reg', category: 'Academics' },
        },
        {
          article: createMockArticle('2', 'Event Registration', 'Campus Life', 'event-reg'),
          relevantContent: 'Content 2',
          relevanceScore: 48,
          source: { title: 'Event Registration', slug: 'event-reg', category: 'Campus Life' },
        },
        {
          article: createMockArticle('3', 'Student ID Registration', 'Services', 'id-reg'),
          relevantContent: 'Content 3',
          relevanceScore: 47,
          source: { title: 'Student ID Registration', slug: 'id-reg', category: 'Services' },
        },
      ];

      const options = getAmbiguityOptions(articles);

      expect(options).toHaveLength(3);
      expect(options).toContainEqual({
        category: 'Academics',
        exampleTitle: 'Course Registration',
      });
      expect(options).toContainEqual({
        category: 'Campus Life',
        exampleTitle: 'Event Registration',
      });
      expect(options).toContainEqual({
        category: 'Services',
        exampleTitle: 'Student ID Registration',
      });
    });

    it('should return one option per category', () => {
      const articles: RetrievedArticle[] = [
        {
          article: createMockArticle('1', 'Article 1', 'Academics', 'article-1'),
          relevantContent: 'Content 1',
          relevanceScore: 50,
          source: { title: 'Article 1', slug: 'article-1', category: 'Academics' },
        },
        {
          article: createMockArticle('2', 'Article 2', 'Academics', 'article-2'),
          relevantContent: 'Content 2',
          relevanceScore: 48,
          source: { title: 'Article 2', slug: 'article-2', category: 'Academics' },
        },
        {
          article: createMockArticle('3', 'Article 3', 'Services', 'article-3'),
          relevantContent: 'Content 3',
          relevanceScore: 47,
          source: { title: 'Article 3', slug: 'article-3', category: 'Services' },
        },
      ];

      const options = getAmbiguityOptions(articles);

      // Should only have 2 options (one per unique category)
      expect(options).toHaveLength(2);
      expect(options.map(o => o.category)).toEqual(['Academics', 'Services']);
      // First article from each category should be used
      expect(options[0].exampleTitle).toBe('Article 1');
      expect(options[1].exampleTitle).toBe('Article 3');
    });

    it('should return empty array for no articles', () => {
      const options = getAmbiguityOptions([]);
      expect(options).toEqual([]);
    });

    it('should handle single category', () => {
      const articles: RetrievedArticle[] = [
        {
          article: createMockArticle('1', 'Article 1', 'Academics', 'article-1'),
          relevantContent: 'Content 1',
          relevanceScore: 50,
          source: { title: 'Article 1', slug: 'article-1', category: 'Academics' },
        },
      ];

      const options = getAmbiguityOptions(articles);

      expect(options).toHaveLength(1);
      expect(options[0]).toEqual({
        category: 'Academics',
        exampleTitle: 'Article 1',
      });
    });
  });
});
