/** @format */

// Post data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  Post,
  PostInsert,
  PostUpdate,
  PostWithAuthor,
  PostFilters,
  PostResponse,
  PostsResponse,
} from "@/types/forum";
import { handleError, DatabaseError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

/**
 * Create a new post
 */
export async function createPost(
  data: Omit<PostInsert, "author_id">,
  userId: string
): Promise<PostResponse> {
  try {
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        ...data,
        author_id: userId,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, { operation: 'createPost' });

    logger.info('Post created successfully', {
      operation: 'createPost',
      userId,
      metadata: { postId: post?.id },
    });

    return { data: post, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'createPost',
      userId,
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Get a post by ID with author information
 */
export async function getPost(
  id: string,
  requestingUserId?: string
): Promise<{ data: PostWithAuthor | null; error: Error | null }> {
  try {
    // Use the database function to get post with proper author visibility
    const { data, error } = await supabase.rpc("get_post_with_author", {
      post_id: id,
      requesting_user_id: requestingUserId || "",
    });

    if (error) throw new DatabaseError(error.message, { operation: 'getPost', postId: id });

    if (!data || data.length === 0) {
      throw new ValidationError("Post not found", { postId: id });
    }

    const postData = data[0];

    // Get user's vote on this post if user is provided
    let user_vote: "upvote" | "downvote" | null = null;
    if (requestingUserId) {
      const { data: voteData } = await supabase
        .from("votes")
        .select("vote_type")
        .eq("post_id", id)
        .eq("user_id", requestingUserId)
        .single();

      user_vote = voteData?.vote_type || null;
    }

    // Get comment count
    const { count: comment_count } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    const result: PostWithAuthor = {
      ...postData,
      user_vote,
      comment_count: comment_count || 0,
    };

    return { data: result, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'getPost',
      metadata: { postId: id, requestingUserId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Get posts for a subforum with filtering and sorting
 */
export async function getSubforumPosts(
  subforumId: string,
  filters?: PostFilters,
  requestingUserId?: string
): Promise<{ data: PostWithAuthor[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        user_profiles!posts_author_id_fkey(display_name)
      `
      )
      .eq("subforum_id", subforumId);

    // Apply sorting
    if (filters?.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });
    } else {
      // Default sort by creation date, newest first
      query = query.order("created_at", { ascending: false });
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    if (!posts || posts.length === 0) {
      return { data: [], error: null };
    }

    // Get user votes if user is provided
    let userVotes: Record<string, "upvote" | "downvote"> = {};
    if (requestingUserId) {
      const { data: voteData } = await supabase
        .from("votes")
        .select("post_id, vote_type")
        .eq("user_id", requestingUserId)
        .in(
          "post_id",
          posts.map((p) => p.id)
        );

      userVotes =
        voteData?.reduce((acc, vote) => {
          acc[vote.post_id] = vote.vote_type;
          return acc;
        }, {} as Record<string, "upvote" | "downvote">) || {};
    }

    // Get comment counts for all posts
    const { data: commentCounts } = await supabase
      .from("comments")
      .select("post_id")
      .in(
        "post_id",
        posts.map((p) => p.id)
      );

    const commentCountMap =
      commentCounts?.reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const result: PostWithAuthor[] = posts.map((post) => ({
      ...post,
      author_name: post.is_anonymous
        ? null
        : post.user_profiles?.display_name || "Unknown User",
      user_vote: userVotes[post.id] || null,
      comment_count: commentCountMap[post.id] || 0,
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a post
 */
export async function updatePost(
  id: string,
  updates: PostUpdate,
  userId: string
): Promise<PostResponse> {
  try {
    // First check if user is the author or admin
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!post) {
      throw new Error("Post not found");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (post.author_id !== userId && !userProfile?.is_admin) {
      throw new Error("Unauthorized to update this post");
    }

    const { data: updatedPost, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: updatedPost, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a post
 */
export async function deletePost(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // First check if user is the author or admin
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!post) {
      throw new Error("Post not found");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (post.author_id !== userId && !userProfile?.is_admin) {
      throw new Error("Unauthorized to delete this post");
    }

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get posts by user
 */
export async function getUserPosts(
  userId: string,
  requestingUserId?: string
): Promise<PostsResponse> {
  try {
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        subforums!posts_subforum_id_fkey(name),
        user_profiles!posts_author_id_fkey(display_name)
      `
      )
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    const { data: posts, error } = await query;

    if (error) throw error;

    if (!posts || posts.length === 0) {
      return { data: [], error: null };
    }

    // Get user votes if requesting user is provided
    let userVotes: Record<string, "upvote" | "downvote"> = {};
    if (requestingUserId) {
      const { data: voteData } = await supabase
        .from("votes")
        .select("post_id, vote_type")
        .eq("user_id", requestingUserId)
        .in(
          "post_id",
          posts.map((p) => p.id)
        );

      userVotes =
        voteData?.reduce((acc, vote) => {
          acc[vote.post_id] = vote.vote_type;
          return acc;
        }, {} as Record<string, "upvote" | "downvote">) || {};
    }

    // Get comment counts
    const { data: commentCounts } = await supabase
      .from("comments")
      .select("post_id")
      .in(
        "post_id",
        posts.map((p) => p.id)
      );

    const commentCountMap =
      commentCounts?.reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const result = posts.map((post) => ({
      ...post,
      author_name: post.is_anonymous
        ? null
        : post.user_profiles?.display_name || "Unknown User",
      user_vote: userVotes[post.id] || null,
      comment_count: commentCountMap[post.id] || 0,
      subforum_name: post.subforums?.name,
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Search posts across all subforums
 */
export async function searchPosts(
  query: string,
  requestingUserId?: string
): Promise<{ data: PostWithAuthor[] | null; error: Error | null }> {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        subforums!posts_subforum_id_fkey(name),
        user_profiles!posts_author_id_fkey(display_name)
      `
      )
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      return { data: [], error: null };
    }

    // Get user votes if user is provided
    let userVotes: Record<string, "upvote" | "downvote"> = {};
    if (requestingUserId) {
      const { data: voteData } = await supabase
        .from("votes")
        .select("post_id, vote_type")
        .eq("user_id", requestingUserId)
        .in(
          "post_id",
          posts.map((p) => p.id)
        );

      userVotes =
        voteData?.reduce((acc, vote) => {
          acc[vote.post_id] = vote.vote_type;
          return acc;
        }, {} as Record<string, "upvote" | "downvote">) || {};
    }

    // Get comment counts
    const { data: commentCounts } = await supabase
      .from("comments")
      .select("post_id")
      .in(
        "post_id",
        posts.map((p) => p.id)
      );

    const commentCountMap =
      commentCounts?.reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const result: PostWithAuthor[] = posts.map((post) => ({
      ...post,
      author_name: post.is_anonymous
        ? null
        : post.user_profiles?.display_name || "Unknown User",
      user_vote: userVotes[post.id] || null,
      comment_count: commentCountMap[post.id] || 0,
      subforum_name: post.subforums?.name,
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
