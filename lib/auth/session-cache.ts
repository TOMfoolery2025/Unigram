/**
 * Session Cache Module
 * 
 * Provides in-memory caching for session validation results to reduce
 * redundant Supabase authentication checks in middleware.
 * 
 * Features:
 * - Map-based in-memory storage
 * - 30-second TTL for cache entries
 * - Automatic cleanup of expired entries
 * - Thread-safe operations
 */

import type { User } from '@supabase/supabase-js';

/**
 * Represents a cached session entry
 */
export interface SessionCacheEntry {
  user: User | null;
  expiresAt: number; // Unix timestamp in milliseconds
  cachedAt: number; // Unix timestamp in milliseconds
}

/**
 * Session cache configuration
 */
const CACHE_TTL = 30000; // 30 seconds in milliseconds

/**
 * In-memory cache storage
 */
const sessionCache = new Map<string, SessionCacheEntry>();

/**
 * Track sessions that are currently being refreshed
 * This allows continued access during refresh operations
 */
const refreshInProgress = new Map<string, Promise<User | null>>();

/**
 * Session Cache Interface
 */
export const SessionCache = {
  /**
   * Retrieve a cached session entry
   * 
   * @param sessionId - The session identifier (typically a hash of the session token)
   * @returns The cached entry if valid, null if expired or not found
   */
  get(sessionId: string): SessionCacheEntry | null {
    const entry = sessionCache.get(sessionId);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    
    // Check if entry has expired
    if (now > entry.expiresAt) {
      sessionCache.delete(sessionId);
      return null;
    }
    
    return entry;
  },

  /**
   * Store a session entry in the cache
   * 
   * @param sessionId - The session identifier
   * @param user - The user object from Supabase (or null for unauthenticated)
   */
  set(sessionId: string, user: User | null): void {
    const now = Date.now();
    
    const entry: SessionCacheEntry = {
      user,
      expiresAt: now + CACHE_TTL,
      cachedAt: now,
    };
    
    sessionCache.set(sessionId, entry);
  },

  /**
   * Clear a specific session from the cache
   * 
   * @param sessionId - The session identifier to clear
   */
  clear(sessionId: string): void {
    sessionCache.delete(sessionId);
  },

  /**
   * Remove all expired entries from the cache
   * 
   * This should be called periodically (e.g., on each request) to prevent
   * memory leaks from expired entries.
   */
  cleanup(): void {
    const now = Date.now();
    
    const keysToDelete: string[] = [];
    sessionCache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => sessionCache.delete(key));
  },

  /**
   * Clear all entries from the cache
   * 
   * Useful for testing or manual cache invalidation
   */
  clearAll(): void {
    sessionCache.clear();
  },

  /**
   * Get the current size of the cache
   * 
   * Useful for monitoring and debugging
   */
  size(): number {
    return sessionCache.size;
  },

  /**
   * Mark a session as being refreshed
   * 
   * @param sessionId - The session identifier
   * @param refreshPromise - Promise that resolves when refresh completes
   */
  setRefreshInProgress(sessionId: string, refreshPromise: Promise<User | null>): void {
    refreshInProgress.set(sessionId, refreshPromise);
  },

  /**
   * Get the refresh promise for a session if one is in progress
   * 
   * @param sessionId - The session identifier
   * @returns The refresh promise if in progress, null otherwise
   */
  getRefreshInProgress(sessionId: string): Promise<User | null> | null {
    return refreshInProgress.get(sessionId) || null;
  },

  /**
   * Clear the refresh-in-progress state for a session
   * 
   * @param sessionId - The session identifier
   */
  clearRefreshInProgress(sessionId: string): void {
    refreshInProgress.delete(sessionId);
  },

  /**
   * Check if a session is currently being refreshed
   * 
   * @param sessionId - The session identifier
   * @returns True if refresh is in progress, false otherwise
   */
  isRefreshInProgress(sessionId: string): boolean {
    return refreshInProgress.has(sessionId);
  },
};
