/**
 * GitHub Module - GitHub API integration utilities
 * @description Fetches and caches benchmark results from GitHub
 * 
 * Note: Only cache.ts exports are currently used in the codebase.
 * Other modules (results.ts, build-time.ts) are available for future use.
 */
export { CachedGitHubResultsFetcher, createCachedGitHubResultsFetcher } from './cache';
export type { BenchmarkReport } from './cache';
