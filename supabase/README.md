# Supabase Database Migrations

This directory contains SQL migration files for the TUM Community Platform database schema.

## Migration Files

1. **20240101000000_initial_schema.sql** - Creates all database tables, basic indexes, and triggers
2. **20240101000001_rls_policies.sql** - Enables Row Level Security and creates all security policies
3. **20240101000002_enable_search.sql** - Enables pg_trgm extension, creates trigram indexes, and search functions

**Important**: The migrations must be run in order. The search migration (3) creates trigram indexes that depend on the pg_trgm extension, so it must run after the initial schema.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file in order:
   - First: `20240101000000_initial_schema.sql`
   - Second: `20240101000001_rls_policies.sql`
   - Third: `20240101000002_enable_search.sql`
4. Click **Run** for each migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Option 3: Manual SQL Execution

You can also connect to your Supabase PostgreSQL database directly and run the SQL files:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" < supabase/migrations/20240101000000_initial_schema.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" < supabase/migrations/20240101000001_rls_policies.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" < supabase/migrations/20240101000002_enable_search.sql
```

## Database Schema Overview

### Tables Created

#### User Management
- `user_profiles` - Extended user profile information

#### Forum System
- `subforums` - Student-created discussion spaces
- `subforum_memberships` - Subforum membership tracking
- `posts` - Forum posts with anonymous posting support
- `comments` - Nested comments on posts
- `votes` - Upvote/downvote tracking

#### Channels System
- `channels` - Official sports/clubs channels (admin-only creation)
- `channel_memberships` - Channel membership tracking
- `channel_messages` - Real-time channel messages

#### Events System
- `events` - Campus and external events
- `event_registrations` - Event registration with QR code support

#### Wiki System
- `wiki_articles` - Public information articles
- `wiki_versions` - Version history for wiki articles

#### Calendar System
- `personal_calendar_events` - Personal calendar entries

#### Admin & Moderation
- `moderation_logs` - Audit trail for moderation actions

## Key Features

### Automated Triggers

- **updated_at timestamps** - Automatically updated on record changes
- **member_count updates** - Automatically maintained for subforums and channels
- **vote_count updates** - Automatically calculated from votes table
- **creator auto-join** - Subforum creators automatically become members
- **wiki versioning** - Automatic version history on article updates

### Row Level Security (RLS)

All tables have RLS enabled with policies that enforce:
- TUM email authentication requirements
- Anonymous post author hiding (except for admins)
- Channel message visibility (members only)
- Admin-only operations (channel creation, wiki editing)
- Event creator permissions
- Personal data isolation (calendar events)

### Performance Optimizations

- Comprehensive indexes on foreign keys
- Composite indexes for common query patterns
- Trigram indexes for full-text search
- Optimized indexes for sorting (created_at, vote_count)

### Search Capabilities

Helper functions for full-text search:
- `search_subforums(search_query TEXT)` - Search subforums by name/description
- `search_channels(search_query TEXT)` - Search channels by name/description
- `search_wiki_articles(search_query TEXT)` - Search wiki articles by title/content

### Helper Functions

- `is_admin(user_id UUID)` - Check if user is admin
- `can_create_events(user_id UUID)` - Check if user can create events
- `get_post_with_author(post_id UUID, requesting_user_id UUID)` - Get post with proper anonymity handling
- `get_comment_with_author(comment_id UUID, requesting_user_id UUID)` - Get comment with proper anonymity handling

## Verification

After applying migrations, verify the setup:

```sql
-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check that RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check that indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check that triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY event_object_table, trigger_name;
```

## Next Steps

After applying these migrations:

1. Create your first admin user by manually updating the `user_profiles` table:
   ```sql
   UPDATE public.user_profiles 
   SET is_admin = true, can_create_events = true 
   WHERE email = 'your-admin-email@tum.de';
   ```

2. Test the authentication flow
3. Begin implementing the application features
4. Use the helper functions in your application code for proper data access

## Troubleshooting

### "operator class gin_trgm_ops does not exist" Error
This error occurs if you try to create trigram indexes before enabling the pg_trgm extension. 

**Solution**: 
- Ensure you run migrations in order (1, 2, then 3)
- Migration 3 enables pg_trgm before creating trigram indexes
- If you already ran migration 1 and got this error, just continue with migrations 2 and 3

### Migration Fails with "extension does not exist"
- Ensure you have the necessary PostgreSQL extensions enabled
- The migrations automatically enable `uuid-ossp` and `pg_trgm`
- If issues persist, manually enable them in the SQL Editor:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  ```

### RLS Policies Block Operations
- Check that you're authenticated when testing
- Verify the user has the necessary permissions
- Use the Supabase dashboard to temporarily disable RLS for debugging (not recommended for production)

### Trigger Not Firing
- Verify the trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';`
- Check trigger function exists: `SELECT * FROM pg_proc WHERE proname LIKE '%your_function_name%';`
- Ensure the operation matches the trigger event (INSERT, UPDATE, DELETE)
