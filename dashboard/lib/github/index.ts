/**
 * GitHub Module - GitHub API integration utilities
 * @description Fetches and caches benchmark results from GitHub
 */
export { CachedGitHubResultsFetcher, createCachedGitHubResultsFetcher } from './cache';
export { GitHubResultsFetcher, createGitHubResultsFetcher, DEFAULT_GITHUB_CONFIG, buildResultGitHubUrl, buildResultRawUrl } from './results';
export type { BenchmarkResult, SystemInfo, BenchmarkSummary, BenchmarkReport, GitHubResultsConfig } from './results';
export { fetchBuildTimeResults, getStaticResults } from './build-time';
