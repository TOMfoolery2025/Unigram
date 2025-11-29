-- User activity status (active / absent)

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS activity_status TEXT
  NOT NULL
  DEFAULT 'active'
  CHECK (activity_status IN ('active', 'absent'));

COMMENT ON COLUMN public.user_profiles.activity_status IS
  'Simple availability flag for users (active or absent)';


