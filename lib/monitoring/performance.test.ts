import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  measureQuery,
  measureOperation,
  PerformanceTimer,
  getQueryMetrics,
  getQueryStats,
  clearMetrics,
  logSlowQuery,
} from './performance';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    clearMetrics();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearMetrics();
  });

  describe('Query Measurement', () => {
    it('should measure query execution time', async () => {
      const result = await measureQuery(
        'test_query',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'result';
        }
      );
      
      expect(result).toBe('result');
      
      const metrics = getQueryMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].query).toBe('test_query');
      expect(metrics[0].duration).toBeGreaterThan(0);
      expect(metrics[0].success).toBe(true);
    });

    it('should record failed queries', async () => {
      try {
        await measureQuery('failing_query', async () => {
          throw new Error('Query failed');
        });
      } catch (error) {
        // Expected to throw
      }
      
      const metrics = getQueryMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].success).toBe(false);
    });
  });

  describe('Operation Measurement', () => {
    it('should measure operation execution time', async () => {
      const result = await measureOperation(
        'test_operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'result';
        }
      );
      
      expect(result).toBe('result');
    });

    it('should handle operation failures', async () => {
      try {
        await measureOperation('failing_operation', async () => {
          throw new Error('Operation failed');
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Performance Timer', () => {
    it('should measure elapsed time', async () => {
      const timer = new PerformanceTimer('test_timer');
      await new Promise(resolve => setTimeout(resolve, 10));
      const elapsed = timer.elapsed();
      
      expect(elapsed).toBeGreaterThan(0);
    });

    it('should stop timer and return duration', async () => {
      const timer = new PerformanceTimer('test_timer');
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = timer.stop();
      
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('Query Statistics', () => {
    it('should calculate query statistics', async () => {
      await measureQuery('query1', async () => 'result1');
      await measureQuery('query2', async () => 'result2');
      
      try {
        await measureQuery('query3', async () => {
          throw new Error('Failed');
        });
      } catch (error) {
        // Expected
      }
      
      const stats = getQueryStats();
      expect(stats.total).toBe(3);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });

    it('should return zero stats when no queries', () => {
      const stats = getQueryStats();
      expect(stats.total).toBe(0);
      expect(stats.averageDuration).toBe(0);
    });
  });

  describe('Metrics Storage', () => {
    it('should store query metrics', async () => {
      await measureQuery('query1', async () => 'result');
      await measureQuery('query2', async () => 'result');
      
      const metrics = getQueryMetrics();
      expect(metrics).toHaveLength(2);
    });

    it('should clear all metrics', async () => {
      await measureQuery('query1', async () => 'result');
      clearMetrics();
      
      const metrics = getQueryMetrics();
      expect(metrics).toHaveLength(0);
    });
  });
});
