/**
 * Cache Layer Unit Tests
 * Tests for GitHub API caching and performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  CachedGitHubResultsFetcher,
  createCachedGitHubResultsFetcher,
  DEFAULT_GITHUB_CONFIG
} from '../github/cache';
import type { BenchmarkReport } from '../github/results';

// Mock localStorage
const localStorageMock = {
  store: new Map<string, string>(),
  getItem: jest.fn((key: string) => localStorageMock.store.get(key) || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.store.set(key, value);
  }),
  removeItem: jest.fn((key: string) => {
    localStorageMock.store.delete(key);
  }),
  clear: jest.fn(() => {
    localStorageMock.store.clear();
  })
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock fetch
global.fetch = jest.fn();

describe('CachedGitHubResultsFetcher', () => {
  let fetcher: CachedGitHubResultsFetcher;
  const mockResults: BenchmarkReport[] = [
    {
      system_id: 'test-system-1',
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

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.store.clear();
    fetcher = new CachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Construction and Initialization', () => {
    it('should create cached fetcher instance', () => {
      expect(fetcher).toBeInstanceOf(CachedGitHubResultsFetcher);
    });

    it('should load existing cache from localStorage on initialization', () => {
      const mockCache = {
        'all-results': {
          data: mockResults,
          timestamp: Date.now(),
          version: 'v1',
          metadata: {
            total_count: 1,
            last_updated: new Date().toISOString(),
            fetch_duration_ms: 1000
          }
        }
      };

      localStorageMock.store.set('github-results-cache', JSON.stringify(mockCache));

      const newFetcher = new CachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
      expect(newFetcher).toBeInstanceOf(CachedGitHubResultsFetcher);
    });

    it('should handle corrupted cache data gracefully', () => {
      localStorageMock.store.set('github-results-cache', 'invalid-json');

      expect(() => {
        new CachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
      }).not.toThrow();
    });
  });

  describe('Cache Hit Scenarios', () => {
    it('should return cached data when cache is valid', async () => {
      const validCache = {
        'all-results': {
          data: mockResults,
          timestamp: Date.now() - 1000, // 1 second ago
          version: 'v1',
          metadata: {
            total_count: 1,
            last_updated: new Date().toISOString(),
            fetch_duration_ms: 1000
          }
        }
      };

      localStorageMock.store.set('github-results-cache', JSON.stringify(validCache));

      const cachedFetcher = new CachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
      const results = await cachedFetcher.fetchAllResults();

      expect(results).toEqual(mockResults);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should check cache validity based on timestamp', async () => {
      const oldCache = {
        'all-results': {
          data: mockResults,
          timestamp: Date.now() - (6 * 60 * 1000), // 6 minutes ago (expired)
          version: 'v1',
          metadata: {
            total_count: 1,
            last_updated: new Date().toISOString(),
            fetch_duration_ms: 1000
          }
        }
      };

      localStorageMock.store.set('github-results-cache', JSON.stringify(oldCache));

      const cachedFetcher = new CachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);

      // Mock fetch to return new data
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => [mockResults[0]]
      } as Response);

      await cachedFetcher.fetchAllResults();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should invalidate cache on version mismatch', async () => {
      const oldVersionCache = {
        'all-results': {
          data: mockResults,
          timestamp: Date.now() - 1000,
          version: 'v0', // Different version
          metadata: {
            total_count: 1,
            last_updated: new Date().toISOString(),
            fetch_duration_ms: 1000
          }
        }
      };

      localStorageMock.store.set('github-results-cache', JSON.stringify(oldVersionCache));

      const cachedFetcher = new CachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);

      // Mock fetch to return new data
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => [mockResults[0]]
      } as Response);

      await cachedFetcher.fetchAllResults();

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Cache Miss Scenarios', () => {
    it('should fetch from GitHub when cache is empty', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => [mockResults[0]]
      } as Response);

      const results = await fetcher.fetchAllResults();

      expect(global.fetch).toHaveBeenCalled();
      expect(results).toEqual(mockResults);
    });

    it('should store fetched data in cache', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResults
      } as Response);

      await fetcher.fetchAllResults();

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const setItemCalls = localStorageMock.setItem.mock.calls;
      expect(setItemCalls.length).toBeGreaterThan(0);
    });

    it('should update metadata cache after fetching', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResults
      } as Response);

      await fetcher.fetchAllResults();

      const stats = fetcher.getCachedStatistics();
      expect(stats.total_systems).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Fallback', () => {
    it('should return stale cache on fetch error', async () => {
      const staleCache = {
        'all-results': {
          data: mockResults,
          timestamp: Date.now() - (4 * 60 * 1000), // 4 minutes ago (stale but exists)
          version: 'v1',
          metadata: {
            total_count: 1,
            last_updated: new Date().toISOString(),
            fetch_duration_ms: 1000
          }
        }
      };

      localStorageMock.store.set('github-results-cache', JSON.stringify(staleCache));

      // Mock fetch to fail
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

      const results = await fetcher.fetchAllResults();

      expect(results).toEqual(mockResults);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw error when no cache available and fetch fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

      await expect(fetcher.fetchAllResults()).rejects.toThrow('Network error');
    });

    it('should handle partial fetch failures gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      } as Response);

      const results = await fetcher.fetchAllResults();

      expect(results).toEqual([]);
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      const stats = fetcher.getCacheStats();

      expect(stats).toHaveProperty('cacheEntries');
      expect(stats).toHaveProperty('metadataCached');
      expect(stats).toHaveProperty('lastUpdate');
      expect(stats).toHaveProperty('version');
    });

    it('should indicate cached status correctly', async () => {
      const validCache = {
        'all-results': {
          data: mockResults,
          timestamp: Date.now() - 1000,
          version: 'v1',
          metadata: {
            total_count: 1,
            last_updated: new Date().toISOString(),
            fetch_duration_ms: 1000
          }
        }
      };

      localStorageMock.store.set('github-results-cache', JSON.stringify(validCache));

      const cachedFetcher = new CachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
      const stats = cachedFetcher.getCachedStatistics();

      expect(stats.is_cached).toBe(true);
      expect(stats.total_systems).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', () => {
      fetcher.clearCache();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('github-results-cache');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('github-results-metadata');
    });

    it('should clear specific cache entries', () => {
      fetcher.clearCache();

      expect(localStorageMock.store.size).toBe(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should cache metadata separately with longer duration', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResults
      } as Response);

      await fetcher.fetchAllResults();

      // Should have separate metadata cache
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should update metadata after successful fetch', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResults
      } as Response);

      await fetcher.fetchAllResults();

      const stats = fetcher.getCachedStatistics();
      expect(stats.last_updated).not.toBeNull();
    });
  });

  describe('Helper Functions', () => {
    it('should create cached fetcher with default config', () => {
      const cachedFetcher = createCachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);

      expect(cachedFetcher).toBeInstanceOf(CachedGitHubResultsFetcher);
    });

    it('should handle custom config', () => {
      const customConfig = {
        owner: 'custom-owner',
        repo: 'custom-repo',
        token: 'custom-token'
      };

      const cachedFetcher = createCachedGitHubResultsFetcher(customConfig);

      expect(cachedFetcher).toBeInstanceOf(CachedGitHubResultsFetcher);
    });
  });

  describe('Cache Version Management', () => {
    it('should handle cache version upgrades', async () => {
      const oldVersionCache = {
        'all-results': {
          data: mockResults,
          timestamp: Date.now() - 1000,
          version: 'v0', // Old version
          metadata: {
            total_count: 1,
            last_updated: new Date().toISOString(),
            fetch_duration_ms: 1000
          }
        }
      };

      localStorageMock.store.set('github-results-cache', JSON.stringify(oldVersionCache));

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResults
      } as Response);

      const cachedFetcher = new CachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
      await cachedFetcher.fetchAllResults();

      // Should fetch new data due to version mismatch
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});