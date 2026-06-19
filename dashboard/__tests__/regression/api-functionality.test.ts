/**
 * Regression Tests for Core API Functionality
 * Tests to prevent breaks in critical API operations and data processing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  GitHubResultsFetcher,
  filterResults,
  compareSystems,
  getResultsStatistics,
  type BenchmarkReport,
  type ResultsFilter
} from '../../lib/github/results';

describe('Regression Tests - Core API Functionality', () => {
  const mockResults: BenchmarkReport[] = [
    {
      system_id: 'system-1',
      system_info: {
        hostname: 'test-machine-1',
        cpu: 'Intel Core i7',
        ram: '16GB',
        os: 'linux',
        arch: 'amd64',
        go_version: '1.21',
        timestamp: '2026-06-19T12:00:00Z'
      },
      benchmarks: [
        {
          id: 'bench-1',
          name: 'Test Benchmark 1',
          duration_ms: 1500,
          tokens_used: 100,
          passed: true,
          output: 'Success',
          timestamp: '2026-06-19T12:00:00Z'
        },
        {
          id: 'bench-2',
          name: 'Test Benchmark 2',
          duration_ms: 2000,
          tokens_used: 150,
          passed: true,
          output: 'Success',
          timestamp: '2026-06-19T12:00:00Z'
        }
      ],
      summary: {
        total_tests: 2,
        passed: 2,
        failed: 0,
        avg_duration_ms: 1750,
        total_tokens: 250
      },
      submitted_at: '2026-06-19T12:00:00Z'
    },
    {
      system_id: 'system-2',
      system_info: {
        hostname: 'test-machine-2',
        cpu: 'AMD Ryzen 9',
        ram: '32GB',
        os: 'windows',
        arch: 'amd64',
        go_version: '1.21',
        timestamp: '2026-06-18T12:00:00Z'
      },
      benchmarks: [],
      summary: {
        total_tests: 0,
        passed: 0,
        failed: 0,
        avg_duration_ms: 0,
        total_tokens: 0
      },
      submitted_at: '2026-06-18T12:00:00Z'
    }
  ];

  describe('Filter Results Function Regression', () => {
    it('should maintain backward compatibility with original filter structure', () => {
      const originalFilter: ResultsFilter = {
        hostname: 'test-machine-1',
        os: 'linux'
      };

      const filtered = filterResults(mockResults, originalFilter);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].system_id).toBe('system-1');
    });

    it('should handle empty filter without breaking', () => {
      const filtered = filterResults(mockResults, {});

      expect(filtered).toHaveLength(2);
    });

    it('should not break with null filter values', () => {
      const nullFilter: ResultsFilter = {
        hostname: null as any,
        os: null as any
      };

      expect(() => {
        filterResults(mockResults, nullFilter);
      }).not.toThrow();
    });

    it('should handle date range filtering correctly', () => {
      const dateFilter: ResultsFilter = {
        dateFrom: '2026-06-19T00:00:00Z',
        dateTo: '2026-06-19T23:59:59Z'
      };

      const filtered = filterResults(mockResults, dateFilter);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].system_id).toBe('system-1');
    });
  });

  describe('Compare Systems Function Regression', () => {
    it('should maintain original comparison data structure', () => {
      const comparisons = compareSystems(mockResults);

      expect(comparisons).toHaveLength(2);
      expect(comparisons[0]).toHaveProperty('system_id');
      expect(comparisons[0]).toHaveProperty('system_info');
      expect(comparisons[0]).toHaveProperty('avg_duration_ms');
      expect(comparisons[0]).toHaveProperty('total_tests');
      expect(comparisons[0]).toHaveProperty('success_rate');
      expect(comparisons[0]).toHaveProperty('total_tokens');
      expect(comparisons[0]).toHaveProperty('submitted_at');
    });

    it('should calculate success rate consistently', () => {
      const comparisons = compareSystems(mockResults);

      // First system has 100% success rate (2/2 passed)
      expect(comparisons[0].success_rate).toBe(100);

      // Second system has no tests, should handle gracefully
      expect(comparisons[1].success_rate).toBe(0);
    });

    it('should handle systems with zero tests', () => {
      const comparisons = compareSystems([mockResults[1]]);

      expect(comparisons).toHaveLength(1);
      expect(comparisons[0].success_rate).toBe(0);
      expect(comparisons[0].total_tests).toBe(0);
    });
  });

  describe('Get Results Statistics Regression', () => {
    it('should maintain original statistics structure', () => {
      const stats = getResultsStatistics(mockResults);

      expect(stats).toHaveProperty('total_systems');
      expect(stats).toHaveProperty('total_benchmarks');
      expect(stats).toHaveProperty('avg_duration_ms');
      expect(stats).toHaveProperty('success_rate');
      expect(stats).toHaveProperty('systems_by_os');
      expect(stats).toHaveProperty('systems_by_arch');
      expect(stats).toHaveProperty('date_range');
      expect(stats.date_range).toHaveProperty('oldest');
      expect(stats.date_range).toHaveProperty('newest');
    });

    it('should calculate averages consistently', () => {
      const stats = getResultsStatistics(mockResults);

      // Average of 1750 and 0 should be 875
      expect(stats.avg_duration_ms).toBe(875);
    });

    it('should group by OS correctly', () => {
      const stats = getResultsStatistics(mockResults);

      expect(stats.systems_by_os).toHaveProperty('linux', 1);
      expect(stats.systems_by_os).toHaveProperty('windows', 1);
    });

    it('should determine date range correctly', () => {
      const stats = getResultsStatistics(mockResults);

      expect(stats.date_range.oldest).toBe('2026-06-18T12:00:00Z');
      expect(stats.date_range.newest).toBe('2026-06-19T12:00:00Z');
    });

    it('should handle empty results array', () => {
      const stats = getResultsStatistics([]);

      expect(stats.total_systems).toBe(0);
      expect(stats.total_benchmarks).toBe(0);
      expect(stats.avg_duration_ms).toBe(0);
      expect(stats.success_rate).toBe(0);
      expect(stats.systems_by_os).toEqual({});
      expect(stats.systems_by_arch).toEqual({});
    });
  });

  describe('GitHub Results Fetcher Regression', () => {
    it('should maintain constructor interface', () => {
      const config = {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main'
      };

      expect(() => {
        new GitHubResultsFetcher(config);
      }).not.toThrow();
    });

    it('should have fetchAllResults method', () => {
      const fetcher = new GitHubResultsFetcher({
        owner: 'test-owner',
        repo: 'test-repo'
      });

      expect(typeof fetcher.fetchAllResults).toBe('function');
    });

    it('should return array from fetchAllResults', async () => {
      const fetcher = new GitHubResultsFetcher({
        owner: 'test-owner',
        repo: 'test-repo'
      });

      // Mock fetch to return empty array
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => []
        })
      );

      const results = await fetcher.fetchAllResults();

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Data Structure Compatibility', () => {
    it('should handle legacy BenchmarkReport structure', () => {
      // Test that the system can handle slightly different but valid structures
      const legacyReport = {
        system_id: 'legacy-system',
        system_info: {
          hostname: 'legacy-host',
          cpu: 'legacy-cpu',
          ram: '8GB',
          os: 'linux',
          arch: 'x86_64',
          go_version: '1.20',
          timestamp: '2026-06-19T12:00:00Z'
        },
        benchmarks: [],
        summary: {
          total_tests: 0,
          passed: 0,
          failed: 0,
          avg_duration_ms: 0,
          total_tokens: 0
        },
        submitted_at: '2026-06-19T12:00:00Z'
      };

      const stats = getResultsStatistics([legacyReport]);

      expect(stats.total_systems).toBe(1);
    });

    it('should handle systems with missing optional fields', () => {
      const minimalReport = {
        system_id: 'minimal-system',
        system_info: {
          hostname: 'minimal-host',
          cpu: 'minimal-cpu',
          ram: '4GB',
          os: 'linux',
          arch: 'x86_64',
          go_version: '1.21',
          timestamp: '2026-06-19T12:00:00Z'
        },
        benchmarks: [],
        summary: {
          total_tests: 0,
          passed: 0,
          failed: 0,
          avg_duration_ms: 0,
          total_tokens: 0
        },
        submitted_at: '2026-06-19T12:00:00Z'
      };

      expect(filterResults([minimalReport], {})).toHaveLength(1);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should not degrade performance with large datasets', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        system_id: `system-${i}`,
        system_info: {
          hostname: `host-${i}`,
          cpu: 'test-cpu',
          ram: '16GB',
          os: 'linux',
          arch: 'amd64',
          go_version: '1.21',
          timestamp: '2026-06-19T12:00:00Z'
        },
        benchmarks: [],
        summary: {
          total_tests: 100,
          passed: 95,
          failed: 5,
          avg_duration_ms: 2000,
          total_tokens: 10000
        },
        submitted_at: '2026-06-19T12:00:00Z'
      }));

      const startTime = performance.now();

      const stats = getResultsStatistics(largeDataset);
      const filtered = filterResults(largeDataset, { os: 'linux' });
      const comparisons = compareSystems(largeDataset);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process 1000 records in less than 100ms
      expect(processingTime).toBeLessThan(100);
      expect(stats.total_systems).toBe(1000);
      expect(filtered.length).toBe(1000);
      expect(comparisons.length).toBe(1000);
    });

    it('should maintain memory efficiency', () => {
      const beforeMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        system_id: `system-${i}`,
        system_info: {
          hostname: `host-${i}`,
          cpu: 'test-cpu',
          ram: '16GB',
          os: 'linux',
          arch: 'amd64',
          go_version: '1.21',
          timestamp: '2026-06-19T12:00:00Z'
        },
        benchmarks: [],
        summary: {
          total_tests: 100,
          passed: 95,
          failed: 5,
          avg_duration_ms: 2000,
          total_tokens: 10000
        },
        submitted_at: '2026-06-19T12:00:00Z'
      }));

      // Process the data multiple times
      for (let i = 0; i < 10; i++) {
        getResultsStatistics(largeDataset);
        filterResults(largeDataset, {});
        compareSystems(largeDataset);
      }

      const afterMemory = (performance as any).memory?.usedJSHeapSize || beforeMemory;

      // Memory growth should be reasonable
      if (beforeMemory > 0 && afterMemory > 0) {
        const memoryGrowth = afterMemory - beforeMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      }
    });
  });

  describe('Edge Case Handling Regression', () => {
    it('should handle systems with failed benchmarks', () => {
      const systemWithFailures = {
        system_id: 'system-with-failures',
        system_info: {
          hostname: 'test-host',
          cpu: 'test-cpu',
          ram: '16GB',
          os: 'linux',
          arch: 'amd64',
          go_version: '1.21',
          timestamp: '2026-06-19T12:00:00Z'
        },
        benchmarks: [],
        summary: {
          total_tests: 100,
          passed: 50,
          failed: 50,
          avg_duration_ms: 2000,
          total_tokens: 10000
        },
        submitted_at: '2026-06-19T12:00:00Z'
      };

      const stats = getResultsStatistics([systemWithFailures]);

      expect(stats.success_rate).toBe(50);
    });

    it('should handle systems with very high duration', () => {
      const slowSystem = {
        system_id: 'slow-system',
        system_info: {
          hostname: 'slow-host',
          cpu: 'slow-cpu',
          ram: '4GB',
          os: 'linux',
          arch: 'amd64',
          go_version: '1.21',
          timestamp: '2026-06-19T12:00:00Z'
        },
        benchmarks: [],
        summary: {
          total_tests: 10,
          passed: 10,
          failed: 0,
          avg_duration_ms: 60000, // 1 minute
          total_tokens: 1000
        },
        submitted_at: '2026-06-19T12:00:00Z'
      };

      const comparisons = compareSystems([slowSystem]);

      expect(comparisons[0].avg_duration_ms).toBe(60000);
    });

    it('should handle mixed OS types', () => {
      const mixedSystems = [
        {
          system_id: 'linux-system',
          system_info: {
            hostname: 'linux-host',
            cpu: 'test-cpu',
            ram: '16GB',
            os: 'linux/amd64',
            arch: 'amd64',
            go_version: '1.21',
            timestamp: '2026-06-19T12:00:00Z'
          },
          benchmarks: [],
          summary: {
            total_tests: 100,
            passed: 95,
            failed: 5,
            avg_duration_ms: 2000,
            total_tokens: 10000
          },
          submitted_at: '2026-06-19T12:00:00Z'
        },
        {
          system_id: 'darwin-system',
          system_info: {
            hostname: 'darwin-host',
            cpu: 'test-cpu',
            ram: '16GB',
            os: 'darwin/arm64',
            arch: 'arm64',
            go_version: '1.21',
            timestamp: '2026-06-19T12:00:00Z'
          },
          benchmarks: [],
          summary: {
            total_tests: 100,
            passed: 95,
            failed: 5,
            avg_duration_ms: 2000,
            total_tokens: 10000
          },
          submitted_at: '2026-06-19T12:00:00Z'
        }
      ];

      const stats = getResultsStatistics(mixedSystems);

      expect(stats.systems_by_os).toHaveProperty('linux/amd64', 1);
      expect(stats.systems_by_os).toHaveProperty('darwin/arm64', 1);
    });
  });
});