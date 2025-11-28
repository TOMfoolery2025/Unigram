/** @format */

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
import { handleError, DatabaseError, AuthenticationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";
import bcrypt from "bcryptjs"; // client-side hashing (safe for PIN)

const supabase = createClient();

/* ---------------------------------------------------
   CREATE CHANNEL   (admin)
--------------------------------------------------- */
export async function createChannel(
  data: Omit<ChannelInsert, "created_by" | "pin_hash"> & {
    access_type: "public" | "pin";
    pin_code?: string;
  },
  userId: string
): Promise<ChannelResponse> {
  try {
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (!userProfile?.is_admin) {
      throw new AuthenticationError(
        "Only administrators can create channels",
        "Unauthorized"
      );
    }

    // ---- NEW: strip pin_code before inserting ----
    const { pin_code, ...rest } = data;

    let pin_hash: string | null = null;

    if (data.access_type === "pin") {
      if (!/^\d{4}$/.test(pin_code || "")) {
        throw new Error("PIN must be 4 digits");
      }
      pin_hash = await bcrypt.hash(pin_code!, 10);
    }

    const { data: channel, error } = await supabase
      .from("channels")
      .insert({
        ...rest, // name, description, access_type, etc.
        pin_hash, // hashed 4-digit PIN or null
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);

    return { data: channel, error: null };
  } catch (error) {
    const appError = handleError(error);
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/* ---------------------------------------------------
   GET CHANNEL
--------------------------------------------------- */
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
      has_pin: !!channel.pin_hash,
      creator_name: channel.user_profiles?.display_name || "Unknown Admin",
    };

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/* ---------------------------------------------------
   USER CHANNELS
--------------------------------------------------- */
export async function getUserChannels(
  userId: string
): Promise<{ data: ChannelWithMembership[] | null; error: Error | null }> {
  try {
    const { data: memberships, error: memError } = await supabase
      .from("channel_memberships")
      .select("channel_id")
      .eq("user_id", userId);

    if (memError) throw memError;

    const channelIds = memberships?.map((m) => m.channel_id) || [];
    if (channelIds.length === 0) {
      return { data: [], error: null };
    }

    const { data: channels, error: chError } = await supabase
      .from("channels")
      .select(
        `
        *,
        user_profiles!channels_created_by_fkey(display_name)
      `
      )
      .in("id", channelIds);

    if (chError) throw chError;

    const result: ChannelWithMembership[] =
      channels?.map((channel) => ({
        ...channel,
        is_member: true,
        has_pin: !!channel.pin_hash,
        creator_name: channel.user_profiles?.display_name || "Unknown Admin",
      })) || [];

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/* ---------------------------------------------------
   CHECK IF USER IS CHANNEL MEMBER
--------------------------------------------------- */
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

    // Supabase PostgREST "not found" code is often PGRST116, but in the
    // JS client we usually just check for no data
    if (error && (error as any).code && (error as any).code !== "PGRST116") {
      throw error;
    }

    return { data: !!membership, error: null };
  } catch (error) {
    return { data: false, error: error as Error };
  }
}

/* ---------------------------------------------------
   GET CHANNEL LIST
--------------------------------------------------- */
export async function getChannels(
  filters?: ChannelFilters,
  userId?: string
): Promise<{ data: ChannelWithMembership[] | null; error: Error | null }> {
  try {
    let query = supabase.from("channels").select(`
      *,
      user_profiles!channels_created_by_fkey(display_name)
    `);

    // Sorting
    if (filters?.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: channels, error } = await query;
    if (error) throw error;

    let result: ChannelWithMembership[] = [];

    if (channels) {
      let memberChannelIds = new Set<string>();

      if (userId) {
        const { data: memberships } = await supabase
          .from("channel_memberships")
          .select("channel_id")
          .eq("user_id", userId);

        memberChannelIds = new Set(memberships?.map((m) => m.channel_id) || []);
      }

      result = channels.map((channel) => ({
        ...channel,
        is_member: memberChannelIds.has(channel.id),
        has_pin: !!channel.pin_hash,
        creator_name: channel.user_profiles?.display_name || "Unknown Admin",
      }));

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(
          (c) =>
            c.name.toLowerCase().includes(s) ||
            c.description?.toLowerCase().includes(s)
        );
      }
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/* ---------------------------------------------------
   JOIN A CHANNEL (WITH PIN)
--------------------------------------------------- */
export async function joinChannel(
  channelId: string,
  userId: string,
  pin_code?: string
): Promise<{ error: Error | null }> {
  try {
    // 1. Load channel to check access type
    const { data: channel, error: chError } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();

    if (chError || !channel) throw new Error("Channel not found");

    // 2. If PIN protected, validate PIN
    if (channel.access_type === "pin") {
      if (!pin_code) throw new Error("This channel requires a PIN");
      if (!channel.pin_hash) throw new Error("Channel PIN is not configured");

      const isValid = await bcrypt.compare(pin_code, channel.pin_hash);
      if (!isValid) throw new Error("Incorrect PIN");
    }

    // 3. Check if already a member
    const { data: membership } = await supabase
      .from("channel_memberships")
      .select("user_id")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single();

    if (membership) return { error: null };

    // 4. Insert membership
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

/* ---------------------------------------------------
   LEAVE CHANNEL
--------------------------------------------------- */
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
