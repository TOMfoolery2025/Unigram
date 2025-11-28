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
  MessageSubscriptionPayload,
} from "@/types/channel";
import { isChannelMember } from "./channels";
import { handleError, DatabaseError, AuthenticationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

/* ---------------------------------------------------
   SEND MESSAGE
--------------------------------------------------- */
export async function sendMessage(
  data: Omit<ChannelMessageInsert, "author_id">,
  userId: string
): Promise<ChannelMessageResponse> {
  try {
    // 1) Permission check: user must be member of the channel
    const { data: isMember, error: membershipError } = await isChannelMember(
      data.channel_id,
      userId
    );

    if (membershipError) throw membershipError;

    if (!isMember) {
      throw new AuthenticationError(
        "You must be a member of this channel to send messages",
        "Unauthorized: Channel membership required"
      );
    }

    // 2) Insert message
    const { data: message, error } = await supabase
      .from("channel_messages")
      .insert({
        ...data,
        author_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, { operation: "sendMessage" });
    }

    logger.info("Message sent successfully", {
      operation: "sendMessage",
      userId,
      metadata: { messageId: message?.id, channelId: data.channel_id },
    });

    return { data: message, error: null };
  } catch (error: any) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "sendMessage",
      userId,
      metadata: { channelId: data.channel_id },
    });

    return { data: null, error: new Error(appError.userMessage) };
  }
}

/* ---------------------------------------------------
   GET MESSAGES
--------------------------------------------------- */
export async function getChannelMessages(
  channelId: string,
  userId: string,
  filters?: MessageFilters
): Promise<{ data: ChannelMessageWithAuthor[] | null; error: Error | null }> {
  try {
    // Member check
    const { data: isMember, error: membershipError } = await isChannelMember(
      channelId,
      userId
    );
    if (membershipError) throw membershipError;
    if (!isMember) {
      throw new AuthenticationError(
        "You must be a member of this channel to view messages",
        "Unauthorized: Channel membership required"
      );
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

    // Sorting
    if (filters?.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });
    } else {
      // Default: chronological for chat UI
      query = query.order("created_at", { ascending: true });
    }

    // Pagination
    if (typeof filters?.offset === "number") {
      const limit = filters.limit ?? 50;
      query = query.range(filters.offset, filters.offset + limit - 1);
    } else if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    const result: ChannelMessageWithAuthor[] =
      messages?.map((message: any) => ({
        ...message,
        author_name: message.user_profiles?.display_name || "Unknown User",
        author_avatar: message.user_profiles?.avatar_url || null,
      })) || [];

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/* ---------------------------------------------------
   RECENT MESSAGES (initial load helper)
--------------------------------------------------- */
export async function getRecentChannelMessages(
  channelId: string,
  userId: string,
  limit: number = 50
): Promise<{ data: ChannelMessageWithAuthor[] | null; error: Error | null }> {
  const result = await getChannelMessages(channelId, userId, {
    sortBy: "created_at",
    sortOrder: "desc",
    limit,
  });

  if (result.data) {
    result.data.reverse(); // oldest → newest for UI
  }
  return result;
}

/* ---------------------------------------------------
   MESSAGES AFTER TIMESTAMP
--------------------------------------------------- */
export async function getMessagesAfter(
  channelId: string,
  userId: string,
  timestamp: string
): Promise<{ data: ChannelMessageWithAuthor[] | null; error: Error | null }> {
  try {
    const { data: isMember, error: membershipError } = await isChannelMember(
      channelId,
      userId
    );

    if (membershipError) throw membershipError;
    if (!isMember) {
      throw new AuthenticationError(
        "You must be a member of this channel to view messages",
        "Unauthorized: Channel membership required"
      );
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
      messages?.map((message: any) => ({
        ...message,
        author_name: message.user_profiles?.display_name || "Unknown User",
        author_avatar: message.user_profiles?.avatar_url || null,
      })) || [];

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/* ---------------------------------------------------
   UPDATE MESSAGE
--------------------------------------------------- */
export async function updateMessage(
  id: string,
  updates: ChannelMessageUpdate,
  userId: string
): Promise<ChannelMessageResponse> {
  try {
    const { data: message } = await supabase
      .from("channel_messages")
      .select("author_id, channel_id")
      .eq("id", id)
      .single();

    if (!message) {
      throw new Error("Message not found");
    }
    if (message.author_id !== userId) {
      throw new AuthenticationError(
        "You can only edit your own messages",
        "Forbidden"
      );
    }

    const { data: isMember, error: membershipError } = await isChannelMember(
      message.channel_id,
      userId
    );
    if (membershipError) throw membershipError;
    if (!isMember) {
      throw new AuthenticationError(
        "You must be a member of this channel to edit messages",
        "Unauthorized"
      );
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

/* ---------------------------------------------------
   DELETE MESSAGE
--------------------------------------------------- */
export async function deleteMessage(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
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
      throw new AuthenticationError(
        "You can only delete your own messages",
        "Forbidden"
      );
    }

    // If not admin, still require membership
    if (!userProfile?.is_admin) {
      const { data: isMember, error: membershipError } = await isChannelMember(
        message.channel_id,
        userId
      );
      if (membershipError) throw membershipError;
      if (!isMember) {
        throw new AuthenticationError(
          "You must be a member of this channel to delete messages",
          "Unauthorized"
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

/* ---------------------------------------------------
   REALTIME SUBSCRIPTION
--------------------------------------------------- */
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

/* ---------------------------------------------------
   UNSUBSCRIBE
--------------------------------------------------- */
export function unsubscribeFromChannelMessages(channel: any) {
  return supabase.removeChannel(channel);
}
