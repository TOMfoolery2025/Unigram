-- Study Program field and daily winner function

-- ============================================================================
-- ADD STUDY_PROGRAM TO USER_PROFILES
-- ============================================================================

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS study_program TEXT
  CHECK (study_program IN ('BIE', 'BMDS', 'MIE', 'MIM', 'MMDT'));

COMMENT ON COLUMN public.user_profiles.study_program IS
  'User study program code (BIE, BMDS, MIE, MIM, MMDT)';

-- ============================================================================
-- FUNCTION: GET DAILY STUDY PROGRAM WINNER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_study_program_winner(
  p_game_date DATE
)
RETURNS TABLE (
  study_program TEXT,
  avg_score NUMERIC,
  player_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.study_program,
    AVG(gs.score) AS avg_score,
    COUNT(*)::INTEGER AS player_count
  FROM public.game_scores gs
  JOIN public.user_profiles up
    ON gs.user_id = up.id
  WHERE 
    gs.game_date = p_game_date
    AND up.study_program IS NOT NULL
  GROUP BY up.study_program
  ORDER BY AVG(gs.score) DESC, COUNT(*) DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_study_program_winner IS
  'Returns the study program with the highest average score (and then most players) for a given game date';


