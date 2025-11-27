-- TUM Community Platform Row Level Security (RLS) Policies
-- This migration enables RLS and creates security policies for all tables

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subforums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subforum_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view all profiles
CREATE POLICY "Users can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile (except admin fields)
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    is_admin = (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) AND
    can_create_events = (SELECT can_create_events FROM public.user_profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- SUBFORUMS POLICIES
-- ============================================================================

-- Anyone authenticated can view all subforums
CREATE POLICY "Authenticated users can view subforums"
  ON public.subforums FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can create subforums
CREATE POLICY "Authenticated users can create subforums"
  ON public.subforums FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);

-- Creators can update their own subforums
CREATE POLICY "Creators can update their subforums"
  ON public.subforums FOR UPDATE
  USING (auth.uid() = creator_id);

-- Creators can delete their own subforums
CREATE POLICY "Creators can delete their subforums"
  ON public.subforums FOR DELETE
  USING (auth.uid() = creator_id);

-- Admins can delete any subforum
CREATE POLICY "Admins can delete any subforum"
  ON public.subforums FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- SUBFORUM MEMBERSHIPS POLICIES
-- ============================================================================

-- Users can view memberships of subforums they're in
CREATE POLICY "Users can view subforum memberships"
  ON public.subforum_memberships FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can join subforums
CREATE POLICY "Users can join subforums"
  ON public.subforum_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave subforums
CREATE POLICY "Users can leave subforums"
  ON public.subforum_memberships FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POSTS POLICIES
-- ============================================================================

-- Authenticated users can view all posts
-- For non-admin users, hide author_id if post is anonymous
CREATE POLICY "Authenticated users can view posts"
  ON public.posts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "Authors can update their posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete their posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can delete any post
CREATE POLICY "Admins can delete any post"
  ON public.posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- COMMENTS POLICIES
-- ============================================================================

-- Authenticated users can view all comments
CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Authors can update their own comments
CREATE POLICY "Authors can update their comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their own comments
CREATE POLICY "Authors can delete their comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
  ON public.comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- VOTES POLICIES
-- ============================================================================

-- Users can view all votes
CREATE POLICY "Users can view votes"
  ON public.votes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create their own votes
CREATE POLICY "Users can create votes"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHANNELS POLICIES
-- ============================================================================

-- Authenticated users can view all channels
CREATE POLICY "Authenticated users can view channels"
  ON public.channels FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can create channels
CREATE POLICY "Admins can create channels"
  ON public.channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update channels
CREATE POLICY "Admins can update channels"
  ON public.channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete channels
CREATE POLICY "Admins can delete channels"
  ON public.channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- CHANNEL MEMBERSHIPS POLICIES
-- ============================================================================

-- Users can view channel memberships
CREATE POLICY "Users can view channel memberships"
  ON public.channel_memberships FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can join channels
CREATE POLICY "Users can join channels"
  ON public.channel_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave channels
CREATE POLICY "Users can leave channels"
  ON public.channel_memberships FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHANNEL MESSAGES POLICIES
-- ============================================================================

-- Only channel members can view messages
CREATE POLICY "Channel members can view messages"
  ON public.channel_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_memberships
      WHERE channel_id = channel_messages.channel_id
      AND user_id = auth.uid()
    )
  );

-- Channel members can send messages
CREATE POLICY "Channel members can send messages"
  ON public.channel_messages FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.channel_memberships
      WHERE channel_id = channel_messages.channel_id
      AND user_id = auth.uid()
    )
  );

-- Authors can update their own messages
CREATE POLICY "Authors can update their messages"
  ON public.channel_messages FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their own messages
CREATE POLICY "Authors can delete their messages"
  ON public.channel_messages FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can delete any message
CREATE POLICY "Admins can delete any message"
  ON public.channel_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Authenticated users can view published events
CREATE POLICY "Authenticated users can view published events"
  ON public.events FOR SELECT
  USING (auth.role() = 'authenticated' AND is_published = true);

-- Event creators can view their own unpublished events
CREATE POLICY "Creators can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = creator_id);

-- Users with event creation permission can create events
CREATE POLICY "Event creators can create events"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND (can_create_events = true OR is_admin = true)
    )
  );

-- Event creators can update their own events
CREATE POLICY "Creators can update their events"
  ON public.events FOR UPDATE
  USING (auth.uid() = creator_id);

-- Event creators can delete their own events
CREATE POLICY "Creators can delete their events"
  ON public.events FOR DELETE
  USING (auth.uid() = creator_id);

-- Admins can delete any event
CREATE POLICY "Admins can delete any event"
  ON public.events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- EVENT REGISTRATIONS POLICIES
-- ============================================================================

-- Users can view their own registrations
CREATE POLICY "Users can view their registrations"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Event creators can view registrations for their events
CREATE POLICY "Creators can view event registrations"
  ON public.event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_registrations.event_id
      AND creator_id = auth.uid()
    )
  );

-- Users can register for events
CREATE POLICY "Users can register for events"
  ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unregister from events
CREATE POLICY "Users can unregister from events"
  ON public.event_registrations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- WIKI ARTICLES POLICIES
-- ============================================================================

-- Everyone (including guests) can view published wiki articles
CREATE POLICY "Anyone can view published wiki articles"
  ON public.wiki_articles FOR SELECT
  USING (is_published = true);

-- Admins can view all wiki articles
CREATE POLICY "Admins can view all wiki articles"
  ON public.wiki_articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can create wiki articles
CREATE POLICY "Admins can create wiki articles"
  ON public.wiki_articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can update wiki articles
CREATE POLICY "Admins can update wiki articles"
  ON public.wiki_articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can delete wiki articles
CREATE POLICY "Admins can delete wiki articles"
  ON public.wiki_articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- WIKI VERSIONS POLICIES
-- ============================================================================

-- Authenticated users can view wiki versions
CREATE POLICY "Authenticated users can view wiki versions"
  ON public.wiki_versions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Wiki versions are created automatically via trigger, no manual insert needed
-- But we allow admins to insert if needed
CREATE POLICY "Admins can create wiki versions"
  ON public.wiki_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- PERSONAL CALENDAR EVENTS POLICIES
-- ============================================================================

-- Users can only view their own personal calendar events
CREATE POLICY "Users can view their own calendar events"
  ON public.personal_calendar_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own calendar events
CREATE POLICY "Users can create their own calendar events"
  ON public.personal_calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calendar events
CREATE POLICY "Users can update their own calendar events"
  ON public.personal_calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own calendar events
CREATE POLICY "Users can delete their own calendar events"
  ON public.personal_calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MODERATION LOGS POLICIES
-- ============================================================================

-- Only admins can view moderation logs
CREATE POLICY "Admins can view moderation logs"
  ON public.moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can create moderation logs
CREATE POLICY "Admins can create moderation logs"
  ON public.moderation_logs FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS FOR APPLICATION LAYER
-- ============================================================================

-- Function to check if user is admin (can be called from application)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create events
CREATE OR REPLACE FUNCTION can_create_events(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND (can_create_events = true OR is_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get post with author info (respecting anonymity for non-admins)
CREATE OR REPLACE FUNCTION get_post_with_author(post_id UUID, requesting_user_id UUID)
RETURNS TABLE (
  id UUID,
  subforum_id UUID,
  author_id UUID,
  author_name TEXT,
  title TEXT,
  content TEXT,
  is_anonymous BOOLEAN,
  vote_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Check if requesting user is admin
  SELECT is_admin INTO is_admin_user
  FROM public.user_profiles
  WHERE public.user_profiles.id = requesting_user_id;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.subforum_id,
    CASE 
      WHEN p.is_anonymous AND NOT COALESCE(is_admin_user, false) THEN NULL
      ELSE p.author_id
    END,
    CASE 
      WHEN p.is_anonymous AND NOT COALESCE(is_admin_user, false) THEN 'Anonymous'
      ELSE up.display_name
    END,
    p.title,
    p.content,
    p.is_anonymous,
    p.vote_count,
    p.created_at,
    p.updated_at
  FROM public.posts p
  LEFT JOIN public.user_profiles up ON p.author_id = up.id
  WHERE p.id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comment with author info (respecting anonymity for non-admins)
CREATE OR REPLACE FUNCTION get_comment_with_author(comment_id UUID, requesting_user_id UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  author_id UUID,
  author_name TEXT,
  content TEXT,
  is_anonymous BOOLEAN,
  parent_comment_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Check if requesting user is admin
  SELECT is_admin INTO is_admin_user
  FROM public.user_profiles
  WHERE public.user_profiles.id = requesting_user_id;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.post_id,
    CASE 
      WHEN c.is_anonymous AND NOT COALESCE(is_admin_user, false) THEN NULL
      ELSE c.author_id
    END,
    CASE 
      WHEN c.is_anonymous AND NOT COALESCE(is_admin_user, false) THEN 'Anonymous'
      ELSE up.display_name
    END,
    c.content,
    c.is_anonymous,
    c.parent_comment_id,
    c.created_at,
    c.updated_at
  FROM public.comments c
  LEFT JOIN public.user_profiles up ON c.author_id = up.id
  WHERE c.id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
