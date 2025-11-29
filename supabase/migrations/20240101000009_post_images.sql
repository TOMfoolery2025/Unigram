-- Post Images Migration
-- This migration adds support for image uploads on hive posts
-- Adds post_images table with metadata tracking and RLS policies

-- ============================================================================
-- POST IMAGES TABLE
-- ============================================================================

-- Post images table to track image metadata and associations
CREATE TABLE public.post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES FOR POST IMAGES
-- ============================================================================

-- Index for querying images by post
CREATE INDEX idx_post_images_post_id ON public.post_images(post_id);

-- Composite index for ordered image retrieval
CREATE INDEX idx_post_images_post_display_order ON public.post_images(post_id, display_order);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR POST IMAGES
-- ============================================================================

-- Enable RLS on post_images table
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all post images (since posts are public)
CREATE POLICY "Authenticated users can view post images"
  ON public.post_images FOR SELECT
  USING (auth.role() = 'authenticated');

-- Post authors can insert images for their own posts
CREATE POLICY "Post authors can insert images"
  ON public.post_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_images.post_id
      AND author_id = auth.uid()
    )
  );

-- Post authors can delete images from their own posts
CREATE POLICY "Post authors can delete their post images"
  ON public.post_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_images.post_id
      AND author_id = auth.uid()
    )
  );

-- Admins can delete any post image
CREATE POLICY "Admins can delete any post image"
  ON public.post_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
