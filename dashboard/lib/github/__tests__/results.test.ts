/**
 * GitHub Results Fetcher Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  GitHubResultsFetcher,
  createGitHubResultsFetcher,
  DEFAULT_GITHUB_CONFIG,
  filterResults,
  compareSystems,
  getResultsStatistics,
  BenchmarkReport,
  ResultsFilter
} from '../results';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('GitHubResultsFetcher', () => {
  let fetcher: GitHubResultsFetcher;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockFetch.mockClear();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetcher = new GitHubResultsFetcher({
      owner: 'test-owner',
      repo: 'test-repo',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(fetcher).toBeDefined();
    });

    it('should accept config', () => {
      const f = new GitHubResultsFetcher({
        owner: 'owner',
        repo: 'repo',
        token: 'secret',
        branch: 'main',
      });
      expect(f).toBeDefined();
    });
  });

  describe('fetchAllResults', () => {
    it('should return empty array on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      const results = await fetcher.fetchAllResults();
      expect(results).toEqual([]);
    });

    it('should throw on other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(fetcher.fetchAllResults()).rejects.toThrow();
    });

    it('should fetch and process results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { type: 'file', name: 'result1.json', path: 'results/result1.json' }
        ]),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: btoa(JSON.stringify({
            system_id: 'sys-1',
            system_info: { hostname: 'h1', cpu: 'c1', ram: 'r1', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-20T00:00:00Z' },
            benchmarks: [],
            summary: { total_tests: 5, passed: 5, failed: 0, avg_duration_ms: 100, total_tokens: 200 },
            submitted_at: '2026-06-20T00:00:00Z',
          })),
        }),
      } as Response);

      const results = await fetcher.fetchAllResults();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should recursively fetch results from subdirectories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { type: 'dir', name: '2026', path: 'results/2026' }
        ]),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { type: 'file', name: 'result.json', path: 'results/2026/result.json' }
        ]),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: btoa(JSON.stringify({
            system_id: 'sys-1',
            system_info: { hostname: 'h1', cpu: 'c1', ram: 'r1', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-20T00:00:00Z' },
            benchmarks: [],
            summary: { total_tests: 5, passed: 5, failed: 0, avg_duration_ms: 100, total_tokens: 200 },
            submitted_at: '2026-06-20T00:00:00Z',
          })),
        }),
      } as Response);

      const results = await fetcher.fetchAllResults();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should sort results by submitted_at descending', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { type: 'file', name: 'r1.json', path: 'r1.json' },
          { type: 'file', name: 'r2.json', path: 'r2.json' },
        ]),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: btoa(JSON.stringify({
            system_id: 'sys-2',
            system_info: { hostname: 'h1', cpu: 'c1', ram: 'r1', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-20T00:00:00Z' },
            benchmarks: [],
            summary: { total_tests: 5, passed: 5, failed: 0, avg_duration_ms: 100, total_tokens: 200 },
            submitted_at: '2026-06-20T00:00:00Z',
          })),
        }),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: btoa(JSON.stringify({
            system_id: 'sys-1',
            system_info: { hostname: 'h1', cpu: 'c1', ram: 'r1', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-19T00:00:00Z' },
            benchmarks: [],
            summary: { total_tests: 5, passed: 5, failed: 0, avg_duration_ms: 100, total_tokens: 200 },
            submitted_at: '2026-06-19T00:00:00Z',
          })),
        }),
      } as Response);

      const results = await fetcher.fetchAllResults();
      expect(results.length).toBe(2);
      if (results.length >= 2) {
        expect(new Date(results[0].submitted_at).getTime()).toBeGreaterThanOrEqual(
          new Date(results[1].submitted_at).getTime()
        );
      }
    });

    it('should handle non-array data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'not found' }),
      } as Response);

      const results = await fetcher.fetchAllResults();
      expect(results).toEqual([]);
    });
  });

  describe('Authentication', () => {
    it('should include Authorization header when token provided', async () => {
      const authFetcher = new GitHubResultsFetcher({
        owner: 'o',
        repo: 'r',
        token: 'my-token',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      await authFetcher.fetchAllResults();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'token my-token',
          }),
        })
      );
    });

    it('should not include Authorization header when no token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      await fetcher.fetchAllResults();

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });
  });
});

describe('createGitHubResultsFetcher', () => {
  it('should create instance', () => {
    const fetcher = createGitHubResultsFetcher({ owner: 'o', repo: 'r' });
    expect(fetcher).toBeInstanceOf(GitHubResultsFetcher);
  });
});

describe('DEFAULT_GITHUB_CONFIG', () => {
  it('should have owner and repo', () => {
    expect(DEFAULT_GITHUB_CONFIG.owner).toBeDefined();
    expect(DEFAULT_GITHUB_CONFIG.repo).toBeDefined();
  });
});

describe('filterResults', () => {
  const mockResults: BenchmarkReport[] = [
    {
      system_id: 'sys-1',
      system_info: { hostname: 'host-1', cpu: 'Intel', ram: '16GB', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-20T00:00:00Z' },
      benchmarks: [],
      summary: { total_tests: 10, passed: 8, failed: 2, avg_duration_ms: 100, total_tokens: 500 },
      submitted_at: '2026-06-20T00:00:00Z',
    },
    {
      system_id: 'sys-2',
      system_info: { hostname: 'host-2', cpu: 'AMD', ram: '32GB', os: 'Darwin', arch: 'arm64', go_version: '1.21', timestamp: '2026-06-19T00:00:00Z' },
      benchmarks: [],
      summary: { total_tests: 5, passed: 5, failed: 0, avg_duration_ms: 200, total_tokens: 300 },
      submitted_at: '2026-06-19T00:00:00Z',
    },
  ];

  it('should return empty array for null input', () => {
    expect(filterResults(null as any, {})).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    expect(filterResults(undefined as any, {})).toEqual([]);
  });

  it('should filter by hostname', () => {
    const filtered = filterResults(mockResults, { hostname: 'host-1' });
    expect(filtered.length).toBe(1);
  });

  it('should filter by os', () => {
    const filtered = filterResults(mockResults, { os: 'Linux' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].system_info.os).toBe('Linux');
  });

  it('should filter by cpu', () => {
    const filtered = filterResults(mockResults, { cpu: 'Intel' });
    expect(filtered.length).toBe(1);
  });

  it('should filter by arch', () => {
    const filtered = filterResults(mockResults, { arch: 'arm64' });
    expect(filtered.length).toBe(1);
  });

  it('should filter by dateFrom', () => {
    const filtered = filterResults(mockResults, { dateFrom: '2026-06-19T12:00:00Z' });
    expect(filtered.length).toBe(1);
  });

  it('should filter by dateTo', () => {
    const filtered = filterResults(mockResults, { dateTo: '2026-06-19T12:00:00Z' });
    expect(filtered.length).toBe(1);
  });

  it('should filter by minTests', () => {
    const filtered = filterResults(mockResults, { minTests: 6 });
    expect(filtered.length).toBe(1);
  });

  it('should return all when no filter', () => {
    const filtered = filterResults(mockResults, {});
    expect(filtered.length).toBe(2);
  });

  it('should combine multiple filters', () => {
    const filtered = filterResults(mockResults, { os: 'Linux', cpu: 'Intel' });
    expect(filtered.length).toBe(1);
  });
});

describe('compareSystems', () => {
  it('should compute comparison', () => {
    const results: BenchmarkReport[] = [
      {
        system_id: 'sys-1',
        system_info: { hostname: 'h', cpu: 'c', ram: 'r', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-20T00:00:00Z' },
        benchmarks: [],
        summary: { total_tests: 10, passed: 10, failed: 0, avg_duration_ms: 100, total_tokens: 500 },
        submitted_at: '2026-06-20T00:00:00Z',
      },
    ];

    const comparison = compareSystems(results);
    expect(comparison.length).toBe(1);
    expect(comparison[0].success_rate).toBe(100);
  });

  it('should handle zero tests', () => {
    const results: BenchmarkReport[] = [
      {
        system_id: 'sys-1',
        system_info: { hostname: 'h', cpu: 'c', ram: 'r', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-20T00:00:00Z' },
        benchmarks: [],
        summary: { total_tests: 0, passed: 0, failed: 0, avg_duration_ms: 0, total_tokens: 0 },
        submitted_at: '2026-06-20T00:00:00Z',
      },
    ];

    const comparison = compareSystems(results);
    expect(comparison[0].success_rate).toBe(0);
  });

  it('should return empty for empty array', () => {
    expect(compareSystems([])).toEqual([]);
  });
});

describe('getResultsStatistics', () => {
  it('should return defaults for empty results', () => {
    const stats = getResultsStatistics([]);
    expect(stats.total_systems).toBe(0);
    expect(stats.total_benchmarks).toBe(0);
    expect(stats.avg_duration_ms).toBe(0);
    expect(stats.success_rate).toBe(0);
    expect(stats.systems_by_os).toEqual({});
    expect(stats.systems_by_arch).toEqual({});
    expect(stats.date_range.oldest).toBe('');
    expect(stats.date_range.newest).toBe('');
  });

  it('should compute statistics', () => {
    const results: BenchmarkReport[] = [
      {
        system_id: 'sys-1',
        system_info: { hostname: 'h1', cpu: 'c1', ram: 'r1', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-19T00:00:00Z' },
        benchmarks: [],
        summary: { total_tests: 10, passed: 8, failed: 2, avg_duration_ms: 100, total_tokens: 500 },
        submitted_at: '2026-06-19T00:00:00Z',
      },
      {
        system_id: 'sys-2',
        system_info: { hostname: 'h2', cpu: 'c2', ram: 'r2', os: 'Darwin', arch: 'arm64', go_version: '1.21', timestamp: '2026-06-20T00:00:00Z' },
        benchmarks: [],
        summary: { total_tests: 5, passed: 5, failed: 0, avg_duration_ms: 200, total_tokens: 300 },
        submitted_at: '2026-06-20T00:00:00Z',
      },
    ];

    const stats = getResultsStatistics(results);
    expect(stats.total_systems).toBe(2);
    expect(stats.total_benchmarks).toBe(15);
    expect(stats.avg_duration_ms).toBe(150);
    expect(stats.systems_by_os['Linux']).toBe(1);
    expect(stats.systems_by_os['Darwin']).toBe(1);
    expect(stats.systems_by_arch['amd64']).toBe(1);
    expect(stats.systems_by_arch['arm64']).toBe(1);
    expect(stats.date_range.oldest).toBe('2026-06-19T00:00:00Z');
    expect(stats.date_range.newest).toBe('2026-06-20T00:00:00Z');
  });

  it('should compute success rate', () => {
    const results: BenchmarkReport[] = [
      {
        system_id: 'sys-1',
        system_info: { hostname: 'h', cpu: 'c', ram: 'r', os: 'Linux', arch: 'amd64', go_version: '1.21', timestamp: '2026-06-20T00:00:00Z' },
        benchmarks: [],
        summary: { total_tests: 10, passed: 7, failed: 3, avg_duration_ms: 100, total_tokens: 500 },
        submitted_at: '2026-06-20T00:00:00Z',
      },
    ];

    const stats = getResultsStatistics(results);
    expect(stats.success_rate).toBe(70);
  });
});