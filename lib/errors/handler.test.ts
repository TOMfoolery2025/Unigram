import { describe, it, expect } from 'vitest';
import {
  handleError,
  DatabaseError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  sanitizeError,
  isRetryableError,
  ErrorCategory,
} from './handler';

describe('Error Handler', () => {
  describe('Error Classification', () => {
    it('should classify database errors correctly', () => {
      const error = new Error('relation "users" does not exist');
      const appError = handleError(error);
      
      expect(appError.category).toBe(ErrorCategory.DATABASE);
      expect(appError.code).toBe('DATABASE_ERROR');
      expect(appError.statusCode).toBe(500);
    });

    it('should classify authentication errors correctly', () => {
      const error = new Error('unauthorized access');
      const appError = handleError(error);
      
      expect(appError.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(appError.code).toBe('AUTHENTICATION_ERROR');
      expect(appError.statusCode).toBe(401);
    });

    it('should classify validation errors correctly', () => {
      const error = new Error('validation failed: field is required');
      const appError = handleError(error);
      
      expect(appError.category).toBe(ErrorCategory.VALIDATION);
      expect(appError.code).toBe('VALIDATION_ERROR');
      expect(appError.statusCode).toBe(400);
    });

    it('should classify network errors correctly', () => {
      const error = new Error('network timeout');
      const appError = handleError(error);
      
      expect(appError.category).toBe(ErrorCategory.NETWORK);
      expect(appError.code).toBe('NETWORK_ERROR');
      expect(appError.statusCode).toBe(503);
    });
  });

  describe('Error Sanitization', () => {
    it('should sanitize sensitive data from error details', () => {
      const error = new DatabaseError('Query failed', {
        password: 'secret123',
        token: 'abc123',
        userId: '123',
      });
      
      const sanitized = sanitizeError(error);
      
      expect(sanitized.details.password).toBe('[REDACTED]');
      expect(sanitized.details.token).toBe('[REDACTED]');
      expect(sanitized.details.userId).toBe('123');
    });

    it('should use user-friendly message in sanitized error', () => {
      const error = new DatabaseError('Internal database error');
      const sanitized = sanitizeError(error);
      
      expect(sanitized.message).toBe(error.userMessage);
      expect(sanitized.message).not.toContain('Internal');
    });
  });

  describe('Retryable Errors', () => {
    it('should identify network errors as retryable', () => {
      const error = new NetworkError('Connection timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify database timeout errors as retryable', () => {
      const error = new DatabaseError('Query timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not identify validation errors as retryable', () => {
      const error = new ValidationError('Invalid input');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('Custom Error Types', () => {
    it('should create DatabaseError with correct properties', () => {
      const error = new DatabaseError('Test error', { query: 'SELECT *' });
      
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.statusCode).toBe(500);
      expect(error.details.query).toBe('SELECT *');
    });

    it('should create AuthenticationError with custom user message', () => {
      const error = new AuthenticationError('Internal auth error', 'Please log in again');
      
      expect(error.userMessage).toBe('Please log in again');
      expect(error.statusCode).toBe(401);
    });
  });
});
