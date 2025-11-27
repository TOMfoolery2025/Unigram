/** @format */

// Comment data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  Comment,
  CommentInsert,
  CommentUpdate,
  CommentWithAuthor,
} from "@/types/forum";

const supabase = createClient();

/**
 * Create a new comment
 */
export async function createComment(
  data: Omit<CommentInsert, "author_id">,
  userId: string
): Promise<{ data: Comment | null; error: Error | null }> {
  try {
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        ...data,
        author_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: comment, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get a comment by ID with author information
 */
export async function getComment(
  id: string,
  requestingUserId?: string
): Promise<{ data: CommentWithAuthor | null; error: Error | null }> {
  try {
    // Use the database function to get comment with proper author visibility
    const { data, error } = await supabase.rpc("get_comment_with_author", {
      comment_id: id,
      requesting_user_id: requestingUserId || "",
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { data: null, error: new Error("Comment not found") };
    }

    const commentData = data[0];

    const result: CommentWithAuthor = {
      ...commentData,
      replies: [], // Will be populated by getCommentThread if needed
    };

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get comments for a post with nested threading
 */
export async function getPostComments(
  postId: string,
  requestingUserId?: string
): Promise<{ data: CommentWithAuthor[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from("comments")
      .select(
        `
        *,
        user_profiles!comments_author_id_fkey(display_name)
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const { data: comments, error } = await query;

    if (error) throw error;

    if (!comments || comments.length === 0) {
      return { data: [], error: null };
    }

    // Build nested comment structure
    const commentMap = new Map<string, CommentWithAuthor>();
    const rootComments: CommentWithAuthor[] = [];

    // First pass: create all comment objects
    comments.forEach((comment) => {
      const commentWithAuthor: CommentWithAuthor = {
        ...comment,
        author_name: comment.is_anonymous
          ? null
          : comment.user_profiles?.display_name || "Unknown User",
        replies: [],
      };
      commentMap.set(comment.id, commentWithAuthor);
    });

    // Second pass: build the tree structure
    comments.forEach((comment) => {
      const commentWithAuthor = commentMap.get(comment.id)!;

      if (comment.parent_comment_id) {
        // This is a reply, add it to parent's replies
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies!.push(commentWithAuthor);
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithAuthor);
      }
    });

    return { data: rootComments, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a comment
 */
export async function updateComment(
  id: string,
  updates: CommentUpdate,
  userId: string
): Promise<{ data: Comment | null; error: Error | null }> {
  try {
    // First check if user is the author or admin
    const { data: comment } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!comment) {
      throw new Error("Comment not found");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (comment.author_id !== userId && !userProfile?.is_admin) {
      throw new Error("Unauthorized to update this comment");
    }

    const { data: updatedComment, error } = await supabase
      .from("comments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: updatedComment, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // First check if user is the author or admin
    const { data: comment } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!comment) {
      throw new Error("Comment not found");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (comment.author_id !== userId && !userProfile?.is_admin) {
      throw new Error("Unauthorized to delete this comment");
    }

    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get comments by user
 */
export async function getUserComments(
  userId: string,
  requestingUserId?: string
): Promise<{ data: CommentWithAuthor[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from("comments")
      .select(
        `
        *,
        posts!comments_post_id_fkey(title, subforum_id),
        subforums!posts_subforum_id_fkey(name),
        user_profiles!comments_author_id_fkey(display_name)
      `
      )
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    const { data: comments, error } = await query;

    if (error) throw error;

    if (!comments || comments.length === 0) {
      return { data: [], error: null };
    }

    const result: CommentWithAuthor[] = comments.map((comment) => ({
      ...comment,
      author_name: comment.is_anonymous
        ? null
        : comment.user_profiles?.display_name || "Unknown User",
      replies: [],
      post_title: comment.posts?.title,
      subforum_name: comment.subforums?.name,
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get comment count for a post
 */
export async function getPostCommentCount(
  postId: string
): Promise<{ data: number | null; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error) throw error;

    return { data: count || 0, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get comment counts for multiple posts
 */
export async function getPostCommentCounts(
  postIds: string[]
): Promise<{ data: Record<string, number> | null; error: Error | null }> {
  try {
    if (postIds.length === 0) {
      return { data: {}, error: null };
    }

    const { data: comments, error } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds);

    if (error) throw error;

    const counts =
      comments?.reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    return { data: counts, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Search comments across all posts
 */
export async function searchComments(
  query: string,
  requestingUserId?: string
): Promise<{ data: CommentWithAuthor[] | null; error: Error | null }> {
  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        posts!comments_post_id_fkey(title, subforum_id),
        subforums!posts_subforum_id_fkey(name),
        user_profiles!comments_author_id_fkey(display_name)
      `
      )
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!comments || comments.length === 0) {
      return { data: [], error: null };
    }

    const result: CommentWithAuthor[] = comments.map((comment) => ({
      ...comment,
      author_name: comment.is_anonymous
        ? null
        : comment.user_profiles?.display_name || "Unknown User",
      replies: [],
      post_title: comment.posts?.title,
      subforum_name: comment.subforums?.name,
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
