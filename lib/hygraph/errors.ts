/**
 * Base error class for all Hygraph-related errors
 */
export class HygraphError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'HygraphError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when Hygraph configuration is missing or invalid
 */
export class ConfigurationError extends HygraphError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when authentication with Hygraph fails
 */
export class AuthenticationError extends HygraphError {
  constructor(message: string, originalError?: Error) {
    super(message, 'AUTHENTICATION_ERROR', originalError);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when network requests to Hygraph fail
 */
export class NetworkError extends HygraphError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when requested content is not found in Hygraph
 */
export class ContentNotFoundError extends HygraphError {
  constructor(slug: string) {
    super(`Article not found: ${slug}`, 'CONTENT_NOT_FOUND');
    this.name = 'ContentNotFoundError';
  }
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns The result of the function
 * @throws The last error if all attempts fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication or configuration errors
      if (
        error instanceof AuthenticationError ||
        error instanceof ConfigurationError
      ) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
