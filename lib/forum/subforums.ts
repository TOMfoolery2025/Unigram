/** @format */

// Subforum data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  Subforum,
  SubforumInsert,
  SubforumUpdate,
  SubforumWithMembership,
  SubforumSearchResult,
  SubforumFilters,
  SubforumResponse,
  SubforumsResponse,
} from "@/types/forum";

const supabase = createClient();

/**
 * Create a new subforum
 */
export async function createSubforum(
  data: Omit<SubforumInsert, "creator_id">,
  userId: string
): Promise<SubforumResponse> {
  try {
    const { data: subforum, error } = await supabase
      .from("subforums")
      .insert({
        ...data,
        creator_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Automatically join the creator to the subforum
    if (subforum) {
      await joinSubforum(subforum.id, userId);
    }

    return { data: subforum, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get a subforum by ID
 */
export async function getSubforum(
  id: string,
  userId?: string
): Promise<{ data: SubforumWithMembership | null; error: Error | null }> {
  try {
    const { data: subforum, error } = await supabase
      .from("subforums")
      .select(
        `
        *,
        user_profiles!subforums_creator_id_fkey(display_name)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    let is_member = false;
    if (userId && subforum) {
      const { data: membership } = await supabase
        .from("subforum_memberships")
        .select("user_id")
        .eq("subforum_id", id)
        .eq("user_id", userId)
        .single();

      is_member = !!membership;
    }

    const result: SubforumWithMembership = {
      ...subforum,
      is_member,
      creator_name: subforum.user_profiles?.display_name || "Unknown User",
    };

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all subforums with optional filtering and search
 */
export async function getSubforums(
  filters?: SubforumFilters,
  userId?: string
): Promise<{ data: SubforumWithMembership[] | null; error: Error | null }> {
  try {
    let query = supabase.from("subforums").select(`
        *,
        user_profiles!subforums_creator_id_fkey(display_name)
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

    const { data: subforums, error } = await query;

    if (error) throw error;

    let result: SubforumWithMembership[] = [];

    if (subforums) {
      // Check membership for each subforum if user is provided
      if (userId) {
        const { data: memberships } = await supabase
          .from("subforum_memberships")
          .select("subforum_id")
          .eq("user_id", userId);

        const memberSubforumIds = new Set(
          memberships?.map((m) => m.subforum_id) || []
        );

        result = subforums.map((subforum) => ({
          ...subforum,
          is_member: memberSubforumIds.has(subforum.id),
          creator_name: subforum.user_profiles?.display_name || "Unknown User",
        }));
      } else {
        result = subforums.map((subforum) => ({
          ...subforum,
          creator_name: subforum.user_profiles?.display_name || "Unknown User",
        }));
      }

      // Apply search filter if provided
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        result = result.filter(
          (subforum) =>
            subforum.name.toLowerCase().includes(searchTerm) ||
            subforum.description.toLowerCase().includes(searchTerm)
        );
      }
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Search subforums using full-text search
 */
export async function searchSubforums(
  query: string
): Promise<{ data: SubforumSearchResult[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("search_subforums", {
      search_query: query,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a subforum
 */
export async function updateSubforum(
  id: string,
  updates: SubforumUpdate,
  userId: string
): Promise<SubforumResponse> {
  try {
    // First check if user is the creator or admin
    const { data: subforum } = await supabase
      .from("subforums")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!subforum) {
      throw new Error("Subforum not found");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (subforum.creator_id !== userId && !userProfile?.is_admin) {
      throw new Error("Unauthorized to update this subforum");
    }

    const { data: updatedSubforum, error } = await supabase
      .from("subforums")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: updatedSubforum, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a subforum
 */
export async function deleteSubforum(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // First check if user is the creator or admin
    const { data: subforum } = await supabase
      .from("subforums")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!subforum) {
      throw new Error("Subforum not found");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (subforum.creator_id !== userId && !userProfile?.is_admin) {
      throw new Error("Unauthorized to delete this subforum");
    }

    const { error } = await supabase.from("subforums").delete().eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Join a subforum
 */
export async function joinSubforum(
  subforumId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // Check if already a member
    const { data: existingMembership } = await supabase
      .from("subforum_memberships")
      .select("user_id")
      .eq("subforum_id", subforumId)
      .eq("user_id", userId)
      .single();

    if (existingMembership) {
      return { error: null }; // Already a member
    }

    const { error } = await supabase.from("subforum_memberships").insert({
      subforum_id: subforumId,
      user_id: userId,
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Leave a subforum
 */
export async function leaveSubforum(
  subforumId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("subforum_memberships")
      .delete()
      .eq("subforum_id", subforumId)
      .eq("user_id", userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get subforum members
 */
export async function getSubforumMembers(
  subforumId: string
): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("subforum_memberships")
      .select(
        `
        user_id,
        joined_at,
        user_profiles!subforum_memberships_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("subforum_id", subforumId)
      .order("joined_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get user's joined subforums
 */
export async function getUserSubforums(
  userId: string
): Promise<SubforumsResponse> {
  try {
    const { data, error } = await supabase
      .from("subforum_memberships")
      .select(
        `
        subforum_id,
        joined_at,
        subforums!subforum_memberships_subforum_id_fkey(*)
      `
      )
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });

    if (error) throw error;

    const subforums: Subforum[] =
      data?.map((membership: any) => membership.subforums).filter(Boolean) ||
      [];

    return { data: subforums, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
