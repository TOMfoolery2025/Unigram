-- ============================================================================
-- WIKI TABLES CLEANUP SCRIPT
-- ============================================================================
-- 
-- This script removes the old database-backed wiki tables that have been
-- replaced by Hygraph CMS integration.
--
-- IMPORTANT: This is a MANUAL cleanup script. Do NOT run this automatically.
-- Only execute this script after:
-- 1. Verifying the Hygraph CMS integration is working correctly
-- 2. Backing up any wiki content you want to preserve
-- 3. Confirming with your team that the migration is complete
--
-- Date: 2024
-- Related Feature: hygraph-cms-integration
-- Requirements: 7.1
-- ============================================================================

-- Drop the search function for wiki articles
DROP FUNCTION IF EXISTS public.search_wiki_articles(text);

-- Drop the wiki_versions table (has foreign key to wiki_articles)
DROP TABLE IF EXISTS public.wiki_versions CASCADE;

-- Drop the wiki_articles table
DROP TABLE IF EXISTS public.wiki_articles CASCADE;

-- Note: The CASCADE option will automatically drop any dependent objects
-- such as foreign key constraints, indexes, and triggers.

-- Verify the tables are dropped
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'wiki_articles'
  ) THEN
    RAISE NOTICE 'wiki_articles table successfully dropped';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'wiki_versions'
  ) THEN
    RAISE NOTICE 'wiki_versions table successfully dropped';
  END IF;
END $$;
