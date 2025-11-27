-- Enable full-text search capabilities
-- This migration enables the pg_trgm extension for trigram-based text search

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- CREATE TRIGRAM INDEXES FOR FULL-TEXT SEARCH
-- ============================================================================

-- Subforums search indexes
CREATE INDEX idx_subforums_name_trgm ON public.subforums USING gin(name gin_trgm_ops);
CREATE INDEX idx_subforums_description_trgm ON public.subforums USING gin(description gin_trgm_ops);

-- Channels search indexes
CREATE INDEX idx_channels_name_trgm ON public.channels USING gin(name gin_trgm_ops);
CREATE INDEX idx_channels_description_trgm ON public.channels USING gin(description gin_trgm_ops);

-- Wiki articles search indexes
CREATE INDEX idx_wiki_articles_title_trgm ON public.wiki_articles USING gin(title gin_trgm_ops);
CREATE INDEX idx_wiki_articles_content_trgm ON public.wiki_articles USING gin(content gin_trgm_ops);

-- ============================================================================
-- SEARCH HELPER FUNCTIONS
-- ============================================================================

-- Create helper function for searching subforums
CREATE OR REPLACE FUNCTION search_subforums(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  creator_id UUID,
  member_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.creator_id,
    s.member_count,
    s.created_at,
    s.updated_at,
    GREATEST(
      similarity(s.name, search_query),
      similarity(s.description, search_query)
    ) AS similarity
  FROM public.subforums s
  WHERE 
    s.name ILIKE '%' || search_query || '%' OR
    s.description ILIKE '%' || search_query || '%' OR
    similarity(s.name, search_query) > 0.3 OR
    similarity(s.description, search_query) > 0.3
  ORDER BY similarity DESC, s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for searching channels
CREATE OR REPLACE FUNCTION search_channels(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_by UUID,
  member_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.created_by,
    c.member_count,
    c.created_at,
    c.updated_at,
    GREATEST(
      similarity(c.name, search_query),
      similarity(c.description, search_query)
    ) AS similarity
  FROM public.channels c
  WHERE 
    c.name ILIKE '%' || search_query || '%' OR
    c.description ILIKE '%' || search_query || '%' OR
    similarity(c.name, search_query) > 0.3 OR
    similarity(c.description, search_query) > 0.3
  ORDER BY similarity DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for searching wiki articles
CREATE OR REPLACE FUNCTION search_wiki_articles(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  created_by UUID,
  is_published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.title,
    w.content,
    w.category,
    w.created_by,
    w.is_published,
    w.created_at,
    w.updated_at,
    GREATEST(
      similarity(w.title, search_query),
      similarity(w.content, search_query)
    ) AS similarity
  FROM public.wiki_articles w
  WHERE 
    w.is_published = true AND (
      w.title ILIKE '%' || search_query || '%' OR
      w.content ILIKE '%' || search_query || '%' OR
      similarity(w.title, search_query) > 0.3 OR
      similarity(w.content, search_query) > 0.3
    )
  ORDER BY similarity DESC, w.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
