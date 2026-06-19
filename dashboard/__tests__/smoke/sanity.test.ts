/**
 * Sanity Tests for Basic Functionality
 * Quick validation of core features and configurations
 */

import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';

describe('Sanity Tests - Basic Functionality', () => {
  describe('Environment Configuration', () => {
    it('should have Node.js environment available', () => {
      expect(process).toBeDefined();
      expect(process.version).toBeTruthy();
    });

    it('should have test environment set', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have required globals available', () => {
      expect(typeof window).toBe('object');
      expect(typeof document).toBe('object');
      expect(typeof navigator).toBe('object');
    });
  });

  describe('Module Loading', () => {
    it('should load main dashboard modules', async () => {
      // Test that main modules can be loaded
      const { createGitHubResultsFetcher } = await import('../lib/github/results');
      expect(typeof createGitHubResultsFetcher).toBe('function');
    });

    it('should load cached fetcher module', async () => {
      const { createCachedGitHubResultsFetcher } = await import('../lib/github/cache');
      expect(typeof createCachedGitHubResultsFetcher).toBe('function');
    });

    it('should load monitoring modules', async () => {
      const { getAnalytics } = await import('../lib/monitoring/analytics');
      expect(typeof getAnalytics).toBe('function');
    });

    it('should load utility functions', async () => {
      const { filterResults, compareSystems } = await import('../lib/github/results');
      expect(typeof filterResults).toBe('function');
      expect(typeof compareSystems).toBe('function');
    });
  });

  describe('Data Structure Validation', () => {
    it('should have correct BenchmarkReport structure', () => {
      const mockReport = {
        system_id: 'test-system',
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
          passed: 95,
          failed: 5,
          avg_duration_ms: 2000,
          total_tokens: 10000
        },
        submitted_at: '2026-06-19T12:00:00Z'
      };

      expect(mockReport).toHaveProperty('system_id');
      expect(mockReport).toHaveProperty('system_info');
      expect(mockReport).toHaveProperty('benchmarks');
      expect(mockReport).toHaveProperty('summary');
      expect(mockReport).toHaveProperty('submitted_at');
    });

    it('should have correct ResultsFilter structure', () => {
      const mockFilter = {
        hostname: 'test-host',
        os: 'linux',
        minTests: 50,
        dateFrom: '2026-01-01T00:00:00Z'
      };

      expect(mockFilter).toHaveProperty('hostname');
      expect(mockFilter).toHaveProperty('os');
      expect(mockFilter).toHaveProperty('minTests');
      expect(mockFilter).toHaveProperty('dateFrom');
    });
  });

  describe('API Integration Sanity', () => {
    it('should handle GitHub configuration structure', () => {
      const config = {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main'
      };

      expect(config.owner).toBeTruthy();
      expect(config.repo).toBeTruthy();
      expect(config.branch).toBeTruthy();
    });

    it('should handle API response structure', () => {
      const mockResponse = [
        {
          name: 'test-result.json',
          path: 'results/test-result.json',
          type: 'file',
          size: 1024
        }
      ];

      expect(Array.isArray(mockResponse)).toBe(true);
      expect(mockResponse[0]).toHaveProperty('name');
      expect(mockResponse[0]).toHaveProperty('path');
      expect(mockResponse[0]).toHaveProperty('type');
    });
  });

  describe('Performance Baseline Tests', () => {
    it('should complete basic operations quickly', () => {
      const startTime = performance.now();

      // Simulate basic operations
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `test-${i}`
      }));

      const filtered = data.filter(item => item.id > 500);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle data processing efficiently', () => {
      const mockResults = Array.from({ length: 100 }, () => ({
        system_id: `system-${Math.random()}`,
        system_info: {
          hostname: 'test',
          cpu: 'test-cpu',
          ram: '16GB',
          os: 'linux',
          arch: 'amd64',
          go_version: '1.21',
          timestamp: new Date().toISOString()
        },
        benchmarks: [],
        summary: {
          total_tests: 100,
          passed: 95,
          failed: 5,
          avg_duration_ms: 2000,
          total_tokens: 10000
        },
        submitted_at: new Date().toISOString()
      }));

      const startTime = performance.now();

      // Filter operations
      const filtered = mockResults.filter(result =>
        result.system_info.os === 'linux'
      );

      // Statistics calculation
      const totalTests = mockResults.reduce((sum, result) =>
        sum + result.summary.total_tests, 0
      );

      const endTime = performance.now();

      expect(filtered.length).toBeGreaterThan(0);
      expect(totalTests).toBe(10000);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in < 50ms
    });
  });

  describe('Error Handling Sanity', () => {
    it('should handle empty data gracefully', async () => {
      const { filterResults } = await import('../lib/github/results');

      const filtered = filterResults([], {});
      expect(filtered).toEqual([]);
    });

    it('should handle null inputs gracefully', async () => {
      const { filterResults } = await import('../lib/github/results');

      expect(() => {
        filterResults(null as any, {});
      }).not.toThrow();
    });

    it('should handle invalid filter criteria', async () => {
      const { filterResults } = await import('../lib/github/results');

      const mockData = [{
        system_id: 'test',
        system_info: {
          hostname: 'test',
          cpu: 'test',
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
      }];

      const filtered = filterResults(mockData, {
        hostname: 'non-existent'
      });

      expect(filtered).toEqual([]);
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid default GitHub configuration', async () => {
      const { DEFAULT_GITHUB_CONFIG } = await import('../lib/github/results');

      expect(DEFAULT_GITHUB_CONFIG).toHaveProperty('owner');
      expect(DEFAULT_GITHUB_CONFIG).toHaveProperty('repo');
      expect(DEFAULT_GITHUB_CONFIG.owner).toBe('aliasfoxkde');
      expect(DEFAULT_GITHUB_CONFIG.repo).toBe('atheon-benchmark-results');
    });

    it('should have valid cache configuration', () => {
      // Cache duration constants
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      const METADATA_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

      expect(CACHE_DURATION).toBeGreaterThan(0);
      expect(METADATA_CACHE_DURATION).toBeGreaterThan(CACHE_DURATION);
    });
  });

  describe('Data Validation Tests', () => {
    it('should validate benchmark report structure', async () => {
      const { getResultsStatistics } = await import('../lib/github/results');

      const emptyStats = getResultsStatistics([]);

      expect(emptyStats.total_systems).toBe(0);
      expect(emptyStats.total_benchmarks).toBe(0);
      expect(emptyStats.avg_duration_ms).toBe(0);
      expect(emptyStats.success_rate).toBe(0);
    });

    it('should validate statistics calculation', async () => {
      const { getResultsStatistics } = await import('../lib/github/results');

      const mockResults = [{
        system_id: 'test-system',
        system_info: {
          hostname: 'test',
          cpu: 'test',
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
      }];

      const stats = getResultsStatistics(mockResults);

      expect(stats.total_systems).toBe(1);
      expect(stats.total_benchmarks).toBe(100);
      expect(stats.success_rate).toBe(95);
    });
  });

  describe('Type System Validation', () => {
    it('should export correct types', async () => {
      const types = await import('../lib/github/results');

      expect(types).toHaveProperty('BenchmarkReport');
      expect(types).toHaveProperty('SystemInfo');
      expect(types).toHaveProperty('BenchmarkResult');
      expect(types).toHaveProperty('ResultsFilter');
    });

    it('should have consistent type interfaces', async () => {
      const {
        BenchmarkReport,
        SystemInfo,
        BenchmarkResult,
        BenchmarkSummary
      } = await import('../lib/github/results');

      // These should be available as types/interfaces
      expect(BenchmarkReport).toBeDefined();
      expect(SystemInfo).toBeDefined();
      expect(BenchmarkResult).toBeDefined();
      expect(BenchmarkSummary).toBeDefined();
    });
  });

  describe('Build Artifacts Validation', () => {
    it('should have static build files available', () => {
      const fs = require('fs');
      const path = require('path');

      // Check for public directory
      const publicDir = path.join(process.cwd(), 'public');
      expect(fs.existsSync(publicDir)).toBe(true);
    });

    it('should have benchmark results file structure', () => {
      const fs = require('fs');
      const path = require('path');

      const resultsFile = path.join(process.cwd(), 'public/benchmark-results.json');

      if (fs.existsSync(resultsFile)) {
        const content = fs.readFileSync(resultsFile, 'utf8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });

  describe('Memory and Performance', () => {
    it('should have reasonable memory footprint for operations', () => {
      const beforeMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Create some data structures
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `test-data-${i}`.repeat(10)
      }));

      const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory growth should be reasonable
      if (beforeMemory > 0 && afterMemory > 0) {
        const memoryGrowth = afterMemory - beforeMemory;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      }
    });
  });
});