-- Social Profiles and Feed Feature Migration
-- This migration extends user_profiles, creates friendships table, and adds activity feed view

-- ============================================================================
-- EXTEND USER_PROFILES TABLE
-- ============================================================================

-- Add social profile fields to existing user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends_only'));

-- Add index for profile visibility queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_visibility ON public.user_profiles(profile_visibility);

-- ============================================================================
-- FRIENDSHIPS TABLE
-- ============================================================================

-- Create friendships table for managing friend connections
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  requester_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure no duplicate friendships
  UNIQUE(user_id, friend_id),
  
  -- Ensure user can't friend themselves
  CHECK (user_id != friend_id)
);

-- ============================================================================
-- FRIENDSHIPS INDEXES
-- ============================================================================

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON public.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON public.friendships(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_requester_id ON public.friendships(requester_id);

-- Indexes for activity feed queries
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_created ON public.event_registrations(user_id, registered_at DESC);

-- ============================================================================
-- FRIENDSHIPS TRIGGERS
-- ============================================================================

-- Apply updated_at trigger to friendships table
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER ACTIVITIES VIEW
-- ============================================================================

-- Create a view that aggregates activities from posts, event registrations, and friendships
CREATE OR REPLACE VIEW public.user_activities AS
SELECT 
  'post' AS activity_type,
  p.id AS activity_id,
  p.author_id AS user_id,
  p.title AS activity_title,
  p.content AS activity_description,
  s.name AS context_name,
  p.created_at,
  p.author_id AS actor_id
FROM public.posts p
JOIN public.subforums s ON p.subforum_id = s.id
WHERE p.is_anonymous = false

UNION ALL

SELECT 
  'event_registration' AS activity_type,
  er.id AS activity_id,
  er.user_id AS user_id,
  e.title AS activity_title,
  e.description AS activity_description,
  e.location AS context_name,
  er.registered_at AS created_at,
  er.user_id AS actor_id
FROM public.event_registrations er
JOIN public.events e ON er.event_id = e.id

UNION ALL

SELECT 
  'friendship' AS activity_type,
  f.id AS activity_id,
  f.user_id AS user_id,
  'New friend connection' AS activity_title,
  NULL AS activity_description,
  NULL AS context_name,
  f.created_at,
  f.friend_id AS actor_id
FROM public.friendships f
WHERE f.status = 'accepted';

-- ============================================================================
-- HELPER FUNCTIONS FOR FRIENDSHIPS
-- ============================================================================

-- Function to get friendship status between two users
CREATE OR REPLACE FUNCTION get_friendship_status(user1_id UUID, user2_id UUID)
RETURNS TEXT AS $$
DECLARE
  friendship_record RECORD;
BEGIN
  -- Check if there's a friendship between the two users
  SELECT * INTO friendship_record
  FROM public.friendships
  WHERE (user_id = user1_id AND friend_id = user2_id)
     OR (user_id = user2_id AND friend_id = user1_id);
  
  -- If no friendship exists
  IF NOT FOUND THEN
    RETURN 'none';
  END IF;
  
  -- If friendship is accepted
  IF friendship_record.status = 'accepted' THEN
    RETURN 'friends';
  END IF;
  
  -- If friendship is pending, determine who sent the request
  IF friendship_record.requester_id = user1_id THEN
    RETURN 'pending_sent';
  ELSE
    RETURN 'pending_received';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND ((user_id = user1_id AND friend_id = user2_id)
         OR (user_id = user2_id AND friend_id = user1_id))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE public.friendships IS 'Stores friend connections between users with pending and accepted states';
COMMENT ON COLUMN public.user_profiles.bio IS 'User biography text for profile display';
COMMENT ON COLUMN public.user_profiles.interests IS 'Array of user interest tags';
COMMENT ON COLUMN public.user_profiles.profile_visibility IS 'Profile visibility setting: public or friends_only';
COMMENT ON VIEW public.user_activities IS 'Aggregated view of user activities including posts, event registrations, and friendships';

