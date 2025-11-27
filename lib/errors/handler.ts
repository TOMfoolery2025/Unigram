/**
 * Error handling utilities for the TUM Community Platform
 * Provides structured error types, classification, and sanitization
 */

export enum ErrorCategory {
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
  category: ErrorCategory;
  details?: any;
}

/**
 * Base error class for application errors
 */
export class BaseAppError extends Error implements AppError {
  code: string;
  userMessage: string;
  statusCode: number;
  category: ErrorCategory;
  details?: any;

  constructor(
    message: string,
    code: string,
    userMessage: string,
    statusCode: number,
    category: ErrorCategory,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.category = category;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends BaseAppError {
  constructor(message: string, details?: any) {
    super(
      message,
      'DATABASE_ERROR',
      'A database error occurred. Please try again later.',
      500,
      ErrorCategory.DATABASE,
      details
    );
  }
}

/**
 * Authentication-related errors
 */
export class AuthenticationError extends BaseAppError {
  constructor(message: string, userMessage?: string, details?: any) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      userMessage || 'Authentication failed. Please log in again.',
      401,
      ErrorCategory.AUTHENTICATION,
      details
    );
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends BaseAppError {
  constructor(message: string, details?: any) {
    super(
      message,
      'VALIDATION_ERROR',
      'Invalid input provided. Please check your data and try again.',
      400,
      ErrorCategory.VALIDATION,
      details
    );
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends BaseAppError {
  constructor(message: string, details?: any) {
    super(
      message,
      'NETWORK_ERROR',
      'A network error occurred. Please check your connection and try again.',
      503,
      ErrorCategory.NETWORK,
      details
    );
  }
}

/**
 * Patterns to identify sensitive data that should be sanitized
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /auth/i,
  /bearer/i,
  /jwt/i,
  /session/i,
];

/**
 * Sanitize error details to remove sensitive information
 */
function sanitizeDetails(details: any): any {
  if (!details) return details;

  if (typeof details === 'string') {
    return details;
  }

  if (Array.isArray(details)) {
    return details.map(sanitizeDetails);
  }

  if (typeof details === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(details)) {
      // Check if key contains sensitive patterns
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeDetails(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return details;
}

/**
 * Classify and handle errors, converting them to AppError instances
 */
export function handleError(error: Error | unknown): AppError {
  // Already an AppError
  if (error instanceof BaseAppError) {
    return error;
  }

  // Handle Error instances
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Database errors
    if (
      message.includes('relation') ||
      message.includes('column') ||
      message.includes('constraint') ||
      message.includes('duplicate key') ||
      message.includes('foreign key') ||
      message.includes('syntax error')
    ) {
      return new DatabaseError(error.message, { originalError: error.name });
    }

    // Authentication errors
    if (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('token') ||
      message.includes('session') ||
      message.includes('invalid credentials')
    ) {
      return new AuthenticationError(error.message);
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('must be')
    ) {
      return new ValidationError(error.message);
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch')
    ) {
      return new NetworkError(error.message);
    }

    // Unknown error
    return new BaseAppError(
      error.message,
      'UNKNOWN_ERROR',
      'An unexpected error occurred. Please try again.',
      500,
      ErrorCategory.UNKNOWN,
      { originalError: error.name }
    );
  }

  // Handle non-Error objects
  return new BaseAppError(
    String(error),
    'UNKNOWN_ERROR',
    'An unexpected error occurred. Please try again.',
    500,
    ErrorCategory.UNKNOWN
  );
}

/**
 * Sanitize error for user display
 * Removes sensitive information and internal details
 */
export function sanitizeError(error: AppError): AppError {
  return {
    ...error,
    details: sanitizeDetails(error.details),
    message: error.userMessage, // Use user-friendly message
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  return (
    error.category === ErrorCategory.NETWORK ||
    (error.category === ErrorCategory.DATABASE && 
     error.message.includes('timeout'))
  );
}
