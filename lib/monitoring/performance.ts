/**
 * Performance monitoring utilities for the TUM Community Platform
 * Provides query timing, slow query detection, and performance metrics collection
 */

import { logger, type LogContext } from './logger';

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Configuration for performance monitoring
 */
interface PerformanceConfig {
  slowQueryThreshold: number; // milliseconds
  enableMetricsCollection: boolean;
}

/**
 * Get performance configuration from environment
 */
function getPerformanceConfig(): PerformanceConfig {
  return {
    slowQueryThreshold: parseInt(
      process.env.SLOW_QUERY_THRESHOLD || '500',
      10
    ),
    enableMetricsCollection: process.env.ENABLE_METRICS !== 'false',
  };
}

/**
 * In-memory storage for metrics (in production, this would be sent to a monitoring service)
 */
const metricsStore: {
  queries: QueryMetrics[];
  operations: PerformanceMetrics[];
} = {
  queries: [],
  operations: [],
};

/**
 * Maximum number of metrics to store in memory
 */
const MAX_METRICS_STORED = 1000;

/**
 * Add query metrics to store
 */
function storeQueryMetrics(metrics: QueryMetrics): void {
  const config = getPerformanceConfig();
  
  if (!config.enableMetricsCollection) return;
  
  metricsStore.queries.push(metrics);
  
  // Keep only the most recent metrics
  if (metricsStore.queries.length > MAX_METRICS_STORED) {
    metricsStore.queries.shift();
  }
}

/**
 * Add operation metrics to store
 */
function storeOperationMetrics(metrics: PerformanceMetrics): void {
  const config = getPerformanceConfig();
  
  if (!config.enableMetricsCollection) return;
  
  metricsStore.operations.push(metrics);
  
  // Keep only the most recent metrics
  if (metricsStore.operations.length > MAX_METRICS_STORED) {
    metricsStore.operations.shift();
  }
}

/**
 * Sanitize query string for logging (remove sensitive data)
 */
function sanitizeQuery(query: string): string {
  // Remove potential sensitive values from query strings
  return query
    .replace(/password\s*=\s*'[^']*'/gi, "password='[REDACTED]'")
    .replace(/token\s*=\s*'[^']*'/gi, "token='[REDACTED]'")
    .replace(/secret\s*=\s*'[^']*'/gi, "secret='[REDACTED]'");
}

/**
 * Log query performance metrics
 */
export function logQuery(metrics: QueryMetrics): void {
  const config = getPerformanceConfig();
  const sanitizedQuery = sanitizeQuery(metrics.query);
  
  // Store metrics
  storeQueryMetrics(metrics);
  
  // Log all queries in debug mode
  logger.debug('Query executed', {
    operation: 'database_query',
    metadata: {
      query: sanitizedQuery,
      duration: metrics.duration,
      success: metrics.success,
      ...metrics.metadata,
    },
  });
  
  // Log slow queries as warnings
  if (metrics.duration >= config.slowQueryThreshold) {
    logSlowQuery(metrics);
  }
}

/**
 * Log slow query with detailed information
 */
export function logSlowQuery(metrics: QueryMetrics): void {
  const sanitizedQuery = sanitizeQuery(metrics.query);
  
  logger.warn('Slow query detected', {
    operation: 'slow_query',
    metadata: {
      query: sanitizedQuery,
      duration: metrics.duration,
      threshold: getPerformanceConfig().slowQueryThreshold,
      success: metrics.success,
      ...metrics.metadata,
    },
  });
}

/**
 * Measure and log query execution time
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  let success = true;
  let error: Error | undefined;
  
  try {
    const result = await queryFn();
    return result;
  } catch (err) {
    success = false;
    error = err instanceof Error ? err : new Error(String(err));
    throw err;
  } finally {
    const duration = performance.now() - startTime;
    
    logQuery({
      query: queryName,
      duration,
      timestamp: new Date(),
      success,
      metadata: {
        ...metadata,
        error: error?.message,
      },
    });
  }
}

/**
 * Measure and log operation execution time
 */
export async function measureOperation<T>(
  operationName: string,
  operationFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await operationFn();
    const duration = performance.now() - startTime;
    
    const metrics: PerformanceMetrics = {
      operation: operationName,
      duration,
      timestamp: new Date(),
      metadata,
    };
    
    storeOperationMetrics(metrics);
    
    logger.debug('Operation completed', {
      operation: operationName,
      metadata: {
        duration,
        ...metadata,
      },
    });
    
    return result;
  } catch (err) {
    const duration = performance.now() - startTime;
    
    logger.error('Operation failed', {
      operation: operationName,
      metadata: {
        duration,
        error: err instanceof Error ? err.message : String(err),
        ...metadata,
      },
    });
    
    throw err;
  }
}

/**
 * Create a timer for manual performance measurement
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  private metadata?: Record<string, any>;

  constructor(operation: string, metadata?: Record<string, any>) {
    this.operation = operation;
    this.metadata = metadata;
    this.startTime = performance.now();
  }

  /**
   * Stop the timer and log the duration
   */
  stop(): number {
    const duration = performance.now() - this.startTime;
    
    logger.debug('Timer stopped', {
      operation: this.operation,
      metadata: {
        duration,
        ...this.metadata,
      },
    });
    
    return duration;
  }

  /**
   * Get elapsed time without stopping the timer
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }
}

/**
 * Get all collected query metrics
 */
export function getQueryMetrics(): QueryMetrics[] {
  return [...metricsStore.queries];
}

/**
 * Get all collected operation metrics
 */
export function getOperationMetrics(): PerformanceMetrics[] {
  return [...metricsStore.operations];
}

/**
 * Get slow queries from collected metrics
 */
export function getSlowQueries(): QueryMetrics[] {
  const config = getPerformanceConfig();
  return metricsStore.queries.filter(
    m => m.duration >= config.slowQueryThreshold
  );
}

/**
 * Get average query duration
 */
export function getAverageQueryDuration(): number {
  if (metricsStore.queries.length === 0) return 0;
  
  const total = metricsStore.queries.reduce((sum, m) => sum + m.duration, 0);
  return total / metricsStore.queries.length;
}

/**
 * Get query statistics
 */
export function getQueryStats(): {
  total: number;
  successful: number;
  failed: number;
  averageDuration: number;
  slowQueries: number;
} {
  const config = getPerformanceConfig();
  
  return {
    total: metricsStore.queries.length,
    successful: metricsStore.queries.filter(m => m.success).length,
    failed: metricsStore.queries.filter(m => !m.success).length,
    averageDuration: getAverageQueryDuration(),
    slowQueries: metricsStore.queries.filter(
      m => m.duration >= config.slowQueryThreshold
    ).length,
  };
}

/**
 * Clear all collected metrics
 */
export function clearMetrics(): void {
  metricsStore.queries = [];
  metricsStore.operations = [];
}

/**
 * Create a performance logger for a specific context
 */
export function createPerformanceLogger(context: LogContext) {
  return {
    measureQuery: <T>(
      queryName: string,
      queryFn: () => Promise<T>,
      metadata?: Record<string, any>
    ) => measureQuery(queryName, queryFn, { ...context, ...metadata }),
    
    measureOperation: <T>(
      operationName: string,
      operationFn: () => Promise<T>,
      metadata?: Record<string, any>
    ) => measureOperation(operationName, operationFn, { ...context, ...metadata }),
    
    timer: (operation: string, metadata?: Record<string, any>) =>
      new PerformanceTimer(operation, { ...context, ...metadata }),
  };
}
