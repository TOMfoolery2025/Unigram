/** @format */

// Channel data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  Channel,
  ChannelInsert,
  ChannelUpdate,
  ChannelWithMembership,
  ChannelSearchResult,
  ChannelFilters,
  ChannelResponse,
  ChannelsResponse,
} from "@/types/channel";

const supabase = createClient();

/**
 * Create a new channel (admin only)
 */
export async function createChannel(
  data: Omit<ChannelInsert, "created_by">,
  userId: string
): Promise<ChannelResponse> {
  try {
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (!userProfile?.is_admin) {
      throw new Error("Only administrators can create channels");
    }

    const { data: channel, error } = await supabase
      .from("channels")
      .insert({
        ...data,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: channel, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get a channel by ID
 */
export async function getChannel(
  id: string,
  userId?: string
): Promise<{ data: ChannelWithMembership | null; error: Error | null }> {
  try {
    const { data: channel, error } = await supabase
      .from("channels")
      .select(
        `
        *,
        user_profiles!channels_created_by_fkey(display_name)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    let is_member = false;
    if (userId && channel) {
      const { data: membership } = await supabase
        .from("channel_memberships")
        .select("user_id")
        .eq("channel_id", id)
        .eq("user_id", userId)
        .single();

      is_member = !!membership;
    }

    const result: ChannelWithMembership = {
      ...channel,
      is_member,
      creator_name: channel.user_profiles?.display_name || "Unknown Admin",
    };

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all channels with optional filtering and search
 */
export async function getChannels(
  filters?: ChannelFilters,
  userId?: string
): Promise<{ data: ChannelWithMembership[] | null; error: Error | null }> {
  try {
    let query = supabase.from("channels").select(`
        *,
        user_profiles!channels_created_by_fkey(display_name)
      `);

    // Apply sorting
    if (filters?.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });
    } else {
      // Default sort by creation date, newest first
      query = query.order("created_at", { ascending: false });
    }

    const { data: channels, error } = await query;

    if (error) throw error;

    let result: ChannelWithMembership[] = [];

    if (channels) {
      // Check membership for each channel if user is provided
      if (userId) {
        const { data: memberships } = await supabase
          .from("channel_memberships")
          .select("channel_id")
          .eq("user_id", userId);

        const memberChannelIds = new Set(
          memberships?.map((m) => m.channel_id) || []
        );

        result = channels.map((channel) => ({
          ...channel,
          is_member: memberChannelIds.has(channel.id),
          creator_name: channel.user_profiles?.display_name || "Unknown Admin",
        }));
      } else {
        result = channels.map((channel) => ({
          ...channel,
          creator_name: channel.user_profiles?.display_name || "Unknown Admin",
        }));
      }

      // Apply search filter if provided
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        result = result.filter(
          (channel) =>
            channel.name.toLowerCase().includes(searchTerm) ||
            channel.description.toLowerCase().includes(searchTerm)
        );
      }
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Search channels using full-text search
 */
export async function searchChannels(
  query: string
): Promise<{ data: ChannelSearchResult[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("search_channels", {
      search_query: query,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a channel (admin only)
 */
export async function updateChannel(
  id: string,
  updates: ChannelUpdate,
  userId: string
): Promise<ChannelResponse> {
  try {
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (!userProfile?.is_admin) {
      throw new Error("Only administrators can update channels");
    }

    const { data: updatedChannel, error } = await supabase
      .from("channels")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: updatedChannel, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a channel (admin only)
 */
export async function deleteChannel(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (!userProfile?.is_admin) {
      throw new Error("Only administrators can delete channels");
    }

    const { error } = await supabase.from("channels").delete().eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Join a channel
 */
export async function joinChannel(
  channelId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // Check if already a member
    const { data: existingMembership } = await supabase
      .from("channel_memberships")
      .select("user_id")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single();

    if (existingMembership) {
      return { error: null }; // Already a member
    }

    const { error } = await supabase.from("channel_memberships").insert({
      channel_id: channelId,
      user_id: userId,
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Leave a channel
 */
export async function leaveChannel(
  channelId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("channel_memberships")
      .delete()
      .eq("channel_id", channelId)
      .eq("user_id", userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get channel members
 */
export async function getChannelMembers(
  channelId: string
): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("channel_memberships")
      .select(
        `
        user_id,
        joined_at,
        user_profiles!channel_memberships_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("channel_id", channelId)
      .order("joined_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get user's joined channels
 */
export async function getUserChannels(
  userId: string
): Promise<ChannelsResponse> {
  try {
    const { data, error } = await supabase
      .from("channel_memberships")
      .select(
        `
        channel_id,
        joined_at,
        channels!channel_memberships_channel_id_fkey(*)
      `
      )
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });

    if (error) throw error;

    const channels: Channel[] =
      data?.map((membership: any) => membership.channels).filter(Boolean) || [];

    return { data: channels, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Check if user is a member of a channel
 */
export async function isChannelMember(
  channelId: string,
  userId: string
): Promise<{ data: boolean; error: Error | null }> {
  try {
    const { data: membership, error } = await supabase
      .from("channel_memberships")
      .select("user_id")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      throw error;
    }

    return { data: !!membership, error: null };
  } catch (error) {
    return { data: false, error: error as Error };
  }
}
