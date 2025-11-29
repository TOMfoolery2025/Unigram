/** @format */

// Post playlist data layer for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  PostPlaylist,
  PostPlaylistItem,
  PostPlaylistWithCount,
  PostWithAuthor,
} from "@/types/forum";
import { handleError, DatabaseError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

export async function getUserPlaylists(
  userId: string
): Promise<{ data: PostPlaylistWithCount[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("post_playlists")
      .select(
        `
        *,
        post_playlist_items(count)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new DatabaseError(error.message, {
        operation: "getUserPlaylists",
        userId,
      });
    }

    const playlists: PostPlaylistWithCount[] =
      data?.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at,
        item_count: row.post_playlist_items?.[0]?.count ?? 0,
      })) || [];

    return { data: playlists, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "getUserPlaylists",
      metadata: { userId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

export async function createPlaylist(
  userId: string,
  name: string,
  description?: string
): Promise<{ data: PostPlaylist | null; error: Error | null }> {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new ValidationError("Playlist name is required", {});
    }

    const { data, error } = await supabase
      .from("post_playlists")
      .insert({
        user_id: userId,
        name: trimmedName,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, {
        operation: "createPlaylist",
        userId,
      });
    }

    return { data, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "createPlaylist",
      metadata: { userId, name },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

export async function addPostToPlaylist(
  playlistId: string,
  postId: string
): Promise<{ data: PostPlaylistItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("post_playlist_items")
      .insert({
        playlist_id: playlistId,
        post_id: postId,
      })
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        // Unique violation: already in playlist, treat as success
        return { data: null, error: null };
      }

      throw new DatabaseError(error.message, {
        operation: "addPostToPlaylist",
        playlistId,
        postId,
      });
    }

    return { data, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "addPostToPlaylist",
      metadata: { playlistId, postId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

export async function removePostFromPlaylist(
  playlistId: string,
  postId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("post_playlist_items")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("post_id", postId);

    if (error) {
      throw new DatabaseError(error.message, {
        operation: "removePostFromPlaylist",
        playlistId,
        postId,
      });
    }

    return { error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "removePostFromPlaylist",
      metadata: { playlistId, postId },
    });
    return { error: new Error(appError.userMessage) };
  }
}

export async function getPlaylistPosts(
  playlistId: string,
  userId?: string
): Promise<{ data: PostWithAuthor[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("post_playlist_items")
      .select(
        `
        post_id,
        posts!inner(
          *,
          user_profiles!posts_author_id_fkey(display_name)
        )
      `
      )
      .eq("playlist_id", playlistId)
      .order("added_at", { ascending: true });

    if (error) {
      throw new DatabaseError(error.message, {
        operation: "getPlaylistPosts",
        playlistId,
      });
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const postsRaw = data.map((row: any) => row.posts);

    // Optional: hydrate with user_vote and comment_count like getSubforumPosts
    let userVotes: Record<string, "upvote" | "downvote"> = {};
    if (userId) {
      const { data: voteData } = await supabase
        .from("votes")
        .select("post_id, vote_type")
        .eq("user_id", userId)
        .in(
          "post_id",
          postsRaw.map((p: any) => p.id)
        );

      userVotes =
        voteData?.reduce((acc, vote) => {
          acc[vote.post_id] = vote.vote_type;
          return acc;
        }, {} as Record<string, "upvote" | "downvote">) || {};
    }

    const { data: commentCounts } = await supabase
      .from("comments")
      .select("post_id")
      .in(
        "post_id",
        postsRaw.map((p: any) => p.id)
      );

    const commentCountMap =
      commentCounts?.reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const posts: PostWithAuthor[] = postsRaw.map((post: any) => ({
      ...post,
      author_name: post.is_anonymous
        ? null
        : post.user_profiles?.display_name || "Unknown User",
      user_vote: userVotes[post.id] || null,
      comment_count: commentCountMap[post.id] || 0,
    }));

    return { data: posts, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "getPlaylistPosts",
      metadata: { playlistId, userId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}


