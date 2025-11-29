# Post Images Storage Reference

Quick reference for working with the post images storage bucket.

## Bucket Configuration

- **Bucket Name**: `post-images`
- **Access**: Public (read-only for all authenticated users)
- **File Size Limit**: 5MB (5,242,880 bytes)
- **Allowed Types**: image/jpeg, image/png, image/gif, image/webp

## Storage Path Structure

```
{user_id}/{post_id}/{filename}
```

Example:
```
550e8400-e29b-41d4-a716-446655440000/7c9e6679-7425-40de-944b-e07fc1f90ae7/photo-1701234567890.jpg
```

## Access Control Policies

### Upload (INSERT)
- ✅ Users can upload to their own user ID folder
- ❌ Users cannot upload to other users' folders
- Path must start with `{auth.uid()}/`

### View (SELECT)
- ✅ All authenticated users can view all images
- ❌ Anonymous users cannot view images

### Delete (DELETE)
- ✅ Users can delete images from their own folders
- ✅ Admins can delete any image
- ❌ Users cannot delete images from other users' folders

## Usage Example

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Upload an image
async function uploadImage(file: File, userId: string, postId: string) {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${userId}/${postId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('post-images')
    .getPublicUrl(filePath);
    
  return urlData.publicUrl;
}

// Delete an image
async function deleteImage(storagePath: string) {
  const { error } = await supabase.storage
    .from('post-images')
    .remove([storagePath]);
    
  if (error) throw error;
}

// Get public URL for an existing image
function getImageUrl(storagePath: string) {
  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(storagePath);
    
  return data.publicUrl;
}
```

## Validation Requirements

### Client-Side Validation
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 5MB limit.'
    };
  }
  
  return { valid: true };
}
```

### Server-Side Validation
The bucket configuration enforces:
- File size limit (5MB)
- MIME type restrictions
- Path-based access control

## Database Integration

Images are tracked in the `post_images` table:

```sql
CREATE TABLE public.post_images (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Best Practices

1. **Always validate files client-side** before uploading
2. **Generate unique filenames** using timestamps or UUIDs
3. **Store metadata in database** for efficient querying
4. **Clean up orphaned files** if post creation fails
5. **Use public URLs** for displaying images (bucket is public)
6. **Implement retry logic** for failed uploads
7. **Show upload progress** for better UX
8. **Lazy load images** in feeds for performance

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `new row violates row-level security policy` | User trying to upload to wrong folder | Ensure path starts with user's ID |
| `Payload too large` | File exceeds 5MB | Validate file size before upload |
| `Invalid mime type` | Unsupported file format | Check file type before upload |
| `Duplicate` | File already exists | Use `upsert: false` or unique filenames |

## Testing

```typescript
// Test file validation
describe('Image validation', () => {
  it('should accept valid image types', () => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    validTypes.forEach(type => {
      const file = new File([''], 'test.jpg', { type });
      expect(validateImageFile(file).valid).toBe(true);
    });
  });
  
  it('should reject files over 5MB', () => {
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });
    expect(validateImageFile(largeFile).valid).toBe(false);
  });
});
```

## Migration Files

- **Database**: `supabase/migrations/20240101000009_post_images.sql`
- **Storage**: `supabase/migrations/20240101000010_post_images_storage.sql`
- **Setup Guide**: `supabase/migrations/POST_IMAGES_STORAGE_SETUP.md`
