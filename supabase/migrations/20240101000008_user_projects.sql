-- User Projects on Profiles
-- This migration adds a JSONB column to user_profiles for storing a list of projects
-- that users are currently working on. Each project is stored as a JSON object
-- with fields like: { id, title, description, url }.

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_profiles.projects IS
  'List of user projects (title, description, url) stored as JSONB';


