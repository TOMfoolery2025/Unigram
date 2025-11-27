/**
 * Cache entry with data, timestamp, and TTL
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple in-memory cache with TTL-based expiration
 * Default TTL is 5 minutes (300000ms)
 */
export class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 300000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get data from cache if it exists and hasn't expired
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with optional TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time-to-live in milliseconds (optional, defaults to 5 minutes)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidate a specific cache entry
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache (including expired ones)
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Request deduplication manager
 * Prevents concurrent duplicate API calls by tracking in-flight requests
 */
export class RequestDeduplicator {
  private inFlightRequests: Map<string, Promise<any>>;

  constructor() {
    this.inFlightRequests = new Map();
  }

  /**
   * Execute a request with deduplication
   * If a request with the same key is already in flight, return the existing promise
   * @param key Unique key for the request
   * @param fn Function that performs the request
   * @returns Promise that resolves with the request result
   */
  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if request is already in flight
    const existingRequest = this.inFlightRequests.get(key);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    // Create new request
    const request = fn()
      .then((result) => {
        // Clean up after successful completion
        this.inFlightRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // Clean up after error
        this.inFlightRequests.delete(key);
        throw error;
      });

    // Store in-flight request
    this.inFlightRequests.set(key, request);

    return request;
  }

  /**
   * Clear all in-flight requests
   */
  clear(): void {
    this.inFlightRequests.clear();
  }

  /**
   * Get the number of in-flight requests
   */
  size(): number {
    return this.inFlightRequests.size;
  }
}

// Export singleton instances for use across the application
export const hygraphCache = new SimpleCache();
export const requestDeduplicator = new RequestDeduplicator();
