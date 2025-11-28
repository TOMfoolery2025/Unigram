/** @format */

// Common types used throughout the application

// Legacy UserProfile interface - kept for backward compatibility
// New code should use UserProfile from types/profile.ts which includes social features
export interface LegacyUserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  can_create_events: boolean;
  created_at: string;
}

// Import UserProfile from profile types
import type { UserProfile as NewUserProfile } from "./profile";

export interface AuthResponse {
  user: NewUserProfile | null;
  error: Error | null;
}

export type VoteType = "upvote" | "downvote";
export type EventType = "tum_native" | "external";

// Re-export types from other modules
export * from "./database.types";
export * from "./forum";
export * from "./channel";
export * from "./event";
export * from "./calendar";
<<<<<<< Updated upstream
export * from "./profile";
export * from "./friendship";
export * from "./activity";
// Note: Wiki types are defined in types/hygraph.ts
=======
export * from "./wiki";
export * from "./chat";
>>>>>>> Stashed changes
