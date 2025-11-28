/**
 * Custom SWR hooks for data fetching with caching
 * Provides client-side caching for frequently accessed data
 */

import useSWR, { SWRConfiguration } from 'swr';
import { getChannels, getUserChannels } from '@/lib/channel';
import { getUserSubforums, getSubforums } from '@/lib/forum';
import { getEvents } from '@/lib/event';

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
