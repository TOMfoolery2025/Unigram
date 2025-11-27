/**
 * Hygraph CMS types for wiki articles
 */

/**
 * Wiki article from Hygraph CMS
 */
export interface HygraphWikiArticle {
  /** Unique identifier */
  id: string;
  /** Article title */
  title: string;
  /** URL-friendly slug */
  slug: string;
  /** Article category */
  category: string;
  /** Markdown content */
  content: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Publication timestamp (null if not published) */
  publishedAt: string | null;
}

/**
 * Wiki category with article count
 */
export interface WikiCategory {
  /** Category name */
  category: string;
  /** Number of articles in this category */
  articleCount: number;
}

/**
 * Wiki search result
 */
export interface WikiSearchResult {
  /** Unique identifier */
  id: string;
  /** Article title */
  title: string;
  /** URL-friendly slug */
  slug: string;
  /** Article category */
  category: string;
  /** Content excerpt for preview */
  excerpt: string;
}
