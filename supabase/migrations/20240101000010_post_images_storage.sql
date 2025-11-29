-- Post Images Storage Setup
-- This migration creates the storage bucket and policies for post image uploads
-- Requires: 20240101000009_post_images.sql (post_images table)

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================

-- Create the post-images bucket for storing post image files
-- This bucket is set to public for easy image display
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB in bytes (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Drop existing policies if they exist to allow re-running the migration
DROP POLICY IF EXISTS "Authenticated users can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any post image" ON storage.objects;

-- Policy: Authenticated users can view all post images
-- Since the bucket is public, this allows reading any image
CREATE POLICY "Authenticated users can view post images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
  );

-- Policy: Users can upload images to their own folder
-- Path structure: {user_id}/{post_id}/{filename}
-- This ensures users can only upload to folders matching their user ID
CREATE POLICY "Users can upload images to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete images from their own posts
-- Users can only delete files in folders matching their user ID
CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can delete any post image
-- Admins have full delete access to all images in the bucket
CREATE POLICY "Admins can delete any post image"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
