/** @format */

// Profile types for social features

export type StudyProgram = 'BIE' | 'BMDS' | 'MIE' | 'MIM' | 'MMDT';
export type ActivityStatus = 'active' | 'absent';

export interface UserProject {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  study_program?: StudyProgram | null;
  activity_status: ActivityStatus;
  bio: string | null;
  interests: string[] | null;
  profile_visibility: 'public' | 'friends_only';
  is_admin: boolean;
  can_create_events: boolean;
  projects: UserProject[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  display_name?: string;
  bio?: string;
  interests?: string[];
  profile_visibility?: 'public' | 'friends_only';
  avatar_url?: string;
  projects?: UserProject[];
  study_program?: StudyProgram | null;
  activity_status?: ActivityStatus;
}

export type FriendshipStatus = 
  | 'none' 
  | 'pending_sent' 
  | 'pending_received' 
  | 'friends';

export interface UserProfileWithFriendship extends UserProfile {
  friendship_status: FriendshipStatus;
  mutual_friends_count?: number;
}

export interface ProfileResponse {
  data: UserProfile | null;
  error: Error | null;
}

export interface UsersResponse {
  data: UserProfileWithFriendship[] | null;
  error: Error | null;
}

export interface ProfileViewer {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_viewed_at: string;
}

export interface ProfileViewersResponse {
  data: ProfileViewer[] | null;
  error: Error | null;
}
