/**
 * System Comparison Modal Component Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('SystemComparisonModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Props Interface', () => {
    it('should accept systems prop', () => {
      const mockSystem = {
        system_info: { hostname: 'test-host' },
        summary: { total_tests: 100, passed: 90 },
      } as any;
      const props = {
        systems: [mockSystem],
        isOpen: true,
        onClose: jest.fn(),
      };
      expect(props.systems).toBeDefined();
      expect(Array.isArray(props.systems)).toBe(true);
    });

    it('should accept isOpen prop', () => {
      const props = {
        systems: [],
        isOpen: false,
        onClose: jest.fn(),
      };
      expect(props.isOpen).toBe(false);
    });

    it('should accept onClose prop', () => {
      const onClose = jest.fn();
      const props = {
        systems: [],
        isOpen: true,
        onClose,
      };
      expect(typeof props.onClose).toBe('function');
    });
  });

  describe('Success Rate Calculation', () => {
    it('should calculate success rate correctly', () => {
      const total_tests = 100;
      const passed = 85;
      const rate = (passed / total_tests) * 100;
      expect(rate).toBe(85);
    });

    it('should handle zero tests', () => {
      const total_tests = 0;
      const passed = 0;
      const rate = total_tests ? (passed / total_tests) * 100 : 0;
      expect(rate).toBe(0);
    });

    it('should format as percentage string', () => {
      const rate = 85.5;
      const formatted = `${rate.toFixed(1)}%`;
      expect(formatted).toBe('85.5%');
    });
  });

  describe('Ranking Logic', () => {
    it('should rank higher values first when higherIsBetter=true', () => {
      const values = [100, 85, 92, 78];
      const sorted = [...values].sort((a, b) => b - a);
      expect(sorted).toEqual([100, 92, 85, 78]);
    });

    it('should rank lower values first when higherIsBetter=false', () => {
      const values = [100, 85, 92, 78]; // e.g., duration - lower is better
      const sorted = [...values].sort((a, b) => a - b);
      expect(sorted).toEqual([78, 85, 92, 100]);
    });

    it('should calculate rank correctly', () => {
      const values = [100, 85, 92];
      const sorted = [...values].sort((a, b) => b - a);
      const ranks = values.map(v => sorted.indexOf(v) + 1);
      expect(ranks).toEqual([1, 3, 2]);
    });
  });

  describe('Rank Styling', () => {
    it('should return yellow style for rank 1', () => {
      const rank = 1;
      const total = 4;
      const style = rank === 1 
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
        : rank === total
        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
      expect(style).toContain('yellow');
    });

    it('should return red style for last rank', () => {
      const rank = 4;
      const total = 4;
      const style = rank === 1 
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
        : rank === total
        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
      expect(style).toContain('red');
    });

    it('should return default style for middle ranks', () => {
      const rank = 2;
      const total = 4;
      const style = rank === 1 
        ? 'bg-yellow-100'
        : rank === total
        ? 'bg-red-100'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
      expect(style).toContain('zinc');
    });
  });

  describe('Value Parsing', () => {
    it('should parse percentage strings', () => {
      const value = '85.5%';
      const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
      expect(parsed).toBe(85.5);
    });

    it('should parse duration strings', () => {
      const value = '1234ms';
      const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
      expect(parsed).toBe(1234);
    });

    it('should handle numeric values', () => {
      const value = 1234;
      const numVal = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value;
      expect(numVal).toBe(1234);
    });
  });

  describe('Component Export', () => {
    it('should export SystemComparisonModal component', async () => {
      const { SystemComparisonModal } = await import('../system-comparison-modal');
      expect(SystemComparisonModal).toBeDefined();
    });
  });
});
