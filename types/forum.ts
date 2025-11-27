/** @format */

// Forum-related types for the TUM Community Platform

import { Database } from "./database.types";

// Base types from database
export type Subforum = Database["public"]["Tables"]["subforums"]["Row"];
export type SubforumInsert =
  Database["public"]["Tables"]["subforums"]["Insert"];
export type SubforumUpdate =
  Database["public"]["Tables"]["subforums"]["Update"];

export type SubforumMembership =
  Database["public"]["Tables"]["subforum_memberships"]["Row"];
export type SubforumMembershipInsert =
  Database["public"]["Tables"]["subforum_memberships"]["Insert"];

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
export type CommentUpdate = Database["public"]["Tables"]["comments"]["Update"];

export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type VoteInsert = Database["public"]["Tables"]["votes"]["Insert"];

// Extended types with additional data
export interface SubforumWithMembership extends Subforum {
  is_member?: boolean;
  creator_name?: string;
}

export interface PostWithAuthor extends Post {
  author_name?: string | null;
  user_vote?: "upvote" | "downvote" | null;
  comment_count?: number;
  subforum_name?: string;
}

export interface CommentWithAuthor extends Comment {
  author_name?: string | null;
  replies?: CommentWithAuthor[];
  post_title?: string;
  subforum_name?: string;
}

// Search and filter types
export interface SubforumSearchResult extends Subforum {
  similarity: number;
}

export interface SubforumFilters {
  search?: string;
  sortBy?: "name" | "member_count" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface PostFilters {
  sortBy?: "created_at" | "vote_count" | "updated_at";
  sortOrder?: "asc" | "desc";
}

// API response types
export interface SubforumResponse {
  data: Subforum | null;
  error: Error | null;
}

export interface SubforumsResponse {
  data: Subforum[] | null;
  error: Error | null;
}

export interface PostResponse {
  data: Post | null;
  error: Error | null;
}

export interface PostsResponse {
  data: Post[] | null;
  error: Error | null;
}
