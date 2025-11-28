// Supabase database types for TUM Community Platform
// These types match the database schema defined in supabase/migrations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          interests: string[] | null
          profile_visibility: 'public' | 'friends_only'
          is_admin: boolean
          can_create_events: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          interests?: string[] | null
          profile_visibility?: 'public' | 'friends_only'
          is_admin?: boolean
          can_create_events?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          interests?: string[] | null
          profile_visibility?: 'public' | 'friends_only'
          is_admin?: boolean
          can_create_events?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subforums: {
        Row: {
          id: string
          name: string
          description: string
          creator_id: string
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          creator_id: string
          member_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          creator_id?: string
          member_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      subforum_memberships: {
        Row: {
          subforum_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          subforum_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          subforum_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          subforum_id: string
          author_id: string
          title: string
          content: string
          is_anonymous: boolean
          vote_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subforum_id: string
          author_id: string
          title: string
          content: string
          is_anonymous?: boolean
          vote_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subforum_id?: string
          author_id?: string
          title?: string
          content?: string
          is_anonymous?: boolean
          vote_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          is_anonymous: boolean
          parent_comment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          is_anonymous?: boolean
          parent_comment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          is_anonymous?: boolean
          parent_comment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          vote_type: 'upvote' | 'downvote'
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          vote_type: 'upvote' | 'downvote'
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          vote_type?: 'upvote' | 'downvote'
          created_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          description: string
          created_by: string
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          created_by: string
          member_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_by?: string
          member_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      channel_memberships: {
        Row: {
          channel_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          channel_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          channel_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      channel_messages: {
        Row: {
          id: string
          channel_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          event_type: 'tum_native' | 'external'
          date: string
          time: string
          location: string
          external_link: string | null
          creator_id: string
          max_attendees: number | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          event_type: 'tum_native' | 'external'
          date: string
          time: string
          location: string
          external_link?: string | null
          creator_id: string
          max_attendees?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          event_type?: 'tum_native' | 'external'
          date?: string
          time?: string
          location?: string
          external_link?: string | null
          creator_id?: string
          max_attendees?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          qr_code: string | null
          registered_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          qr_code?: string | null
          registered_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          qr_code?: string | null
          registered_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted'
          requester_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted'
          requester_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted'
          requester_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      personal_calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          date: string
          time: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          date: string
          time: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          date?: string
          time?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      moderation_logs: {
        Row: {
          id: string
          admin_id: string
          action_type: 'delete_post' | 'delete_comment' | 'grant_permission' | 'revoke_permission'
          target_id: string
          target_type: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: 'delete_post' | 'delete_comment' | 'grant_permission' | 'revoke_permission'
          target_id: string
          target_type: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action_type?: 'delete_post' | 'delete_comment' | 'grant_permission' | 'revoke_permission'
          target_id?: string
          target_type?: string
          reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      user_activities: {
        Row: {
          activity_type: 'post' | 'event_registration' | 'friendship'
          activity_id: string
          user_id: string
          activity_title: string
          activity_description: string | null
          context_name: string | null
          created_at: string
          actor_id: string
        }
      }
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      can_create_events: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_post_with_author: {
        Args: { post_id: string; requesting_user_id: string }
        Returns: {
          id: string
          subforum_id: string
          author_id: string | null
          author_name: string | null
          title: string
          content: string
          is_anonymous: boolean
          vote_count: number
          created_at: string
          updated_at: string
        }[]
      }
      get_comment_with_author: {
        Args: { comment_id: string; requesting_user_id: string }
        Returns: {
          id: string
          post_id: string
          author_id: string | null
          author_name: string | null
          content: string
          is_anonymous: boolean
          parent_comment_id: string | null
          created_at: string
          updated_at: string
        }[]
      }
      search_subforums: {
        Args: { search_query: string }
        Returns: {
          id: string
          name: string
          description: string
          creator_id: string
          member_count: number
          created_at: string
          updated_at: string
          similarity: number
        }[]
      }
      search_channels: {
        Args: { search_query: string }
        Returns: {
          id: string
          name: string
          description: string
          created_by: string
          member_count: number
          created_at: string
          updated_at: string
          similarity: number
        }[]
      }
      get_friendship_status: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      are_friends: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
