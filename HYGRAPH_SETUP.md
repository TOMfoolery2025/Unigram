# Hygraph CMS Setup Guide

This guide documents the Hygraph CMS setup for the TUM Community Platform wiki integration.

> **Status:** ✅ Initial setup completed. Environment variables configured in `.env.local`.

## Step 1: Create a Hygraph Account

1. Go to [Hygraph](https://hygraph.com/) and sign up for a free account
2. Create a new project (e.g., "TUM Community Wiki")

## Step 2: Configure the WikiArticle Content Model

In your Hygraph project, create a new content model called `WikiArticle` with the following schema:

### Content Model Schema

```graphql
type WikiArticle {
  id: ID!
  title: String!
  slug: String! @unique
  category: String!
  content: Markdown!
  stage: Stage! # DRAFT or PUBLISHED
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime
}
```

### Field Configuration

Create the following fields in your Hygraph content model:

1. **Title** (Single line text)
   - API ID: `title`
   - Required: ✓
   - Validations: Non-empty

2. **Slug** (Single line text)
   - API ID: `slug`
   - Required: ✓
   - Unique: ✓
   - Validations: URL-friendly format (lowercase, hyphens only)
   - Example: `welcome-to-tum`, `campus-map`

3. **Category** (Single line text)
   - API ID: `category`
   - Required: ✓
   - Examples: "Getting Started", "Academic Life", "Campus Resources"

4. **Content** (Markdown)
   - API ID: `content`
   - Required: ✓
   - Field Type: **Markdown** (not Rich Text)
   - Supported syntax: Standard Markdown with headings, lists, links, images, code blocks, etc.

### System Fields (Automatic)

The following fields are automatically managed by Hygraph:
- `id` (ID) - Unique identifier
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp
- `publishedAt` (DateTime) - Publication timestamp
- `stage` (Stage) - Content stage: DRAFT or PUBLISHED

## Step 3: Configure API Access

1. Go to **Project Settings** → **API Access**
2. Create a new **Permanent Auth Token**:
   - Name: "TUM Platform Read Token"
   - Permissions: 
     - Content API: Read
     - Management API: No access needed
3. Copy the generated token

## Step 4: Get Your API Endpoint

1. In your Hygraph project, go to **Project Settings** → **Endpoints**
2. Copy the **Content API** endpoint URL
   - It should look like: `https://api-[region].hygraph.com/v2/[project-id]/master`

## Step 5: Update Environment Variables

Update your `.env.local` file with the actual values:

```bash
# Hygraph Configuration
NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://api-[region].hygraph.com/v2/[project-id]/master
HYGRAPH_TOKEN=your-actual-permanent-auth-token
```

**Important:** 
- Replace `[region]` and `[project-id]` with your actual values
- Replace `your-actual-permanent-auth-token` with the token you created
- Keep the `HYGRAPH_TOKEN` secret and never commit it to version control

## Step 6: Create Sample Content (Optional)

To test the integration, create a few sample wiki articles:

### Example Article 1
- **Title:** Welcome to TUM
- **Slug:** welcome-to-tum
- **Category:** Getting Started
- **Content:** Add some rich text content with headings, paragraphs, and images
- **Stage:** Publish the article

### Example Article 2
- **Title:** Campus Map
- **Slug:** campus-map
- **Category:** Campus Resources
- **Content:** Add information about campus locations
- **Stage:** Publish the article

## Step 7: Verify Setup

Once you've completed the setup and updated your environment variables, the application will be able to fetch wiki articles from Hygraph.

## Content Management Workflow

### Creating New Articles

1. Log in to your Hygraph dashboard
2. Navigate to **Content** → **WikiArticle**
3. Click **Create entry**
4. Fill in the required fields
5. Add rich text content with formatting
6. Upload and embed images as needed
7. Save as **DRAFT** to preview
8. **Publish** when ready to make it public

### Editing Articles

1. Find the article in the WikiArticle list
2. Click to edit
3. Make your changes
4. Save and publish

### Unpublishing Articles

1. Open the article
2. Click **Unpublish**
3. The article will no longer appear on the public site

## Markdown Features

The Markdown editor supports standard Markdown syntax:
- Headings (`#` to `######`)
- Paragraphs
- Bold (`**text**`), italic (`*text*`)
- Ordered and unordered lists
- Links (`[text](url)`)
- Images (`![alt](url)`)
- Code blocks (` ``` `)
- Blockquotes (`>`)
- Tables
- Horizontal rules (`---`)

## Next Steps

After completing this setup, the development team can proceed with implementing the Hygraph integration in the codebase. The environment variables you've configured will allow the application to authenticate and fetch content from your Hygraph project.
