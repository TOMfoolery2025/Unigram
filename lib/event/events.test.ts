/** @format */

import { describe, it, expect } from 'vitest';
import { registerForEvent } from './events';

describe('Event Registration', () => {
  describe('Private Event Registration', () => {
    it('should have registerForEvent function', () => {
      expect(registerForEvent).toBeDefined();
      expect(typeof registerForEvent).toBe('function');
    });
  });
});
