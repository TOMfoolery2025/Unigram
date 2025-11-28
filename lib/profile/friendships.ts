/** @format */

// Friendship service layer for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  Friendship,
  FriendWithProfile,
  FriendRequest,
  FriendshipResponse,
  FriendsResponse,
  FriendRequestsResponse,
  FriendshipStatusResponse,
} from "@/types/friendship";
import { FriendshipStatus } from "@/types/profile";
import { handleError, DatabaseError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

/**
 * Send a friend request from one user to another
 * 
 * @param fromUserId - The ID of the user sending the friend request
 * @param toUserId - The ID of the user receiving the friend request
 * @returns The created friendship record with pending status
 */
export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<FriendshipResponse> {
  try {
    // Validate that users are not the same
    if (fromUserId === toUserId) {
      throw new ValidationError(
        "Cannot send friend request to yourself",
        { fromUserId, toUserId }
      );
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(user_id.eq.${fromUserId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${fromUserId})`)
      .maybeSingle();

    if (existingFriendship) {
      throw new ValidationError(
        "Friend request already exists or users are already friends",
        { fromUserId, toUserId }
      );
    }

    // Create the friendship record
    const { data: friendship, error } = await supabase
      .from("friendships")
      .insert({
        user_id: fromUserId,
        friend_id: toUserId,
        status: 'pending',
        requester_id: fromUserId,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, {
        operation: 'sendFriendRequest',
        fromUserId,
        toUserId,
      });
    }

    logger.info('Friend request sent successfully', {
      operation: 'sendFriendRequest',
      metadata: { fromUserId, toUserId, friendshipId: friendship.id },
    });

    return { data: friendship, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'sendFriendRequest',
      metadata: { fromUserId, toUserId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Accept a friend request
 * 
 * @param requestId - The ID of the friendship record to accept
 * @returns The updated friendship record with accepted status
 */
export async function acceptFriendRequest(
  requestId: string
): Promise<FriendshipResponse> {
  try {
    // Update the friendship status to accepted
    const { data: friendship, error } = await supabase
      .from("friendships")
      .update({ status: 'accepted' })
      .eq("id", requestId)
      .eq("status", 'pending') // Only accept if still pending
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, {
        operation: 'acceptFriendRequest',
        requestId,
      });
    }

    if (!friendship) {
      throw new ValidationError(
        "Friend request not found or already processed",
        { requestId }
      );
    }

    logger.info('Friend request accepted successfully', {
      operation: 'acceptFriendRequest',
      metadata: { requestId, friendshipId: friendship.id },
    });

    return { data: friendship, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'acceptFriendRequest',
      metadata: { requestId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Decline a friend request
 * 
 * @param requestId - The ID of the friendship record to decline
 * @returns Success or error response
 */
export async function declineFriendRequest(
  requestId: string
): Promise<{ error: Error | null }> {
  try {
    // Delete the friendship record
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", requestId)
      .eq("status", 'pending'); // Only delete if still pending

    if (error) {
      throw new DatabaseError(error.message, {
        operation: 'declineFriendRequest',
        requestId,
      });
    }

    logger.info('Friend request declined successfully', {
      operation: 'declineFriendRequest',
      metadata: { requestId },
    });

    return { error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'declineFriendRequest',
      metadata: { requestId },
    });
    return { error: new Error(appError.userMessage) };
  }
}

/**
 * Unfriend a user (remove accepted friendship)
 * 
 * @param userId - The ID of the user initiating the unfriend action
 * @param friendId - The ID of the user to unfriend
 * @returns Success or error response
 */
export async function unfriendUser(
  userId: string,
  friendId: string
): Promise<{ error: Error | null }> {
  try {
    // Delete the friendship record (works for both directions)
    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .eq("status", 'accepted'); // Only delete if accepted

    if (error) {
      throw new DatabaseError(error.message, {
        operation: 'unfriendUser',
        userId,
        friendId,
      });
    }

    logger.info('User unfriended successfully', {
      operation: 'unfriendUser',
      metadata: { userId, friendId },
    });

    return { error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'unfriendUser',
      metadata: { userId, friendId },
    });
    return { error: new Error(appError.userMessage) };
  }
}

/**
 * Get a user's friends list
 * 
 * @param userId - The ID of the user whose friends to fetch
 * @returns Array of friends with their profile information
 */
export async function getUserFriends(
  userId: string
): Promise<FriendsResponse> {
  try {
    // Get all accepted friendships for the user
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", 'accepted')
      .order("created_at", { ascending: false });

    if (friendshipsError) {
      throw new DatabaseError(friendshipsError.message, {
        operation: 'getUserFriends',
        userId,
      });
    }

    if (!friendships || friendships.length === 0) {
      return { data: [], error: null };
    }

    // Extract friend IDs (the other user in each friendship)
    const friendIds = friendships.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    );

    // Fetch friend profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url, bio, interests")
      .in("id", friendIds);

    if (profilesError) {
      throw new DatabaseError(profilesError.message, {
        operation: 'getUserFriends',
        userId,
      });
    }

    // Create a map of profiles by ID
    const profileMap = new Map(
      profiles?.map(p => [p.id, p]) || []
    );

    // Combine friendship data with profile data
    const friendsWithProfiles: FriendWithProfile[] = friendships.map(f => {
      const friendId = f.user_id === userId ? f.friend_id : f.user_id;
      const profile = profileMap.get(friendId);

      return {
        friendship_id: f.id,
        user_id: friendId,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        bio: profile?.bio || null,
        interests: profile?.interests || null,
        friendship_since: f.created_at,
      };
    });

    logger.info('User friends fetched successfully', {
      operation: 'getUserFriends',
      metadata: { userId, friendCount: friendsWithProfiles.length },
    });

    return { data: friendsWithProfiles, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'getUserFriends',
      metadata: { userId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Get pending friend requests for a user (incoming requests)
 * 
 * @param userId - The ID of the user whose pending requests to fetch
 * @returns Array of pending friend requests with requester information
 */
export async function getPendingRequests(
  userId: string
): Promise<FriendRequestsResponse> {
  try {
    // Get all pending friendships where the user is the recipient
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select("*")
      .eq("friend_id", userId)
      .eq("status", 'pending')
      .order("created_at", { ascending: false });

    if (friendshipsError) {
      throw new DatabaseError(friendshipsError.message, {
        operation: 'getPendingRequests',
        userId,
      });
    }

    if (!friendships || friendships.length === 0) {
      return { data: [], error: null };
    }

    // Extract requester IDs
    const requesterIds = friendships.map(f => f.requester_id);

    // Fetch requester profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url, bio")
      .in("id", requesterIds);

    if (profilesError) {
      throw new DatabaseError(profilesError.message, {
        operation: 'getPendingRequests',
        userId,
      });
    }

    // Create a map of profiles by ID
    const profileMap = new Map(
      profiles?.map(p => [p.id, p]) || []
    );

    // Combine friendship data with profile data
    const requests: FriendRequest[] = friendships.map(f => {
      const profile = profileMap.get(f.requester_id);

      return {
        id: f.id,
        requester_id: f.requester_id,
        requester_name: profile?.display_name || null,
        requester_avatar: profile?.avatar_url || null,
        requester_bio: profile?.bio || null,
        created_at: f.created_at,
      };
    });

    logger.info('Pending friend requests fetched successfully', {
      operation: 'getPendingRequests',
      metadata: { userId, requestCount: requests.length },
    });

    return { data: requests, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'getPendingRequests',
      metadata: { userId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Get friendship status between two users
 * 
 * @param userId - The ID of the first user
 * @param otherUserId - The ID of the second user
 * @returns The friendship status between the two users
 */
export async function getFriendshipStatus(
  userId: string,
  otherUserId: string
): Promise<FriendshipStatusResponse> {
  try {
    // Use the database function to get friendship status
    const { data: status, error } = await supabase
      .rpc('get_friendship_status', {
        user1_id: userId,
        user2_id: otherUserId,
      });

    if (error) {
      throw new DatabaseError(error.message, {
        operation: 'getFriendshipStatus',
        userId,
        otherUserId,
      });
    }

    const friendshipStatus = (status || 'none') as FriendshipStatus;

    logger.info('Friendship status fetched successfully', {
      operation: 'getFriendshipStatus',
      metadata: { userId, otherUserId, status: friendshipStatus },
    });

    return { data: friendshipStatus, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'getFriendshipStatus',
      metadata: { userId, otherUserId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}
