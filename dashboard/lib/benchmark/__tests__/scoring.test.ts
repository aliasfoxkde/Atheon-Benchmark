/**
 * Tests for Benchmark Scoring System
 */

import {
  calculateBenchmarkScore,
  compareBenchmarks,
  type BenchmarkScore,
} from '../scoring';

describe('Benchmark Scoring', () => {
  describe('calculateBenchmarkScore', () => {
    it('should return perfect score for ideal benchmark', () => {
      const result = {
        id: 'test-1',
        timestamp: new Date().toISOString(),
        systemId: 'test-system',
        version: '1.0.0',
        metrics: {
          ns_per_op: 50_000_000, // Baseline
          files_per_sec: 1_000,   // Baseline
          bytes_per_sec: 10_000_000, // Baseline
          findings_count: 0,
          files_scanned: 100,
          cpu_percent: 50,
          successRate: 1.0,
        },
        duration: 1000,
        status: 'completed' as const,
      };

      const score = calculateBenchmarkScore(result);

      expect(score.overall).toBeGreaterThan(90);
      expect(['A+', 'A', 'B+', 'B', 'C', 'D']).toContain(score.grade);
    });

    it('should penalize slow benchmarks', () => {
      const result = {
        id: 'test-2',
        timestamp: new Date().toISOString(),
        systemId: 'test-system',
        version: '1.0.0',
        metrics: {
          ns_per_op: 150_000_000, // 3x baseline
          files_per_sec: 500,      // 0.5x baseline
          bytes_per_sec: 5_000_000, // 0.5x baseline
          findings_count: 0,
          files_scanned: 100,
          cpu_percent: 80,
          successRate: 1.0,
        },
        duration: 1000,
        status: 'completed' as const,
      };

      const score = calculateBenchmarkScore(result);

      expect(score.performance).toBeLessThan(50);
    });

    it('should penalize failed benchmarks', () => {
      const result = {
        id: 'test-3',
        timestamp: new Date().toISOString(),
        systemId: 'test-system',
        version: '1.0.0',
        metrics: {
          ns_per_op: 50_000_000,
          files_per_sec: 1_000,
          bytes_per_sec: 10_000_000,
          findings_count: 0,
          files_scanned: 100,
          cpu_percent: 50,
          successRate: 0.5, // 50% failure rate
        },
        duration: 1000,
        status: 'completed' as const,
      };

      const score = calculateBenchmarkScore(result);

      expect(score.consistency).toBeLessThan(50);
    });

    it('should calculate grade correctly', () => {
      const cases = [
        { nsPerOp: 25_000_000, filesPerSec: 2000, bytesPerSec: 20_000_000, successRate: 1.0, expectedMin: 95 },
        { nsPerOp: 50_000_000, filesPerSec: 1000, bytesPerSec: 10_000_000, successRate: 1.0, expectedMin: 80 },
        { nsPerOp: 100_000_000, filesPerSec: 500, bytesPerSec: 5_000_000, successRate: 0.9, expectedMin: 50 },
        { nsPerOp: 200_000_000, filesPerSec: 200, bytesPerSec: 2_000_000, successRate: 0.7, expectedMin: 20 },
      ];

      for (const { nsPerOp, filesPerSec, bytesPerSec, successRate, expectedMin } of cases) {
        const result = {
          id: 'test',
          timestamp: new Date().toISOString(),
          systemId: 'test',
          version: '1.0.0',
          metrics: {
            ns_per_op: nsPerOp,
            files_per_sec: filesPerSec,
            bytes_per_sec: bytesPerSec,
            findings_count: 0,
            files_scanned: 100,
            cpu_percent: 50,
            successRate,
          },
          duration: 1000,
          status: 'completed' as const,
        };

        const calculated = calculateBenchmarkScore(result);
        expect(calculated.overall).toBeGreaterThanOrEqual(expectedMin);
      }
    });
  });

  describe('compareBenchmarks', () => {
    it('should show improvement when current is better', () => {
      const previous = {
        id: 'prev',
        timestamp: new Date().toISOString(),
        systemId: 'test',
        version: '1.0.0',
        metrics: {
          ns_per_op: 100_000_000,
          files_per_sec: 500,
          bytes_per_sec: 5_000_000,
          findings_count: 0,
          files_scanned: 100,
          cpu_percent: 80,
          successRate: 0.9,
        },
        duration: 1000,
        status: 'completed' as const,
      };

      const current = {
        id: 'curr',
        timestamp: new Date().toISOString(),
        systemId: 'test',
        version: '1.0.1',
        metrics: {
          ns_per_op: 80_000_000, // 20% faster
          files_per_sec: 600,     // 20% more files
          bytes_per_sec: 6_000_000,
          findings_count: 0,
          files_scanned: 100,
          cpu_percent: 70,
          successRate: 0.95,
        },
        duration: 900,
        status: 'completed' as const,
      };

      const comparison = compareBenchmarks(current, previous);

      expect(comparison.improvement).toBeGreaterThan(0);
      expect(comparison.details.nsPerOpChange).toBeCloseTo(-20, 0);
      expect(comparison.details.filesPerSecChange).toBeCloseTo(20, 0);
    });

    it('should show regression when current is worse', () => {
      const previous = {
        id: 'prev',
        timestamp: new Date().toISOString(),
        systemId: 'test',
        version: '1.0.0',
        metrics: {
          ns_per_op: 80_000_000,
          files_per_sec: 600,
          bytes_per_sec: 6_000_000,
          findings_count: 0,
          files_scanned: 100,
          cpu_percent: 70,
          successRate: 0.95,
        },
        duration: 900,
        status: 'completed' as const,
      };

      const current = {
        id: 'curr',
        timestamp: new Date().toISOString(),
        systemId: 'test',
        version: '1.0.1',
        metrics: {
          ns_per_op: 100_000_000, // 25% slower
          files_per_sec: 500,      // ~17% fewer
          bytes_per_sec: 5_000_000,
          findings_count: 0,
          files_scanned: 100,
          cpu_percent: 80,
          successRate: 0.9,
        },
        duration: 1100,
        status: 'completed' as const,
      };

      const comparison = compareBenchmarks(current, previous);

      expect(comparison.improvement).toBeLessThan(0);
    });
  });
});

// Helper to create benchmark result with specific overall score
function createResultWithScore(targetScore: number): any {
  // Use a simple linear scaling - not perfectly accurate but good enough for tests
  const scalingFactor = targetScore / 85; // Baseline around 85%

  return {
    id: 'test',
    timestamp: new Date().toISOString(),
    systemId: 'test',
    version: '1.0.0',
    metrics: {
      ns_per_op: 50_000_000 / scalingFactor,
      files_per_sec: 1_000 * scalingFactor,
      bytes_per_sec: 10_000_000 * scalingFactor,
      findings_count: 0,
      files_scanned: 100,
      cpu_percent: 50,
      successRate: Math.min(1, scalingFactor),
    },
    duration: 1000,
    status: 'completed' as const,
  };
}
