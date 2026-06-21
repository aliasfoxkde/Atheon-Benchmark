/**
 * GitHub Results Fetcher
 * Fetches benchmark results from GitHub repository
 */

export interface BenchmarkResult {
  id: string;
  name: string;
  duration_ms: number;
  tokens_used: number;
  passed: boolean;
  output: string;
  timestamp: string;
}

export interface SystemInfo {
  hostname: string;
  cpu: string;
  ram: string;
  os: string;
  arch: string;
  go_version: string;
  timestamp: string;
}

export interface BenchmarkSummary {
  total_tests: number;
  passed: number;
  failed: number;
  avg_duration_ms: number;
  total_tokens: number;
}

export interface BenchmarkReport {
  system_id: string;
  system_info: SystemInfo;
  benchmarks: BenchmarkResult[];
  summary: BenchmarkSummary;
  submitted_at: string;
}

export interface GitHubResultsConfig {
  owner: string;
  repo: string;
  token?: string;
  branch?: string;
}

/**
 * GitHub Results Fetcher Class
 */
export class GitHubResultsFetcher {
  private config: GitHubResultsConfig;
  private baseUrl: string;

  constructor(config: GitHubResultsConfig) {
    this.config = config;
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * Fetch all benchmark results from GitHub
   */
  async fetchAllResults(): Promise<BenchmarkReport[]> {
    try {
      const resultsPath = 'results';
      const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${resultsPath}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        // Check if this is a "not found" error which should return empty array
        if (response.status === 404) {
          return [];
        }
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Recursively fetch all result files
      const results: BenchmarkReport[] = [];

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.type === 'dir') {
            const yearResults = await this.fetchResultsFromPath(item.path);
            results.push(...yearResults);
          } else if (item.type === 'file' && item.name.endsWith('.json')) {
            const report = await this.fetchResultFile(item.path);
            if (report) {
              results.push(report);
            }
          }
        }
      }

      // Sort by submission date (newest first)
      results.sort((a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      return results;
    } catch (error) {
      console.error('Failed to fetch results from GitHub:', error);
      throw error;
    }
  }

  /**
   * Fetch results from a specific path
   */
  private async fetchResultsFromPath(path: string): Promise<BenchmarkReport[]> {
    try {
      const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const results: BenchmarkReport[] = [];

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.type === 'dir') {
            const yearResults = await this.fetchResultsFromPath(item.path);
            results.push(...yearResults);
          } else if (item.type === 'file' && item.name.endsWith('.json')) {
            const report = await this.fetchResultFile(item.path);
            if (report) {
              results.push(report);
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error(`Failed to fetch results from path ${path}:`, error);
      return [];
    }
  }

  /**
   * Fetch a single result file from GitHub
   */
  private async fetchResultFile(path: string): Promise<BenchmarkReport | null> {
    try {
      const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.content) {
        const content = atob(data.content);
        return JSON.parse(content) as BenchmarkReport;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch result file ${path}:`, error);
      return null;
    }
  }

  /**
   * Get request headers for GitHub API
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (this.config.token) {
      headers['Authorization'] = `token ${this.config.token}`;
    }

    return headers;
  }
}

/**
 * Create GitHub results fetcher
 */
export function createGitHubResultsFetcher(config: GitHubResultsConfig): GitHubResultsFetcher {
  return new GitHubResultsFetcher(config);
}

/**
 * Default GitHub configuration
 */
export const DEFAULT_GITHUB_CONFIG: GitHubResultsConfig = {
  owner: 'aliasfoxkde',
  repo: 'Atheon-Benchmark-Results',
  branch: 'main',
};

/**
 * Build GitHub URL for a result file
 */
export function buildResultGitHubUrl(systemId: string, date?: string): string {
  const config = DEFAULT_GITHUB_CONFIG;
  const datePath = date || new Date().toISOString().split('T')[0].replace(/-/g, '/');
  return `https://github.com/${config.owner}/${config.repo}/blob/${config.branch}/results/${datePath}/${systemId}.json`;
}

/**
 * Build GitHub raw URL for a result file
 */
export function buildResultRawUrl(systemId: string, date?: string): string {
  const config = DEFAULT_GITHUB_CONFIG;
  const datePath = date || new Date().toISOString().split('T')[0].replace(/-/g, '/');
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/results/${datePath}/${systemId}.json`;
}

/**
 * Results filter function
 */
export interface ResultsFilter {
  hostname?: string;
  os?: string;
  cpu?: string;
  arch?: string;
  dateFrom?: string;
  dateTo?: string;
  minTests?: number;
}

export function filterResults(results: BenchmarkReport[], filter: ResultsFilter): BenchmarkReport[] {
  // Handle null/undefined inputs gracefully
  if (!results || !Array.isArray(results)) {
    return [];
  }

  return results.filter(result => {
    if (filter.hostname && !result.system_info.hostname.includes(filter.hostname)) {
      return false;
    }

    if (filter.os && !result.system_info.os.includes(filter.os)) {
      return false;
    }

    if (filter.cpu && !result.system_info.cpu.includes(filter.cpu)) {
      return false;
    }

    if (filter.arch && !result.system_info.arch.includes(filter.arch)) {
      return false;
    }

    if (filter.dateFrom && new Date(result.submitted_at) < new Date(filter.dateFrom)) {
      return false;
    }

    if (filter.dateTo && new Date(result.submitted_at) > new Date(filter.dateTo)) {
      return false;
    }

    if (filter.minTests && result.summary.total_tests < filter.minTests) {
      return false;
    }

    return true;
  });
}

/**
 * Compare multiple systems
 */
export interface SystemComparison {
  system_id: string;
  system_info: SystemInfo;
  avg_duration_ms: number;
  total_tests: number;
  success_rate: number;
  total_tokens: number;
  submitted_at: string;
}

export function compareSystems(results: BenchmarkReport[]): SystemComparison[] {
  return results.map(result => ({
    system_id: result.system_id,
    system_info: result.system_info,
    avg_duration_ms: result.summary.avg_duration_ms,
    total_tests: result.summary.total_tests,
    success_rate: result.summary.total_tests > 0
      ? (result.summary.passed / result.summary.total_tests) * 100
      : 0,
    total_tokens: result.summary.total_tokens,
    submitted_at: result.submitted_at,
  }));
}

/**
 * Get statistics from results
 */
export interface ResultsStatistics {
  total_systems: number;
  total_benchmarks: number;
  avg_duration_ms: number;
  success_rate: number;
  systems_by_os: Record<string, number>;
  systems_by_arch: Record<string, number>;
  date_range: { oldest: string; newest: string };
}

export function getResultsStatistics(results: BenchmarkReport[]): ResultsStatistics {
  if (results.length === 0) {
    return {
      total_systems: 0,
      total_benchmarks: 0,
      avg_duration_ms: 0,
      success_rate: 0,
      systems_by_os: {},
      systems_by_arch: {},
      date_range: { oldest: '', newest: '' },
    };
  }

  const systems_by_os: Record<string, number> = {};
  const systems_by_arch: Record<string, number> = {};

  let total_duration = 0;
  let total_passed = 0;
  let total_tests = 0;

  let oldest_date = results[0].submitted_at;
  let newest_date = results[0].submitted_at;

  results.forEach(result => {
    // OS statistics
    const os = result.system_info.os;
    systems_by_os[os] = (systems_by_os[os] || 0) + 1;

    // Architecture statistics
    const arch = result.system_info.arch;
    systems_by_arch[arch] = (systems_by_arch[arch] || 0) + 1;

    // Duration statistics
    total_duration += result.summary.avg_duration_ms;

    // Success statistics
    total_passed += result.summary.passed;
    total_tests += result.summary.total_tests;

    // Date range
    if (new Date(result.submitted_at) < new Date(oldest_date)) {
      oldest_date = result.submitted_at;
    }
    if (new Date(result.submitted_at) > new Date(newest_date)) {
      newest_date = result.submitted_at;
    }
  });

  return {
    total_systems: results.length,
    total_benchmarks: total_tests,
    avg_duration_ms: total_duration / results.length,
    success_rate: total_tests > 0 ? (total_passed / total_tests) * 100 : 0,
    systems_by_os,
    systems_by_arch,
    date_range: { oldest: oldest_date, newest: newest_date },
  };
}
