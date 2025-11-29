import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel, createLogger } from './logger';
import { DatabaseError, ErrorCategory } from '../errors';

describe('Logger', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleInfoSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log error messages', () => {
      const logger = new Logger();
      logger.error('Test error');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      const logger = new Logger();
      logger.warn('Test warning');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const logger = new Logger();
      logger.info('Test info');
      
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log debug messages', () => {
      const logger = new Logger();
      logger.debug('Test debug');
      
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('Context Logging', () => {
    it('should include context in log entries', () => {
      const logger = new Logger({ userId: '123' });
      logger.info('Test message', { operation: 'test' });
      
      expect(consoleInfoSpy).toHaveBeenCalled();
      const logOutput = consoleInfoSpy.mock.calls[0][0];
      expect(logOutput).toContain('userId');
      expect(logOutput).toContain('operation');
    });

    it('should merge default context with call context', () => {
      const logger = new Logger({ userId: '123' });
      logger.info('Test', { operation: 'test' });
      
      const logOutput = consoleInfoSpy.mock.calls[0][0];
      expect(logOutput).toContain('userId');
      expect(logOutput).toContain('operation');
    });
  });

  describe('Sensitive Data Filtering', () => {
    it('should filter password from metadata', () => {
      const logger = new Logger();
      logger.info('User login', {
        metadata: {
          username: 'test',
          password: 'secret123',
        },
      });
      
      const logOutput = consoleInfoSpy.mock.calls[0][0];
      expect(logOutput).not.toContain('secret123');
      expect(logOutput).toContain('[FILTERED]');
    });

    it('should filter token from metadata', () => {
      const logger = new Logger();
      logger.info('API call', {
        metadata: {
          apiToken: 'abc123xyz',
          userId: '123',
        },
      });
      
      const logOutput = consoleInfoSpy.mock.calls[0][0];
      expect(logOutput).not.toContain('abc123xyz');
      expect(logOutput).toContain('userId');
    });
  });

  describe('Error Logging', () => {
    it('should log AppError with full context', () => {
      const logger = new Logger();
      const error = new DatabaseError('Test error', { query: 'SELECT *' });
      
      logger.logError(error, { operation: 'test' });
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('Test error');
      expect(logOutput).toContain('DATABASE_ERROR');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with additional context', () => {
      const parentLogger = new Logger({ userId: 'api-user' });
      const childLogger = parentLogger.child({ operation: 'createUser' });
      
      childLogger.info('Test message');
      
      const logOutput = consoleInfoSpy.mock.calls[0][0];
      expect(logOutput).toContain('userId');
      expect(logOutput).toContain('operation');
    });
  });

  describe('Logger Factory', () => {
    it('should create logger with context', () => {
      const logger = createLogger({ userId: '123' });
      logger.info('Test');
      
      const logOutput = consoleInfoSpy.mock.calls[0][0];
      expect(logOutput).toContain('userId');
    });
  });
});
