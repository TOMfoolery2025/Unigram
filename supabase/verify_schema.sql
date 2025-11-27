-- Verification Script for TUM Community Platform Database Schema
-- Run this script after applying migrations to verify everything is set up correctly

-- ============================================================================
-- CHECK EXTENSIONS
-- ============================================================================
SELECT 'Checking Extensions...' AS status;

SELECT 
  extname AS extension_name,
  extversion AS version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pg_trgm')
ORDER BY extname;

-- Expected: 2 rows (uuid-ossp and pg_trgm)

-- ============================================================================
-- CHECK TABLES
-- ============================================================================
SELECT 'Checking Tables...' AS status;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'user_profiles', 'subforums', 'subforum_memberships', 'posts', 'comments', 
      'votes', 'channels', 'channel_memberships', 'channel_messages', 'events', 
      'event_registrations', 'wiki_articles', 'wiki_versions', 
      'personal_calendar_events', 'moderation_logs'
    ) THEN '✓ Expected'
    ELSE '✗ Unexpected'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: 15 tables

-- ============================================================================
-- CHECK ROW LEVEL SECURITY
-- ============================================================================
SELECT 'Checking Row Level Security...' AS status;

SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All tables should have rowsecurity = true

-- ============================================================================
-- CHECK RLS POLICIES
-- ============================================================================
SELECT 'Checking RLS Policies...' AS status;

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Multiple policies per table

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- CHECK INDEXES
-- ============================================================================
SELECT 'Checking Indexes...' AS status;

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'  -- Exclude primary keys
ORDER BY tablename, indexname;

-- Count indexes per table (excluding primary keys)
SELECT 
  tablename,
  COUNT(*) AS index_count
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- CHECK TRIGGERS
-- ============================================================================
SELECT 'Checking Triggers...' AS status;

SELECT 
  trigger_name,
  event_object_table AS table_name,
  action_timing AS timing,
  event_manipulation AS event,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected triggers:
-- - update_*_updated_at triggers on multiple tables
-- - update_subforum_member_count_trigger
-- - update_channel_member_count_trigger
-- - update_post_vote_count_trigger
-- - add_creator_to_subforum_trigger
-- - create_wiki_version_trigger

-- ============================================================================
-- CHECK FUNCTIONS
-- ============================================================================
SELECT 'Checking Functions...' AS status;

SELECT 
  routine_name AS function_name,
  routine_type AS type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected functions:
-- - update_updated_at_column
-- - update_subforum_member_count
-- - update_channel_member_count
-- - update_post_vote_count
-- - add_creator_to_subforum
-- - create_wiki_version
-- - is_admin
-- - can_create_events
-- - get_post_with_author
-- - get_comment_with_author
-- - search_subforums
-- - search_channels
-- - search_wiki_articles

-- ============================================================================
-- CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================
SELECT 'Checking Foreign Key Constraints...' AS status;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- CHECK CHECK CONSTRAINTS
-- ============================================================================
SELECT 'Checking Check Constraints...' AS status;

SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Expected check constraints:
-- - votes.vote_type IN ('upvote', 'downvote')
-- - events.event_type IN ('tum_native', 'external')
-- - moderation_logs.action_type IN (...)

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 'Schema Verification Summary' AS status;

SELECT 
  'Tables' AS component,
  COUNT(*) AS count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
  'RLS Policies' AS component,
  COUNT(*) AS count
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Indexes (non-PK)' AS component,
  COUNT(*) AS count
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'

UNION ALL

SELECT 
  'Triggers' AS component,
  COUNT(*) AS count
FROM information_schema.triggers 
WHERE trigger_schema = 'public'

UNION ALL

SELECT 
  'Functions' AS component,
  COUNT(*) AS count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'

UNION ALL

SELECT 
  'Foreign Keys' AS component,
  COUNT(*) AS count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- ============================================================================
-- TEST BASIC OPERATIONS (Optional - Uncomment to test)
-- ============================================================================

-- Uncomment the following to test basic operations:

/*
-- Test: Create a test user profile
INSERT INTO public.user_profiles (id, email, display_name, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@tum.de',
  'Test User',
  false
);

-- Test: Create a subforum (should auto-add creator to membership)
INSERT INTO public.subforums (name, description, creator_id)
VALUES (
  'Test Subforum',
  'A test subforum for verification',
  '00000000-0000-0000-0000-000000000001'::uuid
);

-- Verify: Check that creator was auto-added to membership
SELECT * FROM public.subforum_memberships 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Verify: Check that member_count is 1
SELECT name, member_count FROM public.subforums 
WHERE name = 'Test Subforum';

-- Cleanup test data
DELETE FROM public.subforums WHERE name = 'Test Subforum';
DELETE FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
*/

SELECT 'Verification Complete!' AS status;
