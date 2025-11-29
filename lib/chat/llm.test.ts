/**
 * Tests for LLM service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadLLMConfig, createSystemPrompt, formatConversationHistory } from './llm';
import type { RetrievedArticle } from './retrieval';

describe('LLM Service', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_TEMPERATURE;
    delete process.env.OPENAI_MAX_TOKENS;
  });

  describe('loadLLMConfig', () => {
    it('should throw error if OPENAI_API_KEY is missing', () => {
      expect(() => loadLLMConfig()).toThrow('OPENAI_API_KEY environment variable is required');
    });

    it('should load configuration with defaults', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      const config = loadLLMConfig();
      
      expect(config.apiKey).toBe('test-key');
      expect(config.model).toBe('gpt-4-turbo-preview');
      expect(config.temperature).toBe(0.7);
      expect(config.maxTokens).toBe(1000);
    });

    it('should load custom model from environment', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
      
      const config = loadLLMConfig();
      
      expect(config.model).toBe('gpt-3.5-turbo');
    });

    it('should load valid temperature from environment', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_TEMPERATURE = '0.5';
      
      const config = loadLLMConfig();
      
      expect(config.temperature).toBe(0.5);
    });

    it('should use default temperature for invalid values', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_TEMPERATURE = 'invalid';
      
      const config = loadLLMConfig();
      
      expect(config.temperature).toBe(0.7);
    });

    it('should use default temperature for out-of-range values', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_TEMPERATURE = '3.0';
      
      const config = loadLLMConfig();
      
      expect(config.temperature).toBe(0.7);
    });

    it('should load valid max tokens from environment', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MAX_TOKENS = '2000';
      
      const config = loadLLMConfig();
      
      expect(config.maxTokens).toBe(2000);
    });

    it('should use default max tokens for invalid values', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MAX_TOKENS = 'invalid';
      
      const config = loadLLMConfig();
      
      expect(config.maxTokens).toBe(1000);
    });

    it('should use default max tokens for out-of-range values', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MAX_TOKENS = '10000';
      
      const config = loadLLMConfig();
      
      expect(config.maxTokens).toBe(1000);
    });
  });

  describe('createSystemPrompt', () => {
    it('should create prompt with no articles', () => {
      const prompt = createSystemPrompt([], false, false, []);
      
      expect(prompt).toContain('TUM Community Platform wiki');
      expect(prompt).toContain('No relevant articles found');
    });

    it('should include category suggestions when no articles found', () => {
      const categories = ['Academics', 'Campus Life', 'Student Services'];
      const prompt = createSystemPrompt([], false, false, categories);
      
      expect(prompt).toContain('Academics');
      expect(prompt).toContain('Campus Life');
      expect(prompt).toContain('Student Services');
      expect(prompt).toContain('suggest 2-3 alternative search terms');
    });

    it('should use fallback categories when none provided', () => {
      const prompt = createSystemPrompt([], false, false, []);
      
      // Should contain fallback categories
      expect(prompt).toContain('Academics, Campus Life, Student Services, Events, Resources');
    });

    it('should create prompt with retrieved articles', () => {
      const articles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Test Article',
            slug: 'test-article',
            category: 'Test Category',
            content: 'Test content',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'Relevant test content',
          relevanceScore: 90,
          source: {
            title: 'Test Article',
            slug: 'test-article',
            category: 'Test Category',
          },
        },
      ];
      
      const prompt = createSystemPrompt(articles, false, false, []);
      
      expect(prompt).toContain('Test Article');
      expect(prompt).toContain('test-article');
      expect(prompt).toContain('Test Category');
      expect(prompt).toContain('Relevant test content');
    });

    it('should include citation format instructions', () => {
      const prompt = createSystemPrompt([], false, false, []);
      
      expect(prompt).toContain('[Article Title](/wiki/articles/slug)');
    });

    it('should include recommendation instructions when isRecommendationQuery is true', () => {
      const articles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Test Article',
            slug: 'test-article',
            category: 'Test Category',
            content: 'Test content',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'Relevant test content',
          relevanceScore: 90,
          source: {
            title: 'Test Article',
            slug: 'test-article',
            category: 'Test Category',
          },
        },
      ];
      
      const prompt = createSystemPrompt(articles, true, false, []);
      
      expect(prompt).toContain('IMPORTANT: The user is asking for article recommendations');
      expect(prompt).toContain('List 2-5 relevant articles');
      expect(prompt).toContain('Brief description (1-2 sentences)');
    });

    it('should not include special recommendation instructions when isRecommendationQuery is false', () => {
      const articles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Test Article',
            slug: 'test-article',
            category: 'Test Category',
            content: 'Test content',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'Relevant test content',
          relevanceScore: 90,
          source: {
            title: 'Test Article',
            slug: 'test-article',
            category: 'Test Category',
          },
        },
      ];
      
      const prompt = createSystemPrompt(articles, false, false, []);
      
      expect(prompt).not.toContain('IMPORTANT: The user is asking for article recommendations');
    });

    // Requirement 1.5: Multi-category response handling
    it('should include multi-category context when articles span multiple categories', () => {
      const articles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Academic Support',
            slug: 'academic-support',
            category: 'Academics',
            content: 'Academic content',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'Academic support content',
          relevanceScore: 90,
          source: {
            title: 'Academic Support',
            slug: 'academic-support',
            category: 'Academics',
          },
        },
        {
          article: {
            id: '2',
            title: 'Campus Life',
            slug: 'campus-life',
            category: 'Campus',
            content: 'Campus content',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'Campus life content',
          relevanceScore: 85,
          source: {
            title: 'Campus Life',
            slug: 'campus-life',
            category: 'Campus',
          },
        },
        {
          article: {
            id: '3',
            title: 'Student Services',
            slug: 'student-services',
            category: 'Services',
            content: 'Services content',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'Student services content',
          relevanceScore: 80,
          source: {
            title: 'Student Services',
            slug: 'student-services',
            category: 'Services',
          },
        },
      ];
      
      const prompt = createSystemPrompt(articles, false, false, []);
      
      // Should mention the number of categories
      expect(prompt).toContain('3 different categories');
      
      // Should list the categories
      expect(prompt).toContain('Academics');
      expect(prompt).toContain('Campus');
      expect(prompt).toContain('Services');
      
      // Should include instructions about synthesizing from all categories
      expect(prompt).toContain('synthesize information from all relevant categories');
    });

    it('should not include multi-category context for single category', () => {
      const articles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Article 1',
            slug: 'article-1',
            category: 'Academics',
            content: 'Content',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'Content 1',
          relevanceScore: 90,
          source: {
            title: 'Article 1',
            slug: 'article-1',
            category: 'Academics',
          },
        },
        {
          article: {
            id: '2',
            title: 'Article 2',
            slug: 'article-2',
            category: 'Academics',
            content: 'Content',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'Content 2',
          relevanceScore: 85,
          source: {
            title: 'Article 2',
            slug: 'article-2',
            category: 'Academics',
          },
        },
      ];
      
      const prompt = createSystemPrompt(articles, false, false, []);
      
      // Should not include the multi-category note
      expect(prompt).not.toContain('different categories:');
    });

    it('should include multi-category instructions in general guidelines', () => {
      const prompt = createSystemPrompt([], false, false, []);
      
      // Should always include multi-category guidelines
      expect(prompt).toContain('Multi-Category Responses');
      expect(prompt).toContain('synthesize information from ALL relevant articles');
      expect(prompt).toContain('Cite sources from different categories');
    });

    // Requirements 7.1, 7.2: Out-of-scope query handling
    it('should include out-of-scope instructions when isOutOfScope is true', () => {
      const categories = ['Academics', 'Campus Life', 'Student Services'];
      const prompt = createSystemPrompt([], false, false, categories, true);
      
      expect(prompt).toContain('IMPORTANT: This query appears to be about non-TUM topics');
      expect(prompt).toContain('outside the scope of the TUM wiki');
      expect(prompt).toContain('Politely acknowledge that the question is outside the scope');
      expect(prompt).toContain('Suggest relevant TUM-related topics');
      expect(prompt).toContain('Academics');
      expect(prompt).toContain('Campus Life');
    });

    it('should not include out-of-scope instructions when isOutOfScope is false', () => {
      const prompt = createSystemPrompt([], false, false, [], false);
      
      expect(prompt).not.toContain('IMPORTANT: This query appears to be about non-TUM topics');
    });

    it('should include general out-of-scope handling guidelines', () => {
      const prompt = createSystemPrompt([], false, false, []);
      
      // Should always include general out-of-scope guidelines
      expect(prompt).toContain('Out-of-Scope Query Handling');
      expect(prompt).toContain('specifically about TUM');
      expect(prompt).toContain('politely acknowledge the limitation');
    });
  });

  describe('formatConversationHistory', () => {
    it('should format empty history', () => {
      const formatted = formatConversationHistory([]);
      
      expect(formatted).toEqual([]);
    });

    it('should format conversation messages', () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
        { role: 'user' as const, content: 'How are you?' },
      ];
      
      const formatted = formatConversationHistory(messages);
      
      expect(formatted).toHaveLength(3);
      expect(formatted[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(formatted[1]).toEqual({ role: 'assistant', content: 'Hi there!' });
      expect(formatted[2]).toEqual({ role: 'user', content: 'How are you?' });
    });
  });

  describe('RAG Integration', () => {
    it('should combine retrieved articles, conversation history, and user query in system prompt', () => {
      // Create mock retrieved articles
      const retrievedArticles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'TUM Admission Requirements',
            slug: 'admission-requirements',
            category: 'Admissions',
            content: 'Full content here...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'To apply to TUM, you need a high school diploma and German language proficiency.',
          relevanceScore: 95,
          source: {
            title: 'TUM Admission Requirements',
            slug: 'admission-requirements',
            category: 'Admissions',
          },
        },
        {
          article: {
            id: '2',
            title: 'Language Requirements',
            slug: 'language-requirements',
            category: 'Admissions',
            content: 'Full content here...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'German language proficiency is required at B2 level or higher.',
          relevanceScore: 85,
          source: {
            title: 'Language Requirements',
            slug: 'language-requirements',
            category: 'Admissions',
          },
        },
      ];

      // Create conversation history
      const conversationHistory = [
        { role: 'user' as const, content: 'What are the admission requirements?' },
        { role: 'assistant' as const, content: 'TUM requires a high school diploma and German proficiency.' },
      ];

      // Test that system prompt includes all components
      const systemPrompt = createSystemPrompt(retrievedArticles, false, false, []);
      
      // Verify retrieved articles are included
      expect(systemPrompt).toContain('TUM Admission Requirements');
      expect(systemPrompt).toContain('admission-requirements');
      expect(systemPrompt).toContain('To apply to TUM, you need a high school diploma');
      expect(systemPrompt).toContain('Language Requirements');
      expect(systemPrompt).toContain('German language proficiency is required at B2 level');
      
      // Verify instructions for citation format
      expect(systemPrompt).toContain('[Article Title](/wiki/articles/slug)');
      
      // Test that conversation history is properly formatted
      const formattedHistory = formatConversationHistory(conversationHistory);
      expect(formattedHistory).toHaveLength(2);
      expect(formattedHistory[0].role).toBe('user');
      expect(formattedHistory[0].content).toContain('admission requirements');
      expect(formattedHistory[1].role).toBe('assistant');
      expect(formattedHistory[1].content).toContain('high school diploma');
    });

    it('should handle empty retrieved articles gracefully', () => {
      const systemPrompt = createSystemPrompt([], false, false, []);
      
      expect(systemPrompt).toContain('No relevant articles found');
      expect(systemPrompt).toContain('TUM Community Platform wiki');
    });

    it('should handle empty conversation history', () => {
      const formatted = formatConversationHistory([]);
      
      expect(formatted).toEqual([]);
    });
  });

  // Requirement 7.4: Ambiguity detection and clarification
  describe('Ambiguity Detection', () => {
    it('should include ambiguity instructions when isAmbiguous is true', () => {
      const retrievedArticles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Course Registration',
            slug: 'course-registration',
            category: 'Academics',
            content: 'Full content here...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'How to register for courses.',
          relevanceScore: 50,
          source: {
            title: 'Course Registration',
            slug: 'course-registration',
            category: 'Academics',
          },
        },
        {
          article: {
            id: '2',
            title: 'Event Registration',
            slug: 'event-registration',
            category: 'Campus Life',
            content: 'Full content here...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'How to register for events.',
          relevanceScore: 48,
          source: {
            title: 'Event Registration',
            slug: 'event-registration',
            category: 'Campus Life',
          },
        },
      ];

      const systemPrompt = createSystemPrompt(retrievedArticles, false, true, []);
      
      // Verify ambiguity instructions are included
      expect(systemPrompt).toContain('IMPORTANT: This query appears ambiguous');
      expect(systemPrompt).toContain('could have multiple interpretations');
      expect(systemPrompt).toContain('Ask the user which specific topic they\'re interested in');
      expect(systemPrompt).toContain('Provide a brief preview of what information is available in each category');
    });

    it('should not include ambiguity instructions when isAmbiguous is false', () => {
      const retrievedArticles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Course Registration',
            slug: 'course-registration',
            category: 'Academics',
            content: 'Full content here...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'How to register for courses.',
          relevanceScore: 50,
          source: {
            title: 'Course Registration',
            slug: 'course-registration',
            category: 'Academics',
          },
        },
      ];

      const systemPrompt = createSystemPrompt(retrievedArticles, false, false, []);
      
      // Verify ambiguity instructions are NOT included
      expect(systemPrompt).not.toContain('IMPORTANT: This query appears ambiguous');
      expect(systemPrompt).not.toContain('could have multiple interpretations');
    });

    it('should include general ambiguity handling guidelines', () => {
      const systemPrompt = createSystemPrompt([], false, false, []);
      
      // Verify general ambiguity guidelines are always present
      expect(systemPrompt).toContain('Ambiguity Detection and Clarification');
      expect(systemPrompt).toContain('When a query could refer to multiple distinct topics');
      expect(systemPrompt).toContain('ask clarifying questions');
      expect(systemPrompt).toContain('Provide multiple interpretation options');
    });

    it('should provide example clarification format in ambiguity instructions', () => {
      const retrievedArticles: RetrievedArticle[] = [
        {
          article: {
            id: '1',
            title: 'Library Access',
            slug: 'library-access',
            category: 'Services',
            content: 'Full content here...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          relevantContent: 'How to access the library.',
          relevanceScore: 50,
          source: {
            title: 'Library Access',
            slug: 'library-access',
            category: 'Services',
          },
        },
      ];

      const systemPrompt = createSystemPrompt(retrievedArticles, false, true, []);
      
      // Verify example format is provided
      expect(systemPrompt).toContain('Example:');
      expect(systemPrompt).toContain('Are you asking about:');
      expect(systemPrompt).toContain('[Category 1 topic]');
      expect(systemPrompt).toContain('[Category 2 topic]');
    });
  });
});
