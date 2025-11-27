# Markdown Content Fix

## Problem

After fixing the environment variable issue, the application was throwing GraphQL errors:
```
field 'json' is not defined in 'String'
```

This indicated that the Hygraph content model was using a simple **String** field for content (containing Markdown), not a **Rich Text** field as originally designed.

## Root Cause

The design document specified using Hygraph's Rich Text field type, which provides `content.json`, `content.html`, and `content.text` properties. However, the actual Hygraph content model was configured with a simple String field containing Markdown.

## Solution

Updated the entire codebase to work with Markdown content instead of Rich Text:

### 1. Updated GraphQL Queries

Changed all queries in `lib/hygraph/wiki.ts` to fetch `content` as a simple string:

**Before:**
```graphql
content {
  json
  html
  text
}
```

**After:**
```graphql
content
```

### 2. Updated TypeScript Types

Modified `types/hygraph.ts` to reflect that content is a string:

**Before:**
```typescript
export interface HygraphWikiArticle {
  // ...
  content: RichTextContent; // Complex object with json, html, text
}
```

**After:**
```typescript
export interface HygraphWikiArticle {
  // ...
  content: string; // Simple Markdown string
}
```

### 3. Replaced Rich Text Renderer with Markdown Renderer

**Installed packages:**
- `react-markdown` - React component for rendering Markdown
- `remark-gfm` - GitHub Flavored Markdown support
- `@tailwindcss/typography` - Beautiful typography styles for Markdown

**Updated `components/wiki/wiki-article.tsx`:**

**Before:**
```tsx
import { RichTextRenderer } from "./rich-text-renderer";

<RichTextRenderer content={article.content.json} />
```

**After:**
```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

<div className="prose prose-slate dark:prose-invert max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {article.content}
  </ReactMarkdown>
</div>
```

### 4. Updated Article List Component

Changed `components/wiki/wiki-article-list.tsx` to access content directly:

**Before:**
```tsx
{article.content.text.substring(0, 200)}
```

**After:**
```tsx
{article.content.substring(0, 200)}
```

### 5. Updated Search Function

Modified `lib/hygraph/wiki.ts` searchArticles function to handle string content:

**Before:**
```typescript
content: { text: string }
// ...
const excerpt = article.content.text.length > 200
  ? article.content.text.substring(0, 200) + '...'
  : article.content.text;
```

**After:**
```typescript
content: string
// ...
const excerpt = article.content.length > 200
  ? article.content.substring(0, 200) + '...'
  : article.content;
```

## Benefits of Markdown

1. **Simpler Content Model** - No need for complex Rich Text AST
2. **Version Control Friendly** - Markdown is plain text and works well with Git
3. **Portable** - Markdown can be easily migrated between systems
4. **Familiar** - Most developers and content creators know Markdown
5. **GitHub Flavored Markdown** - Supports tables, task lists, strikethrough, etc.

## Styling

The Tailwind Typography plugin (`@tailwindcss/typography`) provides beautiful default styles for Markdown content:

- `prose` - Base typography styles
- `prose-slate` - Slate color scheme
- `dark:prose-invert` - Inverted colors for dark mode
- `max-w-none` - Removes max-width constraint

## Testing

After these changes:
1. Restart your development server
2. Navigate to `/wiki`
3. Categories should load correctly
4. Clicking on a category should show articles
5. Clicking on an article should render the Markdown content with proper formatting

## Hygraph Content Model

Your Hygraph WikiArticle model should have:
- `title` (String)
- `slug` (String, unique)
- `category` (String)
- `content` (String) - Contains Markdown
- `stage` (System field: DRAFT/PUBLISHED)
