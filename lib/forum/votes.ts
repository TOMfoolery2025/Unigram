/** @format */

// Vote data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import { Vote, VoteInsert } from "@/types/forum";

const supabase = createClient();

/**
 * Vote on a post (upvote or downvote)
 * Handles vote changes by removing previous vote and applying new one
 */
export async function voteOnPost(
  postId: string,
  userId: string,
  voteType: "upvote" | "downvote"
): Promise<{ error: Error | null }> {
  try {
    // Start a transaction-like operation
    // First, check if user has already voted on this post
    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    // If user already voted with the same type, remove the vote (toggle off)
    if (existingVote && existingVote.vote_type === voteType) {
      const { error: deleteError } = await supabase
        .from("votes")
        .delete()
        .eq("id", existingVote.id);

      if (deleteError) throw deleteError;

      // Update post vote count
      await updatePostVoteCount(postId);
      return { error: null };
    }

    // If user voted with different type, update the vote
    if (existingVote && existingVote.vote_type !== voteType) {
      const { error: updateError } = await supabase
        .from("votes")
        .update({ vote_type: voteType })
        .eq("id", existingVote.id);

      if (updateError) throw updateError;

      // Update post vote count
      await updatePostVoteCount(postId);
      return { error: null };
    }

    // If no existing vote, create new vote
    const { error: insertError } = await supabase.from("votes").insert({
      post_id: postId,
      user_id: userId,
      vote_type: voteType,
    });

    if (insertError) throw insertError;

    // Update post vote count
    await updatePostVoteCount(postId);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Remove a vote from a post
 */
export async function removeVote(
  postId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) throw error;

    // Update post vote count
    await updatePostVoteCount(postId);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get user's vote on a specific post
 */
export async function getUserVote(
  postId: string,
  userId: string
): Promise<{ data: Vote | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      throw error;
    }

    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all votes for a post
 */
export async function getPostVotes(
  postId: string
): Promise<{ data: Vote[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get vote statistics for a post
 */
export async function getPostVoteStats(postId: string): Promise<{
  data: {
    upvotes: number;
    downvotes: number;
    total: number;
  } | null;
  error: Error | null;
}> {
  try {
    const { data: votes, error } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("post_id", postId);

    if (error) throw error;

    const upvotes = votes?.filter((v) => v.vote_type === "upvote").length || 0;
    const downvotes =
      votes?.filter((v) => v.vote_type === "downvote").length || 0;
    const total = upvotes - downvotes;

    return {
      data: { upvotes, downvotes, total },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update the vote count on a post
 * This function recalculates the vote count from the votes table
 */
async function updatePostVoteCount(postId: string): Promise<void> {
  try {
    // Get current vote statistics
    const { data: stats } = await getPostVoteStats(postId);

    if (stats) {
      // Update the post's vote_count field
      const { error } = await supabase
        .from("posts")
        .update({ vote_count: stats.total })
        .eq("id", postId);

      if (error) throw error;
    }
  } catch (error) {
    console.error("Failed to update post vote count:", error);
    // Don't throw here to avoid breaking the main vote operation
  }
}

/**
 * Get user's votes across multiple posts
 */
export async function getUserVotesForPosts(
  postIds: string[],
  userId: string
): Promise<{
  data: Record<string, "upvote" | "downvote"> | null;
  error: Error | null;
}> {
  try {
    if (postIds.length === 0) {
      return { data: {}, error: null };
    }

    const { data, error } = await supabase
      .from("votes")
      .select("post_id, vote_type")
      .eq("user_id", userId)
      .in("post_id", postIds);

    if (error) throw error;

    const votesMap =
      data?.reduce((acc, vote) => {
        acc[vote.post_id] = vote.vote_type;
        return acc;
      }, {} as Record<string, "upvote" | "downvote">) || {};

    return { data: votesMap, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get top voted posts in a subforum
 */
export async function getTopVotedPosts(
  subforumId: string,
  limit: number = 10
): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        user_profiles!posts_author_id_fkey(display_name)
      `
      )
      .eq("subforum_id", subforumId)
      .order("vote_count", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
