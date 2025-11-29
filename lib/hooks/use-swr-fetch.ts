/**
 * Custom SWR hooks for data fetching with caching
 * Provides client-side caching for frequently accessed data
 */

import { useState, useEffect, useCallback } from 'react';
import useSWR, { SWRConfiguration, useSWRConfig } from 'swr';
import { getChannels, getUserChannels } from '@/lib/channel';
import { getUserSubforums, getSubforums } from '@/lib/forum';
import { getEvents } from '@/lib/event';
import { voteOnPost } from '@/lib/forum/votes';
import type { PostWithSubhive, FeedResponse } from '@/types/game';

// Default SWR configuration
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  focusThrottleInterval: 10000, // Throttle revalidation on focus
};

/**
 * Hook to fetch all channels with caching
 */
export function useChannels(config?: SWRConfiguration) {
  return useSWR(
    'channels',
    async () => {
      const result = await getChannels();
      if (result.error) throw result.error;
      return result.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * Hook to fetch user's channels with caching
 */
export function useUserChannels(userId: string | undefined, config?: SWRConfiguration) {
  return useSWR(
    userId ? ['user-channels', userId] : null,
    async () => {
      if (!userId) return [];
      const result = await getUserChannels(userId);
      if (result.error) throw result.error;
      return result.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * Hook to fetch user's subforums with caching
 */
export function useUserSubforums(userId: string | undefined, config?: SWRConfiguration) {
  return useSWR(
    userId ? ['user-subforums', userId] : null,
    async () => {
      if (!userId) return [];
      const result = await getUserSubforums(userId);
      if (result.error) throw result.error;
      return result.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * Hook to fetch all subforums with caching
 */
export function useSubforums(config?: SWRConfiguration) {
  return useSWR(
    'subforums',
    async () => {
      const result = await getSubforums();
      if (result.error) throw result.error;
      return result.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * Hook to fetch events with caching
 */
export function useEvents(config?: SWRConfiguration) {
  return useSWR(
    'events',
    async () => {
      const result = await getEvents();
      if (result.error) throw result.error;
      return result.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * Hook to fetch dashboard data with caching
 * Combines multiple data sources for the dashboard
 */
export function useDashboardData(userId: string | undefined) {
  const { data: channels, error: channelsError, isLoading: channelsLoading } = useChannels();
  const { data: userChannels, error: userChannelsError, isLoading: userChannelsLoading } = useUserChannels(userId);
  const { data: userSubforums, error: userSubforumsError, isLoading: userSubforumsLoading } = useUserSubforums(userId);

  return {
    channels: channels || [],
    userChannels: userChannels || [],
    userSubforums: userSubforums || [],
    isLoading: channelsLoading || userChannelsLoading || userSubforumsLoading,
    error: channelsError || userChannelsError || userSubforumsError,
  };
}

/**
 * Hook to fetch joined subhives with caching
 * Requirements: 2.1
 */
export function useJoinedSubhives(userId: string | undefined, config?: SWRConfiguration) {
  return useSWR(
    userId ? ['joined-subhives', userId] : null,
    async () => {
      if (!userId) return [];
      const result = await getUserSubforums(userId);
      if (result.error) throw result.error;
      return result.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * Hook to fetch feed posts with pagination
 * Requirements: 3.1
 */
export function useFeedPosts(
  params: {
    subhiveId?: string;
    search?: string;
    sort?: 'new' | 'hot' | 'top';
    page?: number;
    limit?: number;
  },
  config?: SWRConfiguration
) {
  const { subhiveId, search, sort = 'new', page = 0, limit = 20 } = params;
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (subhiveId) queryParams.set('subhive_id', subhiveId);
  if (search) queryParams.set('search', search);
  queryParams.set('sort', sort);
  queryParams.set('page', page.toString());
  queryParams.set('limit', limit.toString());
  
  const queryString = queryParams.toString();
  
  return useSWR(
    queryString ? ['feed-posts', queryString] : null,
    async () => {
      const response = await fetch(`/api/hives/feed?${queryString}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch feed');
      }
      return response.json();
    },
    {
      ...defaultConfig,
      revalidateOnFocus: true,
      ...config,
    }
  );
}

/**
 * Hook to fetch top subhives by activity
 * Requirements: 5.2
 */
export function useTopSubhives(
  params?: {
    limit?: number;
    days?: number;
  },
  config?: SWRConfiguration
) {
  const { limit = 5, days = 7 } = params || {};
  
  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  queryParams.set('days', days.toString());
  
  const queryString = queryParams.toString();
  
  return useSWR(
    ['top-subhives', queryString],
    async () => {
      const response = await fetch(`/api/hives/top-subhives?${queryString}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch top subhives');
      }
      return response.json();
    },
    {
      ...defaultConfig,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      ...config,
    }
  );
}

/**
 * Hook to fetch game leaderboard
 * Requirements: 4.5
 */
export function useGameLeaderboard(
  date?: string,
  config?: SWRConfiguration
) {
  const gameDate = date || new Date().toISOString().split('T')[0];
  
  return useSWR(
    ['game-leaderboard', gameDate],
    async () => {
      const response = await fetch(`/api/hives/leaderboard?date=${gameDate}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch leaderboard');
      }
      return response.json();
    },
    {
      ...defaultConfig,
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
      ...config,
    }
  );
}

/**
 * Hook for debounced search with SWR
 * Requirements: 1.2, 1.3, 1.5
 * 
 * This hook provides debounced search functionality that integrates with the feed posts hook.
 * It returns a debounced search query that can be used with useFeedPosts.
 */
export function useDebouncedSearch(initialValue: string = '', delay: number = 300) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    // Set up the debounce timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer on value change or unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return {
    value,
    debouncedValue,
    setValue,
    isDebouncing: value !== debouncedValue,
  };
}

/**
 * Hook to search posts with debouncing
 * Requirements: 1.2, 1.3, 1.5
 * 
 * This is a convenience hook that combines useDebouncedSearch with useFeedPosts
 * for a complete search experience.
 */
export function useSearchPosts(
  searchQuery: string,
  options?: {
    subhiveId?: string;
    sort?: 'new' | 'hot' | 'top';
    page?: number;
    limit?: number;
    enabled?: boolean;
  },
  config?: SWRConfiguration
) {
  const { subhiveId, sort = 'new', page = 0, limit = 20, enabled = true } = options || {};
  
  // Only fetch if search query is not empty and enabled
  const shouldFetch = enabled && searchQuery.trim().length > 0;
  
  return useFeedPosts(
    shouldFetch
      ? {
          subhiveId,
          search: searchQuery,
          sort,
          page,
          limit,
        }
      : { subhiveId, sort, page, limit },
    {
      ...config,
      // Don't fetch if search is disabled
      isPaused: () => !shouldFetch && searchQuery.trim().length > 0,
    }
  );
}

/**
 * Hook for voting on posts with optimistic updates
 * Requirements: 3.2
 * 
 * This hook provides vote mutation functionality with optimistic UI updates
 * and automatic cache invalidation on error.
 */
export function useVoteMutation(userId: string | undefined) {
  const { mutate } = useSWRConfig();
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const vote = useCallback(
    async (
      postId: string,
      voteType: 'upvote' | 'downvote',
      currentVote: 'upvote' | 'downvote' | null,
      feedKey: string
    ) => {
      if (!userId) {
        setError(new Error('User not authenticated'));
        return;
      }

      setIsVoting(true);
      setError(null);

      // Calculate optimistic vote count change
      let voteChange = 0;
      if (currentVote === voteType) {
        // Removing vote (toggle off)
        voteChange = voteType === 'upvote' ? -1 : 1;
      } else if (currentVote) {
        // Changing vote type
        voteChange = voteType === 'upvote' ? 2 : -2;
      } else {
        // Adding new vote
        voteChange = voteType === 'upvote' ? 1 : -1;
      }

      // Determine new vote state
      const newVote = currentVote === voteType ? null : voteType;

      try {
        // Optimistic update
        await mutate(
          feedKey,
          async (currentData: FeedResponse | undefined) => {
            if (!currentData) return currentData;

            return {
              ...currentData,
              posts: currentData.posts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      vote_count: post.vote_count + voteChange,
                      user_vote: newVote,
                    }
                  : post
              ),
            };
          },
          { revalidate: false }
        );

        // Perform actual vote
        const result = await voteOnPost(postId, userId, voteType);

        if (result.error) {
          throw result.error;
        }

        // Revalidate to ensure consistency
        await mutate(feedKey);
      } catch (err) {
        // Rollback on error
        setError(err as Error);
        await mutate(feedKey);
        throw err;
      } finally {
        setIsVoting(false);
      }
    },
    [userId, mutate]
  );

  return {
    vote,
    isVoting,
    error,
  };
}
