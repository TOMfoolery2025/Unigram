# Authentication Documentation

## Overview

Unigram uses Supabase Auth for authentication with email-based login and TUM email verification. The authentication system is built around Next.js middleware for session management and route protection.

## Authentication Flow

### Registration Flow

```
1. User visits /register
   ↓
2. User enters email (@tum.de) and password
   ↓
3. Form validates input (Zod schema)
   ↓
4. Call supabase.auth.signUp()
   ↓
5. Supabase creates auth.users record
   ↓
6. Supabase sends verification email
   ↓
7. User redirected to /verify-email
   ↓
8. User clicks link in email
   ↓
9. Email verified, redirected to /auth/callback
   ↓
10. Callback creates user_profiles record
   ↓
11. User redirected to /dashboard
```

### Login Flow

```
1. User visits /login
   ↓
2. User enters email and password
   ↓
3. Form validates input
   ↓
4. Call supabase.auth.signInWithPassword()
   ↓
5. Supabase validates credentials
   ↓
6. Session created, cookies set
   ↓
7. Middleware validates session
   ↓
8. If email not verified → /verify-email
   ↓
9. If verified → /dashboard
```

### Session Management Flow

```
1. User makes request
   ↓
2. Middleware intercepts request
   ↓
3. Create Supabase client with cookie handlers
   ↓
4. Call supabase.auth.getUser()
   ↓
5. If session valid → continue
   ↓
6. If session expired → refresh token
   ↓
7. If refresh fails → redirect to /login
   ↓
8. If no session and protected route → /login
```

## Middleware Implementation

### Current Implementation

**File**: `middleware.ts`

The middleware runs on every request (except static files) and:

1. **Creates Supabase Client**: Creates a new client with cookie handlers
2. **Validates Session**: Calls `getUser()` to check authentication
3. **Route Protection**: Applies different logic based on route type
4. **Cookie Management**: Handles session cookie updates

### Route Types

#### Public Routes
Routes accessible without authentication:
- `/login` - Login page
- `/register` - Registration page
- `/wiki` - Public wiki (guest access)
- `/auth/callback` - OAuth callback handler

#### Auth Routes
Routes that redirect authenticated users:
- `/login` - Redirects to `/dashboard` if logged in
- `/register` - Redirects to `/dashboard` if logged in

#### Protected Routes
All other routes require authentication:
- `/dashboard` - User dashboard
- `/forums` - Forum system
- `/channels` - Channel system
- `/events` - Events system
- `/calendar` - Calendar view

#### Email Verification
Authenticated users with unverified emails are redirected to `/verify-email` (except for auth routes and callback).

### Middleware Configuration

```typescript
export const config = {
  matcher: [
    // Match all routes except:
    // - _next/static (static files)
    // - _next/image (image optimization)
    // - favicon.ico
    // - api routes
    // - image files
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## Supabase Client Management

### Browser Client

**File**: `lib/supabase/client.ts`

Used in Client Components for client-side operations:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Usage:**
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient()
  // Use supabase client
}
```

### Server Client

**File**: `lib/supabase/server.ts`

Used in Server Components and API Routes:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
      },
    }
  )
}
```

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function MyServerComponent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Use supabase client
}
```

## Authentication Components

### Login Form

**File**: `components/auth/login-form.tsx`

Features:
- Email and password inputs
- Form validation with Zod
- Error handling and display
- Loading states
- Link to registration

**Validation Schema:**
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
```

### Register Form

**File**: `components/auth/register-form.tsx`

Features:
- Email, password, and display name inputs
- TUM email validation
- Password confirmation
- Form validation with Zod
- Error handling and display
- Loading states
- Link to login

**Validation Schema:**
```typescript
const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .endsWith('@tum.de', 'Must be a TUM email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  displayName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
```

### Protected Route Component

**File**: `components/auth/protected-route.tsx`

Wrapper component for client-side route protection:
- Checks authentication status
- Shows loading state while checking
- Redirects to login if not authenticated
- Renders children if authenticated

### Verify Email Prompt

**File**: `components/auth/verify-email-prompt.tsx`

Displays message to users with unverified emails:
- Instructions to check email
- Resend verification email button
- Logout option

## Session Management

### Session Storage

Sessions are stored in httpOnly cookies:
- **Cookie Name**: Set by Supabase (e.g., `sb-[project-ref]-auth-token`)
- **httpOnly**: Yes (prevents JavaScript access)
- **Secure**: Yes in production (HTTPS only)
- **SameSite**: Lax (CSRF protection)

### Session Lifecycle

1. **Creation**: Session created on successful login/registration
2. **Validation**: Middleware validates on every request
3. **Refresh**: Automatic refresh when token expires
4. **Expiration**: Sessions expire after inactivity period
5. **Logout**: Session deleted on explicit logout

### Token Refresh

**Current Implementation:**
- Middleware calls `getUser()` which automatically refreshes if needed
- Supabase handles refresh token logic internally

**Known Issues:**
- New client created on every request (performance issue)
- No explicit refresh before expiry (relies on Supabase auto-refresh)

## User Profile Management

### Profile Creation

User profiles are created in the auth callback:

**File**: `app/auth/callback/route.ts`

```typescript
// After successful email verification
if (data.user && !error) {
  // Check if profile exists
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  // Create profile if doesn't exist
  if (!profile) {
    await supabase.from("user_profiles").insert({
      id: data.user.id,
      email: data.user.email!,
      display_name: data.user.user_metadata?.display_name || null,
      is_admin: false,
      can_create_events: false,
    });
  }
}
```

### Profile Fields

**Table**: `user_profiles`

- `id` (UUID): Matches auth.users.id
- `email` (string): User's email address
- `display_name` (string, nullable): Display name
- `avatar_url` (string, nullable): Profile picture URL
- `is_admin` (boolean): Admin privileges
- `can_create_events` (boolean): Event creation permission
- `created_at` (timestamp): Account creation time
- `updated_at` (timestamp): Last profile update

## Permission System

### User Roles

#### Regular User
- Default role for all users
- Can create posts, comments, join channels
- Cannot create events or channels
- Cannot moderate content

#### Event Creator
- `can_create_events = true`
- Can create and manage events
- Can view event registrations
- Can generate QR codes

#### Admin
- `is_admin = true`
- Full access to all features
- Can create channels and subforums
- Can moderate content
- Can view anonymous post authors
- Can manage user permissions

### Permission Checks

**In Components:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('user_profiles')
  .select('is_admin, can_create_events')
  .eq('id', user.id)
  .single()

if (profile?.is_admin) {
  // Show admin features
}
```

**In RLS Policies:**
```sql
-- Example: Only admins can create channels
CREATE POLICY "Admins can create channels"
ON channels FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
```

## Security Considerations

### Email Verification

- **Required**: Users must verify email before full access
- **Enforcement**: Middleware redirects unverified users
- **Bypass**: Only auth routes and callback bypass check
- **Resend**: Users can request new verification email

### Password Security

- **Minimum Length**: 6 characters (enforced by validation)
- **Hashing**: Handled by Supabase (bcrypt)
- **Reset**: Password reset via email (Supabase feature)
- **Strength**: Consider adding strength requirements

### Session Security

- **httpOnly Cookies**: Prevents XSS attacks
- **Secure Flag**: HTTPS only in production
- **SameSite**: CSRF protection
- **Expiration**: Automatic session expiry

### TUM Email Restriction

- **Validation**: Only @tum.de emails allowed
- **Enforcement**: Client-side validation + database constraint
- **Verification**: Email verification required

## Known Issues and Improvements

### Current Issues

1. **Client Recreation**: New Supabase client created on every middleware request
2. **No Destination Preservation**: Login doesn't preserve original destination URL
3. **No Session Refresh Logic**: Relies on Supabase auto-refresh
4. **Cookie Inconsistency**: Cookie options may vary across requests

### Planned Improvements

1. **Client Caching**: Reuse Supabase client instances
2. **Destination URLs**: Preserve and redirect to original destination
3. **Explicit Refresh**: Refresh tokens before expiry
4. **Consistent Cookies**: Standardize cookie options
5. **Rate Limiting**: Add login attempt rate limiting
6. **2FA**: Consider two-factor authentication
7. **OAuth**: Add social login options (Google, GitHub)

## Testing Authentication

### Manual Testing

1. **Registration**:
   - Visit `/register`
   - Enter TUM email and password
   - Check email for verification link
   - Click link and verify redirect to dashboard

2. **Login**:
   - Visit `/login`
   - Enter credentials
   - Verify redirect to dashboard

3. **Protected Routes**:
   - Logout
   - Try accessing `/dashboard`
   - Verify redirect to `/login`

4. **Email Verification**:
   - Register without verifying email
   - Try accessing protected routes
   - Verify redirect to `/verify-email`

### Automated Testing

**Unit Tests** (to be implemented):
- Validation schemas
- Helper functions
- Permission checks

**Integration Tests** (to be implemented):
- Complete auth flows
- Middleware behavior
- Session management

## Troubleshooting

### "Invalid API key" Error

**Cause**: Incorrect environment variables

**Solution**:
1. Check `.env.local` has correct values
2. Verify using anon key (not service role key)
3. Restart dev server after changes

### Email Verification Not Working

**Cause**: Email not sent or redirect URL incorrect

**Solution**:
1. Check spam folder
2. Verify redirect URLs in Supabase dashboard
3. Check Supabase Auth Logs

### Infinite Redirect Loop

**Cause**: Middleware redirect logic issue

**Solution**:
1. Check middleware route matching
2. Verify public routes configuration
3. Clear browser cookies and try again

### Session Not Persisting

**Cause**: Cookie not being set correctly

**Solution**:
1. Check browser allows cookies
2. Verify cookie domain settings
3. Check middleware cookie handlers

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Database Guide](./DATABASE.md) - Database schema and RLS
- [API Documentation](./API.md) - API routes
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues
