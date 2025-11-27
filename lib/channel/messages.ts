/** @format */

// Channel message data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  ChannelMessage,
  ChannelMessageInsert,
  ChannelMessageUpdate,
  ChannelMessageWithAuthor,
  MessageFilters,
  ChannelMessageResponse,
  ChannelMessagesResponse,
  MessageSubscriptionPayload,
} from "@/types/channel";
import { isChannelMember } from "./channels";
import { handleError, DatabaseError, AuthenticationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

/**
 * Send a message to a channel
 */
export async function sendMessage(
  data: Omit<ChannelMessageInsert, "author_id">,
  userId: string
): Promise<ChannelMessageResponse> {
  try {
    // Check if user is a member of the channel
    const { data: isMember, error: membershipError } = await isChannelMember(
      data.channel_id,
      userId
    );

    if (membershipError) throw membershipError;

    if (!isMember) {
      throw new AuthenticationError("You must be a member of this channel to send messages", "Unauthorized: Channel membership required");
    }

    const { data: message, error } = await supabase
      .from("channel_messages")
      .insert({
        ...data,
        author_id: userId,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, { operation: 'sendMessage' });

    logger.info('Message sent successfully', {
      operation: 'sendMessage',
      userId,
      metadata: { messageId: message?.id, channelId: data.channel_id },
    });

    return { data: message, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'sendMessage',
      userId,
      metadata: { channelId: data.channel_id },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Get messages from a channel
 */
export async function getChannelMessages(
  channelId: string,
  userId: string,
  filters?: MessageFilters
): Promise<{ data: ChannelMessageWithAuthor[] | null; error: Error | null }> {
  try {
    // Check if user is a member of the channel
    const { data: isMember, error: membershipError } = await isChannelMember(
      channelId,
      userId
    );

    if (membershipError) throw membershipError;

    if (!isMember) {
      throw new Error("You must be a member of this channel to view messages");
    }

    let query = supabase
      .from("channel_messages")
      .select(
        `
        *,
        user_profiles!channel_messages_author_id_fkey(
          display_name,
          avatar_url
        )
      `
      )
      .eq("channel_id", channelId);

    // Apply sorting
    if (filters?.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });
    } else {
      // Default sort by creation time, oldest first for chat
      query = query.order("created_at", { ascending: true });
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    const result: ChannelMessageWithAuthor[] =
      messages?.map((message) => ({
        ...message,
        author_name: message.user_profiles?.display_name || "Unknown User",
        author_avatar: message.user_profiles?.avatar_url || null,
      })) || [];

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get recent messages from a channel (for initial load)
 */
export async function getRecentChannelMessages(
  channelId: string,
  userId: string,
  limit: number = 50
): Promise<{ data: ChannelMessageWithAuthor[] | null; error: Error | null }> {
  return getChannelMessages(channelId, userId, {
    sortBy: "created_at",
    sortOrder: "desc",
    limit,
  }).then((result) => {
    // Reverse the order to show oldest first
    if (result.data) {
      result.data.reverse();
    }
    return result;
  });
}

/**
 * Get messages after a specific timestamp (for real-time updates)
 */
export async function getMessagesAfter(
  channelId: string,
  userId: string,
  timestamp: string
): Promise<{ data: ChannelMessageWithAuthor[] | null; error: Error | null }> {
  try {
    // Check if user is a member of the channel
    const { data: isMember, error: membershipError } = await isChannelMember(
      channelId,
      userId
    );

    if (membershipError) throw membershipError;

    if (!isMember) {
      throw new Error("You must be a member of this channel to view messages");
    }

    const { data: messages, error } = await supabase
      .from("channel_messages")
      .select(
        `
        *,
        user_profiles!channel_messages_author_id_fkey(
          display_name,
          avatar_url
        )
      `
      )
      .eq("channel_id", channelId)
      .gt("created_at", timestamp)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const result: ChannelMessageWithAuthor[] =
      messages?.map((message) => ({
        ...message,
        author_name: message.user_profiles?.display_name || "Unknown User",
        author_avatar: message.user_profiles?.avatar_url || null,
      })) || [];

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a message (author only)
 */
export async function updateMessage(
  id: string,
  updates: ChannelMessageUpdate,
  userId: string
): Promise<ChannelMessageResponse> {
  try {
    // First check if user is the author
    const { data: message } = await supabase
      .from("channel_messages")
      .select("author_id, channel_id")
      .eq("id", id)
      .single();

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.author_id !== userId) {
      throw new Error("You can only edit your own messages");
    }

    // Check if user is still a member of the channel
    const { data: isMember, error: membershipError } = await isChannelMember(
      message.channel_id,
      userId
    );

    if (membershipError) throw membershipError;

    if (!isMember) {
      throw new Error("You must be a member of this channel to edit messages");
    }

    const { data: updatedMessage, error } = await supabase
      .from("channel_messages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: updatedMessage, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a message (author or admin only)
 */
export async function deleteMessage(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // First check if user is the author or admin
    const { data: message } = await supabase
      .from("channel_messages")
      .select("author_id, channel_id")
      .eq("id", id)
      .single();

    if (!message) {
      throw new Error("Message not found");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (message.author_id !== userId && !userProfile?.is_admin) {
      throw new Error("You can only delete your own messages");
    }

    // Check if user is still a member of the channel (unless admin)
    if (!userProfile?.is_admin) {
      const { data: isMember, error: membershipError } = await isChannelMember(
        message.channel_id,
        userId
      );

      if (membershipError) throw membershipError;

      if (!isMember) {
        throw new Error(
          "You must be a member of this channel to delete messages"
        );
      }
    }

    const { error } = await supabase
      .from("channel_messages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Subscribe to new messages in a channel
 */
export function subscribeToChannelMessages(
  channelId: string,
  onMessage: (payload: MessageSubscriptionPayload) => void
) {
  const channel = supabase
    .channel(`channel-messages:${channelId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "channel_messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onMessage({
          new: payload.new as ChannelMessage,
          eventType: "INSERT",
        });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "channel_messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onMessage({
          new: payload.new as ChannelMessage,
          old: payload.old as ChannelMessage,
          eventType: "UPDATE",
        });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "channel_messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onMessage({
          new: payload.old as ChannelMessage,
          eventType: "DELETE",
        });
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from channel messages
 */
export function unsubscribeFromChannelMessages(channel: any) {
  return supabase.removeChannel(channel);
}
