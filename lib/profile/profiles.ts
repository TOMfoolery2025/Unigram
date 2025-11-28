/** @format */

// Profile data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  UserProfile,
  ProfileUpdate,
  UserProfileWithFriendship,
  FriendshipStatus,
  ProfileResponse,
  UsersResponse,
} from "@/types/profile";
import { Activity, ActivitiesResponse } from "@/types/activity";
import { handleError, DatabaseError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

/**
 * Get user profile by ID
 * 
 * @param userId - The ID of the user whose profile to fetch
 * @param viewerId - Optional ID of the user viewing the profile (to determine friendship status)
 * @returns Profile data with friendship status if viewerId provided
 */
export async function getUserProfile(
  userId: string,
  viewerId?: string
): Promise<ProfileResponse> {
  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new DatabaseError(error.message, { 
        operation: 'getUserProfile',
        userId 
      });
    }

    if (!profile) {
      throw new ValidationError("User profile not found", { userId });
    }

    logger.info('Profile fetched successfully', {
      operation: 'getUserProfile',
      metadata: { userId, viewerId },
    });

    return { data: profile, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'getUserProfile',
      metadata: { userId, viewerId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Update user profile
 * 
 * @param userId - The ID of the user whose profile to update
 * @param updates - Profile fields to update
 * @returns Updated profile data
 */
export async function updateUserProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<ProfileResponse> {
  try {
    // Validate bio length (max 500 characters)
    if (updates.bio !== undefined && updates.bio !== null && updates.bio.length > 500) {
      throw new ValidationError(
        "Bio must be 500 characters or less",
        { bioLength: updates.bio.length }
      );
    }

    // Validate interests array (max 10 interests, each max 50 characters)
    if (updates.interests !== undefined && updates.interests !== null) {
      if (updates.interests.length > 10) {
        throw new ValidationError(
          "Maximum 10 interests allowed",
          { interestsCount: updates.interests.length }
        );
      }

      for (const interest of updates.interests) {
        if (interest.length > 50) {
          throw new ValidationError(
            "Each interest must be 50 characters or less",
            { interest }
          );
        }
      }
    }

    // Validate display_name length (max 100 characters)
    if (updates.display_name !== undefined && updates.display_name !== null) {
      if (updates.display_name.length > 100) {
        throw new ValidationError(
          "Display name must be 100 characters or less",
          { displayNameLength: updates.display_name.length }
        );
      }
    }

    const { data: updatedProfile, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, { 
        operation: 'updateUserProfile',
        userId 
      });
    }

    logger.info('Profile updated successfully', {
      operation: 'updateUserProfile',
      userId,
      metadata: { updatedFields: Object.keys(updates) },
    });

    return { data: updatedProfile, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'updateUserProfile',
      userId,
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Search users by name
 * 
 * @param query - Search query string to match against display names
 * @param viewerId - Optional ID of the user performing the search (to include friendship status)
 * @returns Array of user profiles matching the search query with friendship status
 */
export async function searchUsers(
  query: string,
  viewerId?: string
): Promise<UsersResponse> {
  try {
    if (!query || query.trim().length === 0) {
      return { data: [], error: null };
    }

    // Search for users by display_name (case-insensitive)
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("*")
      .ilike("display_name", `%${query}%`)
      .order("display_name", { ascending: true })
      .limit(50); // Limit results to prevent overwhelming UI

    if (error) {
      throw new DatabaseError(error.message, { 
        operation: 'searchUsers',
        query 
      });
    }

    if (!users || users.length === 0) {
      return { data: [], error: null };
    }

    // If viewerId is provided, get friendship status for each user
    let usersWithFriendship: UserProfileWithFriendship[] = [];

    if (viewerId) {
      // Get friendship statuses for all users in the results
      const userIds = users.map(u => u.id);
      
      const friendshipStatuses = await Promise.all(
        userIds.map(async (userId) => {
          if (userId === viewerId) {
            return { userId, status: 'none' as FriendshipStatus };
          }

          const { data: statusData } = await supabase
            .rpc('get_friendship_status', {
              user1_id: viewerId,
              user2_id: userId
            });

          return { 
            userId, 
            status: (statusData || 'none') as FriendshipStatus 
          };
        })
      );

      const statusMap = new Map(
        friendshipStatuses.map(fs => [fs.userId, fs.status])
      );

      usersWithFriendship = users.map(user => ({
        ...user,
        friendship_status: statusMap.get(user.id) || 'none',
      }));
    } else {
      // No viewer, return users with 'none' friendship status
      usersWithFriendship = users.map(user => ({
        ...user,
        friendship_status: 'none' as FriendshipStatus,
      }));
    }

    logger.info('User search completed', {
      operation: 'searchUsers',
      metadata: { query, resultCount: usersWithFriendship.length, viewerId },
    });

    return { data: usersWithFriendship, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'searchUsers',
      metadata: { query, viewerId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Get user's recent activity
 * 
 * @param userId - The ID of the user whose activity to fetch
 * @param limit - Maximum number of activities to return (default: 10)
 * @returns Array of recent activities for the user
 */
export async function getUserActivity(
  userId: string,
  limit: number = 10
): Promise<ActivitiesResponse> {
  try {
    // Query the user_activities view
    const { data: activities, error } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError(error.message, { 
        operation: 'getUserActivity',
        userId 
      });
    }

    if (!activities || activities.length === 0) {
      return { data: [], error: null };
    }

    // Enrich activities with actor profile information
    const actorIdsSet = new Set(activities.map(a => a.actor_id));
    const actorIds = Array.from(actorIdsSet);
    
    const { data: actorProfiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url")
      .in("id", actorIds);

    const actorMap = new Map(
      actorProfiles?.map(profile => [
        profile.id,
        {
          name: profile.display_name,
          avatar: profile.avatar_url,
        }
      ]) || []
    );

    const enrichedActivities: Activity[] = activities.map(activity => ({
      ...activity,
      actor_name: actorMap.get(activity.actor_id)?.name || null,
      actor_avatar: actorMap.get(activity.actor_id)?.avatar || null,
    }));

    logger.info('User activity fetched successfully', {
      operation: 'getUserActivity',
      metadata: { userId, activityCount: enrichedActivities.length },
    });

    return { data: enrichedActivities, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'getUserActivity',
      metadata: { userId, limit },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}
