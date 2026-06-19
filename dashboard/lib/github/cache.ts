/**
 * GitHub Results Cache
 * Caches GitHub API results locally for faster loading
 */

import { GitHubResultsFetcher, type BenchmarkReport } from './results';

const CACHE_VERSION = 'v1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const METADATA_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for metadata

interface CacheEntry {
  data: BenchmarkReport[];
  timestamp: number;
  version: string;
  metadata: {
    total_count: number;
    last_updated: string;
    fetch_duration_ms: number;
  };
}

interface MetadataCache {
  systems: Map<string, {
    system_id: string;
    hostname: string;
    last_updated: string;
    summary: any;
  }>;
  timestamp: number;
}

export class CachedGitHubResultsFetcher extends GitHubResultsFetcher {
  private cache: Map<string, CacheEntry> = new Map();
  private metadataCache: MetadataCache | null = null;
  private storageKey = 'github-results-cache';
  private metadataKey = 'github-results-metadata';

  constructor(config: any) {
    super(config);
    this.loadCache();
    this.loadMetadataCache();
  }

  /**
   * Fetch all results with caching
   */
  async fetchAllResults(): Promise<BenchmarkReport[]> {
    const cacheKey = 'all-results';
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      console.log('[GitHub Cache] Using cached results');
      return cached.data;
    }

    console.log('[GitHub Cache] Cache miss, fetching from GitHub...');
    const startTime = Date.now();

    try {
      const data = await super.fetchAllResults();
      const fetchDuration = Date.now() - startTime;

      // Cache the results
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        metadata: {
          total_count: data.length,
          last_updated: new Date().toISOString(),
          fetch_duration_ms: fetchDuration,
        },
      };

      this.cache.set(cacheKey, cacheEntry);
      this.saveCache();

      // Update metadata cache
      this.updateMetadataCache(data);

      return data;
    } catch (error) {
      console.error('[GitHub Cache] Fetch error:', error);

      // Return stale cache if available
      if (cached && cached.data.length > 0) {
        console.log('[GitHub Cache] Returning stale cache due to fetch error');
        return cached.data;
      }

      throw error;
    }
  }

  /**
   * Fetch system metadata only (lightweight)
   */
  async fetchSystemMetadata(): Promise<Map<string, any>> {
    if (this.metadataCache && this.isMetadataCacheValid()) {
      return this.metadataCache.systems;
    }

    console.log('[GitHub Cache] Metadata cache miss, fetching...');
    const results = await this.fetchAllResults();

    const systems = new Map();
    results.forEach(report => {
      systems.set(report.system_id, {
        system_id: report.system_id,
        hostname: report.system_info.hostname,
        last_updated: report.submitted_at,
        summary: report.summary,
      });
    });

    return systems;
  }

  /**
   * Get cached statistics quickly
   */
  getCachedStatistics() {
    if (this.metadataCache && this.isMetadataCacheValid()) {
      return {
        total_systems: this.metadataCache.systems.size,
        last_updated: this.metadataCache.timestamp,
        is_cached: true,
      };
    }

    return {
      total_systems: 0,
      last_updated: null,
      is_cached: false,
    };
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < CACHE_DURATION;
  }

  /**
   * Check if metadata cache is valid
   */
  private isMetadataCacheValid(): boolean {
    if (!this.metadataCache) return false;
    const now = Date.now();
    return (now - this.metadataCache.timestamp) < METADATA_CACHE_DURATION;
  }

  /**
   * Update metadata cache
   */
  private updateMetadataCache(results: BenchmarkReport[]): void {
    const systems = new Map();
    results.forEach(report => {
      systems.set(report.system_id, {
        system_id: report.system_id,
        hostname: report.system_info.hostname,
        last_updated: report.submitted_at,
        summary: report.summary,
      });
    });

    this.metadataCache = {
      systems,
      timestamp: Date.now(),
    };

    this.saveMetadataCache();
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value.version === CACHE_VERSION) {
            this.cache.set(key, value as CacheEntry);
          }
        });
        console.log(`[GitHub Cache] Loaded ${this.cache.size} cache entries`);
      }
    } catch (error) {
      console.error('[GitHub Cache] Failed to load cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem(this.storageKey, JSON.stringify(cacheObj));
      console.log(`[GitHub Cache] Saved ${this.cache.size} cache entries`);
    } catch (error) {
      console.error('[GitHub Cache] Failed to save cache:', error);
    }
  }

  /**
   * Load metadata cache from localStorage
   */
  private loadMetadataCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem(this.metadataKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.version === CACHE_VERSION) {
          this.metadataCache = parsed;
          console.log('[GitHub Cache] Metadata cache loaded');
        }
      }
    } catch (error) {
      console.error('[GitHub Cache] Failed to load metadata cache:', error);
    }
  }

  /**
   * Save metadata cache to localStorage
   */
  private saveMetadataCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const systemsObj = Object.fromEntries(this.metadataCache!.systems);
      const cacheData = {
        version: CACHE_VERSION,
        systems: systemsObj,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.metadataKey, JSON.stringify(cacheData));
      console.log('[GitHub Cache] Metadata cache saved');
    } catch (error) {
      console.error('[GitHub Cache] Failed to save metadata cache:', error);
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.metadataCache = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.metadataKey);
    }

    console.log('[GitHub Cache] All caches cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheEntries: this.cache.size,
      metadataCached: this.metadataCache !== null,
      lastUpdate: this.metadataCache?.timestamp || null,
      version: CACHE_VERSION,
    };
  }
}

/**
 * Create cached GitHub fetcher with default config
 */
export function createCachedGitHubResultsFetcher(config: any) {
  return new CachedGitHubResultsFetcher(config);
}

// Re-export everything from the results module for convenience
export * from './results';