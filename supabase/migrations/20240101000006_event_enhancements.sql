-- Event Enhancements Migration
-- This migration adds new fields to the events table to support:
-- - Start and end times
-- - Private events with friend-only visibility
-- - Event categories
-- - Communication channel integration (forums and clusters)

-- ============================================================================
-- ADD NEW COLUMNS TO EVENTS TABLE
-- ============================================================================

-- Add start_time column (migrate existing time data)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS start_time TIME;

-- Migrate existing time data to start_time (only if time column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'time'
  ) THEN
    UPDATE public.events
    SET start_time = time::TIME
    WHERE time IS NOT NULL AND start_time IS NULL;
  END IF;
END $$;

-- Make start_time NOT NULL after migration (if not already)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'start_time'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.events ALTER COLUMN start_time SET NOT NULL;
  END IF;
END $$;

-- Add end_time column (optional)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add is_private column for friend-only events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- Add category column for event classification (if not exists)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';

-- Add forum_id for public event communication channels
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS forum_id UUID REFERENCES public.subforums(id) ON DELETE SET NULL;

-- Add cluster_id for private event communication channels
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES public.channels(id) ON DELETE SET NULL;

-- Add cluster_pin for private event access codes
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS cluster_pin TEXT;

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Update any existing category values that don't match the valid set to 'other'
UPDATE public.events
SET category = 'other'
WHERE category IS NOT NULL 
  AND category NOT IN ('social', 'academic', 'sports', 'cultural', 'other');

-- ============================================================================
-- ADD CHECK CONSTRAINTS
-- ============================================================================

-- Ensure end_time is after start_time when specified
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_end_time_after_start'
  ) THEN
    ALTER TABLE public.events
    ADD CONSTRAINT check_end_time_after_start
    CHECK (end_time IS NULL OR end_time > start_time);
  END IF;
END $$;

-- Ensure category is one of the valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_valid_category'
  ) THEN
    ALTER TABLE public.events
    ADD CONSTRAINT check_valid_category
    CHECK (category IN ('social', 'academic', 'sports', 'cultural', 'other'));
  END IF;
END $$;

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for filtering private events
CREATE INDEX IF NOT EXISTS idx_events_is_private ON public.events(is_private);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- Composite index for common queries (date + category)
CREATE INDEX IF NOT EXISTS idx_events_date_category ON public.events(date, category);

-- Composite index for visibility queries (is_private + is_published)
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(is_private, is_published);

-- Index for forum_id lookups
CREATE INDEX IF NOT EXISTS idx_events_forum_id ON public.events(forum_id) WHERE forum_id IS NOT NULL;

-- Index for cluster_id lookups
CREATE INDEX IF NOT EXISTS idx_events_cluster_id ON public.events(cluster_id) WHERE cluster_id IS NOT NULL;

-- ============================================================================
-- DROP OLD TIME COLUMN
-- ============================================================================

-- Drop the old time column after successful migration (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'time'
  ) THEN
    ALTER TABLE public.events DROP COLUMN time;
  END IF;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.events.start_time IS 'Event start time (replaces old time column)';
COMMENT ON COLUMN public.events.end_time IS 'Event end time (optional)';
COMMENT ON COLUMN public.events.is_private IS 'Whether event is visible only to creator''s friends';
COMMENT ON COLUMN public.events.category IS 'Event category: social, academic, sports, cultural, or other';
COMMENT ON COLUMN public.events.forum_id IS 'Associated forum for public event discussions';
COMMENT ON COLUMN public.events.cluster_id IS 'Associated cluster for private event chat';
COMMENT ON COLUMN public.events.cluster_pin IS 'PIN code for accessing private event cluster';
