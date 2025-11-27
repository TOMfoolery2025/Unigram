# Database Documentation

## Overview

Unigram uses Supabase (PostgreSQL 15) as its database with Row Level Security (RLS) for data protection. The database schema supports forums, channels, events, calendar, and user management.

## Database Schema

### Entity Relationship Overview

```
user_profiles (1) ──< (N) subforum_memberships
user_profiles (1) ──< (N) posts
user_profiles (1) ──< (N) comments
user_profiles (1) ──< (N) votes
user_profiles (1) ──< (N) channel_memberships
user_profiles (1) ──< (N) channel_messages
user_profiles (1) ──< (N) events
user_profiles (1) ──< (N) event_registrations
user_profiles (1) ──< (N) personal_calendar_events
user_profiles (1) ──< (N) moderation_logs

subforums (1) ──< (N) subforum_memberships
subforums (1) ──< (N) posts

posts (1) ──< (N) comments
posts (1) ──< (N) votes

channels (1) ──< (N) channel_memberships
channels (1) ──< (N) channel_messages

events (1) ──< (N) event_registrations
```

## Tables

### User Management

#### user_profiles

Extended user information beyond Supabase auth.

**Columns:**
- `id` (UUID, PK): Matches auth.users.id
- `email` (TEXT, NOT NULL, UNIQUE): User's email
- `display_name` (TEXT): Display name
- `avatar_url` (TEXT): Profile picture URL
- `is_admin` (BOOLEAN, DEFAULT false): Admin privileges
- `can_create_events` (BOOLEAN, DEFAULT false): Event creation permission
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**RLS Policies:**
- Users can read all profiles
- Users can update only their own profile (except permissions)
- Admins can update any profile

### Forum System

#### subforums

Discussion spaces for different topics.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `name` (TEXT, NOT NULL, UNIQUE): Subforum name
- `description` (TEXT): Subforum description
- `creator_id` (UUID, FK → user_profiles.id): Creator
- `member_count` (INTEGER, DEFAULT 0): Number of members
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign key on `creator_id`
- Unique index on `name`
- GIN index on `name` for search (trigram)

**Triggers:**
- Auto-increment `member_count` on membership insert
- Auto-decrement `member_count` on membership delete
- Auto-join creator on subforum creation

**RLS Policies:**
- Anyone can read subforums
- Authenticated users can create subforums
- Only creator can update/delete subforum

#### subforum_memberships

Tracks user memberships in subforums.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `subforum_id` (UUID, FK → subforums.id, ON DELETE CASCADE)
- `user_id` (UUID, FK → user_profiles.id, ON DELETE CASCADE)
- `joined_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign keys on `subforum_id`, `user_id`
- Unique index on `(subforum_id, user_id)`

**RLS Policies:**
- Users can read their own memberships
- Users can create their own memberships
- Users can delete their own memberships

#### posts

Forum posts within subforums.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `subforum_id` (UUID, FK → subforums.id, ON DELETE CASCADE)
- `author_id` (UUID, FK → user_profiles.id, ON DELETE CASCADE)
- `title` (TEXT, NOT NULL): Post title
- `content` (TEXT, NOT NULL): Post content
- `is_anonymous` (BOOLEAN, DEFAULT false): Hide author
- `vote_count` (INTEGER, DEFAULT 0): Net votes (upvotes - downvotes)
- `comment_count` (INTEGER, DEFAULT 0): Number of comments
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign keys on `subforum_id`, `author_id`
- Index on `subforum_id` for listing posts
- Index on `author_id` for user's posts
- Index on `created_at` for sorting

**Triggers:**
- Auto-increment `comment_count` on comment insert
- Auto-decrement `comment_count` on comment delete
- Auto-update `vote_count` on vote insert/update/delete

**RLS Policies:**
- Anyone can read posts
- Authenticated users can create posts
- Only author can update/delete post
- Anonymous posts hide `author_id` (except to admins)

#### comments

Nested comments on posts.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `post_id` (UUID, FK → posts.id, ON DELETE CASCADE)
- `author_id` (UUID, FK → user_profiles.id, ON DELETE CASCADE)
- `parent_id` (UUID, FK → comments.id, ON DELETE CASCADE): For nested comments
- `content` (TEXT, NOT NULL): Comment content
- `is_anonymous` (BOOLEAN, DEFAULT false): Hide author
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign keys on `post_id`, `author_id`, `parent_id`
- Index on `post_id` for listing comments
- Index on `parent_id` for nested comments

**RLS Policies:**
- Anyone can read comments
- Authenticated users can create comments
- Only author can update/delete comment
- Anonymous comments hide `author_id` (except to admins)

#### votes

Upvotes and downvotes on posts.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `post_id` (UUID, FK → posts.id, ON DELETE CASCADE)
- `user_id` (UUID, FK → user_profiles.id, ON DELETE CASCADE)
- `vote_type` (TEXT, CHECK IN ('upvote', 'downvote')): Vote direction
- `created_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign keys on `post_id`, `user_id`
- Unique index on `(post_id, user_id)`: One vote per user per post

**Triggers:**
- Update post `vote_count` on insert/update/delete

**RLS Policies:**
- Users can read all votes
- Users can create their own votes
- Users can update/delete their own votes

### Channel System

#### channels

Official communication channels.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `name` (TEXT, NOT NULL, UNIQUE): Channel name
- `description` (TEXT): Channel description
- `is_official` (BOOLEAN, DEFAULT true): Official channel flag
- `creator_id` (UUID, FK → user_profiles.id): Creator (admin)
- `member_count` (INTEGER, DEFAULT 0): Number of members
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign key on `creator_id`
- Unique index on `name`
- GIN index on `name` for search (trigram)

**Triggers:**
- Auto-increment `member_count` on membership insert
- Auto-decrement `member_count` on membership delete

**RLS Policies:**
- Anyone can read channels
- Only admins can create channels
- Only creator can update/delete channel

#### channel_memberships

Tracks user memberships in channels.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `channel_id` (UUID, FK → channels.id, ON DELETE CASCADE)
- `user_id` (UUID, FK → user_profiles.id, ON DELETE CASCADE)
- `joined_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign keys on `channel_id`, `user_id`
- Unique index on `(channel_id, user_id)`

**RLS Policies:**
- Users can read their own memberships
- Users can create their own memberships
- Users can delete their own memberships

#### channel_messages

Real-time messages in channels.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `channel_id` (UUID, FK → channels.id, ON DELETE CASCADE)
- `author_id` (UUID, FK → user_profiles.id, ON DELETE CASCADE)
- `content` (TEXT, NOT NULL): Message content
- `created_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign keys on `channel_id`, `author_id`
- Index on `channel_id` for listing messages
- Index on `created_at` for sorting

**RLS Policies:**
- Only channel members can read messages
- Only channel members can create messages
- Only author can delete message

### Events System

#### events

Campus events with registration.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `title` (TEXT, NOT NULL): Event title
- `description` (TEXT): Event description
- `event_type` (TEXT, CHECK IN ('social', 'academic', 'sports', 'cultural', 'other')): Event category
- `location` (TEXT): Event location
- `start_time` (TIMESTAMPTZ, NOT NULL): Event start
- `end_time` (TIMESTAMPTZ, NOT NULL): Event end
- `max_participants` (INTEGER): Maximum registrations
- `registration_count` (INTEGER, DEFAULT 0): Current registrations
- `creator_id` (UUID, FK → user_profiles.id): Event creator
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign key on `creator_id`
- Index on `start_time` for sorting
- Index on `event_type` for filtering

**Triggers:**
- Auto-increment `registration_count` on registration insert
- Auto-decrement `registration_count` on registration delete

**RLS Policies:**
- Anyone can read events
- Users with `can_create_events` can create events
- Only creator can update/delete event

#### event_registrations

Event signups with QR codes.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `event_id` (UUID, FK → events.id, ON DELETE CASCADE)
- `user_id` (UUID, FK → user_profiles.id, ON DELETE CASCADE)
- `qr_code` (TEXT): QR code data
- `checked_in` (BOOLEAN, DEFAULT false): Check-in status
- `registered_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign keys on `event_id`, `user_id`
- Unique index on `(event_id, user_id)`: One registration per user per event

**RLS Policies:**
- Users can read their own registrations
- Event creators can read all registrations for their events
- Users can create their own registrations
- Users can delete their own registrations

### Calendar System

#### personal_calendar_events

User personal calendar entries.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `user_id` (UUID, FK → user_profiles.id, ON DELETE CASCADE)
- `title` (TEXT, NOT NULL): Event title
- `description` (TEXT): Event description
- `start_time` (TIMESTAMPTZ, NOT NULL): Event start
- `end_time` (TIMESTAMPTZ, NOT NULL): Event end
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign key on `user_id`
- Index on `user_id` for user's events
- Index on `start_time` for sorting

**RLS Policies:**
- Users can only read their own calendar events
- Users can create their own calendar events
- Users can update/delete their own calendar events

### Admin System

#### moderation_logs

Audit trail for moderation actions.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `moderator_id` (UUID, FK → user_profiles.id): Admin who performed action
- `action_type` (TEXT, NOT NULL): Type of action (delete_post, ban_user, etc.)
- `target_type` (TEXT): Type of target (post, comment, user)
- `target_id` (UUID): ID of target
- `reason` (TEXT): Reason for action
- `created_at` (TIMESTAMPTZ, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Foreign key on `moderator_id`
- Index on `moderator_id` for admin's actions
- Index on `created_at` for sorting

**RLS Policies:**
- Only admins can read moderation logs
- Only admins can create moderation logs

## Query Patterns

### Common Query Patterns

#### Get User Profile
```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('id, email, display_name, avatar_url, is_admin, can_create_events')
  .eq('id', userId)
  .single()
```

#### Get Subforums with Creator
```typescript
const { data: subforums } = await supabase
  .from('subforums')
  .select(`
    id,
    name,
    description,
    member_count,
    created_at,
    user_profiles!subforums_creator_id_fkey(display_name)
  `)
  .order('created_at', { ascending: false })
```

#### Get Posts with Author and Vote Count
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    content,
    is_anonymous,
    vote_count,
    comment_count,
    created_at,
    user_profiles!posts_author_id_fkey(display_name, avatar_url)
  `)
  .eq('subforum_id', subforumId)
  .order('created_at', { ascending: false })
```

#### Get Channel Messages with Author
```typescript
const { data: messages } = await supabase
  .from('channel_messages')
  .select(`
    id,
    content,
    created_at,
    user_profiles!channel_messages_author_id_fkey(display_name, avatar_url)
  `)
  .eq('channel_id', channelId)
  .order('created_at', { ascending: true })
  .limit(100)
```

#### Get Events with Registration Status
```typescript
const { data: events } = await supabase
  .from('events')
  .select(`
    id,
    title,
    description,
    event_type,
    location,
    start_time,
    end_time,
    max_participants,
    registration_count,
    event_registrations!inner(user_id)
  `)
  .eq('event_registrations.user_id', userId)
```

### Known Performance Issues

#### N+1 Query Patterns

**Problem**: Fetching related data in loops

**Example (Bad)**:
```typescript
// Fetches posts
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('subforum_id', subforumId)

// Then fetches author for each post (N+1)
for (const post of posts) {
  const { data: author } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', post.author_id)
    .single()
}
```

**Solution (Good)**:
```typescript
// Single query with join
const { data: posts } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    content,
    user_profiles!posts_author_id_fkey(display_name)
  `)
  .eq('subforum_id', subforumId)
```

#### SELECT * Queries

**Problem**: Fetching all columns when only few are needed

**Example (Bad)**:
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select('*')
```

**Solution (Good)**:
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select('id, title, vote_count, created_at')
```

## Optimization Strategies

### Indexes

All foreign keys have indexes for join performance:
- `subforum_id` on posts, subforum_memberships
- `author_id` on posts, comments, channel_messages
- `user_id` on votes, event_registrations, etc.

Composite indexes for common queries:
- `(subforum_id, created_at)` on posts
- `(channel_id, created_at)` on channel_messages
- `(event_id, user_id)` on event_registrations

Full-text search indexes (trigram):
- `name` on subforums
- `name` on channels

### Connection Pooling

Supabase handles connection pooling automatically:
- Connection pool managed by Supabase
- No manual connection management needed
- Reuse Supabase client instances when possible

### Caching Strategies

**To be implemented:**
- Query result caching for frequently accessed data
- Cache invalidation on data updates
- TTL-based cache expiration

### Batch Operations

**To be implemented:**
- Batch inserts for multiple records
- Batch updates for bulk operations
- Transaction support for related operations

## Row Level Security (RLS)

### RLS Overview

All tables have RLS enabled. Policies control:
- Who can read data
- Who can insert data
- Who can update data
- Who can delete data

### Common RLS Patterns

#### User-Owned Data
```sql
-- Users can only access their own data
CREATE POLICY "Users can read own data"
ON table_name FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

#### Public Read, Authenticated Write
```sql
-- Anyone can read, authenticated users can write
CREATE POLICY "Public read access"
ON table_name FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated write access"
ON table_name FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### Admin-Only Access
```sql
-- Only admins can access
CREATE POLICY "Admin only access"
ON table_name FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
```

#### Anonymous Post Protection
```sql
-- Hide author_id for anonymous posts (except to admins)
CREATE POLICY "Anonymous post protection"
ON posts FOR SELECT
TO authenticated
USING (
  CASE
    WHEN is_anonymous = true THEN
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND is_admin = true
      )
    ELSE true
  END
);
```

## Migrations

### Migration Files

Located in `supabase/migrations/`:

1. **20240101000000_initial_schema.sql**: Create all tables and indexes
2. **20240101000001_rls_policies.sql**: Create RLS policies
3. **20240101000002_enable_search.sql**: Enable full-text search

### Running Migrations

**Via Supabase Dashboard:**
1. Go to SQL Editor
2. Copy migration file content
3. Click "Run"

**Via Supabase CLI:**
```bash
supabase db push
```

### Rollback Procedures

**Manual Rollback:**
1. Identify migration to rollback
2. Write reverse migration SQL
3. Run in SQL Editor

**Example Rollback:**
```sql
-- Rollback table creation
DROP TABLE IF EXISTS table_name CASCADE;

-- Rollback policy creation
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

## Database Maintenance

### Backup Strategy

**Supabase Automatic Backups:**
- Daily backups (retained for 7 days on free tier)
- Point-in-time recovery available on paid tiers

**Manual Backups:**
```bash
# Via Supabase CLI
supabase db dump -f backup.sql
```

### Performance Monitoring

**Supabase Dashboard:**
- Database → Performance
- View slow queries
- Monitor connection pool usage
- Check index usage

**Query Performance:**
```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM posts WHERE subforum_id = 'uuid';
```

### Index Maintenance

**Check Index Usage:**
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**Rebuild Indexes:**
```sql
REINDEX TABLE table_name;
```

## Troubleshooting

### Common Issues

#### RLS Blocking Queries

**Symptom**: Queries return empty results or permission denied

**Solution**:
1. Check if user is authenticated: `SELECT auth.uid()`
2. Verify RLS policy matches query
3. Check user permissions in `user_profiles`

#### Slow Queries

**Symptom**: Queries take > 500ms

**Solution**:
1. Check for N+1 patterns
2. Add missing indexes
3. Use EXPLAIN ANALYZE to identify bottlenecks
4. Optimize SELECT clauses

#### Foreign Key Violations

**Symptom**: Insert/update fails with FK constraint error

**Solution**:
1. Verify referenced record exists
2. Check cascade delete settings
3. Ensure correct UUID format

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Authentication Guide](./AUTHENTICATION.md) - Auth and RLS
- [Performance Guide](./PERFORMANCE.md) - Optimization strategies
- [API Documentation](./API.md) - API routes
