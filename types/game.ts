/** @format */

// Game-related types for the TUM Community Platform

import { Database } from "./database.types";

// Base types from database (will be available after migration)
export interface GameScore {
  id: string;
  user_id: string;
  game_date: string; // YYYY-MM-DD format
  score: number;
  completed_at: string; // ISO timestamp
  created_at: string;
}

export interface GameScoreInsert {
  user_id: string;
  game_date: string;
  score: number;
  completed_at?: string;
}

// Extended types with additional data
export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  rank: number;
}

export interface StudyProgramWinner {
  study_program: string;
  avg_score: number;
  player_count: number;
}

export interface SubhiveActivity {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  post_count_7d: number;
  comment_count_7d: number;
  activity_score: number;
}

export interface PostWithSubhive {
  id: string;
  subforum_id: string;
  subforum_name: string;
  author_id: string;
  author_name?: string | null;
  title: string;
  content: string;
  is_anonymous: boolean;
  vote_count: number;
  comment_count?: number;
  user_vote?: "upvote" | "downvote" | null;
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface SubmitScoreRequest {
  score: number;
  game_date: string; // YYYY-MM-DD
}

export interface SubmitScoreResponse {
  success: boolean;
  rank?: number;
  error?: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export interface StudyProgramWinnerResponse {
  winner: StudyProgramWinner | null;
}

export interface TopSubhivesResponse {
  subhives: SubhiveActivity[];
}

export interface FeedResponse {
  posts: PostWithSubhive[];
  hasMore: boolean;
  total: number;
}

export interface HasPlayedResponse {
  has_played: boolean;
  score?: number;
  rank?: number;
}
