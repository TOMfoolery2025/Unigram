# Design Document: Hive Post Image Uploads

## Overview

This feature adds image upload capability to hive posts using Supabase Storage. The implementation will extend the existing post creation flow with file upload UI, storage integration, and image display components. The design prioritizes simplicity and leverages existing Supabase infrastructure.

## Architecture

### Storage Layer
- **Supabase Storage Bucket**: A new public bucket named `post-images` will store all post images
- **Storage Path Structure**: `{user_id}/{post_id}/{filename}` for organized file management
- **Access Control**: RLS policies will ensure users can only upload to their own folders and read published post images

### Database Layer
- **New Table**: `post_images` table to track image metadata and associations
- **Foreign Key**: Links to `posts` table with CASCADE delete to clean up orphaned images

### Application Layer
- **Upload Component**: New `ImageUploadInput` component for file selection and preview
- **Display Component**: New `PostImages` component for rendering image grids
- **Storage Service**: New `lib/storage/post-images.ts` for upload/delete operations

## Components and Interfaces

### Database Schema

```sql
-- New table for post images
CREATE TABLE public.post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_post_images_post_id ON public.post_images(post_id);
CREATE INDEX idx_post_images_display_order ON public.post_images(post_id, display_order);
```

### TypeScript Interfaces

```typescript
// types/forum.ts additions
export interface PostImage {
  id: string;
  post_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  display_order: number;
  created_at: string;
  url?: string; // Public URL for display
}

export interface PostWithImages extends PostWithAuthor {
  images?: PostImage[];
}
```

### Storage Service API

```typescript
// lib/storage/post-images.ts
export async function uploadPostImage(
  file: File,
  userId: string,
  postId: string
): Promise<{ data: string | null; error: Error | null }>;

export async function deletePostImage(
  storagePath: string
): Promise<{ error: Error | null }>;

export async function getPostImages(
  postId: string
): Promise<{ data: PostImage[] | null; error: Error | null }>;

export function getImageUrl(storagePath: string): string;
```

## Data Models

### Post Images Table
- `id`: UUID primary key
- `post_id`: Foreign key to posts table
- `storage_path`: Full path in Supabase Storage
- `file_name`: Original filename for display
- `file_size`: Size in bytes for validation tracking
- `mime_type`: Image MIME type
- `display_order`: Integer for ordering multiple images
- `created_at`: Timestamp

### Storage Bucket Configuration
- **Name**: `post-images`
- **Public**: Yes (for easy image display)
- **File Size Limit**: 5MB per file
- **Allowed MIME Types**: image/jpeg, image/png, image/gif, image/webp

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid file type acceptance
*For any* file selected for upload, if the file has a MIME type of image/jpeg, image/png, image/gif, or image/webp, then the system should accept it for upload
**Validates: Requirements 1.2**

### Property 2: File size validation
*For any* file selected for upload, if the file size exceeds 5MB, then the system should reject it and display an error message
**Validates: Requirements 1.3**

### Property 3: Image-post association
*For any* uploaded image, the image record in the database should reference a valid post_id that exists in the posts table
**Validates: Requirements 1.4**

### Property 4: Cascade deletion
*For any* post that is deleted, all associated images should be removed from both the database and storage
**Validates: Requirements 4.3**

### Property 5: Unique storage paths
*For any* two different uploaded images, they should have different storage paths to prevent collisions
**Validates: Requirements 4.2**

## Error Handling

### Upload Errors
- **Invalid File Type**: Display toast notification with accepted formats
- **File Too Large**: Display toast with size limit information
- **Network Failure**: Retry logic with exponential backoff, show error after 3 attempts
- **Storage Quota**: Display error message suggesting image compression

### Display Errors
- **Image Load Failure**: Show placeholder with retry button
- **Missing Images**: Log warning, display post without images
- **Permission Denied**: Show appropriate error message

### Cleanup Errors
- **Orphaned Images**: Background job to clean up images not associated with posts
- **Failed Deletions**: Log error, retry on next cleanup cycle

## Testing Strategy

### Unit Tests
- Test file validation logic (type and size checks)
- Test storage path generation for uniqueness
- Test image URL generation
- Test database operations (insert, query, delete)

### Property-Based Tests
- Property 1: Generate random valid image files, verify all are accepted
- Property 2: Generate random files over 5MB, verify all are rejected
- Property 3: Generate random post IDs, verify foreign key constraints
- Property 4: Create posts with images, delete posts, verify images are removed
- Property 5: Upload multiple images, verify no path collisions

### Integration Tests
- Test complete upload flow from UI to storage
- Test image display in post feed
- Test image removal before post creation
- Test post deletion with image cleanup

### Manual Testing
- Test with various image formats and sizes
- Test responsive image display on mobile devices
- Test image lightbox/modal functionality
- Test error states and user feedback

## Implementation Notes

### Performance Considerations
- Implement image lazy loading for post feeds
- Use thumbnail generation for grid views (future enhancement)
- Limit to 5 images per post to prevent abuse

### Security Considerations
- Validate file types on both client and server
- Sanitize filenames to prevent path traversal
- Implement rate limiting on uploads
- Use signed URLs for private images (if needed in future)

### User Experience
- Show upload progress indicators
- Display image previews immediately after selection
- Allow drag-and-drop file upload
- Provide clear feedback for all error states
