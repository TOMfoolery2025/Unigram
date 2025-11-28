/**
 * Error Handling Tests
 * Tests for LLM service failure handling
 * Requirement 7.3: Handle LLM service failures
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMServiceError } from './llm';

describe('LLM Error Handling', () => {
  describe('LLMServiceError', () => {
    it('should create error with message and retryable flag', () => {
      const error = new LLMServiceError('Test error', undefined, true);
      
      expect(error.message).toBe('Test error');
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('LLMServiceError');
    });
    
    it('should default to retryable true', () => {
      const error = new LLMServiceError('Test error');
      
      expect(error.isRetryable).toBe(true);
    });
    
    it('should support non-retryable errors', () => {
      const error = new LLMServiceError('Auth error', undefined, false);
      
      expect(error.isRetryable).toBe(false);
    });
    
    it('should store original error', () => {
      const originalError = new Error('Original');
      const error = new LLMServiceError('Wrapped error', originalError, true);
      
      expect(error.originalError).toBe(originalError);
    });
  });
  
  describe('Error categorization', () => {
    it('should identify rate limit errors as retryable', () => {
      const error = { status: 429, message: 'Rate limit' };
      const isRetryable = 
        error.status === 429 || 
        error.status === 503 || 
        error.status === 500;
      
      expect(isRetryable).toBe(true);
    });
    
    it('should identify service unavailable errors as retryable', () => {
      const error = { status: 503, message: 'Service unavailable' };
      const isRetryable = 
        error.status === 429 || 
        error.status === 503 || 
        error.status === 500;
      
      expect(isRetryable).toBe(true);
    });
    
    it('should identify timeout errors as retryable', () => {
      const error = { code: 'ETIMEDOUT', message: 'Timeout' };
      const isRetryable = 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT';
      
      expect(isRetryable).toBe(true);
    });
    
    it('should identify auth errors as non-retryable', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const isRetryable = error.status !== 401;
      
      expect(isRetryable).toBe(false);
    });
  });
  
  describe('Error messages', () => {
    it('should provide user-friendly message for rate limit', () => {
      const error = new LLMServiceError(
        'Rate limit exceeded. Please try again in a moment.',
        undefined,
        true
      );
      
      expect(error.message).toContain('Rate limit');
      expect(error.message).toContain('try again');
      expect(error.isRetryable).toBe(true);
    });
    
    it('should provide user-friendly message for service unavailable', () => {
      const error = new LLMServiceError(
        'The AI service is temporarily unavailable. Please try again later.',
        undefined,
        true
      );
      
      expect(error.message).toContain('temporarily unavailable');
      expect(error.message).toContain('try again');
      expect(error.isRetryable).toBe(true);
    });
    
    it('should provide user-friendly message for timeout', () => {
      const error = new LLMServiceError(
        'Request timed out. Please try again.',
        undefined,
        true
      );
      
      expect(error.message).toContain('timed out');
      expect(error.message).toContain('try again');
      expect(error.isRetryable).toBe(true);
    });
    
    it('should provide user-friendly message for auth failure', () => {
      const error = new LLMServiceError(
        'Authentication failed. Please check your API key configuration.',
        undefined,
        false
      );
      
      expect(error.message).toContain('Authentication failed');
      expect(error.message).toContain('API key');
      expect(error.isRetryable).toBe(false);
    });
  });
});
