-- Post playlists: group bookmarked posts

CREATE TABLE IF NOT EXISTS public.post_playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_playlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES public.post_playlists(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (playlist_id, post_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_post_playlists_user_id ON public.post_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_post_playlist_items_playlist_id ON public.post_playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_post_playlist_items_post_id ON public.post_playlist_items(post_id);

-- RLS
ALTER TABLE public.post_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_playlist_items ENABLE ROW LEVEL SECURITY;

-- Users can manage their own playlists
CREATE POLICY "Users can select own playlists"
  ON public.post_playlists
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own playlists"
  ON public.post_playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own playlists"
  ON public.post_playlists
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own playlists"
  ON public.post_playlists
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can manage items in their own playlists
CREATE POLICY "Users can select items in own playlists"
  ON public.post_playlist_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.post_playlists p
      WHERE p.id = playlist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items in own playlists"
  ON public.post_playlist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.post_playlists p
      WHERE p.id = playlist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items in own playlists"
  ON public.post_playlist_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.post_playlists p
      WHERE p.id = playlist_id AND p.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.post_playlists IS 'Collections of bookmarked hive posts per user';
COMMENT ON TABLE public.post_playlist_items IS 'Mapping between playlists and posts';


