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

### 4️⃣ Auto-Create User Profiles (REQUIRED FOURTH)
```
File: 20240101000003_auto_create_user_profiles.sql
```

**What it does:**
- Creates trigger to automatically create user profiles on signup
- Ensures every authenticated user has a profile entry

**Dependencies:**
- Requires user_profiles table from migration 1

---

### 5️⃣ Social Profiles and Feed Schema (OPTIONAL)
```
File: 20240101000004_social_profiles_and_feed.sql
```

**What it does:**
- Extends user_profiles table with bio, interests, and profile_visibility
- Creates friendships table for friend connections
- Creates user_activities view for activity feed
- Adds helper functions for friendship status

**Dependencies:**
- Requires user_profiles, posts, events, and event_registrations tables from migration 1

**Note:** This migration is for the social profiles and feed feature. Only run if you want to enable social features.

---

### 6️⃣ Social Profiles RLS Policies (OPTIONAL)
```
File: 20240101000005_social_profiles_rls.sql
```

**What it does:**
- Enables Row Level Security on friendships table
- Creates security policies for friend requests and connections
- Updates user_profiles policies to allow social field updates

**Dependencies:**
- Requires friendships table from migration 5
- Must run AFTER migration 5

**Note:** This migration is for the social profiles and feed feature. Only run if you ran migration 5.

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
12. Create a new query
13. Copy and paste **20240101000003_auto_create_user_profiles.sql**
14. Click **Run** ✓
15. (Optional) Create a new query
16. (Optional) Copy and paste **20240101000004_social_profiles_and_feed.sql**
17. (Optional) Click **Run** ✓
18. (Optional) Create a new query
19. (Optional) Copy and paste **20240101000005_social_profiles_rls.sql**
20. (Optional) Click **Run** ✓

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

After running all migrations, verify success:

```sql
-- Check tables (should return 15 base tables, or 16 if social profiles enabled)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check extensions (should include uuid-ossp and pg_trgm)
SELECT extname FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pg_trgm');

-- Check trigram indexes (should return 6)
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%_trgm';

-- Check RLS is enabled (should return 15 base tables, or 16 if social profiles enabled)
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check views (should return 1 if social profiles enabled)
SELECT COUNT(*) FROM information_schema.views 
WHERE table_schema = 'public' AND table_name = 'user_activities';

-- Check friendships table exists (if social profiles enabled)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'friendships'
);
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

-- Drop views first
DROP VIEW IF EXISTS public.user_activities CASCADE;

-- Drop all tables (cascades to indexes, triggers, etc.)
DROP TABLE IF EXISTS public.friendships CASCADE;
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
DROP FUNCTION IF EXISTS are_friends CASCADE;
DROP FUNCTION IF EXISTS get_friendship_status CASCADE;
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

-- Then re-run migrations in order: 1 → 2 → 3 → 4 → (optional) 5 → (optional) 6
```

---

## Summary

✅ **Correct Order (Core)**: 1 → 2 → 3 → 4

✅ **Correct Order (With Social Features)**: 1 → 2 → 3 → 4 → 5 → 6

❌ **Wrong Order**: Any other sequence will cause errors

🔑 **Key Points**: 
- Migration 3 must run after migration 1 because it creates indexes on tables that don't exist until migration 1 runs, and it needs the pg_trgm extension to create trigram indexes.
- Migrations 5 and 6 are optional and only needed if you want social profiles and feed features.
- Migration 6 must run after migration 5 because it creates RLS policies for the friendships table.
