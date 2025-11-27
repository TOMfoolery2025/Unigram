# Hygraph Environment Variable Fix

## Problem

The wiki was showing the error:
```
Error loading wiki: Hygraph configuration is missing. Please set NEXT_PUBLIC_HYGRAPH_ENDPOINT and HYGRAPH_TOKEN environment variables.
```

Even though the environment variables were correctly set in `.env.local`.

## Root Cause

The issue was that the wiki components (`WikiHome`, `WikiArticle`, `WikiSearch`, `WikiArticleList`) are **client components** (marked with `"use client"`), and they were directly calling Hygraph data functions that tried to access the `HYGRAPH_TOKEN` environment variable.

In Next.js:
- Environment variables **without** the `NEXT_PUBLIC_` prefix are **only available on the server side**
- Client components cannot access server-only environment variables
- `HYGRAPH_TOKEN` should remain server-only for security reasons (it's an authentication token)

## Solution

Created API routes that act as a server-side proxy to fetch data from Hygraph:

### New API Routes

1. **`/api/wiki/categories`** - Fetches all categories
2. **`/api/wiki/articles/[slug]`** - Fetches a single article by slug
3. **`/api/wiki/search?q=query`** - Searches articles
4. **`/api/wiki/category/[category]`** - Fetches articles by category

### Updated Components

All wiki components now call these API routes instead of directly calling Hygraph:

- `components/wiki/wiki-home.tsx` - Uses `/api/wiki/categories`
- `components/wiki/wiki-article.tsx` - Uses `/api/wiki/articles/[slug]`
- `components/wiki/wiki-search.tsx` - Uses `/api/wiki/search`
- `components/wiki/wiki-article-list.tsx` - Uses `/api/wiki/category/[category]`

## How to Test

1. **Restart your development server** (important - Next.js needs to reload environment variables):
   ```bash
   npm run dev
   ```

2. Navigate to the wiki page at `/wiki`

3. You should now see the wiki loading correctly without the configuration error

## Why This Works

- API routes run on the server side and have access to all environment variables
- Client components make HTTP requests to these API routes
- The `HYGRAPH_TOKEN` stays secure on the server and is never exposed to the client
- This is the recommended Next.js pattern for accessing server-only resources from client components

## Alternative Solution (Not Implemented)

Another approach would be to convert the wiki components to Server Components, which would allow them to directly access server-side environment variables. However, this would require:
- Removing all `useState`, `useEffect`, and other client-side hooks
- Restructuring the components to use server-side data fetching
- This is a larger refactor and was not chosen for this fix
