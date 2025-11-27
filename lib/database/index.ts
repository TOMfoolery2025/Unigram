/**
 * Database utilities module
 * 
 * This module provides utilities for optimizing database operations:
 * - Query utilities for explicit column selection and batching
 * - Caching layer for reducing database load
 * 
 * @module lib/database
 */

export {
  buildSelectClause,
  batchQuery,
  measureQuery,
  validateSelectClause,
  type BatchQueryOptions,
  type QueryTimingOptions,
  type QueryTimingResult
} from './query-utils'

export {
  createCache,
  generateCacheKey,
  type Cache,
  type CacheConfig,
  type CacheEntry,
  type CacheStats
} from './cache'
