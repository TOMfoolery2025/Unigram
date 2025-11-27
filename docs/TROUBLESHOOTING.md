# Troubleshooting Guide

## Overview

This guide covers common issues you may encounter while developing or running Unigram, along with their solutions.

## Authentication Issues

### Issue: "Invalid API key" Error

**Symptoms**:
- Error message: "Invalid API key"
- Unable to connect to Supabase
- Authentication fails immediately

**Causes**:
- Incorrect environment variables
- Using service role key instead of anon key
- Environment variables not loaded

**Solutions**:

1. **Verify environment variables**:
```bash
# Check .env.local exists
ls -la .env.local

# Verify contents (don't commit this file!)
cat .env.local
```

2. **Check you're using the anon key**:
   - Go to Supabase Dashboard → Settings → API
   - Copy the "anon public" key (NOT the service_role key)
   - Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (anon key)
```

3. **Restart development server**:
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### Issue: Email Verification Not Working

**Symptoms**:
- Verification email not received
- Email received but link doesn't work
- Redirected to wrong page after verification

**Solutions**:

1. **Check spam folder**:
   - Verification emails may be marked as spam
   - Add Supabase to safe senders

2. **Verify redirect URLs**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your site URL: `http://localhost:3000` (development)
   - Add callback URL: `http://localhost:3000/auth/callback`
   - For production, add production URLs

3. **Check email template**:
   - Go to Authentication → Email Templates
   - Verify "Confirm signup" template is enabled
   - Check redirect URL in template: `{{ .ConfirmationURL }}`

4. **Resend verification email**:
```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@tum.de'
})
```

### Issue: Infinite Redirect Loop

**Symptoms**:
- Page keeps redirecting
- Browser shows "too many redirects" error
- Unable to access any page

**Causes**:
- Middleware redirect logic issue
- Cookie not being set
- Session not persisting

**Solutions**:

1. **Clear browser cookies**:
   - Open DevTools → Application → Cookies
   - Delete all cookies for localhost
   - Refresh page

2. **Check middleware configuration**:
```typescript
// middleware.ts
// Verify public routes are correctly defined
const publicRoutes = ["/login", "/register", "/wiki", "/auth/callback"]
```

3. **Verify cookie settings**:
   - Check browser allows cookies
   - Disable browser extensions that block cookies
   - Try incognito mode

4. **Check for conflicting redirects**:
   - Review middleware logic
   - Check for redirects in page components
   - Verify auth state is correct

### Issue: Session Not Persisting

**Symptoms**:
- User logged out after page refresh
- Session expires immediately
- "Not authenticated" errors

**Solutions**:

1. **Check cookie settings**:
```typescript
// Verify cookies are being set with correct options
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 days
}
```

2. **Verify Supabase client creation**:
```typescript
// Ensure client is created correctly
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
```

3. **Check for session refresh**:
```typescript
// Middleware should refresh expired sessions
const { data: { user } } = await supabase.auth.getUser()
```

## Database Issues

### Issue: RLS Policy Blocking Queries

**Symptoms**:
- Queries return empty results
- "Permission denied" errors
- Data not visible to users

**Solutions**:

1. **Verify user is authenticated**:
```sql
-- Check current user
SELECT auth.uid();

-- Should return user UUID, not NULL
```

2. **Check RLS policies**:
```sql
-- View policies for table
SELECT * FROM pg_policies WHERE tablename = 'posts';

-- Verify policy matches your query
```

3. **Test policy logic**:
```sql
-- Test if user meets policy conditions
SELECT EXISTS (
  SELECT 1 FROM user_profiles
  WHERE id = auth.uid()
  AND is_admin = true
);
```

4. **Temporarily disable RLS for testing**:
```sql
-- ONLY FOR TESTING - DO NOT USE IN PRODUCTION
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
```

### Issue: Slow Database Queries

**Symptoms**:
- Queries take > 500ms
- Page loads slowly
- Timeout errors

**Solutions**:

1. **Identify slow queries**:
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM posts WHERE subforum_id = 'uuid';
```

2. **Check for N+1 patterns**:
```typescript
// Bad: N+1 query
for (const post of posts) {
  const author = await fetchAuthor(post.author_id)
}

// Good: Single query with join
const posts = await supabase
  .from('posts')
  .select('*, user_profiles(*)')
```

3. **Add missing indexes**:
```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes 
WHERE schemaname = 'public';

-- Add index if needed
CREATE INDEX idx_posts_subforum_id ON posts(subforum_id);
```

4. **Optimize SELECT clauses**:
```typescript
// Bad: Select all columns
.select('*')

// Good: Select only needed columns
.select('id, title, vote_count, created_at')
```

### Issue: Foreign Key Constraint Violations

**Symptoms**:
- Insert/update fails with FK error
- "violates foreign key constraint" message

**Solutions**:

1. **Verify referenced record exists**:
```sql
-- Check if parent record exists
SELECT id FROM user_profiles WHERE id = 'user-uuid';
```

2. **Check UUID format**:
```typescript
// Ensure UUID is valid format
const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
```

3. **Review cascade settings**:
```sql
-- Check FK constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## Build and Development Issues

### Issue: Build Fails

**Symptoms**:
- `npm run build` fails
- TypeScript errors
- Module not found errors

**Solutions**:

1. **Check TypeScript errors**:
```bash
# Run type check
npx tsc --noEmit

# Fix reported errors
```

2. **Verify dependencies**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

3. **Check for missing imports**:
```typescript
// Ensure all imports are correct
import { createClient } from '@/lib/supabase/client'
```

4. **Clear Next.js cache**:
```bash
rm -rf .next
npm run build
```

### Issue: Hot Reload Not Working

**Symptoms**:
- Changes not reflected in browser
- Need to manually refresh
- Dev server not detecting changes

**Solutions**:

1. **Restart dev server**:
```bash
# Stop server (Ctrl+C)
npm run dev
```

2. **Check file watchers**:
```bash
# Increase file watchers (Linux/Mac)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or open DevTools → Network → Disable cache

4. **Check for syntax errors**:
   - Review console for errors
   - Fix any syntax errors in files

### Issue: Module Not Found

**Symptoms**:
- "Cannot find module" error
- Import errors
- Path resolution issues

**Solutions**:

1. **Check import paths**:
```typescript
// Use @ alias for absolute imports
import { Button } from '@/components/ui/button'

// Not relative paths from root
import { Button } from '../../components/ui/button'
```

2. **Verify tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

3. **Install missing dependencies**:
```bash
npm install missing-package
```

4. **Check file exists**:
```bash
ls -la components/ui/button.tsx
```

## Performance Issues

### Issue: Slow Page Load

**Symptoms**:
- Pages take > 3s to load
- High LCP/FCP times
- Poor Lighthouse scores

**Solutions**:

1. **Check bundle size**:
```bash
npm run build
# Review .next/analyze/ output
```

2. **Optimize images**:
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/image.jpg"
  width={500}
  height={300}
  alt="Description"
/>
```

3. **Implement code splitting**:
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
})
```

4. **Add loading states**:
```typescript
// app/page/loading.tsx
export default function Loading() {
  return <div>Loading...</div>
}
```

### Issue: High Memory Usage

**Symptoms**:
- Browser tab using > 500MB
- Slow interactions
- Browser becomes unresponsive

**Solutions**:

1. **Check for memory leaks**:
```typescript
// Clean up subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('channel')
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

2. **Limit data fetched**:
```typescript
// Use pagination
.range(0, 19) // Fetch only 20 items
```

3. **Use virtualization for long lists**:
```bash
npm install react-window
```

4. **Profile memory usage**:
   - Open DevTools → Memory
   - Take heap snapshot
   - Identify large objects

## Real-time Issues

### Issue: Messages Not Updating in Real-time

**Symptoms**:
- New messages don't appear
- Need to refresh to see updates
- Subscription not working

**Solutions**:

1. **Check subscription setup**:
```typescript
const subscription = supabase
  .channel(`channel:${channelId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'channel_messages',
    filter: `channel_id=eq.${channelId}`
  }, (payload) => {
    console.log('New message:', payload)
    // Update state
  })
  .subscribe()
```

2. **Verify RLS policies allow real-time**:
```sql
-- Check if user can read messages
SELECT * FROM channel_messages 
WHERE channel_id = 'channel-uuid';
```

3. **Check subscription status**:
```typescript
subscription.on('subscribe', (status) => {
  console.log('Subscription status:', status)
})
```

4. **Enable Realtime in Supabase**:
   - Go to Database → Replication
   - Enable replication for table
   - Add table to publication

### Issue: Too Many Subscriptions

**Symptoms**:
- "Too many subscriptions" error
- Connection limit reached
- Subscriptions fail to connect

**Solutions**:

1. **Clean up old subscriptions**:
```typescript
// Always unsubscribe on unmount
useEffect(() => {
  const sub = supabase.channel('channel').subscribe()
  return () => sub.unsubscribe()
}, [])
```

2. **Limit subscription scope**:
```typescript
// Subscribe to specific channel, not all messages
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'channel_messages',
  filter: `channel_id=eq.${channelId}` // Add filter
}, handleMessage)
```

3. **Use single subscription for multiple tables**:
```typescript
const subscription = supabase
  .channel('combined')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePost)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, handleComment)
  .subscribe()
```

## Production Issues

### Issue: Environment Variables Not Working

**Symptoms**:
- "undefined" for environment variables
- Features not working in production
- Different behavior than local

**Solutions**:

1. **Verify variables are set**:
   - Vercel: Dashboard → Settings → Environment Variables
   - Check all required variables are present

2. **Use correct prefix**:
```typescript
// Client-side variables need NEXT_PUBLIC_ prefix
process.env.NEXT_PUBLIC_SUPABASE_URL

// Server-side can use any name
process.env.DATABASE_URL
```

3. **Redeploy after adding variables**:
   - Environment variables require redeployment
   - Vercel: Deployments → Redeploy

4. **Check variable names match**:
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...

# Code
process.env.NEXT_PUBLIC_SUPABASE_URL // Must match exactly
```

### Issue: CORS Errors in Production

**Symptoms**:
- "CORS policy" errors
- API requests blocked
- Cross-origin errors

**Solutions**:

1. **Add domain to Supabase**:
   - Go to Authentication → URL Configuration
   - Add production domain
   - Add callback URLs

2. **Configure CORS headers**:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ]
  },
}
```

3. **Check API route configuration**:
```typescript
// app/api/route.ts
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
```

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Review error messages carefully**
3. **Check browser console for errors**
4. **Review Supabase logs**
5. **Try the issue in incognito mode**
6. **Search existing issues on GitHub**

### Information to Include

When asking for help, include:
- **Error message** (full text)
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Environment** (OS, browser, Node version)
- **Relevant code** (minimal reproduction)
- **Screenshots** (if applicable)

### Resources

- **Documentation**: Check other docs in `docs/` folder
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **GitHub Issues**: Check project issues
- **Community**: Supabase Discord, Next.js Discord

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Authentication Guide](./AUTHENTICATION.md) - Auth troubleshooting
- [Database Guide](./DATABASE.md) - Database troubleshooting
- [Performance Guide](./PERFORMANCE.md) - Performance issues
- [Deployment Guide](./DEPLOYMENT.md) - Production issues
