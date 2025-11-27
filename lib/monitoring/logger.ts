/**
 * Logging system for the TUM Community Platform
 * Provides structured logging with context, log levels, and sensitive data filtering
 */

import { ErrorCategory, type AppError } from '../errors';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  userId?: string;
  operation?: string;
  category?: ErrorCategory;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: Date;
}

/**
 * Patterns to identify sensitive data that should be filtered
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /bearer/i,
  /jwt/i,
  /session/i,
  /cookie/i,
  /authorization/i,
];

/**
 * Filter sensitive data from log context
 */
function filterSensitiveData(data: any): any {
  if (!data) return data;

  if (typeof data === 'string') {
    // Check if the entire string looks like a token/secret
    if (data.length > 20 && /^[A-Za-z0-9_-]+$/.test(data)) {
      return '[FILTERED]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(filterSensitiveData);
  }

  if (typeof data === 'object') {
    const filtered: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key contains sensitive patterns
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        filtered[key] = '[FILTERED]';
      } else if (typeof value === 'object') {
        filtered[key] = filterSensitiveData(value);
      } else if (typeof value === 'string' && value.length > 50) {
        // Filter long strings that might be tokens
        filtered[key] = filterSensitiveData(value);
      } else {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  return data;
}

/**
 * Get current log level from environment
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  
  switch (envLevel) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    default:
      // Default to INFO in production, DEBUG in development
      return process.env.NODE_ENV === 'production' 
        ? LogLevel.INFO 
        : LogLevel.DEBUG;
  }
}

/**
 * Check if a log level should be logged based on current configuration
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const currentIndex = levels.indexOf(currentLevel);
  const messageIndex = levels.indexOf(level);
  
  return messageIndex >= currentIndex;
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const { level, message, context, timestamp } = entry;
  
  // In production, use JSON format for structured logging
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify({
      level,
      message,
      ...context,
      timestamp: timestamp.toISOString(),
    });
  }
  
  // In development, use human-readable format
  const timeStr = timestamp.toISOString();
  const levelStr = level.toUpperCase().padEnd(5);
  const contextStr = Object.keys(context).length > 0 
    ? ` ${JSON.stringify(context)}` 
    : '';
  
  return `[${timeStr}] ${levelStr} ${message}${contextStr}`;
}

/**
 * Output log entry to appropriate destination
 */
function outputLog(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);
  
  switch (entry.level) {
    case LogLevel.ERROR:
      console.error(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.DEBUG:
      console.debug(formatted);
      break;
  }
}

/**
 * Create a log entry with filtered sensitive data
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): LogEntry {
  return {
    level,
    message,
    context: {
      ...context,
      timestamp: context.timestamp || new Date(),
      metadata: context.metadata ? filterSensitiveData(context.metadata) : undefined,
    },
    timestamp: new Date(),
  };
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private defaultContext: LogContext;

  constructor(defaultContext: LogContext = {}) {
    this.defaultContext = defaultContext;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context: LogContext = {}): void {
    if (!shouldLog(LogLevel.DEBUG)) return;
    
    const entry = createLogEntry(
      LogLevel.DEBUG,
      message,
      { ...this.defaultContext, ...context }
    );
    outputLog(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, context: LogContext = {}): void {
    if (!shouldLog(LogLevel.INFO)) return;
    
    const entry = createLogEntry(
      LogLevel.INFO,
      message,
      { ...this.defaultContext, ...context }
    );
    outputLog(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context: LogContext = {}): void {
    if (!shouldLog(LogLevel.WARN)) return;
    
    const entry = createLogEntry(
      LogLevel.WARN,
      message,
      { ...this.defaultContext, ...context }
    );
    outputLog(entry);
  }

  /**
   * Log an error message
   */
  error(message: string, context: LogContext = {}): void {
    if (!shouldLog(LogLevel.ERROR)) return;
    
    const entry = createLogEntry(
      LogLevel.ERROR,
      message,
      { ...this.defaultContext, ...context }
    );
    outputLog(entry);
  }

  /**
   * Log an AppError with full context
   */
  logError(error: AppError, context: LogContext = {}): void {
    this.error(error.message, {
      ...context,
      category: error.category,
      metadata: {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }

  /**
   * Create a child logger with additional default context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({
      ...this.defaultContext,
      ...additionalContext,
    });
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with specific context
 */
export function createLogger(context: LogContext): Logger {
  return new Logger(context);
}
