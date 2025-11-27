-- TUM Community Platform Database Schema
-- This migration creates all tables, indexes, and triggers
-- Note: pg_trgm extension and search indexes are created in a separate migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
-- Extends Supabase auth.users with additional profile information
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  can_create_events BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- FORUM SYSTEM TABLES
-- ============================================================================

-- Subforums table
CREATE TABLE public.subforums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subforum memberships table
CREATE TABLE public.subforum_memberships (
  subforum_id UUID NOT NULL REFERENCES public.subforums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (subforum_id, user_id)
);

-- Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subforum_id UUID NOT NULL REFERENCES public.subforums(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  vote_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- ============================================================================
-- CHANNELS SYSTEM TABLES
-- ============================================================================

-- Channels table (official sports/clubs channels)
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Channel memberships table
CREATE TABLE public.channel_memberships (
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (channel_id, user_id)
);

-- Channel messages table
CREATE TABLE public.channel_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- EVENTS SYSTEM TABLES
-- ============================================================================

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('tum_native', 'external')),
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  external_link TEXT,
  creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  max_attendees INTEGER,
  is_published BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Event registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  qr_code TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- ============================================================================
-- WIKI SYSTEM TABLES
-- ============================================================================

-- Wiki articles table
CREATE TABLE public.wiki_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Wiki version history table
CREATE TABLE public.wiki_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.wiki_articles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- CALENDAR SYSTEM TABLES
-- ============================================================================

-- Personal calendar events table
CREATE TABLE public.personal_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ADMIN & MODERATION TABLES
-- ============================================================================

-- Moderation logs table
CREATE TABLE public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('delete_post', 'delete_comment', 'grant_permission', 'revoke_permission')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_is_admin ON public.user_profiles(is_admin);
CREATE INDEX idx_user_profiles_can_create_events ON public.user_profiles(can_create_events);

-- Subforums indexes
CREATE INDEX idx_subforums_creator_id ON public.subforums(creator_id);
CREATE INDEX idx_subforums_created_at ON public.subforums(created_at DESC);
-- Note: Trigram indexes for search are created in the search migration

-- Subforum memberships indexes
CREATE INDEX idx_subforum_memberships_user_id ON public.subforum_memberships(user_id);
CREATE INDEX idx_subforum_memberships_subforum_id ON public.subforum_memberships(subforum_id);

-- Posts indexes
CREATE INDEX idx_posts_subforum_id ON public.posts(subforum_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_vote_count ON public.posts(vote_count DESC);
CREATE INDEX idx_posts_subforum_created ON public.posts(subforum_id, created_at DESC);
CREATE INDEX idx_posts_subforum_votes ON public.posts(subforum_id, vote_count DESC);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_comments_parent_comment_id ON public.comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at ASC);

-- Votes indexes
CREATE INDEX idx_votes_post_id ON public.votes(post_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);

-- Channels indexes
CREATE INDEX idx_channels_created_by ON public.channels(created_by);
CREATE INDEX idx_channels_created_at ON public.channels(created_at DESC);
-- Note: Trigram indexes for search are created in the search migration

-- Channel memberships indexes
CREATE INDEX idx_channel_memberships_user_id ON public.channel_memberships(user_id);
CREATE INDEX idx_channel_memberships_channel_id ON public.channel_memberships(channel_id);

-- Channel messages indexes
CREATE INDEX idx_channel_messages_channel_id ON public.channel_messages(channel_id);
CREATE INDEX idx_channel_messages_author_id ON public.channel_messages(author_id);
CREATE INDEX idx_channel_messages_created_at ON public.channel_messages(created_at ASC);
CREATE INDEX idx_channel_messages_channel_created ON public.channel_messages(channel_id, created_at ASC);

-- Events indexes
CREATE INDEX idx_events_creator_id ON public.events(creator_id);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_is_published ON public.events(is_published);
CREATE INDEX idx_events_date_type ON public.events(date, event_type);

-- Event registrations indexes
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations(user_id);

-- Wiki articles indexes
CREATE INDEX idx_wiki_articles_category ON public.wiki_articles(category);
CREATE INDEX idx_wiki_articles_created_by ON public.wiki_articles(created_by);
CREATE INDEX idx_wiki_articles_is_published ON public.wiki_articles(is_published);
-- Note: Trigram indexes for search are created in the search migration

-- Wiki versions indexes
CREATE INDEX idx_wiki_versions_article_id ON public.wiki_versions(article_id);
CREATE INDEX idx_wiki_versions_created_at ON public.wiki_versions(created_at DESC);

-- Personal calendar events indexes
CREATE INDEX idx_personal_calendar_events_user_id ON public.personal_calendar_events(user_id);
CREATE INDEX idx_personal_calendar_events_date ON public.personal_calendar_events(date);
CREATE INDEX idx_personal_calendar_events_user_date ON public.personal_calendar_events(user_id, date);

-- Moderation logs indexes
CREATE INDEX idx_moderation_logs_admin_id ON public.moderation_logs(admin_id);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);
CREATE INDEX idx_moderation_logs_action_type ON public.moderation_logs(action_type);

-- ============================================================================
-- TRIGGERS FOR AUTOMATED UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subforums_updated_at BEFORE UPDATE ON public.subforums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wiki_articles_updated_at BEFORE UPDATE ON public.wiki_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_calendar_events_updated_at BEFORE UPDATE ON public.personal_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update subforum member_count
CREATE OR REPLACE FUNCTION update_subforum_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.subforums
    SET member_count = member_count + 1
    WHERE id = NEW.subforum_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.subforums
    SET member_count = member_count - 1
    WHERE id = OLD.subforum_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subforum member_count
CREATE TRIGGER update_subforum_member_count_trigger
AFTER INSERT OR DELETE ON public.subforum_memberships
FOR EACH ROW EXECUTE FUNCTION update_subforum_member_count();

-- Function to update channel member_count
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.channels
    SET member_count = member_count + 1
    WHERE id = NEW.channel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.channels
    SET member_count = member_count - 1
    WHERE id = OLD.channel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for channel member_count
CREATE TRIGGER update_channel_member_count_trigger
AFTER INSERT OR DELETE ON public.channel_memberships
FOR EACH ROW EXECUTE FUNCTION update_channel_member_count();

-- Function to update post vote_count
CREATE OR REPLACE FUNCTION update_post_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET vote_count = vote_count + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE -1 END
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.posts
    SET vote_count = vote_count + 
      CASE 
        WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN 2
        WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN -2
        ELSE 0
      END
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET vote_count = vote_count - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE -1 END
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post vote_count
CREATE TRIGGER update_post_vote_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION update_post_vote_count();

-- Function to automatically add creator to subforum membership
CREATE OR REPLACE FUNCTION add_creator_to_subforum()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subforum_memberships (subforum_id, user_id)
  VALUES (NEW.id, NEW.creator_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add creator to subforum
CREATE TRIGGER add_creator_to_subforum_trigger
AFTER INSERT ON public.subforums
FOR EACH ROW EXECUTE FUNCTION add_creator_to_subforum();

-- Function to create wiki version on article update
CREATE OR REPLACE FUNCTION create_wiki_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.wiki_versions
  WHERE article_id = NEW.id;
  
  -- Create version entry
  INSERT INTO public.wiki_versions (article_id, content, version_number, created_by)
  VALUES (NEW.id, NEW.content, next_version, NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for wiki version creation
CREATE TRIGGER create_wiki_version_trigger
AFTER INSERT OR UPDATE OF content ON public.wiki_articles
FOR EACH ROW EXECUTE FUNCTION create_wiki_version();
