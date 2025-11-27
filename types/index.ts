// Common types used throughout the application

export interface UserProfile {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  is_admin: boolean
  can_create_events: boolean
  created_at: string
}

export interface AuthResponse {
  user: UserProfile | null
  error: Error | null
}

export type VoteType = 'upvote' | 'downvote'
export type EventType = 'tum_native' | 'external'
