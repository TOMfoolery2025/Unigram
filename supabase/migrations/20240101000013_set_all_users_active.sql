-- Ensure all existing users have activity_status = 'active'

UPDATE public.user_profiles
SET activity_status = 'active'
WHERE activity_status IS NULL
   OR activity_status <> 'active';


