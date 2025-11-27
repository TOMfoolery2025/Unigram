/**
 * In-Memory Caching Layer
 * 
 * This module provides a simple in-memory cache with TTL (Time To Live)
 * support for reducing database load by caching frequently accessed data.
 * 
 * **Features:**
 * - TTL-based expiration
 * - Automatic cleanup of expired entries
 * - Cache statistics and monitoring
 * - Type-safe cache operations
 * - Cache invalidation strategies
 * 
 * **Use cases:**
 * - Caching frequently accessed data (user profiles, settings)
 * - Reducing load on database for read-heavy operations
 * - Temporary storage of computed results
 * 
 * **Limitations:**
 * - In-memory only (not shared across instances)
 * - Data lost on server restart
 * - Not suitable for large datasets
 * 
 * For production use with multiple instances, consider:
 * - Redis for distributed caching
 * - Next.js built-in caching mechanisms
 * - CDN caching for static content
 */

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  /**
   * The cached value
   */
  value: T
  
  /**
   * Timestamp when the entry was created (milliseconds)
   */
  createdAt: number
  
  /**
   * Timestamp when the entry expires (milliseconds)
   */
  expiresAt: number
  
  /**
   * Number of times this entry has been accessed
   */
  hits: number
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Default TTL in milliseconds
   * Default: 5 minutes (300000ms)
   */
  defaultTTL?: number
  
  /**
   * Maximum number of entries in the cache
   * When exceeded, oldest entries are removed
   * Default: 1000
   */
  maxSize?: number
  
  /**
   * Interval for cleanup of expired entries (milliseconds)
   * Default: 1 minute (60000ms)
   */
  cleanupInterval?: number
  
  /**
   * Whether to enable cache statistics tracking
   * Default: true
   */
  enableStats?: boolean
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /**
   * Total number of cache hits
   */
  hits: number
  
  /**
   * Total number of cache misses
   */
  misses: number
  
  /**
   * Cache hit rate (0-1)
   */
  hitRate: number
  
  /**
   * Current number of entries in cache
   */
  size: number
  
  /**
   * Maximum cache size
   */
  maxSize: number
}

/**
 * Cache interface
 */
export interface Cache {
  /**
   * Get a value from the cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null
  
  /**
   * Set a value in the cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void
  
  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean
  
  /**
   * Delete a specific key from the cache
   */
  delete(key: string): boolean
  
  /**
   * Clear all entries from the cache
   */
  clear(): void
  
  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): number
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats
  
  /**
   * Manually trigger cleanup of expired entries
   */
  cleanup(): number
}

/**
 * Creates a new in-memory cache instance
 * 
 * @param config - Cache configuration options
 * @returns Cache instance
 * 
 * @example
 * // Basic usage
 * const cache = createCache()
 * 
 * // Set a value with default TTL
 * cache.set('user:123', { name: 'John', email: 'john@example.com' })
 * 
 * // Get a value
 * const user = cache.get('user:123')
 * 
 * // Set with custom TTL (10 seconds)
 * cache.set('temp:data', someData, 10000)
 * 
 * @example
 * // With custom configuration
 * const cache = createCache({
 *   defaultTTL: 600000, // 10 minutes
 *   maxSize: 500,
 *   cleanupInterval: 120000 // 2 minutes
 * })
 * 
 * @example
 * // Cache invalidation
 * cache.set('user:123:profile', profile1)
 * cache.set('user:456:profile', profile2)
 * cache.set('post:789', post1)
 * 
 * // Invalidate all user profiles
 * cache.invalidatePattern(/^user:\d+:profile$/)
 * 
 * @example
 * // Monitoring cache performance
 * const stats = cache.getStats()
 * console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`)
 * console.log(`Cache size: ${stats.size}/${stats.maxSize}`)
 */
export function createCache(config: CacheConfig = {}): Cache {
  const {
    defaultTTL = 300000, // 5 minutes
    maxSize = 1000,
    cleanupInterval = 60000, // 1 minute
    enableStats = true
  } = config
  
  // Internal cache storage
  const cache = new Map<string, CacheEntry<any>>()
  
  // Statistics tracking
  let hits = 0
  let misses = 0
  
  // Cleanup timer
  let cleanupTimer: NodeJS.Timeout | null = null
  
  /**
   * Remove expired entries from cache
   */
  function cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    const entries = Array.from(cache.entries())
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) {
        cache.delete(key)
        removed++
      }
    }
    
    return removed
  }
  
  /**
   * Enforce max size by removing oldest entries
   */
  function enforceMaxSize(): void {
    if (cache.size <= maxSize) {
      return
    }
    
    // Sort entries by creation time and remove oldest
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)
    
    const toRemove = cache.size - maxSize
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0])
    }
  }
  
  // Start cleanup interval
  if (cleanupInterval > 0) {
    cleanupTimer = setInterval(cleanup, cleanupInterval)
    
    // Prevent the timer from keeping the process alive
    if (cleanupTimer.unref) {
      cleanupTimer.unref()
    }
  }
  
  return {
    get<T>(key: string): T | null {
      const entry = cache.get(key)
      
      if (!entry) {
        if (enableStats) misses++
        return null
      }
      
      // Check if expired
      if (entry.expiresAt <= Date.now()) {
        cache.delete(key)
        if (enableStats) misses++
        return null
      }
      
      // Update hit count
      entry.hits++
      if (enableStats) hits++
      
      return entry.value as T
    },
    
    set<T>(key: string, value: T, ttl?: number): void {
      const now = Date.now()
      const effectiveTTL = ttl ?? defaultTTL
      
      cache.set(key, {
        value,
        createdAt: now,
        expiresAt: now + effectiveTTL,
        hits: 0
      })
      
      enforceMaxSize()
    },
    
    has(key: string): boolean {
      const entry = cache.get(key)
      
      if (!entry) {
        return false
      }
      
      // Check if expired
      if (entry.expiresAt <= Date.now()) {
        cache.delete(key)
        return false
      }
      
      return true
    },
    
    delete(key: string): boolean {
      return cache.delete(key)
    },
    
    clear(): void {
      cache.clear()
      hits = 0
      misses = 0
    },
    
    invalidatePattern(pattern: string | RegExp): number {
      const regex = typeof pattern === 'string' 
        ? new RegExp(pattern) 
        : pattern
      
      let removed = 0
      
      const keys = Array.from(cache.keys())
      for (const key of keys) {
        if (regex.test(key)) {
          cache.delete(key)
          removed++
        }
      }
      
      return removed
    },
    
    getStats(): CacheStats {
      const total = hits + misses
      
      return {
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0,
        size: cache.size,
        maxSize
      }
    },
    
    cleanup
  }
}

/**
 * Generates a consistent cache key from parameters
 * 
 * This function creates deterministic cache keys from various input types,
 * ensuring that the same inputs always produce the same key.
 * 
 * **Features:**
 * - Handles strings, numbers, booleans, objects, and arrays
 * - Sorts object keys for consistency
 * - Handles nested objects and arrays
 * - Produces readable keys for debugging
 * 
 * @param namespace - Cache namespace (e.g., 'user', 'post', 'query')
 * @param params - Parameters to include in the key
 * @returns Cache key string
 * 
 * @example
 * // Simple key
 * const key = generateCacheKey('user', { id: '123' })
 * // Returns: 'user:id=123'
 * 
 * @example
 * // Multiple parameters
 * const key = generateCacheKey('posts', { 
 *   authorId: '123', 
 *   limit: 10,
 *   offset: 0 
 * })
 * // Returns: 'posts:authorId=123:limit=10:offset=0'
 * 
 * @example
 * // With arrays
 * const key = generateCacheKey('users', { 
 *   ids: ['1', '2', '3'],
 *   fields: ['name', 'email']
 * })
 * // Returns: 'users:fields=email,name:ids=1,2,3'
 * 
 * @example
 * // Nested objects
 * const key = generateCacheKey('query', {
 *   filter: { status: 'active', role: 'admin' },
 *   sort: { field: 'created_at', order: 'desc' }
 * })
 */
export function generateCacheKey(
  namespace: string,
  params: Record<string, any> = {}
): string {
  const parts: string[] = [namespace]
  
  // Sort keys for consistency
  const sortedKeys = Object.keys(params).sort()
  
  for (const key of sortedKeys) {
    const value = params[key]
    const serialized = serializeValue(value)
    parts.push(`${key}=${serialized}`)
  }
  
  return parts.join(':')
}

/**
 * Serializes a value for use in cache keys
 */
function serializeValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null'
  }
  
  if (typeof value === 'string') {
    return value
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  
  if (Array.isArray(value)) {
    return value.map(serializeValue).sort().join(',')
  }
  
  if (typeof value === 'object') {
    const sortedKeys = Object.keys(value).sort()
    const pairs = sortedKeys.map(k => `${k}=${serializeValue(value[k])}`)
    return `{${pairs.join(',')}}`
  }
  
  return String(value)
}

/**
 * Wraps a function with caching
 * 
 * This higher-order function adds caching to any async function,
 * automatically handling cache hits and misses.
 * 
 * @param cache - Cache instance to use
 * @param keyFn - Function to generate cache key from arguments
 * @param fn - Function to wrap with caching
 * @param ttl - Optional TTL override
 * @returns Cached version of the function
 * 
 * @example
 * const cache = createCache()
 * 
 * // Original function
 * async function fetchUser(id: string) {
 *   const { data } = await supabase
 *     .from('user_profiles')
 *     .select('*')
 *     .eq('id', id)
 *     .single()
 *   return data
 * }
 * 
 * // Cached version
 * const cachedFetchUser = withCache(
 *   cache,
 *   (id) => generateCacheKey('user', { id }),
 *   fetchUser,
 *   60000 // 1 minute TTL
 * )
 * 
 * // First call: fetches from database
 * const user1 = await cachedFetchUser('123')
 * 
 * // Second call: returns from cache
 * const user2 = await cachedFetchUser('123')
 */
export function withCache<TArgs extends any[], TResult>(
  cache: Cache,
  keyFn: (...args: TArgs) => string,
  fn: (...args: TArgs) => Promise<TResult>,
  ttl?: number
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args)
    
    // Try to get from cache
    const cached = cache.get<TResult>(key)
    if (cached !== null) {
      return cached
    }
    
    // Execute function and cache result
    const result = await fn(...args)
    cache.set(key, result, ttl)
    
    return result
  }
}
