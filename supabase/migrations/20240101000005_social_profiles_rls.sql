-- Social Profiles and Feed RLS Policies
-- This migration adds Row Level Security policies for the friendships table

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON FRIENDSHIPS TABLE
-- ============================================================================

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FRIENDSHIPS POLICIES
-- ============================================================================

-- Users can view friendships where they are involved (either as user or friend)
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- Users can send friend requests (create pending friendships)
-- The requester must be the user_id, and status must be pending
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() = requester_id AND
    status = 'pending' AND
    user_id != friend_id
  );

-- Users can accept friend requests sent to them
-- This updates the status from pending to accepted
-- Only the recipient (friend_id) can accept, and only if they didn't send it
CREATE POLICY "Users can accept friend requests"
  ON public.friendships FOR UPDATE
  USING (
    auth.uid() = friend_id AND
    requester_id != auth.uid() AND
    status = 'pending'
  )
  WITH CHECK (
    auth.uid() = friend_id AND
    status = 'accepted'
  );

-- Users can delete friendships where they are involved
-- This covers: declining requests, unfriending, and canceling sent requests
CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- Admins can view all friendships
CREATE POLICY "Admins can view all friendships"
  ON public.friendships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete any friendship (for moderation)
CREATE POLICY "Admins can delete any friendship"
  ON public.friendships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- UPDATE USER_PROFILES POLICIES FOR SOCIAL FIELDS
-- ============================================================================

-- Update the existing user profile update policy to allow users to update social fields
-- Drop the existing restrictive policy and create a new one
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Users can update their own profile (including bio, interests, profile_visibility)
-- But cannot change admin fields
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Ensure admin fields haven't changed
    is_admin = (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) AND
    can_create_events = (SELECT can_create_events FROM public.user_profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view their own friendships" ON public.friendships IS 
  'Users can view friendships where they are either the user or the friend';

COMMENT ON POLICY "Users can send friend requests" ON public.friendships IS 
  'Users can create pending friend requests where they are the requester';

COMMENT ON POLICY "Users can accept friend requests" ON public.friendships IS 
  'Users can accept friend requests that were sent to them by updating status to accepted';

COMMENT ON POLICY "Users can delete their friendships" ON public.friendships IS 
  'Users can delete friendships they are involved in (decline, unfriend, or cancel)';

