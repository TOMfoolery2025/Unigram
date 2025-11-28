/**
 * Unit tests for Session Cache module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionCache } from './session-cache';
import type { User } from '@supabase/supabase-js';

describe('SessionCache', () => {
  // Mock user object
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Clear cache before each test
    SessionCache.clearAll();
    // Reset timers
    vi.clearAllTimers();
  });

  describe('get and set', () => {
    it('should store and retrieve a session', () => {
      const sessionId = 'test-session-1';
      
      SessionCache.set(sessionId, mockUser);
      const entry = SessionCache.get(sessionId);
      
      expect(entry).not.toBeNull();
      expect(entry?.user).toEqual(mockUser);
    });

    it('should store null user for unauthenticated sessions', () => {
      const sessionId = 'test-session-2';
      
      SessionCache.set(sessionId, null);
      const entry = SessionCache.get(sessionId);
      
      expect(entry).not.toBeNull();
      expect(entry?.user).toBeNull();
    });

    it('should return null for non-existent session', () => {
      const entry = SessionCache.get('non-existent');
      
      expect(entry).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', () => {
      const sessionId = 'test-session-3';
      
      // Use fake timers
      vi.useFakeTimers();
      
      SessionCache.set(sessionId, mockUser);
      
      // Verify entry exists
      expect(SessionCache.get(sessionId)).not.toBeNull();
      
      // Advance time by 31 seconds (past 30-second TTL)
      vi.advanceTimersByTime(31000);
      
      // Entry should be expired
      expect(SessionCache.get(sessionId)).toBeNull();
      
      vi.useRealTimers();
    });

    it('should return entry within TTL window', () => {
      const sessionId = 'test-session-4';
      
      vi.useFakeTimers();
      
      SessionCache.set(sessionId, mockUser);
      
      // Advance time by 29 seconds (within 30-second TTL)
      vi.advanceTimersByTime(29000);
      
      // Entry should still be valid
      const entry = SessionCache.get(sessionId);
      expect(entry).not.toBeNull();
      expect(entry?.user).toEqual(mockUser);
      
      vi.useRealTimers();
    });
  });

  describe('clear', () => {
    it('should remove a specific session', () => {
      const sessionId = 'test-session-5';
      
      SessionCache.set(sessionId, mockUser);
      expect(SessionCache.get(sessionId)).not.toBeNull();
      
      SessionCache.clear(sessionId);
      expect(SessionCache.get(sessionId)).toBeNull();
    });

    it('should not affect other sessions', () => {
      const sessionId1 = 'test-session-6';
      const sessionId2 = 'test-session-7';
      
      SessionCache.set(sessionId1, mockUser);
      SessionCache.set(sessionId2, mockUser);
      
      SessionCache.clear(sessionId1);
      
      expect(SessionCache.get(sessionId1)).toBeNull();
      expect(SessionCache.get(sessionId2)).not.toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      vi.useFakeTimers();
      
      const sessionId1 = 'test-session-8';
      const sessionId2 = 'test-session-9';
      
      SessionCache.set(sessionId1, mockUser);
      
      // Advance time by 31 seconds
      vi.advanceTimersByTime(31000);
      
      // Add a new session
      SessionCache.set(sessionId2, mockUser);
      
      // Run cleanup
      SessionCache.cleanup();
      
      // First session should be removed, second should remain
      expect(SessionCache.get(sessionId1)).toBeNull();
      expect(SessionCache.get(sessionId2)).not.toBeNull();
      
      vi.useRealTimers();
    });

    it('should not remove valid entries', () => {
      const sessionId = 'test-session-10';
      
      SessionCache.set(sessionId, mockUser);
      SessionCache.cleanup();
      
      expect(SessionCache.get(sessionId)).not.toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should remove all entries', () => {
      SessionCache.set('session-1', mockUser);
      SessionCache.set('session-2', mockUser);
      SessionCache.set('session-3', mockUser);
      
      expect(SessionCache.size()).toBe(3);
      
      SessionCache.clearAll();
      
      expect(SessionCache.size()).toBe(0);
      expect(SessionCache.get('session-1')).toBeNull();
      expect(SessionCache.get('session-2')).toBeNull();
      expect(SessionCache.get('session-3')).toBeNull();
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(SessionCache.size()).toBe(0);
      
      SessionCache.set('session-1', mockUser);
      expect(SessionCache.size()).toBe(1);
      
      SessionCache.set('session-2', mockUser);
      expect(SessionCache.size()).toBe(2);
      
      SessionCache.clear('session-1');
      expect(SessionCache.size()).toBe(1);
      
      SessionCache.clearAll();
      expect(SessionCache.size()).toBe(0);
    });
  });

  describe('cache entry metadata', () => {
    it('should include cachedAt timestamp', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);
      
      const sessionId = 'test-session-11';
      SessionCache.set(sessionId, mockUser);
      
      const entry = SessionCache.get(sessionId);
      expect(entry?.cachedAt).toBe(now);
      
      vi.useRealTimers();
    });

    it('should include expiresAt timestamp', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);
      
      const sessionId = 'test-session-12';
      SessionCache.set(sessionId, mockUser);
      
      const entry = SessionCache.get(sessionId);
      expect(entry?.expiresAt).toBe(now + 30000); // 30 seconds TTL
      
      vi.useRealTimers();
    });
  });

  describe('refresh-in-progress tracking', () => {
    it('should track refresh-in-progress state', () => {
      const sessionId = 'test-session-13';
      const refreshPromise = Promise.resolve(mockUser);
      
      expect(SessionCache.isRefreshInProgress(sessionId)).toBe(false);
      
      SessionCache.setRefreshInProgress(sessionId, refreshPromise);
      
      expect(SessionCache.isRefreshInProgress(sessionId)).toBe(true);
    });

    it('should retrieve refresh-in-progress promise', async () => {
      const sessionId = 'test-session-14';
      const refreshPromise = Promise.resolve(mockUser);
      
      SessionCache.setRefreshInProgress(sessionId, refreshPromise);
      
      const retrievedPromise = SessionCache.getRefreshInProgress(sessionId);
      expect(retrievedPromise).toBe(refreshPromise);
      
      const result = await retrievedPromise;
      expect(result).toEqual(mockUser);
    });

    it('should clear refresh-in-progress state', () => {
      const sessionId = 'test-session-15';
      const refreshPromise = Promise.resolve(mockUser);
      
      SessionCache.setRefreshInProgress(sessionId, refreshPromise);
      expect(SessionCache.isRefreshInProgress(sessionId)).toBe(true);
      
      SessionCache.clearRefreshInProgress(sessionId);
      expect(SessionCache.isRefreshInProgress(sessionId)).toBe(false);
    });

    it('should return null for non-existent refresh promise', () => {
      const sessionId = 'test-session-16';
      
      const promise = SessionCache.getRefreshInProgress(sessionId);
      expect(promise).toBeNull();
    });

    it('should handle multiple concurrent refresh operations', async () => {
      const sessionId1 = 'test-session-17';
      const sessionId2 = 'test-session-18';
      
      const promise1 = Promise.resolve(mockUser);
      const promise2 = Promise.resolve(null);
      
      SessionCache.setRefreshInProgress(sessionId1, promise1);
      SessionCache.setRefreshInProgress(sessionId2, promise2);
      
      expect(SessionCache.isRefreshInProgress(sessionId1)).toBe(true);
      expect(SessionCache.isRefreshInProgress(sessionId2)).toBe(true);
      
      const result1 = await SessionCache.getRefreshInProgress(sessionId1);
      const result2 = await SessionCache.getRefreshInProgress(sessionId2);
      
      expect(result1).toEqual(mockUser);
      expect(result2).toBeNull();
    });
  });
});
