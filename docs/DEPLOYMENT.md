# Deployment Guide

## Overview

This guide covers deploying Unigram to production, including environment setup, database migrations, and monitoring.

## Prerequisites

Before deploying, ensure you have:
- [ ] Completed local development and testing
- [ ] Set up production Supabase project
- [ ] Chosen a hosting platform (Vercel recommended)
- [ ] Configured domain name (optional)
- [ ] Set up error tracking service (optional)

## Hosting Options

### Vercel (Recommended)

**Pros**:
- Optimized for Next.js
- Automatic deployments from Git
- Built-in CDN and edge functions
- Free tier available
- Easy environment variable management

**Cons**:
- Vendor lock-in
- Limited customization

### Other Options

- **Netlify**: Similar to Vercel, good Next.js support
- **AWS Amplify**: More control, AWS integration
- **Self-hosted**: Full control, requires more setup (Docker, Kubernetes)

## Deployment Steps

### 1. Prepare Production Environment

#### Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project for production
3. Choose appropriate region (close to users)
4. Use strong database password
5. Note project URL and anon key

#### Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order:

```sql
-- 1. Initial schema
-- Copy content from supabase/migrations/20240101000000_initial_schema.sql

-- 2. RLS policies
-- Copy content from supabase/migrations/20240101000001_rls_policies.sql

-- 3. Enable search
-- Copy content from supabase/migrations/20240101000002_enable_search.sql
```

3. Verify schema:
```sql
-- Run verification script
-- Copy content from supabase/verify_schema.sql
```

#### Configure Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates
4. Set up redirect URLs:
   - Add production URL: `https://yourdomain.com`
   - Add callback: `https://yourdomain.com/auth/callback`
5. Configure SMTP (recommended for production):
   - Go to Settings → Auth → SMTP Settings
   - Configure your email provider (SendGrid, AWS SES, etc.)

### 2. Deploy to Vercel

#### Initial Setup

1. **Install Vercel CLI** (optional):
```bash
npm install -g vercel
```

2. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Select Next.js framework preset

3. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

#### Environment Variables

Add these environment variables in Vercel dashboard:

**Required**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Optional** (for Hygraph CMS):
```env
NEXT_PUBLIC_HYGRAPH_URL=https://your-region.hygraph.com/v2/your-project-id/master
HYGRAPH_TOKEN=your-token
```

**Optional** (for monitoring):
```env
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

#### Deploy

**Via Vercel Dashboard**:
1. Click "Deploy"
2. Wait for build to complete
3. Visit deployment URL

**Via CLI**:
```bash
vercel --prod
```

### 3. Post-Deployment Verification

#### Health Checks

1. **Test Authentication**:
   - Visit `/register`
   - Create test account
   - Verify email
   - Login successfully

2. **Test Core Features**:
   - Create subforum
   - Create post
   - Join channel
   - Create event
   - View wiki

3. **Test Performance**:
   - Run Lighthouse audit
   - Check page load times
   - Verify database queries

#### Create Admin User

1. Register your admin account
2. Go to Supabase Dashboard → SQL Editor
3. Run:
```sql
UPDATE public.user_profiles 
SET is_admin = true, can_create_events = true 
WHERE email = 'your-admin@tum.de';
```

## Environment Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGc...` |

#### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_HYGRAPH_URL` | Hygraph API endpoint | `https://api.hygraph.com/...` |
| `HYGRAPH_TOKEN` | Hygraph auth token | `eyJhbGc...` |
| `SENTRY_DSN` | Sentry error tracking | `https://...@sentry.io/...` |
| `NEXT_PUBLIC_ANALYTICS_ID` | Analytics tracking ID | `G-XXXXXXXXXX` |
| `NODE_ENV` | Environment mode | `production` |

### Security Configuration

#### Security Headers

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

#### CORS Configuration

CORS is handled by Next.js API routes. For custom CORS:

```typescript
// middleware.ts or API route
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}
```

## Database Management

### Backup Strategy

#### Automatic Backups

Supabase provides automatic backups:
- **Free tier**: Daily backups (7 days retention)
- **Pro tier**: Daily backups (30 days retention) + point-in-time recovery

#### Manual Backups

**Via Supabase CLI**:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Create backup
supabase db dump -f backup-$(date +%Y%m%d).sql
```

**Via pg_dump** (if you have direct database access):
```bash
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup.sql
```

### Migration Management

#### Understanding Migrations

Database migrations are version-controlled changes to your database schema. They allow you to:
- Track schema changes over time
- Apply changes consistently across environments
- Rollback changes if needed
- Collaborate with team members safely

**Migration Files Location**: `supabase/migrations/`

**Naming Convention**: `YYYYMMDDHHMMSS_description.sql`
- Timestamp ensures correct ordering
- Description explains what the migration does

#### Initial Database Setup

For a new production database, run migrations in this exact order:

1. **Initial Schema** (`20240101000000_initial_schema.sql`):
   - Creates all 15 database tables
   - Sets up basic indexes
   - Creates automated triggers
   - Creates helper functions

2. **RLS Policies** (`20240101000001_rls_policies.sql`):
   - Enables Row Level Security
   - Creates 70+ security policies
   - Adds helper functions

3. **Search Capabilities** (`20240101000002_enable_search.sql`):
   - Enables pg_trgm extension
   - Creates trigram indexes
   - Adds search helper functions

4. **Auto-Create User Profiles** (`20240101000003_auto_create_user_profiles.sql`):
   - Sets up automatic profile creation on signup

**See**: `supabase/MIGRATION_ORDER.md` for detailed instructions

#### Creating New Migrations

**Step 1: Plan Your Migration**

Before writing code, document:
- What tables/columns will change
- What data will be affected
- What indexes are needed
- What RLS policies need updating
- How to rollback the change

**Step 2: Create Migration File**

```bash
# Generate timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Create migration file
touch supabase/migrations/${TIMESTAMP}_add_feature.sql
```

**Step 3: Write Migration**

```sql
-- Migration: Add pinned posts feature
-- Date: 2024-01-15
-- Author: Your Name
-- Description: Allows moderators to pin important posts to the top of subforums

-- Add column with default value
ALTER TABLE posts 
ADD COLUMN pinned BOOLEAN DEFAULT false NOT NULL;

-- Add index for efficient querying of pinned posts
CREATE INDEX idx_posts_pinned 
ON posts(subforum_id, pinned, created_at DESC) 
WHERE pinned = true;

-- Add RLS policy for pinned posts
CREATE POLICY "Anyone can read pinned posts"
ON posts FOR SELECT
TO authenticated
USING (pinned = true OR author_id = auth.uid());

-- Add helper function
CREATE OR REPLACE FUNCTION pin_post(post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only moderators can pin posts
  IF NOT is_admin() THEN
    RETURN false;
  END IF;
  
  UPDATE posts SET pinned = true WHERE id = post_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON COLUMN posts.pinned IS 'Whether this post is pinned to the top of the subforum';
```

**Step 4: Test Locally**

```bash
# Reset local database and apply all migrations
supabase db reset

# Or apply just the new migration
supabase db push

# Verify migration
supabase db diff
```

**Step 5: Test Migration Logic**

```sql
-- Test adding pinned posts
INSERT INTO posts (subforum_id, author_id, title, content, pinned)
VALUES ('...', '...', 'Test Pinned Post', 'Content', true);

-- Test querying pinned posts
SELECT * FROM posts WHERE pinned = true;

-- Test RLS policies
SET ROLE authenticated;
SELECT * FROM posts WHERE pinned = true;
```

**Step 6: Create Rollback Migration**

Always create a rollback migration before applying to production:

```sql
-- Rollback: Remove pinned posts feature
-- Date: 2024-01-15
-- Description: Rollback for migration 20240115120000_add_feature.sql

-- Drop helper function
DROP FUNCTION IF EXISTS pin_post(UUID);

-- Drop RLS policy
DROP POLICY IF EXISTS "Anyone can read pinned posts" ON posts;

-- Drop index
DROP INDEX IF EXISTS idx_posts_pinned;

-- Remove column (WARNING: This will delete data!)
ALTER TABLE posts DROP COLUMN IF EXISTS pinned;

-- Add comment
COMMENT ON TABLE posts IS 'Rolled back pinned posts feature';
```

Save as: `supabase/migrations/YYYYMMDDHHMMSS_rollback_add_feature.sql`

**Step 7: Apply to Production**

**Option A: Via Supabase Dashboard** (Recommended for safety):

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy migration content
4. Review carefully
5. Click "Run"
6. Verify changes

**Option B: Via Supabase CLI**:

```bash
# Link to production project
supabase link --project-ref your-production-ref

# Push migration
supabase db push

# Verify
supabase db diff
```

**Step 8: Verify in Production**

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'pinned';

-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'posts' AND indexname = 'idx_posts_pinned';

-- Check function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'pin_post';

-- Test functionality
SELECT * FROM posts WHERE pinned = true LIMIT 1;
```

**Step 9: Document Migration**

Update CHANGELOG.md:
```markdown
### Changed
- Added pinned posts feature for moderators (#123)
```

#### Migration Best Practices

**DO**:
- ✅ Always test migrations locally first
- ✅ Create rollback migrations before applying
- ✅ Use transactions when possible
- ✅ Add comments explaining complex logic
- ✅ Use `IF EXISTS` / `IF NOT EXISTS` for safety
- ✅ Set default values for new columns
- ✅ Create indexes for new query patterns
- ✅ Update RLS policies for new columns
- ✅ Document breaking changes clearly
- ✅ Backup database before major migrations

**DON'T**:
- ❌ Don't modify existing migration files
- ❌ Don't delete data without explicit confirmation
- ❌ Don't skip testing in staging/local
- ❌ Don't apply migrations during peak hours
- ❌ Don't forget to update RLS policies
- ❌ Don't use `CASCADE` without understanding impact
- ❌ Don't hardcode values (use variables)
- ❌ Don't skip rollback planning

#### Common Migration Patterns

**Adding a Column**:
```sql
-- Add column with default value (safe, no downtime)
ALTER TABLE posts 
ADD COLUMN view_count INTEGER DEFAULT 0 NOT NULL;

-- Add index if needed
CREATE INDEX idx_posts_view_count ON posts(view_count);
```

**Removing a Column**:
```sql
-- Step 1: Stop using column in application code
-- Step 2: Deploy application without column references
-- Step 3: Remove column in migration
ALTER TABLE posts DROP COLUMN IF EXISTS old_column;
```

**Renaming a Column**:
```sql
-- Option 1: Rename (requires downtime)
ALTER TABLE posts RENAME COLUMN old_name TO new_name;

-- Option 2: Add new, migrate data, remove old (zero downtime)
-- Migration 1: Add new column
ALTER TABLE posts ADD COLUMN new_name TEXT;
UPDATE posts SET new_name = old_name;

-- Migration 2 (after deploying code): Remove old column
ALTER TABLE posts DROP COLUMN old_name;
```

**Adding a Foreign Key**:
```sql
-- Add foreign key with validation
ALTER TABLE posts
ADD CONSTRAINT fk_posts_subforum
FOREIGN KEY (subforum_id)
REFERENCES subforums(id)
ON DELETE CASCADE;

-- Add index for foreign key
CREATE INDEX idx_posts_subforum_id ON posts(subforum_id);
```

**Modifying Data**:
```sql
-- Use transactions for data modifications
BEGIN;

-- Update data
UPDATE posts 
SET status = 'published' 
WHERE status IS NULL;

-- Verify changes
SELECT COUNT(*) FROM posts WHERE status = 'published';

-- Commit if correct, rollback if not
COMMIT;
-- or ROLLBACK;
```

#### Migration Troubleshooting

**Error: "relation already exists"**
```sql
-- Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS new_table (...);
```

**Error: "column already exists"**
```sql
-- Use IF NOT EXISTS (PostgreSQL 9.6+)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS new_column TEXT;
```

**Error: "constraint already exists"**
```sql
-- Drop and recreate
ALTER TABLE posts DROP CONSTRAINT IF EXISTS constraint_name;
ALTER TABLE posts ADD CONSTRAINT constraint_name ...;
```

**Error: "cannot drop column because other objects depend on it"**
```sql
-- Use CASCADE (careful!)
ALTER TABLE posts DROP COLUMN old_column CASCADE;

-- Or manually drop dependent objects first
DROP VIEW IF EXISTS posts_view;
ALTER TABLE posts DROP COLUMN old_column;
CREATE VIEW posts_view AS ...;
```

#### Migration Checklist

Use this checklist for every migration:

```markdown
## Migration Checklist

**Migration**: YYYYMMDDHHMMSS_description.sql
**Date**: YYYY-MM-DD
**Author**: Your Name

### Pre-Migration
- [ ] Migration file created with correct naming
- [ ] Migration tested locally
- [ ] Rollback migration created
- [ ] Rollback tested locally
- [ ] Breaking changes documented
- [ ] Team notified of planned migration
- [ ] Database backup verified
- [ ] Migration scheduled (avoid peak hours)

### Migration Content
- [ ] Uses transactions where appropriate
- [ ] Uses IF EXISTS / IF NOT EXISTS
- [ ] Includes comments explaining changes
- [ ] Updates RLS policies if needed
- [ ] Creates indexes for new query patterns
- [ ] Sets default values for new columns
- [ ] No hardcoded values

### Execution
- [ ] Applied to staging (if available)
- [ ] Verified in staging
- [ ] Applied to production
- [ ] Verified in production
- [ ] Application still works
- [ ] No errors in logs

### Post-Migration
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Team notified of completion
- [ ] Monitoring for issues
- [ ] Rollback migration kept ready

### Rollback (if needed)
- [ ] Rollback migration applied
- [ ] Changes verified
- [ ] Application still works
- [ ] Issue documented for post-mortem
```

#### Advanced Migration Scenarios

**Zero-Downtime Column Type Change**:
```sql
-- Step 1: Add new column
ALTER TABLE posts ADD COLUMN view_count_new BIGINT;

-- Step 2: Backfill data
UPDATE posts SET view_count_new = view_count::BIGINT;

-- Step 3: Deploy code using new column

-- Step 4: Drop old column
ALTER TABLE posts DROP COLUMN view_count;

-- Step 5: Rename new column
ALTER TABLE posts RENAME COLUMN view_count_new TO view_count;
```

**Large Data Migration**:
```sql
-- Use batching for large updates
DO $$
DECLARE
  batch_size INTEGER := 1000;
  offset_val INTEGER := 0;
  rows_updated INTEGER;
BEGIN
  LOOP
    UPDATE posts
    SET processed = true
    WHERE id IN (
      SELECT id FROM posts
      WHERE processed = false
      LIMIT batch_size
    );
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;
    
    offset_val := offset_val + batch_size;
    RAISE NOTICE 'Processed % rows', offset_val;
    
    -- Small delay to avoid overwhelming database
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
```

## Monitoring and Logging

### Error Tracking

#### Sentry Integration

1. **Install Sentry**:
```bash
npm install @sentry/nextjs
```

2. **Configure Sentry**:
```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

3. **Add to pages**:
```typescript
// app/error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  
  return <div>Something went wrong!</div>
}
```

### Performance Monitoring

#### Vercel Analytics

Automatically enabled on Vercel:
- Web Vitals tracking
- Page load times
- API response times

#### Custom Monitoring

```typescript
// lib/monitoring/logger.ts
export function logPerformance(metric: {
  name: string
  value: number
  timestamp: Date
}) {
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service
    fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(metric)
    })
  } else {
    console.log('Performance:', metric)
  }
}
```

### Health Check Endpoint

**Create health check**:
```typescript
// app/api/health/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check database connection
    const supabase = await createClient()
    const { error } = await supabase.from('user_profiles').select('id').limit(1)
    
    if (error) throw error
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: true,
        authentication: true
      }
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 })
  }
}
```

**Monitor health**:
```bash
# Check health
curl https://yourdomain.com/api/health

# Set up monitoring (e.g., UptimeRobot, Pingdom)
```

## Scaling Considerations

### Database Scaling

**Supabase Scaling**:
- Free tier: Suitable for development and small apps
- Pro tier: Increased resources, better performance
- Enterprise: Dedicated resources, custom scaling

**Optimization**:
- Add database indexes for slow queries
- Implement query result caching
- Use connection pooling (handled by Supabase)
- Consider read replicas for high traffic

### Application Scaling

**Vercel Scaling**:
- Automatic scaling based on traffic
- Edge functions for global performance
- CDN for static assets

**Optimization**:
- Implement caching strategies
- Use Server Components for better performance
- Optimize bundle size
- Lazy load heavy components

## Rollback Procedures

### When to Rollback

Consider rolling back when:
- Critical bugs discovered in production
- Performance degradation after deployment
- Data integrity issues
- Security vulnerabilities introduced
- User-facing features broken

### Pre-Rollback Checklist

Before initiating a rollback:
- [ ] Identify the issue and confirm rollback is necessary
- [ ] Determine the last known good version
- [ ] Notify team members of planned rollback
- [ ] Document the issue for post-mortem
- [ ] Prepare communication for users (if needed)
- [ ] Verify backup availability (for database rollbacks)

### Application Rollback

#### Via Vercel Dashboard (Recommended)

1. **Navigate to Deployments**:
   - Go to [vercel.com](https://vercel.com)
   - Select your project
   - Click "Deployments" tab

2. **Find Previous Working Deployment**:
   - Review deployment list
   - Identify last known good deployment
   - Check deployment timestamp and commit

3. **Promote to Production**:
   - Click "..." menu on the deployment
   - Select "Promote to Production"
   - Confirm promotion

4. **Verify Rollback**:
   - Visit production URL
   - Test critical functionality
   - Check health endpoint: `/api/health`
   - Monitor error rates

**Time to Complete**: ~2-5 minutes

#### Via Vercel CLI

```bash
# List recent deployments
vercel ls

# Example output:
# Age  Deployment                          Status
# 2m   unigram-abc123.vercel.app          Ready
# 1h   unigram-def456.vercel.app          Ready (Current)
# 2h   unigram-ghi789.vercel.app          Ready

# Rollback to specific deployment
vercel rollback unigram-abc123.vercel.app

# Or rollback to previous deployment
vercel rollback
```

**Time to Complete**: ~1-2 minutes

#### Via Git Revert (For Permanent Fix)

If you need to permanently revert changes:

```bash
# Revert specific commit
git revert <commit-hash>

# Or revert multiple commits
git revert <commit-hash-1> <commit-hash-2>

# Push to trigger new deployment
git push origin main
```

**Time to Complete**: ~5-10 minutes (includes build time)

### Database Rollback

#### Option 1: Rollback Migration (Preferred)

**When to Use**: 
- Schema changes that can be reversed
- No data loss acceptable
- Changes are recent and well-documented

**Steps**:

1. **Create Rollback Migration**:
```sql
-- Example: Rollback adding a column
-- File: supabase/migrations/20240115120001_rollback_add_pinned.sql

-- Remove column
ALTER TABLE posts DROP COLUMN IF EXISTS pinned;

-- Remove index
DROP INDEX IF EXISTS idx_posts_pinned;

-- Remove RLS policy
DROP POLICY IF EXISTS "Users can read pinned posts" ON posts;

-- Add comment for documentation
COMMENT ON TABLE posts IS 'Rolled back pinned column addition';
```

2. **Test Locally**:
```bash
# Apply rollback migration locally
supabase db reset
supabase db push
```

3. **Apply to Production**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy rollback migration content
   - Run migration
   - Verify changes

4. **Verify Rollback**:
```sql
-- Check column doesn't exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'pinned';
-- Should return no rows

-- Check index doesn't exist
SELECT indexname 
FROM pg_indexes 
WHERE indexname = 'idx_posts_pinned';
-- Should return no rows
```

**Time to Complete**: ~5-15 minutes

#### Option 2: Point-in-Time Recovery (Pro/Enterprise Only)

**When to Use**:
- Need to restore to specific point in time
- Data corruption occurred
- Multiple changes need to be reverted
- Have Supabase Pro or Enterprise plan

**Steps**:

1. **Determine Recovery Point**:
   - Identify exact timestamp before issue
   - Ensure timestamp is within retention period
   - Document what will be lost

2. **Initiate Recovery**:
   - Go to Supabase Dashboard → Database → Backups
   - Click "Point-in-Time Recovery"
   - Select timestamp
   - Review impact warning

3. **Confirm Recovery**:
   - Enter project name to confirm
   - Click "Restore"
   - Wait for restoration (can take 10-30 minutes)

4. **Verify Data**:
   - Check critical tables
   - Verify data integrity
   - Test application functionality

**Time to Complete**: ~15-45 minutes

**Warning**: All data created after the recovery point will be lost!

#### Option 3: Backup Restore (Last Resort)

**When to Use**:
- Point-in-time recovery not available
- Need to restore from daily backup
- Catastrophic data loss

**Steps**:

1. **Select Backup**:
   - Go to Supabase Dashboard → Database → Backups
   - Review available backups
   - Select most recent backup before issue

2. **Download Backup** (Optional):
```bash
# Download backup for safety
supabase db dump -f backup-before-restore.sql
```

3. **Restore Backup**:
   - Click "Restore" on selected backup
   - Confirm restoration
   - Wait for completion (10-30 minutes)

4. **Verify Restoration**:
```sql
-- Check table counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Verify critical data
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM posts;
SELECT COUNT(*) FROM events;
```

**Time to Complete**: ~15-45 minutes

**Warning**: All data created after the backup will be lost!

### Combined Rollback (Application + Database)

When both application and database changes need to be rolled back:

1. **Rollback Database First**:
   - Apply database rollback migration
   - Or restore from backup
   - Verify database state

2. **Then Rollback Application**:
   - Promote previous deployment
   - Or revert git commits
   - Verify application works with rolled-back database

3. **Verify Integration**:
   - Test critical user flows
   - Check data consistency
   - Monitor error rates
   - Review health endpoint

**Time to Complete**: ~20-60 minutes

### Post-Rollback Actions

After completing a rollback:

1. **Verify System Health**:
   - [ ] Check health endpoint: `/api/health`
   - [ ] Test authentication flow
   - [ ] Verify core features work
   - [ ] Monitor error rates for 30 minutes
   - [ ] Check database query performance

2. **Communication**:
   - [ ] Notify team of completed rollback
   - [ ] Update status page (if applicable)
   - [ ] Communicate with affected users (if needed)

3. **Documentation**:
   - [ ] Document what went wrong
   - [ ] Record rollback steps taken
   - [ ] Update CHANGELOG.md
   - [ ] Create post-mortem document

4. **Prevention**:
   - [ ] Identify root cause
   - [ ] Create fix for the issue
   - [ ] Add tests to prevent recurrence
   - [ ] Update deployment checklist
   - [ ] Review and improve testing process

### Rollback Testing

Test your rollback procedures regularly:

**Monthly Rollback Drill**:
1. Deploy to staging environment
2. Practice rolling back application
3. Practice rolling back database
4. Document time taken and issues
5. Update procedures based on learnings

**Rollback Checklist Template**:
```markdown
## Rollback Checklist

**Date**: YYYY-MM-DD
**Issue**: Brief description
**Rollback Type**: Application / Database / Both
**Last Known Good Version**: v1.2.3 / Deployment URL

### Pre-Rollback
- [ ] Issue confirmed and documented
- [ ] Team notified
- [ ] Backup verified (for database rollback)
- [ ] Rollback plan reviewed

### Rollback Execution
- [ ] Application rolled back (if needed)
- [ ] Database rolled back (if needed)
- [ ] Changes verified

### Post-Rollback
- [ ] Health checks passed
- [ ] Core features tested
- [ ] Error rates normal
- [ ] Team notified of completion
- [ ] Post-mortem scheduled

### Time Tracking
- Issue detected: HH:MM
- Rollback started: HH:MM
- Rollback completed: HH:MM
- Total downtime: X minutes
```

### Emergency Contacts

Maintain a list of emergency contacts for rollback scenarios:

- **Database Issues**: Supabase Support (support@supabase.io)
- **Hosting Issues**: Vercel Support (support@vercel.com)
- **Team Lead**: [Name] ([email])
- **On-Call Engineer**: [Name] ([phone])

### Rollback Decision Matrix

| Severity | Impact | Action | Timeline |
|----------|--------|--------|----------|
| Critical | All users affected, data loss risk | Immediate rollback | < 15 min |
| High | Major features broken, no data loss | Rollback within 1 hour | < 1 hour |
| Medium | Minor features broken, workaround exists | Fix forward or rollback | < 4 hours |
| Low | Cosmetic issues, no functionality impact | Fix forward | Next deployment |

## Troubleshooting Deployment

### Build Failures

**Check build logs**:
```bash
# Via Vercel CLI
vercel logs [deployment-url]
```

**Common issues**:
- Missing environment variables
- TypeScript errors
- Dependency issues
- Build timeout

**Solutions**:
1. Verify all environment variables are set
2. Run `npm run build` locally
3. Check `package.json` for correct dependencies
4. Increase build timeout in Vercel settings

### Runtime Errors

**Check runtime logs**:
- Vercel Dashboard → Deployments → [deployment] → Logs
- Sentry error tracking

**Common issues**:
- Database connection errors
- Authentication failures
- API rate limits
- Memory issues

**Solutions**:
1. Verify environment variables
2. Check Supabase connection
3. Review error logs
4. Check resource usage

### Performance Issues

**Symptoms**:
- Slow page loads
- High response times
- Timeout errors

**Solutions**:
1. Run Lighthouse audit
2. Check database query performance
3. Implement caching
4. Optimize bundle size
5. Use CDN for static assets

## Maintenance

### Regular Tasks

**Daily**:
- [ ] Monitor error rates
- [ ] Check health endpoint
- [ ] Review performance metrics

**Weekly**:
- [ ] Review slow queries
- [ ] Check database size
- [ ] Update dependencies (security patches)
- [ ] Review user feedback

**Monthly**:
- [ ] Full backup verification
- [ ] Performance audit
- [ ] Security review
- [ ] Dependency updates

### Update Procedures

**Application Updates**:
1. Create feature branch
2. Develop and test locally
3. Create pull request
4. Review and merge
5. Automatic deployment via Vercel

**Database Updates**:
1. Create migration file
2. Test locally
3. Apply to staging (if available)
4. Apply to production
5. Verify changes

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Performance Guide](./PERFORMANCE.md) - Optimization strategies
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues
- [Contributing Guide](./CONTRIBUTING.md) - Development workflow
