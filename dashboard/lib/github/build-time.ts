/**
 * Build-time GitHub Results Fetcher
 * Fetches benchmark results during build time for static export
 */

import { GitHubResultsFetcher, type BenchmarkReport } from './results';
import { DEFAULT_GITHUB_CONFIG } from './results';
import fs from 'fs';
import path from 'path';

/**
 * Fetch results at build time and save to static JSON
 */
export async function fetchBuildTimeResults(): Promise<BenchmarkReport[]> {
  console.log('[Build-time] Fetching GitHub results...');

  try {
    const fetcher = new GitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
    const results = await fetcher.fetchAllResults();

    console.log(`[Build-time] Fetched ${results.length} benchmark reports`);

    // Save to public directory for static serving
    const publicDir = path.join(process.cwd(), 'public');
    const resultsFile = path.join(publicDir, 'benchmark-results.json');

    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write results to file
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`[Build-time] Saved results to ${resultsFile}`);

    return results;
  } catch (error) {
    console.error('[Build-time] Failed to fetch results:', error);

    // Return empty array as fallback
    return [];
  }
}

/**
 * Get build-time results from static JSON file
 */
export async function getStaticResults(): Promise<BenchmarkReport[]> {
  try {
    const response = await fetch('/benchmark-results.json');
    if (!response.ok) {
      throw new Error('Failed to load static results');
    }

    const results = await response.json();
    console.log('[Static] Loaded benchmark results from static file');
    return results;
  } catch (error) {
    console.error('[Static] Failed to load results:', error);
    return [];
  }
}