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

#### Creating New Migrations

1. **Create migration file**:
```bash
# Format: YYYYMMDDHHMMSS_description.sql
touch supabase/migrations/20240115120000_add_feature.sql
```

2. **Write migration**:
```sql
-- Add new column
ALTER TABLE posts ADD COLUMN pinned BOOLEAN DEFAULT false;

-- Add index
CREATE INDEX idx_posts_pinned ON posts(pinned) WHERE pinned = true;

-- Update RLS policy
CREATE POLICY "Users can read pinned posts"
ON posts FOR SELECT
TO authenticated
USING (pinned = true OR author_id = auth.uid());
```

3. **Test locally**:
```bash
supabase db reset
```

4. **Apply to production**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy migration content
   - Run migration

#### Rollback Procedures

**Create rollback migration**:
```sql
-- Rollback: Remove pinned column
ALTER TABLE posts DROP COLUMN IF EXISTS pinned;

-- Rollback: Remove index
DROP INDEX IF EXISTS idx_posts_pinned;

-- Rollback: Remove policy
DROP POLICY IF EXISTS "Users can read pinned posts" ON posts;
```

**Apply rollback**:
1. Go to SQL Editor
2. Run rollback migration
3. Verify data integrity

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

### Application Rollback

**Via Vercel Dashboard**:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Via CLI**:
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Database Rollback

**Via Migration**:
1. Create rollback migration
2. Test locally
3. Apply to production via SQL Editor

**Via Backup Restore**:
1. Go to Supabase Dashboard → Database → Backups
2. Select backup to restore
3. Click "Restore"
4. Confirm restoration

**Warning**: Restoring from backup will lose data created after backup.

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
