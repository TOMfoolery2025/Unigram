-- Profile views tracking: who viewed which profile and when

CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  viewed_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_id
  ON public.profile_views(viewed_user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id
  ON public.profile_views(viewer_id, viewed_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Viewers can insert their own views
CREATE POLICY "Users can insert their own profile views"
  ON public.profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Users can see who viewed their profile
CREATE POLICY "Users can see who viewed their profile"
  ON public.profile_views
  FOR SELECT
  TO authenticated
  USING (viewed_user_id = auth.uid());

COMMENT ON TABLE public.profile_views IS 'Tracks which users viewed which profiles and when';
COMMENT ON COLUMN public.profile_views.viewer_id IS 'User who viewed the profile';
COMMENT ON COLUMN public.profile_views.viewed_user_id IS 'User whose profile was viewed';
COMMENT ON COLUMN public.profile_views.viewed_at IS 'When the profile was viewed';


