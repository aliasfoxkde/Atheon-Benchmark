/**
 * D1 Database Operations
 * Persistent storage implementation for benchmark results using Cloudflare D1
 */

interface DatabaseConfig {
  dbName: string;
  accountId?: string;
  region?: string;
}

interface BenchmarkRecord {
  id: string;
  name: string;
  scenario: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress: number;
  total_tests: number;
  completed_tests: number;
  summary?: any;
}

interface ResultRecord {
  id: string;
  benchmark_id: string;
  name: string;
  configuration: string;
  duration_ms: number;
  tokens_used: number;
  passed: boolean;
  output: string;
  timestamp: string;
  error?: string;
}

/**
 * D1 Database Manager Class
 *
 * Production: Bind to D1 via Cloudflare Workers environment:
 *   constructor(config: DatabaseConfig, db: D1Database) { this.db = db; this.ready = true; }
 *
 * Local dev: CreateDatabase() returns instance with ready=false, all methods return empty/null
 */
export class D1Database {
  private db: any; // D1 database binding
  private config: DatabaseConfig;
  private ready: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
    // D1 binding must be passed from Cloudflare Workers env
    // e.g., new D1Database(config, env.DB)
    this.ready = false;
  }

  /**
   * Bind D1 database from Cloudflare Workers environment
   */
  bindD1(db: any): void {
    this.db = db;
    this.ready = true;
  }

  /**
   * Save benchmark to database
   */
  async saveBenchmark(benchmark: BenchmarkRecord): Promise<boolean> {
    if (!this.ready) {
      console.warn('Database not ready, using in-memory storage');
      return false;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO benchmarks (
          id, name, scenario, status, created_at, started_at,
          completed_at, progress, total_tests, completed_tests, summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt.bind(
        benchmark.id,
        benchmark.name,
        benchmark.scenario,
        benchmark.status,
        benchmark.created_at,
        benchmark.started_at || null,
        benchmark.completed_at || null,
        benchmark.progress,
        benchmark.total_tests,
        benchmark.completed_tests,
        JSON.stringify(benchmark.summary || {})
      ).run();

      return true;
    } catch (error) {
      console.error('Failed to save benchmark:', error);
      return false;
    }
  }

  /**
   * Save result to database
   */
  async saveResult(result: ResultRecord): Promise<boolean> {
    if (!this.ready) {
      console.warn('Database not ready, using in-memory storage');
      return false;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO results (
          id, benchmark_id, name, configuration, duration_ms,
          tokens_used, passed, output, timestamp, error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt.bind(
        result.id,
        result.benchmark_id,
        result.name,
        result.configuration,
        result.duration_ms,
        result.tokens_used,
        result.passed,
        result.output,
        result.timestamp,
        result.error || null
      ).run();

      return true;
    } catch (error) {
      console.error('Failed to save result:', error);
      return false;
    }
  }

  /**
   * Get benchmark by ID
   */
  async getBenchmark(id: string): Promise<BenchmarkRecord | null> {
    if (!this.ready) return null;

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM benchmarks WHERE id = ?
      `);

      const result = await stmt.bind(id).first();
      if (result && result.summary) {
        result.summary = JSON.parse(result.summary);
      }
      return result;
    } catch (error) {
      console.error('Failed to get benchmark:', error);
      return null;
    }
  }

  /**
   * Get all benchmarks
   */
  async getAllBenchmarks(limit: number = 50, offset: number = 0): Promise<BenchmarkRecord[]> {
    if (!this.ready) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM benchmarks
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);

      const { results } = await stmt.bind(limit, offset).all();

      return results.map((bench: any) => ({
        ...bench,
        summary: bench.summary ? JSON.parse(bench.summary) : null
      }));
    } catch (error) {
      console.error('Failed to get benchmarks:', error);
      return [];
    }
  }

  /**
   * Get results for benchmark
   */
  async getResults(benchmarkId: string): Promise<ResultRecord[]> {
    if (!this.ready) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM results
        WHERE benchmark_id = ?
        ORDER BY timestamp ASC
      `);

      const { results } = await stmt.bind(benchmarkId).all();
      return results;
    } catch (error) {
      console.error('Failed to get results:', error);
      return [];
    }
  }

  /**
   * Update benchmark status
   */
  async updateBenchmarkStatus(
    id: string,
    status: string,
    progress?: number,
    completedTests?: number,
    summary?: any
  ): Promise<boolean> {
    if (!this.ready) return false;

    try {
      const updates: string[] = ['status = ?'];
      const values: any[] = [status];

      if (progress !== undefined) {
        updates.push('progress = ?');
        values.push(progress);
      }
      if (completedTests !== undefined) {
        updates.push('completed_tests = ?');
        values.push(completedTests);
      }
      if (status === 'completed') {
        updates.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
      if (summary) {
        updates.push('summary = ?');
        values.push(JSON.stringify(summary));
      }

      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE benchmarks
        SET ${updates.join(', ')}
        WHERE id = ?
      `);

      await stmt.bind(...values).run();
      return true;
    } catch (error) {
      console.error('Failed to update benchmark:', error);
      return false;
    }
  }

  /**
   * Delete benchmark
   */
  async deleteBenchmark(id: string): Promise<boolean> {
    if (!this.ready) return false;

    try {
      // Delete results first (foreign key)
      await this.db.prepare('DELETE FROM results WHERE benchmark_id = ?')
        .bind(id)
        .run();

      // Delete benchmark
      await this.db.prepare('DELETE FROM benchmarks WHERE id = ?')
        .bind(id)
        .run();

      return true;
    } catch (error) {
      console.error('Failed to delete benchmark:', error);
      return false;
    }
  }

  /**
   * Get benchmark statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byScenario: Record<string, number>;
    byStatus: Record<string, number>;
    avgDuration: number;
  }> {
    if (!this.ready) {
      return { total: 0, byScenario: {}, byStatus: {}, avgDuration: 0 };
    }

    try {
      const { results } = await this.db.prepare(`
        SELECT scenario, status, AVG(
          CAST(JSON_EXTRACT(summary, '$.avg_duration_ms') AS INTEGER)
        ) as avg_duration
        FROM benchmarks
        WHERE status = 'completed'
        GROUP BY scenario, status
      `).all();

      const stats = {
        total: results.length,
        byScenario: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        avgDuration: 0
      };

      let totalDuration = 0;
      let count = 0;

      for (const row of results) {
        stats.byScenario[row.scenario] = (stats.byScenario[row.scenario] || 0) + 1;
        stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + 1;
        if (row.avg_duration) {
          totalDuration += row.avg_duration;
          count++;
        }
      }

      stats.avgDuration = count > 0 ? Math.round(totalDuration / count) : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return { total: 0, byScenario: {}, byStatus: {}, avgDuration: 0 };
    }
  }
}

/**
 * Create database instance
 */
export function createDatabase(config?: Partial<DatabaseConfig>): D1Database {
  return new D1Database({
    dbName: config?.dbName || 'atheon-benchmark',
    accountId: config?.accountId,
    region: config?.region || 'us-east-1',
  });
}

/**
 * Default database configuration
 */
export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  dbName: 'atheon-benchmark',
  region: 'us-east-1',
};