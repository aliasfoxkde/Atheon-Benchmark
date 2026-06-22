/**
 * Build-time GitHub Results Fetcher Unit Tests
 * Tests for build-time.ts functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the dependencies before importing
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

jest.mock('../results', () => ({
  GitHubResultsFetcher: jest.fn().mockImplementation(() => ({
    fetchAllResults: jest.fn().mockResolvedValue([
      {
        id: 'bench-1',
        name: 'Test Benchmark',
        scenario: 'vanilla',
        status: 'completed',
        created_at: '2026-06-20T00:00:00Z',
        summary: { avg_duration_ms: 150 }
      }
    ])
  })),
  DEFAULT_GITHUB_CONFIG: {
    owner: 'test-owner',
    repo: 'test-repo',
    workflowId: 'benchmark.yml'
  }
}));

import { fetchBuildTimeResults, getStaticResults } from '../build-time';
import { GitHubResultsFetcher } from '../results';
import fs from 'fs';

describe('fetchBuildTimeResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
  });

  it('should fetch results from GitHubResultsFetcher', async () => {
    const results = await fetchBuildTimeResults();

    expect(GitHubResultsFetcher).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('bench-1');
  });

  it('should write results to public directory', async () => {
    await fetchBuildTimeResults();

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
    expect(writeCall[0]).toContain('benchmark-results.json');
  });

  it('should create public directory if it does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await fetchBuildTimeResults();

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true }
    );
  });

  it('should return empty array on error', async () => {
    // Mock GitHubResultsFetcher to throw
    (GitHubResultsFetcher as unknown as jest.Mock).mockImplementationOnce(() => ({
      fetchAllResults: jest.fn().mockRejectedValue(new Error('API error'))
    }));

    const results = await fetchBuildTimeResults();

    expect(results).toEqual([]);
  });
});

describe('getStaticResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global fetch
    global.fetch = jest.fn();
  });

  it('should fetch results from static JSON file', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'bench-1',
          name: 'Test Benchmark',
          scenario: 'vanilla',
          status: 'completed'
        }
      ]
    });

    const results = await getStaticResults();

    expect(global.fetch).toHaveBeenCalledWith('/benchmark-results.json');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('bench-1');
  });

  it('should return empty array when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const results = await getStaticResults();

    expect(results).toEqual([]);
  });

  it('should return empty array when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const results = await getStaticResults();

    expect(results).toEqual([]);
  });
});
