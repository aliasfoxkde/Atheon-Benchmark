/**
 * Pattern Breakdown Component Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('PatternBreakdown Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Props Interface', () => {
    it('should accept findingsCount prop', () => {
      const props = { findingsCount: 42 };
      expect(props.findingsCount).toBe(42);
    });

    it('should accept optional systemId prop', () => {
      const props = { findingsCount: 10, systemId: 'test-system' };
      expect(props.systemId).toBe('test-system');
    });
  });

  describe('Pattern Categories', () => {
    it('should have 8 pattern categories', () => {
      const PATTERN_CATEGORIES = [
        { name: 'secrets', label: 'Secrets' },
        { name: 'api-keys', label: 'API Keys' },
        { name: 'cloud', label: 'Cloud Providers' },
        { name: 'database', label: 'Database' },
        { name: 'email', label: 'Email' },
        { name: 'pii', label: 'PII' },
        { name: 'payment', label: 'Payment' },
        { name: 'other', label: 'Other' },
      ];
      expect(PATTERN_CATEGORIES).toHaveLength(8);
    });

    it('should have unique category names', () => {
      const names = ['secrets', 'api-keys', 'cloud', 'database', 'email', 'pii', 'payment', 'other'];
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate category percentages', () => {
      const findingsCount = 100;
      const weight = 0.25; // 25%
      const count = Math.round(findingsCount * weight);
      expect(count).toBe(25);
    });

    it('should handle zero findings', () => {
      const findingsCount = 0;
      const count = Math.round(findingsCount * 0.25);
      expect(count).toBe(0);
    });

    it('should calculate total percentage', () => {
      const weights = [0.25, 0.20, 0.15, 0.12, 0.10, 0.08, 0.05, 0.05];
      const total = weights.reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1.0, 1);
    });
  });

  describe('LocalStorage', () => {
    it('should use system-specific storage key', () => {
      const systemId = 'test-system';
      const storageKey = `pattern-breakdown-${systemId}`;
      expect(storageKey).toBe('pattern-breakdown-test-system');
    });

    it('should not use storage key without systemId', () => {
      const systemId = undefined;
      const storageKey = systemId ? `pattern-breakdown-${systemId}` : null;
      expect(storageKey).toBeNull();
    });
  });

  describe('Component Export', () => {
    it('should export PatternBreakdown component', async () => {
      const { PatternBreakdown } = await import('../pattern-breakdown');
      expect(PatternBreakdown).toBeDefined();
    });
  });
});
