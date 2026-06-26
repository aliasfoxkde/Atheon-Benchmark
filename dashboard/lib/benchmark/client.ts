/**
 * Benchmark Client
 * Client-side functions for calling the benchmark API
 */

export interface BenchmarkConfig {
  name: string;
  scenario: 'vanilla' | 'mcp' | 'atheon';
  testCases?: number;
}

export interface BenchmarkResult {
  id: string;
  name: string;
  scenario: string;
  status: string;
  created_at: string;
  completed_at?: string;
  progress: number;
  total_tests: number;
  completed_tests: number;
  results: Array<{
    id: string;
    name: string;
    configuration: string;
    duration_ms: number;
    tokens_used: number;
    passed: boolean;
    output: string;
    timestamp: string;
  }>;
  summary?: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    avg_duration_ms: number;
    total_tokens: number;
  };
  errors: string[];
  metrics: BenchmarkMetrics;
}

export interface BenchmarkMetrics {
  ns_per_op: number;
  bytes_per_sec: number;
  files_per_sec: number;
  ops_per_sec: number;
  allocated_bytes_per_op: number;
  allocations_per_op: number;
  peak_rss_bytes: number;
  cpu_percent: number;
  findings_count: number;
  files_scanned: number;
  bytes_scanned: number;
  successRate: number;
}

export class BenchmarkClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async startBenchmark(config: BenchmarkConfig): Promise<{
    success: boolean;
    benchmark_id: string;
    message: string;
    benchmark: BenchmarkResult;
  }> {
    const response = await fetch(`${this.baseUrl}/benchmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.name,
        scenario: config.scenario,
        config: {
          test_cases: config.testCases || 10,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getBenchmark(benchmarkId: string): Promise<{
    success: boolean;
    benchmark: BenchmarkResult;
  }> {
    const response = await fetch(`${this.baseUrl}/benchmark?id=${benchmarkId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAllBenchmarks(): Promise<{
    success: boolean;
    benchmarks: BenchmarkResult[];
  }> {
    const response = await fetch(`${this.baseUrl}/benchmark`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async streamProgress(
    benchmarkId: string,
    onProgress: (data: any) => void,
    onComplete?: () => void
  ): Promise<void> {
    const eventSource = new EventSource(
      `/api/benchmark/stream?benchmark_id=${benchmarkId}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data);

        if (data.type === 'completed') {
          eventSource.close();
          if (onComplete) onComplete();
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };
  }

  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    // Start the benchmark
    const { success, benchmark_id, benchmark } = await this.startBenchmark(config);

    if (!success) {
      throw new Error('Failed to start benchmark');
    }

    // Poll for completion
    let result = benchmark;
    while (result.status === 'running' || result.status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await this.getBenchmark(benchmark_id);
      result = response.benchmark;
    }

    return result;
  }
}

export const benchmarkClient = new BenchmarkClient();