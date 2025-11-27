/** @format */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  buildSelectClause,
  batchQuery,
  measureQuery,
  validateSelectClause,
  type BatchQueryOptions,
  type QueryTimingOptions
} from './query-utils'

describe('buildSelectClause', () => {
  it('should build simple select clause with multiple columns', () => {
    const columns = ['id', 'name', 'email']
    const result = buildSelectClause(columns)
    expect(result).toBe('id,name,email')
  })

  it('should handle single column', () => {
    const columns = ['id']
    const result = buildSelectClause(columns)
    expect(result).toBe('id')
  })

  it('should preserve nested relation syntax', () => {
    const columns = ['id', 'user_profiles(display_name, avatar_url)']
    const result = buildSelectClause(columns)
    expect(result).toBe('id,user_profiles(display_name, avatar_url)')
  })

  it('should handle multiple relations', () => {
    const columns = [
      'id',
      'title',
      'author:user_profiles(name)',
      'comments(count)'
    ]
    const result = buildSelectClause(columns)
    expect(result).toBe('id,title,author:user_profiles(name),comments(count)')
  })

  it('should throw error for empty columns array', () => {
    expect(() => buildSelectClause([])).toThrow(
      'buildSelectClause: columns array cannot be empty'
    )
  })
})

describe('batchQuery', () => {
  it('should handle empty items array', async () => {
    const fetcher = vi.fn()
    const result = await batchQuery([], fetcher)
    
    expect(result).toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('should process items in batches sequentially', async () => {
    const items = Array.from({ length: 10 }, (_, i) => i)
    const fetcher = vi.fn(async (batch: number[]) => {
      return batch.map(n => n * 2)
    })
    
    const result = await batchQuery(items, fetcher, {
      batchSize: 3,
      parallel: false
    })
    
    expect(result).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
    expect(fetcher).toHaveBeenCalledTimes(4) // 10 items / 3 per batch = 4 batches
  })

  it('should process items in batches in parallel', async () => {
    const items = Array.from({ length: 10 }, (_, i) => i)
    const fetcher = vi.fn(async (batch: number[]) => {
      return batch.map(n => n * 2)
    })
    
    const result = await batchQuery(items, fetcher, {
      batchSize: 3,
      parallel: true
    })
    
    expect(result).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  it('should use default batch size of 50', async () => {
    const items = Array.from({ length: 100 }, (_, i) => i)
    const fetcher = vi.fn(async (batch: number[]) => batch)
    
    await batchQuery(items, fetcher)
    
    expect(fetcher).toHaveBeenCalledTimes(2) // 100 items / 50 per batch = 2 batches
  })

  it('should handle single batch', async () => {
    const items = [1, 2, 3]
    const fetcher = vi.fn(async (batch: number[]) => batch)
    
    const result = await batchQuery(items, fetcher, { batchSize: 10 })
    
    expect(result).toEqual([1, 2, 3])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('should propagate errors from fetcher', async () => {
    const items = [1, 2, 3]
    const fetcher = vi.fn(async () => {
      throw new Error('Fetch failed')
    })
    
    await expect(batchQuery(items, fetcher)).rejects.toThrow('Fetch failed')
  })
})

describe('measureQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should measure query execution time', async () => {
    const queryFn = vi.fn(async () => {
      vi.advanceTimersByTime(100)
      return 'result'
    })
    
    const resultPromise = measureQuery(queryFn, { name: 'test_query' })
    vi.runAllTimers()
    const result = await resultPromise
    
    expect(result.data).toBe('result')
    expect(result.duration).toBeGreaterThanOrEqual(0)
    expect(result.isSlow).toBe(false)
  })

  it('should detect slow queries', async () => {
    const queryFn = vi.fn(async () => {
      vi.advanceTimersByTime(600)
      return 'result'
    })
    
    const resultPromise = measureQuery(queryFn, {
      name: 'slow_query',
      slowQueryThreshold: 500
    })
    vi.runAllTimers()
    const result = await resultPromise
    
    expect(result.isSlow).toBe(true)
  })

  it('should use custom slow query threshold', async () => {
    const queryFn = vi.fn(async () => {
      vi.advanceTimersByTime(800)
      return 'result'
    })
    
    const resultPromise = measureQuery(queryFn, {
      name: 'query',
      slowQueryThreshold: 1000
    })
    vi.runAllTimers()
    const result = await resultPromise
    
    expect(result.isSlow).toBe(false)
  })

  it('should handle query errors and still measure time', async () => {
    const queryFn = vi.fn(async () => {
      vi.advanceTimersByTime(50)
      throw new Error('Query failed')
    })
    
    const resultPromise = measureQuery(queryFn, { name: 'failing_query' })
    vi.runAllTimers()
    
    await expect(resultPromise).rejects.toThrow('Query failed')
  })

  it('should respect logTiming option', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const queryFn = vi.fn(async () => 'result')
    
    await measureQuery(queryFn, {
      name: 'test',
      logTiming: false
    })
    
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('validateSelectClause', () => {
  it('should throw error for SELECT *', () => {
    expect(() => validateSelectClause('*')).toThrow(
      'SELECT * is not allowed'
    )
  })

  it('should throw error for SELECT * with spaces', () => {
    expect(() => validateSelectClause('  *  ')).toThrow(
      'SELECT * is not allowed'
    )
  })

  it('should throw error for SELECT * in list', () => {
    expect(() => validateSelectClause('id,*,name')).toThrow(
      'SELECT * is not allowed'
    )
  })

  it('should allow explicit column selection', () => {
    expect(() => validateSelectClause('id,name,email')).not.toThrow()
  })

  it('should allow nested relations', () => {
    expect(() => 
      validateSelectClause('id,user_profiles(display_name)')
    ).not.toThrow()
  })
})
