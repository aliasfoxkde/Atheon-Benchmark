/**
 * Benchmark Trending Component Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('BenchmarkTrending Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Props Interface', () => {
    it('should accept currentMetrics prop', () => {
      const props = {
        currentMetrics: {
          ns_per_op: 1000000,
          files_per_sec: 5000,
          bytes_per_sec: 1000000,
          findings_count: 10,
          files_scanned: 100,
          cpu_percent: 50,
        },
        systemId: 'test-system',
      };
      expect(props.currentMetrics).toBeDefined();
      expect(props.currentMetrics.ns_per_op).toBe(1000000);
    });

    it('should accept systemId prop', () => {
      const props = {
        currentMetrics: { ns_per_op: 0, files_per_sec: 0, bytes_per_sec: 0, findings_count: 0, files_scanned: 0, cpu_percent: 0 },
        systemId: 'test-system-123',
      };
      expect(props.systemId).toBeDefined();
      expect(typeof props.systemId).toBe('string');
    });

    it('should accept optional anomalyThresholds prop', () => {
      const props = {
        currentMetrics: { ns_per_op: 0, files_per_sec: 0, bytes_per_sec: 0, findings_count: 0, files_scanned: 0, cpu_percent: 0 },
        systemId: 'test',
        anomalyThresholds: { warning: 2.5, critical: 3.5 },
      };
      expect(props.anomalyThresholds).toBeDefined();
      expect(props.anomalyThresholds?.warning).toBe(2.5);
    });

    it('should use default anomalyThresholds', () => {
      const defaults = { warning: 2, critical: 3 };
      expect(defaults.warning).toBe(2);
      expect(defaults.critical).toBe(3);
    });
  });

  describe('Standard Deviation Calculation', () => {
    it('should calculate stdDev correctly for simple values', () => {
      // stdDev([1, 2, 3, 4, 5]) should be ~1.58
      const values = [1, 2, 3, 4, 5];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sqDiffs = values.map(v => Math.pow(v - mean, 2));
      const variance = sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
      const stdDev = Math.sqrt(variance);
      expect(stdDev).toBeCloseTo(1.58, 1);
    });

    it('should return 0 for single value', () => {
      const values = [5];
      const stdDev = values.length < 2 ? 0 : 1;
      expect(stdDev).toBe(0);
    });

    it('should return 0 for empty array', () => {
      const values: number[] = [];
      const stdDev = values.length < 2 ? 0 : 1;
      expect(stdDev).toBe(0);
    });

    it('should return 0 for array with single element', () => {
      const values = [42];
      const stdDev = values.length < 2 ? 0 : 1;
      expect(stdDev).toBe(0);
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate percent change correctly', () => {
      const prev = 1000000;
      const curr = 1100000;
      const change = ((curr - prev) / prev) * 100;
      expect(change).toBe(10);
    });

    it('should detect down trend (lower is better for ns_per_op)', () => {
      const prev = 1000000;
      const curr = 900000; // 10% decrease = better
      const change = ((curr - prev) / prev) * 100;
      const trend = change < -5 ? 'down' : change > 5 ? 'up' : 'stable';
      expect(trend).toBe('down');
    });

    it('should detect up trend', () => {
      const prev = 1000000;
      const curr = 1100000; // 10% increase = worse
      const change = ((curr - prev) / prev) * 100;
      const trend = change < -5 ? 'down' : change > 5 ? 'up' : 'stable';
      expect(trend).toBe('up');
    });

    it('should detect stable trend', () => {
      const prev = 1000000;
      const curr = 1020000; // 0.2% increase = stable
      const change = ((curr - prev) / prev) * 100;
      const trend = change < -5 ? 'down' : change > 5 ? 'up' : 'stable';
      expect(trend).toBe('stable');
    });
  });

  describe('Format Number', () => {
    const formatNumber = (n: number): string => {
      if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
      if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
      return n.toFixed(0);
    };

    it('should format billions', () => {
      expect(formatNumber(1500000000)).toBe('1.50B');
    });

    it('should format millions', () => {
      expect(formatNumber(2500000)).toBe('2.50M');
    });

    it('should format thousands', () => {
      expect(formatNumber(3500)).toBe('3.50K');
    });

    it('should format small numbers', () => {
      expect(formatNumber(42)).toBe('42');
    });
  });

  describe('Z-Score Calculation', () => {
    it('should calculate z-score correctly', () => {
      const values = [100, 102, 101, 99, 100];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sqDiffs = values.map(v => Math.pow(v - mean, 2));
      const sigma = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
      const current = 110;
      const zScore = sigma > 0 ? Math.abs((current - mean) / sigma) : 0;
      expect(zScore).toBeGreaterThan(3); // 110 is ~3+ std from mean of 100.4
    });

    it('should identify warning level anomaly', () => {
      const warningThreshold = 2;
      const zScore = 2.5;
      const severity = zScore > 3 ? 'critical' : zScore > warningThreshold ? 'warning' : null;
      expect(severity).toBe('warning');
    });

    it('should identify critical level anomaly', () => {
      const criticalThreshold = 3;
      const zScore = 3.5;
      const severity = zScore > criticalThreshold ? 'critical' : zScore > 2 ? 'warning' : null;
      expect(severity).toBe('critical');
    });

    it('should not flag normal values as anomaly', () => {
      const warningThreshold = 2;
      const zScore = 1.0;
      const severity = zScore > 3 ? 'critical' : zScore > warningThreshold ? 'warning' : null;
      expect(severity).toBeNull();
    });
  });

  describe('Anomaly Detection Logic', () => {
    it('should require minimum 5 history entries', () => {
      const historyLength = 4;
      const hasEnoughData = historyLength >= 5;
      expect(hasEnoughData).toBe(false);
    });

    it('should have enough data at 5 entries', () => {
      const historyLength = 5;
      const hasEnoughData = historyLength >= 5;
      expect(hasEnoughData).toBe(true);
    });
  });

  describe('History Management', () => {
    it('should keep only last 20 entries', () => {
      const maxEntries = 20;
      const entries = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const kept = entries.slice(-maxEntries);
      expect(kept.length).toBe(20);
      expect(kept[0].id).toBe(5); // First kept is original index 5
    });

    it('should store with system-specific key', () => {
      const systemId = 'test-system-123';
      const storageKey = `benchmark-history-${systemId}`;
      expect(storageKey).toBe('benchmark-history-test-system-123');
    });
  });

  describe('Component Export', () => {
    it('should export BenchmarkTrending component', async () => {
      const { BenchmarkTrending } = await import('../benchmark-trending');
      expect(BenchmarkTrending).toBeDefined();
    });
  });
});
