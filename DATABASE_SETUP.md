# Database Setup Guide

This guide walks you through setting up the database schema for the TUM Community Platform.

## Prerequisites

- A Supabase project created (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- Access to your Supabase dashboard
- Environment variables configured in `.env.local`

## Quick Setup

### Step 1: Access SQL Editor

1. Go to your Supabase project dashboard at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Apply Migrations

Apply the following migration files in order by copying and pasting their contents into the SQL Editor and clicking **Run**:

#### Migration 1: Initial Schema
```
File: supabase/migrations/20240101000000_initial_schema.sql
```
This creates:
- All 15 database tables
- Basic performance indexes (foreign keys, sorting)
- Automated triggers for member counts, vote counts, and timestamps
- Helper functions

**Important**: This migration does NOT include trigram search indexes (they require pg_trgm extension first).

#### Migration 2: RLS Policies
```
File: supabase/migrations/20240101000001_rls_policies.sql
```
This creates:
- Row Level Security policies for all tables
- Access control rules
- Helper functions for anonymous post handling

#### Migration 3: Search Capabilities
```
File: supabase/migrations/20240101000002_enable_search.sql
```
This enables:
- pg_trgm extension for full-text search
- Trigram indexes on searchable columns
- Search functions for subforums, channels, and wiki articles

**Note**: This migration must run AFTER the initial schema to create the trigram indexes.

### Step 3: Verify Setup

Run the verification script to ensure everything is set up correctly:

```
File: supabase/verify_schema.sql
```

This will check:
- ✓ All tables exist
- ✓ RLS is enabled on all tables
- ✓ Indexes are created
- ✓ Triggers are active
- ✓ Functions are available

### Step 4: Create Your First Admin User

After signing up through your application, promote your user to admin:

1. Go to **SQL Editor** in Supabase
2. Run this query (replace with your email):

```sql
UPDATE public.user_profiles 
SET is_admin = true, can_create_events = true 
WHERE email = 'your-email@tum.de';
```

## What Was Created

### Tables (15 total)

**User Management:**
- `user_profiles` - Extended user information

**Forum System:**
- `subforums` - Discussion spaces
- `subforum_memberships` - Membership tracking
- `posts` - Forum posts
- `comments` - Post comments
- `votes` - Upvotes/downvotes

**Channels System:**
- `channels` - Official channels
- `channel_memberships` - Channel members
- `channel_messages` - Real-time messages

**Events System:**
- `events` - Campus events
- `event_registrations` - Event signups with QR codes

**Wiki System:**
- `wiki_articles` - Public information
- `wiki_versions` - Version history

**Calendar System:**
- `personal_calendar_events` - Personal calendar entries

**Admin System:**
- `moderation_logs` - Moderation audit trail

### Key Features

**Automated Triggers:**
- Member counts auto-update when users join/leave
- Vote counts auto-update when users vote
- Timestamps auto-update on record changes
- Subforum creators auto-join their subforums
- Wiki versions auto-created on edits

**Security (RLS Policies):**
- TUM email authentication required
- Anonymous posts hide author (except to admins)
- Channel messages only visible to members
- Admin-only operations protected
- Personal data isolated per user

**Performance:**
- Comprehensive indexes on all foreign keys
- Composite indexes for common queries
- Full-text search indexes
- Optimized for sorting and filtering

## Troubleshooting

### "Extension does not exist" Error

If you get an error about missing extensions:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### "Permission denied" Error

Ensure you're using the SQL Editor in the Supabase dashboard, which has the necessary permissions.

### RLS Blocking Operations

If you're testing and RLS is blocking operations:
1. Ensure you're authenticated (check `auth.uid()`)
2. Verify user has necessary permissions
3. Check the specific RLS policy for that table

### Trigger Not Working

Verify triggers are active:

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## Next Steps

1. ✓ Database schema created
2. ✓ RLS policies enabled
3. ✓ Admin user created
4. → Start building authentication (Task 3)
5. → Implement forum features (Task 4)
6. → Build remaining features

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

## Need Help?

- Check the verification script output for specific issues
- Review the Supabase logs in **Logs** → **Postgres Logs**
- Consult the [supabase/README.md](./supabase/README.md) for detailed information
