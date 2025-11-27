/** @format */

// Channel-related types for the TUM Community Platform

import { Database } from "./database.types";

// Base types from database
export type Channel = Database["public"]["Tables"]["channels"]["Row"];
export type ChannelInsert = Database["public"]["Tables"]["channels"]["Insert"];
export type ChannelUpdate = Database["public"]["Tables"]["channels"]["Update"];

export type ChannelMembership =
  Database["public"]["Tables"]["channel_memberships"]["Row"];
export type ChannelMembershipInsert =
  Database["public"]["Tables"]["channel_memberships"]["Insert"];

export type ChannelMessage =
  Database["public"]["Tables"]["channel_messages"]["Row"];
export type ChannelMessageInsert =
  Database["public"]["Tables"]["channel_messages"]["Insert"];
export type ChannelMessageUpdate =
  Database["public"]["Tables"]["channel_messages"]["Update"];

// Extended types with additional data
export interface ChannelWithMembership extends Channel {
  is_member?: boolean;
  creator_name?: string;
}

export interface ChannelMessageWithAuthor extends ChannelMessage {
  author_name?: string;
  author_avatar?: string;
}

// Search and filter types
export interface ChannelSearchResult extends Channel {
  similarity: number;
}

export interface ChannelFilters {
  search?: string;
  sortBy?: "name" | "member_count" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface MessageFilters {
  sortBy?: "created_at";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// API response types
export interface ChannelResponse {
  data: Channel | null;
  error: Error | null;
}

export interface ChannelsResponse {
  data: Channel[] | null;
  error: Error | null;
}

export interface ChannelMessageResponse {
  data: ChannelMessage | null;
  error: Error | null;
}

export interface ChannelMessagesResponse {
  data: ChannelMessage[] | null;
  error: Error | null;
}

// Real-time subscription types
export interface ChannelSubscription {
  channel: string;
  event: string;
  payload: any;
}

export interface MessageSubscriptionPayload {
  new: ChannelMessage;
  old?: ChannelMessage;
  eventType: "INSERT" | "UPDATE" | "DELETE";
}
