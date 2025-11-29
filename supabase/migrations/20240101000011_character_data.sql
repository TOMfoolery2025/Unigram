-- Add character_data column to user_profiles table
-- This migration adds support for customizable character avatars

-- Add character_data JSONB column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN character_data JSONB DEFAULT NULL;

-- Create GIN index on character_data column for efficient querying
-- GIN (Generalized Inverted Index) is optimal for JSONB data
CREATE INDEX idx_user_profiles_character_data 
ON public.user_profiles USING GIN (character_data);

-- Add comment to document the column
COMMENT ON COLUMN public.user_profiles.character_data IS 
'Stores customizable character avatar data as JSON. Contains character customization options including body type, facial features, hair, clothing, and accessories.';
