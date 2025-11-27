# Migration Order Guide

**IMPORTANT**: Migrations must be run in the exact order specified below.

## Order of Execution

### 1️⃣ Initial Schema (REQUIRED FIRST)
```
File: 20240101000000_initial_schema.sql
```

**What it does:**
- Creates all 15 database tables
- Creates basic indexes (foreign keys, sorting)
- Sets up automated triggers
- Creates helper functions

**What it does NOT do:**
- Does NOT create trigram search indexes (requires pg_trgm extension)

**Run this first!**

---

### 2️⃣ RLS Policies (REQUIRED SECOND)
```
File: 20240101000001_rls_policies.sql
```

**What it does:**
- Enables Row Level Security on all tables
- Creates 70+ security policies
- Adds helper functions for anonymous post handling

**Dependencies:**
- Requires tables from migration 1

---

### 3️⃣ Search Capabilities (REQUIRED THIRD)
```
File: 20240101000002_enable_search.sql
```

**What it does:**
- Enables pg_trgm extension
- Creates trigram indexes for full-text search
- Adds search helper functions

**Dependencies:**
- Requires tables from migration 1
- Must run AFTER migration 1 to create trigram indexes

**Why this order matters:**
The trigram indexes use the `gin_trgm_ops` operator class, which is only available after the `pg_trgm` extension is enabled. If you try to create these indexes before enabling the extension, you'll get an error.

---

## Quick Start

### Using Supabase Dashboard

1. Open your Supabase project
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste **20240101000000_initial_schema.sql**
5. Click **Run** ✓
6. Create a new query
7. Copy and paste **20240101000001_rls_policies.sql**
8. Click **Run** ✓
9. Create a new query
10. Copy and paste **20240101000002_enable_search.sql**
11. Click **Run** ✓

### Using Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations in order
supabase db push
```

The CLI will automatically run migrations in the correct order based on their timestamps.

---

## Common Errors

### ❌ "operator class gin_trgm_ops does not exist"

**Cause:** You tried to run migration 1 when it still had trigram indexes, or you ran migrations out of order.

**Solution:** 
- Ensure you're using the updated migration 1 (without trigram indexes)
- Run migrations in order: 1 → 2 → 3
- Migration 3 will create the trigram indexes after enabling pg_trgm

### ❌ "relation does not exist"

**Cause:** You skipped migration 1 or ran migrations out of order.

**Solution:**
- Start over and run migration 1 first
- Then run migrations 2 and 3 in order

### ❌ "extension does not exist"

**Cause:** PostgreSQL extensions are not available in your environment.

**Solution:**
- Supabase includes these extensions by default
- If using a different PostgreSQL setup, ensure `uuid-ossp` and `pg_trgm` are available

---

## Verification

After running all three migrations, verify success:

```sql
-- Check tables (should return 15)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check extensions (should include uuid-ossp and pg_trgm)
SELECT extname FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pg_trgm');

-- Check trigram indexes (should return 6)
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%_trgm';

-- Check RLS is enabled (should return 15 with rowsecurity = true)
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

Or run the complete verification script:
```
File: verify_schema.sql
```

---

## Rollback

If you need to start over:

```sql
-- WARNING: This will delete all data!

-- Drop all tables (cascades to indexes, triggers, etc.)
DROP TABLE IF EXISTS public.moderation_logs CASCADE;
DROP TABLE IF EXISTS public.personal_calendar_events CASCADE;
DROP TABLE IF EXISTS public.wiki_versions CASCADE;
DROP TABLE IF EXISTS public.wiki_articles CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.channel_messages CASCADE;
DROP TABLE IF EXISTS public.channel_memberships CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.subforum_memberships CASCADE;
DROP TABLE IF EXISTS public.subforums CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS search_wiki_articles CASCADE;
DROP FUNCTION IF EXISTS search_channels CASCADE;
DROP FUNCTION IF EXISTS search_subforums CASCADE;
DROP FUNCTION IF EXISTS get_comment_with_author CASCADE;
DROP FUNCTION IF EXISTS get_post_with_author CASCADE;
DROP FUNCTION IF EXISTS can_create_events CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS create_wiki_version CASCADE;
DROP FUNCTION IF EXISTS add_creator_to_subforum CASCADE;
DROP FUNCTION IF EXISTS update_post_vote_count CASCADE;
DROP FUNCTION IF EXISTS update_channel_member_count CASCADE;
DROP FUNCTION IF EXISTS update_subforum_member_count CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Then re-run migrations 1, 2, 3 in order
```

---

## Summary

✅ **Correct Order**: 1 → 2 → 3

❌ **Wrong Order**: Any other sequence will cause errors

🔑 **Key Point**: Migration 3 must run after migration 1 because it creates indexes on tables that don't exist until migration 1 runs, and it needs the pg_trgm extension to create trigram indexes.
