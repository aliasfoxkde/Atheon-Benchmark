/**
 * GitHub API Integration Tests
 * Tests for GitHub results fetching and processing
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  GitHubResultsFetcher,
  createGitHubResultsFetcher,
  DEFAULT_GITHUB_CONFIG,
  filterResults,
  compareSystems,
  getResultsStatistics,
  type BenchmarkReport,
  type ResultsFilter
} from '../github/results';

describe('GitHubResultsFetcher', () => {
  let fetcher: GitHubResultsFetcher;

  beforeEach(() => {
    fetcher = new GitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Construction', () => {
    it('should create fetcher with default config', () => {
      expect(fetcher).toBeInstanceOf(GitHubResultsFetcher);
    });

    it('should create fetcher with custom config', () => {
      const customConfig = {
        owner: 'test-owner',
        repo: 'test-repo',
        token: 'test-token'
      };
      const customFetcher = new GitHubResultsFetcher(customConfig);
      expect(customFetcher).toBeInstanceOf(GitHubResultsFetcher);
    });
  });

  describe('fetchAllResults', () => {
    it('should return empty array on GitHub API error', async () => {
      // Mock fetch to simulate error
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const results = await fetcher.fetchAllResults();
      expect(results).toEqual([]);
    });

    it('should handle empty repository', async () => {
      // Mock fetch to return empty array
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      );

      const results = await fetcher.fetchAllResults();
      expect(results).toEqual([]);
    });
  });
});

describe('filterResults', () => {
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
      benchmarks: [],
      summary: {
        total_tests: 100,
        passed: 95,
        failed: 5,
        avg_duration_ms: 2345,
        total_tokens: 10000
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
        timestamp: '2026-06-19T12:00:00Z'
      },
      benchmarks: [],
      summary: {
        total_tests: 80,
        passed: 75,
        failed: 5,
        avg_duration_ms: 3456,
        total_tokens: 8000
      },
      submitted_at: '2026-06-18T12:00:00Z'
    }
  ];

  it('should return all results when no filter is provided', () => {
    const filtered = filterResults(mockResults, {});
    expect(filtered).toHaveLength(2);
  });

  it('should filter by OS', () => {
    const filtered = filterResults(mockResults, { os: 'linux' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].system_id).toBe('system-1');
  });

  it('should filter by hostname', () => {
    const filtered = filterResults(mockResults, { hostname: 'test-machine-2' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].system_id).toBe('system-2');
  });

  it('should filter by CPU', () => {
    const filtered = filterResults(mockResults, { cpu: 'Intel' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].system_info.cpu).toContain('Intel');
  });

  it('should filter by date range', () => {
    const filtered = filterResults(mockResults, {
      dateFrom: '2026-06-19T00:00:00Z'
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].system_id).toBe('system-1');
  });

  it('should filter by minimum tests', () => {
    const filtered = filterResults(mockResults, { minTests: 90 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].summary.total_tests).toBeGreaterThanOrEqual(90);
  });

  it('should handle multiple filter criteria', () => {
    const filtered = filterResults(mockResults, {
      os: 'linux',
      minTests: 50
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].system_info.os).toContain('linux');
  });

  it('should return empty array when no results match', () => {
    const filtered = filterResults(mockResults, { os: 'macos' });
    expect(filtered).toHaveLength(0);
  });
});

describe('compareSystems', () => {
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

  it('should return comparison data', () => {
    const comparisons = compareSystems(mockResults);
    expect(comparisons).toHaveLength(1);
    expect(comparisons[0].system_id).toBe('system-1');
  });

  it('should calculate success rate correctly', () => {
    const comparisons = compareSystems(mockResults);
    expect(comparisons[0].success_rate).toBe(95);
  });

  it('should include all required fields', () => {
    const comparisons = compareSystems(mockResults);
    const comparison = comparisons[0];

    expect(comparison).toHaveProperty('system_id');
    expect(comparison).toHaveProperty('system_info');
    expect(comparison).toHaveProperty('avg_duration_ms');
    expect(comparison).toHaveProperty('total_tests');
    expect(comparison).toHaveProperty('success_rate');
    expect(comparison).toHaveProperty('total_tokens');
    expect(comparison).toHaveProperty('submitted_at');
  });
});

describe('getResultsStatistics', () => {
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
        total_tests: 80,
        passed: 75,
        failed: 5,
        avg_duration_ms: 3000,
        total_tokens: 8000
      },
      submitted_at: '2026-06-18T12:00:00Z'
    }
  ];

  it('should return empty statistics for empty results', () => {
    const stats = getResultsStatistics([]);
    expect(stats.total_systems).toBe(0);
    expect(stats.total_benchmarks).toBe(0);
    expect(stats.avg_duration_ms).toBe(0);
    expect(stats.success_rate).toBe(0);
  });

  it('should calculate total systems correctly', () => {
    const stats = getResultsStatistics(mockResults);
    expect(stats.total_systems).toBe(2);
  });

  it('should calculate total benchmarks correctly', () => {
    const stats = getResultsStatistics(mockResults);
    expect(stats.total_benchmarks).toBe(180); // 100 + 80
  });

  it('should calculate average duration correctly', () => {
    const stats = getResultsStatistics(mockResults);
    expect(stats.avg_duration_ms).toBe(2500); // (2000 + 3000) / 2
  });

  it('should calculate success rate correctly', () => {
    const stats = getResultsStatistics(mockResults);
    const expectedRate = ((95 + 75) / (100 + 80)) * 100;
    expect(stats.success_rate).toBeCloseTo(expectedRate);
  });

  it('should group systems by OS', () => {
    const stats = getResultsStatistics(mockResults);
    expect(stats.systems_by_os).toHaveProperty('linux', 1);
    expect(stats.systems_by_os).toHaveProperty('windows', 1);
  });

  it('should calculate date range correctly', () => {
    const stats = getResultsStatistics(mockResults);
    expect(stats.date_range.oldest).toBe('2026-06-18T12:00:00Z');
    expect(stats.date_range.newest).toBe('2026-06-19T12:00:00Z');
  });
});

describe('createGitHubResultsFetcher', () => {
  it('should create fetcher instance', () => {
    const fetcher = createGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
    expect(fetcher).toBeInstanceOf(GitHubResultsFetcher);
  });
});