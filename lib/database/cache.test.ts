/** @format */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createCache,
  generateCacheKey,
  withCache,
  type Cache,
  type CacheConfig
} from './cache'

describe('createCache', () => {
  let cache: Cache

  beforeEach(() => {
    cache = createCache()
  })

  afterEach(() => {
    cache.clear()
  })

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('should check if key exists', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
    })

    it('should delete keys', () => {
      cache.set('key1', 'value1')
      expect(cache.delete('key1')).toBe(true)
      expect(cache.get('key1')).toBeNull()
      expect(cache.delete('key1')).toBe(false)
    })

    it('should clear all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
    })
  })

  describe('TTL and expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should expire entries after TTL', () => {
      cache.set('key1', 'value1', 1000) // 1 second TTL
      
      expect(cache.get('key1')).toBe('value1')
      
      vi.advanceTimersByTime(1001)
      
      expect(cache.get('key1')).toBeNull()
    })

    it('should use default TTL when not specified', () => {
      const shortCache = createCache({ defaultTTL: 1000 })
      shortCache.set('key1', 'value1')
      
      expect(shortCache.get('key1')).toBe('value1')
      
      vi.advanceTimersByTime(1001)
      
      expect(shortCache.get('key1')).toBeNull()
    })

    it('should cleanup expired entries', () => {
      cache.set('key1', 'value1', 1000)
      cache.set('key2', 'value2', 2000)
      
      vi.advanceTimersByTime(1500)
      
      const removed = cache.cleanup()
      expect(removed).toBe(1)
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
    })
  })

  describe('max size enforcement', () => {
    it('should enforce max size by removing oldest entries', () => {
      const smallCache = createCache({ maxSize: 3 })
      
      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')
      smallCache.set('key4', 'value4') // Should remove key1
      
      expect(smallCache.get('key1')).toBeNull()
      expect(smallCache.get('key2')).toBe('value2')
      expect(smallCache.get('key3')).toBe('value3')
      expect(smallCache.get('key4')).toBe('value4')
    })
  })

  describe('pattern invalidation', () => {
    it('should invalidate keys matching string pattern', () => {
      cache.set('user:123:profile', { name: 'John' })
      cache.set('user:456:profile', { name: 'Jane' })
      cache.set('post:789', { title: 'Post' })
      
      const removed = cache.invalidatePattern('user:.*:profile')
      
      expect(removed).toBe(2)
      expect(cache.get('user:123:profile')).toBeNull()
      expect(cache.get('user:456:profile')).toBeNull()
      expect(cache.get('post:789')).not.toBeNull()
    })

    it('should invalidate keys matching regex pattern', () => {
      cache.set('user:123:profile', { name: 'John' })
      cache.set('user:456:profile', { name: 'Jane' })
      cache.set('post:789', { title: 'Post' })
      
      const removed = cache.invalidatePattern(/^user:\d+:profile$/)
      
      expect(removed).toBe(2)
      expect(cache.get('post:789')).not.toBeNull()
    })
  })

  describe('statistics', () => {
    it('should track cache hits and misses', () => {
      cache.set('key1', 'value1')
      
      cache.get('key1') // hit
      cache.get('key1') // hit
      cache.get('key2') // miss
      cache.get('key3') // miss
      
      const stats = cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBe(0.5)
    })

    it('should track cache size', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      const stats = cache.getStats()
      expect(stats.size).toBe(2)
    })

    it('should reset stats on clear', () => {
      cache.set('key1', 'value1')
      cache.get('key1')
      cache.get('key2')
      
      cache.clear()
      
      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.size).toBe(0)
    })
  })

  describe('type safety', () => {
    it('should handle different value types', () => {
      cache.set('string', 'value')
      cache.set('number', 42)
      cache.set('boolean', true)
      cache.set('object', { key: 'value' })
      cache.set('array', [1, 2, 3])
      
      expect(cache.get('string')).toBe('value')
      expect(cache.get('number')).toBe(42)
      expect(cache.get('boolean')).toBe(true)
      expect(cache.get('object')).toEqual({ key: 'value' })
      expect(cache.get('array')).toEqual([1, 2, 3])
    })
  })
})

describe('generateCacheKey', () => {
  it('should generate key with namespace only', () => {
    const key = generateCacheKey('user')
    expect(key).toBe('user')
  })

  it('should generate key with simple parameters', () => {
    const key = generateCacheKey('user', { id: '123' })
    expect(key).toBe('user:id=123')
  })

  it('should generate key with multiple parameters', () => {
    const key = generateCacheKey('posts', {
      authorId: '123',
      limit: 10,
      offset: 0
    })
    expect(key).toBe('posts:authorId=123:limit=10:offset=0')
  })

  it('should sort parameters for consistency', () => {
    const key1 = generateCacheKey('posts', { b: '2', a: '1', c: '3' })
    const key2 = generateCacheKey('posts', { c: '3', a: '1', b: '2' })
    expect(key1).toBe(key2)
  })

  it('should handle array parameters', () => {
    const key = generateCacheKey('users', {
      ids: ['3', '1', '2']
    })
    expect(key).toContain('ids=1,2,3') // Arrays are sorted
  })

  it('should handle nested objects', () => {
    const key = generateCacheKey('query', {
      filter: { status: 'active', role: 'admin' }
    })
    expect(key).toContain('filter={role=admin,status=active}')
  })

  it('should handle null and undefined', () => {
    const key = generateCacheKey('test', {
      a: null,
      b: undefined
    })
    expect(key).toContain('a=null')
    expect(key).toContain('b=null')
  })

  it('should handle boolean values', () => {
    const key = generateCacheKey('test', {
      active: true,
      deleted: false
    })
    expect(key).toContain('active=true')
    expect(key).toContain('deleted=false')
  })
})

describe('withCache', () => {
  let cache: Cache

  beforeEach(() => {
    cache = createCache()
  })

  afterEach(() => {
    cache.clear()
  })

  it('should cache function results', async () => {
    const fn = vi.fn(async (id: string) => {
      return { id, name: `User ${id}` }
    })

    const cachedFn = withCache(
      cache,
      (id) => generateCacheKey('user', { id }),
      fn
    )

    // First call - should execute function
    const result1 = await cachedFn('123')
    expect(result1).toEqual({ id: '123', name: 'User 123' })
    expect(fn).toHaveBeenCalledTimes(1)

    // Second call - should return from cache
    const result2 = await cachedFn('123')
    expect(result2).toEqual({ id: '123', name: 'User 123' })
    expect(fn).toHaveBeenCalledTimes(1) // Not called again
  })

  it('should cache different arguments separately', async () => {
    const fn = vi.fn(async (id: string) => {
      return { id, name: `User ${id}` }
    })

    const cachedFn = withCache(
      cache,
      (id) => generateCacheKey('user', { id }),
      fn
    )

    await cachedFn('123')
    await cachedFn('456')

    expect(fn).toHaveBeenCalledTimes(2)
    expect(cache.get(generateCacheKey('user', { id: '123' }))).toBeTruthy()
    expect(cache.get(generateCacheKey('user', { id: '456' }))).toBeTruthy()
  })

  it('should respect custom TTL', async () => {
    vi.useFakeTimers()

    const fn = vi.fn(async (id: string) => ({ id }))

    const cachedFn = withCache(
      cache,
      (id) => generateCacheKey('user', { id }),
      fn,
      1000 // 1 second TTL
    )

    await cachedFn('123')
    expect(fn).toHaveBeenCalledTimes(1)

    // Within TTL - should use cache
    await cachedFn('123')
    expect(fn).toHaveBeenCalledTimes(1)

    // After TTL - should call function again
    vi.advanceTimersByTime(1001)
    await cachedFn('123')
    expect(fn).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('should propagate errors from wrapped function', async () => {
    const fn = vi.fn(async () => {
      throw new Error('Function failed')
    })

    const cachedFn = withCache(
      cache,
      () => 'key',
      fn
    )

    await expect(cachedFn()).rejects.toThrow('Function failed')
  })
})
