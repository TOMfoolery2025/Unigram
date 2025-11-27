/**
 * Database Query Utilities
 * 
 * This module provides utilities for optimizing database queries:
 * - Explicit column selection to minimize data transfer
 * - Batch query operations to reduce round trips
 * - Query timing and performance monitoring
 * 
 * These utilities help prevent common performance issues like:
 * - SELECT * queries that fetch unnecessary data
 * - N+1 query patterns from sequential operations
 * - Unmonitored slow queries
 */

/**
 * Builds a select clause with explicit column names
 * 
 * This function helps avoid SELECT * queries by explicitly specifying
 * which columns to fetch. This reduces data transfer and improves performance.
 * 
 * **Performance benefits:**
 * - Reduces network bandwidth by fetching only needed columns
 * - Improves query performance by reducing data processing
 * - Makes queries more maintainable and explicit
 * 
 * **Supports:**
 * - Simple column names: ['id', 'name', 'email']
 * - Nested relations: ['id', 'user_profiles(display_name, avatar_url)']
 * - Multiple relations: ['id', 'author:user_profiles(name)', 'comments(count)']
 * 
 * @param columns - Array of column names to select
 * @returns Comma-separated select clause string
 * 
 * @example
 * // Simple columns
 * const select = buildSelectClause(['id', 'title', 'content'])
 * // Returns: 'id,title,content'
 * 
 * @example
 * // With nested relations
 * const select = buildSelectClause([
 *   'id',
 *   'title',
 *   'user_profiles(display_name, avatar_url)'
 * ])
 * // Returns: 'id,title,user_profiles(display_name, avatar_url)'
 * 
 * @example
 * // Usage with Supabase
 * const { data } = await supabase
 *   .from('posts')
 *   .select(buildSelectClause(['id', 'title', 'author:user_profiles(name)']))
 */
export function buildSelectClause(columns: string[]): string {
  if (columns.length === 0) {
    throw new Error('buildSelectClause: columns array cannot be empty')
  }
  
  // Join columns with commas, preserving nested relation syntax
  return columns.join(',')
}

/**
 * Options for batch query operations
 */
export interface BatchQueryOptions {
  /**
   * Number of items to process in each batch
   * Default: 50
   */
  batchSize?: number
  
  /**
   * Whether to execute batches in parallel or sequentially
   * - true: Faster but uses more connections
   * - false: Slower but more conservative with resources
   * Default: false
   */
  parallel?: boolean
}

/**
 * Executes queries in batches to optimize performance
 * 
 * This function helps prevent N+1 query patterns by batching multiple
 * operations together. Instead of making N individual queries, it groups
 * them into batches and executes them more efficiently.
 * 
 * **Use cases:**
 * - Fetching data for multiple IDs
 * - Bulk insert/update operations
 * - Processing large datasets
 * 
 * **Performance characteristics:**
 * - Sequential: Processes one batch at a time (safer, slower)
 * - Parallel: Processes all batches simultaneously (faster, more connections)
 * 
 * @param ids - Array of IDs to fetch data for
 * @param fetcher - Function that fetches data for a batch of IDs
 * @param options - Batch configuration options
 * @returns Promise resolving to array of all fetched items
 * 
 * @example
 * // Fetch user profiles for multiple user IDs
 * const userIds = ['id1', 'id2', 'id3', ..., 'id100']
 * 
 * const profiles = await batchQuery(
 *   userIds,
 *   async (batchIds) => {
 *     const { data } = await supabase
 *       .from('user_profiles')
 *       .select('id, display_name, avatar_url')
 *       .in('id', batchIds)
 *     return data || []
 *   },
 *   { batchSize: 50, parallel: false }
 * )
 * 
 * @example
 * // Bulk insert with batching
 * const posts = Array.from({ length: 1000 }, (_, i) => ({ title: `Post ${i}` }))
 * 
 * await batchQuery(
 *   posts,
 *   async (batch) => {
 *     const { data } = await supabase
 *       .from('posts')
 *       .insert(batch)
 *     return data || []
 *   },
 *   { batchSize: 100, parallel: true }
 * )
 */
export async function batchQuery<T, R>(
  items: T[],
  fetcher: (batch: T[]) => Promise<R[]>,
  options: BatchQueryOptions = {}
): Promise<R[]> {
  const { batchSize = 50, parallel = false } = options
  
  if (items.length === 0) {
    return []
  }
  
  // Split items into batches
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  
  // Execute batches
  if (parallel) {
    // Execute all batches in parallel
    const results = await Promise.all(
      batches.map(batch => fetcher(batch))
    )
    return results.flat()
  } else {
    // Execute batches sequentially
    const results: R[] = []
    for (const batch of batches) {
      const batchResults = await fetcher(batch)
      results.push(...batchResults)
    }
    return results
  }
}

/**
 * Query timing result
 */
export interface QueryTimingResult<T> {
  /**
   * The result of the query
   */
  data: T
  
  /**
   * Query execution time in milliseconds
   */
  duration: number
  
  /**
   * Whether the query exceeded the slow query threshold
   */
  isSlow: boolean
}

/**
 * Options for query timing
 */
export interface QueryTimingOptions {
  /**
   * Query name for logging purposes
   */
  name: string
  
  /**
   * Threshold in milliseconds for slow query detection
   * Default: 500ms
   */
  slowQueryThreshold?: number
  
  /**
   * Whether to log query timing to console
   * Default: true in development, false in production
   */
  logTiming?: boolean
}

/**
 * Wraps a query with timing and performance monitoring
 * 
 * This function measures query execution time and logs slow queries
 * to help identify performance bottlenecks.
 * 
 * **Features:**
 * - Measures query execution time
 * - Detects slow queries based on threshold
 * - Logs timing information in development
 * - Returns timing metadata with query results
 * 
 * @param queryFn - Async function that executes the query
 * @param options - Timing configuration options
 * @returns Promise resolving to query result with timing metadata
 * 
 * @example
 * // Basic usage
 * const result = await measureQuery(
 *   async () => {
 *     const { data } = await supabase
 *       .from('posts')
 *       .select('*')
 *       .eq('author_id', userId)
 *     return data
 *   },
 *   { name: 'fetch_user_posts' }
 * )
 * 
 * console.log(`Query took ${result.duration}ms`)
 * console.log(`Is slow: ${result.isSlow}`)
 * console.log(`Data:`, result.data)
 * 
 * @example
 * // With custom slow query threshold
 * const result = await measureQuery(
 *   async () => fetchComplexData(),
 *   { 
 *     name: 'complex_aggregation',
 *     slowQueryThreshold: 1000, // 1 second
 *     logTiming: true
 *   }
 * )
 */
export async function measureQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryTimingOptions
): Promise<QueryTimingResult<T>> {
  const {
    name,
    slowQueryThreshold = 500,
    logTiming = process.env.NODE_ENV === 'development'
  } = options
  
  const startTime = performance.now()
  
  try {
    const data = await queryFn()
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)
    const isSlow = duration > slowQueryThreshold
    
    // Log timing information
    if (logTiming) {
      const logLevel = isSlow ? 'warn' : 'log'
      const slowIndicator = isSlow ? ' [SLOW]' : ''
      console[logLevel](
        `Query "${name}" took ${duration}ms${slowIndicator}`
      )
    }
    
    return {
      data,
      duration,
      isSlow
    }
  } catch (error) {
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)
    
    if (logTiming) {
      console.error(
        `Query "${name}" failed after ${duration}ms:`,
        error
      )
    }
    
    throw error
  }
}

/**
 * Helper to validate that a select clause doesn't use SELECT *
 * 
 * This is useful for enforcing explicit column selection in your codebase.
 * 
 * @param selectClause - The select clause to validate
 * @throws Error if the select clause contains '*'
 * 
 * @example
 * // This will throw an error
 * validateSelectClause('*')
 * 
 * @example
 * // This will pass
 * validateSelectClause('id,name,email')
 */
export function validateSelectClause(selectClause: string): void {
  if (selectClause.trim() === '*' || selectClause.includes(',*') || selectClause.includes('*, ')) {
    throw new Error(
      'SELECT * is not allowed. Use buildSelectClause() to specify explicit columns.'
    )
  }
}
