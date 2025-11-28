/** @format */

// Activity feed data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  ActivityType,
  ActivitiesResponse,
} from "@/types/activity";
import { handleError, DatabaseError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

/**
 * Get activity feed for a user (activities from their friends)
 * 
 * This function retrieves activities from the user's friends, including:
 * - Forum posts created by friends
 * - Event registrations by friends
 * - New friendships formed by friends
 * 
 * @param userId - The ID of the user whose activity feed to fetch
 * @param options - Optional configuration for pagination and filtering
 * @param options.limit - Maximum number of activities to return (default: 20)
 * @param options.offset - Number of activities to skip for pagination (default: 0)
 * @param options.types - Array of activity types to filter by (optional)
 * @param options.dateRange - Date range to filter activities (optional)
 * @param options.friendId - Specific friend ID to filter activities (optional)
 * @returns Array of activities from the user's friends, ordered by most recent first
 */
export async function getActivityFeed(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    types?: ActivityType[];
    dateRange?: {
      start?: string;
      end?: string;
    };
    friendId?: string;
  }
): Promise<ActivitiesResponse> {
  try {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;
    const types = options?.types;
    const dateRange = options?.dateRange;
    const friendId = options?.friendId;

    // First, get the user's friends (accepted friendships only)
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .eq("status", "accepted")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (friendshipsError) {
      throw new DatabaseError(friendshipsError.message, {
        operation: "getActivityFeed",
        userId,
      });
    }

    // If user has no friends, return empty array
    if (!friendships || friendships.length === 0) {
      logger.info("No friends found for activity feed", {
        operation: "getActivityFeed",
        metadata: { userId },
      });
      return { data: [], error: null };
    }

    // Extract friend IDs (the other user in each friendship)
    let friendIds = friendships.map((friendship) =>
      friendship.user_id === userId
        ? friendship.friend_id
        : friendship.user_id
    );

    // Apply friend-specific filter if provided
    if (friendId) {
      friendIds = friendIds.filter((id) => id === friendId);
      
      // If the specified friend is not in the user's friends list, return empty
      if (friendIds.length === 0) {
        logger.info("Specified friend not found in user's friends list", {
          operation: "getActivityFeed",
          metadata: { userId, friendId },
        });
        return { data: [], error: null };
      }
    }

    // Build query for user_activities view
    let query = supabase
      .from("user_activities")
      .select("*")
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply activity type filter if provided
    if (types && types.length > 0) {
      query = query.in("activity_type", types);
    }

    // Apply date range filter if provided
    if (dateRange?.start) {
      query = query.gte("created_at", dateRange.start);
    }
    if (dateRange?.end) {
      // Add one day to end date to include the entire end date
      const endDate = new Date(dateRange.end);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt("created_at", endDate.toISOString().split('T')[0]);
    }

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      throw new DatabaseError(activitiesError.message, {
        operation: "getActivityFeed",
        userId,
      });
    }

    if (!activities || activities.length === 0) {
      return { data: [], error: null };
    }

    // Enrich activities with actor profile information
    const actorIdsSet = new Set(activities.map((a) => a.actor_id));
    const actorIds = Array.from(actorIdsSet);

    const { data: actorProfiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url")
      .in("id", actorIds);

    const actorMap = new Map(
      actorProfiles?.map((profile) => [
        profile.id,
        {
          name: profile.display_name,
          avatar: profile.avatar_url,
        },
      ]) || []
    );

    const enrichedActivities: Activity[] = activities.map((activity) => ({
      ...activity,
      actor_name: actorMap.get(activity.actor_id)?.name || null,
      actor_avatar: actorMap.get(activity.actor_id)?.avatar || null,
    }));

    logger.info("Activity feed fetched successfully", {
      operation: "getActivityFeed",
      metadata: {
        userId,
        activityCount: enrichedActivities.length,
        friendCount: friendIds.length,
        limit,
        offset,
        types,
        dateRange,
        friendId,
      },
    });

    return { data: enrichedActivities, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "getActivityFeed",
      metadata: { userId, options },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Get total count of activities in a user's feed
 * 
 * This function counts the total number of activities from the user's friends,
 * useful for implementing pagination UI (e.g., showing "Showing 1-20 of 150")
 * 
 * @param userId - The ID of the user whose activity count to fetch
 * @returns Total count of activities from the user's friends
 */
export async function getActivityCount(
  userId: string
): Promise<{ data: number | null; error: Error | null }> {
  try {
    // First, get the user's friends (accepted friendships only)
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .eq("status", "accepted")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (friendshipsError) {
      throw new DatabaseError(friendshipsError.message, {
        operation: "getActivityCount",
        userId,
      });
    }

    // If user has no friends, return 0
    if (!friendships || friendships.length === 0) {
      return { data: 0, error: null };
    }

    // Extract friend IDs
    const friendIds = friendships.map((friendship) =>
      friendship.user_id === userId
        ? friendship.friend_id
        : friendship.user_id
    );

    // Count activities from friends
    const { count, error: countError } = await supabase
      .from("user_activities")
      .select("*", { count: "exact", head: true })
      .in("user_id", friendIds);

    if (countError) {
      throw new DatabaseError(countError.message, {
        operation: "getActivityCount",
        userId,
      });
    }

    logger.info("Activity count fetched successfully", {
      operation: "getActivityCount",
      metadata: { userId, count },
    });

    return { data: count ?? 0, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "getActivityCount",
      metadata: { userId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}
