-- Game Scores Table for Daily Puzzle Games
-- This migration creates the game_scores table with proper indexes and RLS policies

-- ============================================================================
-- GAME SCORES TABLE
-- ============================================================================
CREATE TABLE public.game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  score INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, game_date)
);

-- Create indexes for efficient queries
CREATE INDEX idx_game_scores_date ON public.game_scores(game_date);
CREATE INDEX idx_game_scores_user_date ON public.game_scores(user_id, game_date);
CREATE INDEX idx_game_scores_date_score ON public.game_scores(game_date, score DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Users can view all game scores (for leaderboard)
CREATE POLICY "Users can view all game scores"
  ON public.game_scores
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own game scores
CREATE POLICY "Users can insert their own game scores"
  ON public.game_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete game scores (immutable once submitted)
-- No UPDATE or DELETE policies means these operations are not allowed

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's rank for a specific date
CREATE OR REPLACE FUNCTION public.get_user_rank(
  p_user_id UUID,
  p_game_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT rank INTO user_rank
  FROM (
    SELECT 
      user_id,
      RANK() OVER (ORDER BY score DESC) as rank
    FROM public.game_scores
    WHERE game_date = p_game_date
  ) ranked_scores
  WHERE user_id = p_user_id;
  
  RETURN user_rank;
END;
$$;

-- Function to get top subhives by activity
CREATE OR REPLACE FUNCTION public.get_top_subhives(
  p_limit INTEGER DEFAULT 5,
  p_date_threshold TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  member_count INTEGER,
  post_count_7d BIGINT,
  comment_count_7d BIGINT,
  activity_score BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.member_count,
    COUNT(DISTINCT p.id) as post_count_7d,
    COUNT(DISTINCT c.id) as comment_count_7d,
    (COUNT(DISTINCT p.id) * 2 + COUNT(DISTINCT c.id)) as activity_score
  FROM public.subforums s
  LEFT JOIN public.posts p ON s.id = p.subforum_id 
    AND p.created_at > p_date_threshold
  LEFT JOIN public.comments c ON p.id = c.post_id 
    AND c.created_at > p_date_threshold
  GROUP BY s.id, s.name, s.description, s.member_count
  ORDER BY activity_score DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.game_scores IS 'Stores daily puzzle game scores for users';
COMMENT ON COLUMN public.game_scores.game_date IS 'The date of the game (YYYY-MM-DD format)';
COMMENT ON COLUMN public.game_scores.score IS 'The score achieved by the user';
COMMENT ON COLUMN public.game_scores.completed_at IS 'When the user completed the game';
COMMENT ON FUNCTION public.get_user_rank IS 'Returns the rank of a user for a specific game date';
COMMENT ON FUNCTION public.get_top_subhives IS 'Returns the most active subhives based on recent activity';
