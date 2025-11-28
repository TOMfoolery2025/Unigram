/** @format */

// Friendship types for social features

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  requester_id: string;
  created_at: string;
  updated_at: string;
}

export interface FriendWithProfile {
  friendship_id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  friendship_since: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  requester_name: string | null;
  requester_avatar: string | null;
  requester_bio: string | null;
  created_at: string;
}

export interface FriendshipResponse {
  data: Friendship | null;
  error: Error | null;
}

export interface FriendsResponse {
  data: FriendWithProfile[] | null;
  error: Error | null;
}

export interface FriendRequestsResponse {
  data: FriendRequest[] | null;
  error: Error | null;
}

export interface FriendshipStatusResponse {
  data: import('./profile').FriendshipStatus | null;
  error: Error | null;
}
