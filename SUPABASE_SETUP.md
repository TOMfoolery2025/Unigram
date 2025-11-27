# Supabase Setup Guide

This guide will help you set up your Supabase project for the TUM Community Platform.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: unigram
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for setup to complete

## 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
3. Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Configure Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Email** provider (should be enabled by default)
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize the verification email template if desired
4. Set up redirect URLs:
   - Go to **Authentication** → **URL Configuration**
   - Add your site URL (e.g., `http://localhost:3000` for development)
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback`
     - Add production URLs when deploying

## 4. Configure Email Settings (Optional)

By default, Supabase uses their email service. For production, you may want to configure your own SMTP:

1. Go to **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your SMTP provider (e.g., SendGrid, AWS SES)

## 5. Database Schema Setup

The database schema will be created in the next task. You can access the SQL Editor at:
**SQL Editor** in your Supabase dashboard

## 6. Row Level Security (RLS)

RLS policies will be configured in the next task to ensure data security. All tables will have RLS enabled by default.

## 7. Verify Setup

To verify your setup is working:

1. Start your development server: `npm run dev`
2. The app should load without errors
3. Check the browser console for any Supabase connection errors

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file has the correct keys
- Ensure you're using the **anon public** key, not the service role key
- Restart your development server after changing environment variables

### Email verification not working
- Check your email spam folder
- Verify redirect URLs are configured correctly
- Check Supabase logs in **Logs** → **Auth Logs**

### CORS errors
- Ensure your site URL is added in **Authentication** → **URL Configuration**
- Check that you're using the correct Supabase URL

## Next Steps

Once your Supabase project is set up:
1. Proceed to Task 2: Implement database schema and RLS policies
2. Test authentication flows
3. Begin building feature modules
