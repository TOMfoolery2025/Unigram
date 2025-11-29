/** @format */

// Profile types for social features

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
