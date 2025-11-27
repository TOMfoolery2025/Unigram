# Slug vs ID Fix

## Problem

When clicking on an article, the application was making a request to:
```
GET http://localhost:3000/api/wiki/articles/undefined
```

This resulted in a 404 error because the `slug` parameter was `undefined`.

## Root Cause

The wiki page (`app/(guest)/wiki/page.tsx`) was using the old database-based approach with article IDs (`articleId`), but the Hygraph integration uses **slugs** instead of IDs for identifying articles.

The mismatch:
- **Old approach**: Articles identified by database ID (UUID)
- **New approach**: Articles identified by slug (URL-friendly string like "getting-started")

## Solution

Updated `app/(guest)/wiki/page.tsx` to use slugs throughout:

### Changes Made:

1. **Updated ViewState interface**:
   ```typescript
   // Before
   interface ViewState {
     mode: ViewMode;
     categoryName?: string;
     articleId?: string;  // ❌ Using ID
   }
   
   // After
   interface ViewState {
     mode: ViewMode;
     categoryName?: string;
     articleSlug?: string;  // ✅ Using slug
   }
   ```

2. **Updated handler functions**:
   ```typescript
   // Before
   const handleArticleSelect = (articleId: string) => {
     setViewState({ mode: 'article', articleId });
   };
   
   // After
   const handleArticleSelect = (slug: string) => {
     setViewState({ mode: 'article', articleSlug: slug });
   };
   ```

3. **Updated WikiArticle component usage**:
   ```typescript
   // Before
   {viewState.mode === 'article' && viewState.articleId && (
     <WikiArticle
       articleId={viewState.articleId}  // ❌ Wrong prop
       onBack={handleBack}
     />
   )}
   
   // After
   {viewState.mode === 'article' && viewState.articleSlug && (
     <WikiArticle
       slug={viewState.articleSlug}  // ✅ Correct prop
       onBack={handleBack}
     />
   )}
   ```

4. **Removed unused features**:
   - Removed `WikiEditor` component (editing is done in Hygraph CMS)
   - Removed `VersionHistory` component (versioning is handled by Hygraph)
   - Removed related handler functions
   - Simplified the view modes to just: `'home' | 'category' | 'article'`

## Why Slugs?

Slugs are better than IDs for several reasons:

1. **SEO-friendly**: URLs like `/wiki/getting-started` are better than `/wiki/123e4567-e89b`
2. **Human-readable**: Users can understand what the page is about from the URL
3. **Stable**: Slugs don't change even if the article is moved between systems
4. **CMS-native**: Hygraph uses slugs as the primary identifier for content

## Testing

After this fix:
1. Navigate to `/wiki`
2. Click on a category
3. Click on an article
4. The article should load correctly with the URL showing the slug

The API will now receive requests like:
```
GET /api/wiki/articles/getting-started
```

Instead of:
```
GET /api/wiki/articles/undefined
```
