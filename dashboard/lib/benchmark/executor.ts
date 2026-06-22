/**
 * Benchmark Execution Engine
 * Main orchestrator for running benchmarks with different configurations
 */

import { BenchmarkScenario, getBenchmarkScenario } from './configurations';
import { TestCase, TestCaseGenerator, DeterministicTestCaseGenerator, createTestCaseGenerator } from './test-cases';
import {
  VanillaClaudeClient,
  MCPClaudeClient,
  AtheonClaudeClient,
  BenchmarkResult,
  createVanillaClaudeClient,
  createMCPClaudeClient,
  createAtheonClaudeClient,
  DEFAULT_ATHEON_CONFIG,
  DEFAULT_QUALITY_GATES
} from '../claude';
import { PerformanceCollector, createPerformanceCollector, PerformanceMetrics, StatisticalSummary } from './measurements';

export interface BenchmarkExecution {
  id: string;
  scenario: BenchmarkScenario;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  progress: number;
  total_tests: number;
  completed_tests: number;
  failed_tests: number;
  results: BenchmarkResult[];
  errors: string[];
  statistics: ExecutionStatistics;
}

export interface ExecutionStatistics {
  duration_ms: number;
  total_tokens: number;
  avg_duration_ms: number;
  avg_tokens_per_test: number;
  success_rate: number;
  configuration_stats: Record<string, ConfigurationStats>;
}

export interface ConfigurationStats {
  total_tests: number;
  completed_tests: number;
  failed_tests: number;
  avg_duration_ms: number;
  avg_tokens: number;
  total_tokens: number;
  success_rate: number;
}

export interface ProgressCallback {
  (progress: {
    type: 'started' | 'progress' | 'test_completed' | 'test_failed' | 'completed' | 'error';
    benchmark_id: string;
    data: any;
  }): void | Promise<void>;
}

export class BenchmarkExecutor {
  private scenario: BenchmarkScenario;
  private generator: TestCaseGenerator;
  private performanceCollector: PerformanceCollector;
  private clients: Map<string, VanillaClaudeClient | MCPClaudeClient | AtheonClaudeClient>;
  private execution: BenchmarkExecution;

  constructor(scenario: BenchmarkScenario | string, seed?: number) {
    // Get scenario by ID or use directly
    this.scenario = typeof scenario === 'string'
      ? getBenchmarkScenario(scenario) || scenario as any
      : scenario;

    this.generator = createTestCaseGenerator(seed);
    this.performanceCollector = createPerformanceCollector();
    this.clients = new Map();

    this.execution = this.initializeExecution();
  }

  /**
   * Initialize execution state
   */
  private initializeExecution(): BenchmarkExecution {
    // Calculate total tests
    const totalTests = this.scenario.test_configs.reduce(
      (sum, config) => sum + (config.count || 10),
      0
    );

    return {
      id: `benchmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scenario: this.scenario,
      status: 'pending',
      progress: 0,
      total_tests: totalTests,
      completed_tests: 0,
      failed_tests: 0,
      results: [],
      errors: [],
      statistics: {
        duration_ms: 0,
        total_tokens: 0,
        avg_duration_ms: 0,
        avg_tokens_per_test: 0,
        success_rate: 0,
        configuration_stats: {},
      },
    };
  }

  /**
   * Execute the benchmark
   */
  async execute(onProgress?: ProgressCallback): Promise<BenchmarkExecution> {
    this.execution.status = 'running';
    this.execution.started_at = new Date();

    try {
      await this.notifyProgress(onProgress, 'started', {
        benchmark_id: this.execution.id,
        scenario: this.scenario,
      });

      // Generate test cases
      const testCases = this.generateTestCases();

      // Initialize clients for each configuration
      await this.initializeClients();

      // Execute warmup runs
      await this.executeWarmupRuns(onProgress);

      // Execute tests for each configuration
      for (const configId of this.getConfigurationIds()) {
        await this.executeConfigurationTests(configId, testCases, onProgress);
      }

      // Calculate final statistics
      this.calculateStatistics();

      this.execution.status = 'completed';
      this.execution.completed_at = new Date();
      this.execution.progress = 100;

      await this.notifyProgress(onProgress, 'completed', {
        benchmark_id: this.execution.id,
        execution: this.execution,
      });

    } catch (error) {
      this.execution.status = 'failed';
      this.execution.completed_at = new Date();
      this.execution.errors.push(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );

      await this.notifyProgress(onProgress, 'error', {
        benchmark_id: this.execution.id,
        error: this.execution.errors,
      });
    }

    return this.execution;
  }

  /**
   * Generate test cases from scenario configuration
   */
  private generateTestCases(): TestCase[] {
    const allTestCases: TestCase[] = [];

    for (const config of this.scenario.test_configs) {
      const testCases = this.generator.generate(config);
      allTestCases.push(...testCases);
    }

    return allTestCases;
  }

  /**
   * Initialize Claude clients for different configurations
   */
  private async initializeClients(): Promise<void> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    // Vanilla client
    this.clients.set('vanilla', createVanillaClaudeClient({
      apiKey,
      model: this.scenario.claude_config.model,
      timeout: this.scenario.claude_config.timeout,
    }));

    // MCP client
    if (this.scenario.mcp_config?.enabled) {
      this.clients.set('mcp', createMCPClaudeClient({
        apiKey,
        model: this.scenario.claude_config.model,
        timeout: this.scenario.claude_config.timeout,
        mcpServers: this.scenario.mcp_config.servers.map(server => ({
          name: server,
          endpoint: `http://localhost:3000/${server}`,
          tools: [],
          enabled: true,
        })),
      }));
    }

    // Atheon client
    if (this.scenario.atheon_config?.enabled || this.scenario.mcp_config?.enabled) {
      this.clients.set('atheon', createAtheonClaudeClient({
        apiKey,
        model: this.scenario.claude_config.model,
        timeout: this.scenario.claude_config.timeout,
        mcpServers: [{
          name: 'atheon-mcp',
          endpoint: 'http://localhost:3000/atheon',
          tools: [],
          enabled: true,
        }],
        atheon: this.scenario.atheon_config || DEFAULT_ATHEON_CONFIG,
        qualityGates: this.scenario.quality_gates || DEFAULT_QUALITY_GATES,
      }));
    }
  }

  /**
   * Execute warmup runs
   */
  private async executeWarmupRuns(onProgress?: ProgressCallback): Promise<void> {
    const warmupCount = this.scenario.execution.warmup_runs;
    if (warmupCount === 0) return;

    await this.notifyProgress(onProgress, 'progress', {
      benchmark_id: this.execution.id,
      message: `Executing ${warmupCount} warmup runs...`,
    });

    // Simple warmup prompts
    const warmupPrompt = 'Hello! Please respond with "Warmup complete"';

    for (let i = 0; i < warmupCount; i++) {
      try {
        const client = this.clients.get('vanilla');
        if (client instanceof VanillaClaudeClient) {
          await client.execute([
            { role: 'user', content: warmupPrompt }
          ]);
        }

        // Cooldown
        await this.delay(this.scenario.execution.cooldown_ms);
      } catch (error) {
        // Warmup failures are not critical
        console.warn('Warmup run failed:', error);
      }
    }
  }

  /**
   * Execute tests for a specific configuration
   */
  private async executeConfigurationTests(
    configId: string,
    testCases: TestCase[],
    onProgress?: ProgressCallback
  ): Promise<void> {
    const client = this.clients.get(configId);
    if (!client) {
      throw new Error(`Client not found for configuration: ${configId}`);
    }

    const batchSize = this.scenario.execution.parallel_tests;

    for (let i = 0; i < testCases.length; i += batchSize) {
      const batch = testCases.slice(i, i + batchSize);
      await this.executeBatch(configId, client, batch, onProgress);

      // Cooldown between batches
      if (i + batchSize < testCases.length) {
        await this.delay(this.scenario.execution.cooldown_ms);
      }
    }
  }

  /**
   * Execute a batch of tests
   */
  private async executeBatch(
    configId: string,
    client: VanillaClaudeClient | MCPClaudeClient | AtheonClaudeClient,
    testCases: TestCase[],
    onProgress?: ProgressCallback
  ): Promise<void> {
    const promises = testCases.map(testCase =>
      this.executeTest(configId, client, testCase, onProgress)
    );

    await Promise.all(promises);
  }

  /**
   * Execute a single test
   */
  private async executeTest(
    configId: string,
    client: VanillaClaudeClient | MCPClaudeClient | AtheonClaudeClient,
    testCase: TestCase,
    onProgress?: ProgressCallback
  ): Promise<void> {
    this.performanceCollector.startMeasurement(testCase.id);

    try {
      let result: BenchmarkResult;

      // Use type-safe method calls instead of instanceof checks
      if ('runBenchmark' in client && typeof (client as any).runBenchmark === 'function') {
        result = await (client as VanillaClaudeClient).runBenchmark(
          this.execution.id,
          testCase.id,
          testCase.name,
          testCase.input_prompt
        );
      } else if ('runBenchmarkWithMCP' in client && typeof (client as any).runBenchmarkWithMCP === 'function') {
        const mcpResult = await (client as MCPClaudeClient).runBenchmarkWithMCP(
          this.execution.id,
          testCase.id,
          testCase.name,
          testCase.input_prompt
        );
        result = mcpResult;
      } else if ('runBenchmarkWithAtheon' in client && typeof (client as any).runBenchmarkWithAtheon === 'function') {
        const atheonResult = await (client as AtheonClaudeClient).runBenchmarkWithAtheon(
          this.execution.id,
          testCase.id,
          testCase.name,
          testCase.input_prompt
        );
        result = atheonResult;
      } else {
        throw new Error('Unknown client type');
      }

      // Record performance metrics
      this.performanceCollector.stopMeasurement(
        testCase.id,
        result.metrics.duration,
        {
          configuration: configId,
          test_case: testCase.name,
          tokens: result.metrics.totalTokens,
          success: result.metrics.success,
        }
      );

      // Add to results
      this.execution.results.push(result);

      // Update counters
      this.execution.completed_tests++;
      if (!result.passed) {
        this.execution.failed_tests++;
      }

      // Update progress
      this.execution.progress = Math.round(
        (this.execution.completed_tests / this.execution.total_tests) * 100
      );

      await this.notifyProgress(onProgress, 'test_completed', {
        benchmark_id: this.execution.id,
        result,
        progress: this.execution.progress,
      });

    } catch (error) {
      this.execution.failed_tests++;
      this.execution.errors.push(
        `Test ${testCase.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      await this.notifyProgress(onProgress, 'test_failed', {
        benchmark_id: this.execution.id,
        test_case: testCase.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Calculate final statistics
   */
  private calculateStatistics(): void {
    const completedResults = this.execution.results.filter(r => r.metrics.success);

    if (completedResults.length === 0) {
      return;
    }

    // Overall statistics
    const totalDuration = completedResults.reduce((sum, r) => sum + r.metrics.duration, 0);
    const totalTokens = completedResults.reduce((sum, r) => sum + r.metrics.totalTokens, 0);

    this.execution.statistics.duration_ms = totalDuration;
    this.execution.statistics.total_tokens = totalTokens;
    this.execution.statistics.avg_duration_ms = totalDuration / completedResults.length;
    this.execution.statistics.avg_tokens_per_test = totalTokens / completedResults.length;
    this.execution.statistics.success_rate =
      (completedResults.length / this.execution.results.length) * 100;

    // Per-configuration statistics
    const configIds = this.getConfigurationIds();
    for (const configId of configIds) {
      const configResults = completedResults.filter(r => r.configuration === configId);

      if (configResults.length === 0) {
        this.execution.statistics.configuration_stats[configId] = {
          total_tests: 0,
          completed_tests: 0,
          failed_tests: 0,
          avg_duration_ms: 0,
          avg_tokens: 0,
          total_tokens: 0,
          success_rate: 0,
        };
        continue;
      }

      const configDuration = configResults.reduce((sum, r) => sum + r.metrics.duration, 0);
      const configTokens = configResults.reduce((sum, r) => sum + r.metrics.totalTokens, 0);

      this.execution.statistics.configuration_stats[configId] = {
        total_tests: this.execution.results.filter(r => r.configuration === configId).length,
        completed_tests: configResults.length,
        failed_tests: this.execution.results.filter(r => r.configuration === configId && !r.passed).length,
        avg_duration_ms: configDuration / configResults.length,
        avg_tokens: configTokens / configResults.length,
        total_tokens: configTokens,
        success_rate: (configResults.length / this.execution.results.filter(r => r.configuration === configId).length) * 100,
      };
    }
  }

  /**
   * Get configuration IDs to test
   */
  private getConfigurationIds(): string[] {
    const ids = ['vanilla'];

    if (this.scenario.mcp_config?.enabled) {
      ids.push('mcp');
    }

    if (this.scenario.atheon_config?.enabled) {
      ids.push('atheon');
    }

    return ids;
  }

  /**
   * Notify progress callback
   */
  private async notifyProgress(
    onProgress: ProgressCallback | undefined,
    type: 'started' | 'progress' | 'test_completed' | 'test_failed' | 'completed' | 'error',
    data: any
  ): Promise<void> {
    if (onProgress) {
      try {
        await onProgress({ type, benchmark_id: this.execution.id, data });
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution results
   */
  getExecution(): BenchmarkExecution {
    return this.execution;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Map<string, StatisticalSummary> {
    const stats = new Map<string, StatisticalSummary>();

    for (const configId of this.getConfigurationIds()) {
      const summary = this.performanceCollector.getStatisticalSummary(configId);
      if (summary) {
        stats.set(configId, summary);
      }
    }

    return stats;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    return this.performanceCollector.generatePerformanceReport();
  }

  /**
   * Export results as JSON
   */
  exportResults(): string {
    return JSON.stringify({
      execution: this.execution,
      performance_stats: this.getPerformanceStats(),
      performance_measurements: this.performanceCollector.exportMeasurements(),
    }, null, 2);
  }
}

/**
 * Factory function to create benchmark executors
 */
export function createBenchmarkExecutor(
  scenario: BenchmarkScenario | string,
  seed?: number
): BenchmarkExecutor {
  return new BenchmarkExecutor(scenario, seed);
}

/**
 * Execute a benchmark with automatic cleanup
 */
export async function executeBenchmark(
  scenario: BenchmarkScenario | string,
  onProgress?: ProgressCallback,
  seed?: number
): Promise<BenchmarkExecution> {
  const executor = createBenchmarkExecutor(scenario, seed);
  return await executor.execute(onProgress);
}