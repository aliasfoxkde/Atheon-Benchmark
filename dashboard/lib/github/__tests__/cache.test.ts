/**
 * Cached GitHub Results Fetcher Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  CachedGitHubResultsFetcher,
  createCachedGitHubResultsFetcher
} from '../cache';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('CachedGitHubResultsFetcher', () => {
  let fetcher: CachedGitHubResultsFetcher;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const mockReport = (id: string, date: string) => ({
    system_id: id,
    system_info: {
      hostname: `host-${id}`,
      cpu: 'Intel',
      ram: '16GB',
      os: 'Linux',
      arch: 'amd64',
      go_version: '1.21',
      timestamp: date,
    },
    benchmarks: [],
    summary: { total_tests: 5, passed: 5, failed: 0, avg_duration_ms: 100, total_tokens: 200 },
    submitted_at: date,
  });

  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetcher = new CachedGitHubResultsFetcher({ owner: 'o', repo: 'r' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(fetcher).toBeDefined();
    });

    it('should initialize empty caches', () => {
      const stats = fetcher.getCacheStats();
      expect(stats.cacheEntries).toBe(0);
      expect(stats.metadataCached).toBe(false);
    });
  });

  describe('fetchAllResults', () => {
    it('should fetch and cache results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      const results = await fetcher.fetchAllResults();
      expect(Array.isArray(results)).toBe(true);
      // 404 returns []
      expect(results).toEqual([]);
    });

    it('should return cached results on subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      const r1 = await fetcher.fetchAllResults();
      const r2 = await fetcher.fetchAllResults();
      expect(r1).toEqual(r2);
      // Fetch should only be called once (cached on second)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should save to localStorage after fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      await fetcher.fetchAllResults();
      const stored = localStorage.getItem('github-results-cache');
      expect(stored).toBeDefined();
    });

    it('should return stale cache on fetch error', async () => {
      // First call - successful cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { type: 'file', name: 'r.json', path: 'r.json' }
        ]),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: btoa(JSON.stringify(mockReport('sys-1', '2026-06-20T00:00:00Z'))),
        }),
      } as Response);

      const r1 = await fetcher.fetchAllResults();
      expect(r1.length).toBeGreaterThan(0);

      // Force expire cache by manipulating time
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 10 * 60 * 1000); // 10 minutes later

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const r2 = await fetcher.fetchAllResults();
      expect(r2.length).toBeGreaterThan(0); // Stale cache returned

      Date.now = originalNow;
    });

    it('should throw if no cache and fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetcher.fetchAllResults()).rejects.toThrow();
    });
  });

  describe('fetchSystemMetadata', () => {
    it('should return empty Map when cache is fresh but empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      const metadata = await fetcher.fetchSystemMetadata();
      expect(metadata).toBeInstanceOf(Map);
      expect(metadata.size).toBe(0);
    });

    it('should fetch and return metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { type: 'file', name: 'r1.json', path: 'r1.json' },
        ]),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: btoa(JSON.stringify(mockReport('sys-1', '2026-06-20T00:00:00Z'))),
        }),
      } as Response);

      const metadata = await fetcher.fetchSystemMetadata();
      expect(metadata.size).toBeGreaterThanOrEqual(1);
    });

    it('should use cached metadata when valid', async () => {
      // First call - populate metadata
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { type: 'file', name: 'r1.json', path: 'r1.json' },
        ]),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: btoa(JSON.stringify(mockReport('sys-1', '2026-06-20T00:00:00Z'))),
        }),
      } as Response);

      await fetcher.fetchSystemMetadata();

      // Second call - should use cache
      const metadata2 = await fetcher.fetchSystemMetadata();
      expect(metadata2.size).toBeGreaterThanOrEqual(1);
      // Only the initial fetch calls should have been made
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCachedStatistics', () => {
    it('should return empty stats when no cache', () => {
      const stats = fetcher.getCachedStatistics();
      expect(stats.total_systems).toBe(0);
      expect(stats.is_cached).toBe(false);
    });

    it('should return cached stats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      await fetcher.fetchAllResults();
      const stats = fetcher.getCachedStatistics();
      expect(stats.is_cached).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear caches and localStorage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      await fetcher.fetchAllResults();
      expect(localStorage.getItem('github-results-cache')).toBeDefined();

      fetcher.clearCache();
      expect(localStorage.getItem('github-results-cache')).toBeNull();

      const stats = fetcher.getCacheStats();
      expect(stats.cacheEntries).toBe(0);
      expect(stats.metadataCached).toBe(false);
    });
  });

  describe('getCacheStats', () => {
    it('should return version', () => {
      const stats = fetcher.getCacheStats();
      expect(stats.version).toBe('v1');
    });

    it('should track cache entries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      await fetcher.fetchAllResults();
      const stats = fetcher.getCacheStats();
      expect(stats.cacheEntries).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('createCachedGitHubResultsFetcher', () => {
  it('should create instance', () => {
    const f = createCachedGitHubResultsFetcher({ owner: 'o', repo: 'r' });
    expect(f).toBeInstanceOf(CachedGitHubResultsFetcher);
  });
});