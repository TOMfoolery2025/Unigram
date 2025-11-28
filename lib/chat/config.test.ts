/**
 * Tests for chatbot configuration module
 * Requirements: 8.1, 8.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadChatbotConfig, validateChatbotConfig, getConfigSummary } from './config';

describe('Chatbot Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadChatbotConfig', () => {
    it('should throw error when OPENAI_API_KEY is missing', () => {
      delete process.env.OPENAI_API_KEY;
      
      expect(() => loadChatbotConfig()).toThrow('OPENAI_API_KEY environment variable is required');
    });

    it('should load configuration with defaults when only API key is provided', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      delete process.env.OPENAI_MODEL;
      delete process.env.OPENAI_TEMPERATURE;
      delete process.env.OPENAI_MAX_TOKENS;
      
      const config = loadChatbotConfig();
      
      expect(config.openai.apiKey).toBe('sk-test-key');
      expect(config.openai.model).toBe('gpt-4-turbo-preview');
      expect(config.openai.temperature).toBe(0.7);
      expect(config.openai.maxTokens).toBe(1000);
    });

    it('should load custom model from environment', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
      
      const config = loadChatbotConfig();
      
      expect(config.openai.model).toBe('gpt-3.5-turbo');
    });

    it('should load valid temperature from environment', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_TEMPERATURE = '0.5';
      
      const config = loadChatbotConfig();
      
      expect(config.openai.temperature).toBe(0.5);
    });

    it('should use default temperature for invalid values', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_TEMPERATURE = 'invalid';
      
      const config = loadChatbotConfig();
      
      expect(config.openai.temperature).toBe(0.7);
    });

    it('should use default temperature for out-of-range values', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_TEMPERATURE = '3.0';
      
      const config = loadChatbotConfig();
      
      expect(config.openai.temperature).toBe(0.7);
    });

    it('should load valid max tokens from environment', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_MAX_TOKENS = '2000';
      
      const config = loadChatbotConfig();
      
      expect(config.openai.maxTokens).toBe(2000);
    });

    it('should use default max tokens for invalid values', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_MAX_TOKENS = 'invalid';
      
      const config = loadChatbotConfig();
      
      expect(config.openai.maxTokens).toBe(1000);
    });

    it('should use default max tokens for out-of-range values', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_MAX_TOKENS = '10000';
      
      const config = loadChatbotConfig();
      
      expect(config.openai.maxTokens).toBe(1000);
    });

    it('should accept temperature at boundary values', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      
      // Test lower boundary
      process.env.OPENAI_TEMPERATURE = '0';
      let config = loadChatbotConfig();
      expect(config.openai.temperature).toBe(0);
      
      // Test upper boundary
      process.env.OPENAI_TEMPERATURE = '2';
      config = loadChatbotConfig();
      expect(config.openai.temperature).toBe(2);
    });

    it('should accept max tokens at boundary values', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      
      // Test lower boundary
      process.env.OPENAI_MAX_TOKENS = '1';
      let config = loadChatbotConfig();
      expect(config.openai.maxTokens).toBe(1);
      
      // Test upper boundary
      process.env.OPENAI_MAX_TOKENS = '4096';
      config = loadChatbotConfig();
      expect(config.openai.maxTokens).toBe(4096);
    });
  });

  describe('validateChatbotConfig', () => {
    it('should return invalid when API key is missing', () => {
      delete process.env.OPENAI_API_KEY;
      
      const result = validateChatbotConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OPENAI_API_KEY is not set');
    });

    it('should return valid when API key is present', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      
      const result = validateChatbotConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should include warnings for invalid optional config', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_TEMPERATURE = 'invalid';
      
      const result = validateChatbotConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('OPENAI_TEMPERATURE');
    });

    it('should warn about unknown model names', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_MODEL = 'unknown-model-xyz';
      
      const result = validateChatbotConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Unknown OPENAI_MODEL');
    });

    it('should not warn about known model names', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';
      
      const result = validateChatbotConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('getConfigSummary', () => {
    it('should mask API key in summary', () => {
      process.env.OPENAI_API_KEY = 'sk-test-1234567890abcdef';
      
      const summary = getConfigSummary();
      
      expect(summary['OPENAI_API_KEY']).toContain('sk-test-');
      expect(summary['OPENAI_API_KEY']).toContain('...');
      expect(summary['OPENAI_API_KEY']).not.toBe('sk-test-1234567890abcdef');
    });

    it('should show NOT SET when API key is missing', () => {
      delete process.env.OPENAI_API_KEY;
      
      const summary = getConfigSummary();
      
      expect(summary['OPENAI_API_KEY']).toBe('NOT SET');
    });

    it('should show default values when config is not set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      delete process.env.OPENAI_MODEL;
      delete process.env.OPENAI_TEMPERATURE;
      delete process.env.OPENAI_MAX_TOKENS;
      
      const summary = getConfigSummary();
      
      expect(summary['OPENAI_MODEL']).toContain('default');
      expect(summary['OPENAI_TEMPERATURE']).toContain('default');
      expect(summary['OPENAI_MAX_TOKENS']).toContain('default');
    });

    it('should show custom values when config is set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
      process.env.OPENAI_TEMPERATURE = '0.5';
      process.env.OPENAI_MAX_TOKENS = '2000';
      
      const summary = getConfigSummary();
      
      expect(summary['OPENAI_MODEL']).toBe('gpt-3.5-turbo');
      expect(summary['OPENAI_TEMPERATURE']).toBe('0.5');
      expect(summary['OPENAI_MAX_TOKENS']).toBe('2000');
    });
  });
});
