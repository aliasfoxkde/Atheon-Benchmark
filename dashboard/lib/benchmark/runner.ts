/**
 * Simple Benchmark Runner
 * Working implementation for testing the complete flow
 */

export interface SimpleBenchmarkResult {
  id: string;
  name: string;
  configuration: string;
  duration_ms: number;
  tokens_used: number;
  passed: boolean;
  output: string;
  timestamp: string;
}

export class SimpleBenchmarkRunner {
  async runBenchmark(config: {
    name: string;
    scenario: string;
    testCases: number;
  }): Promise<{
    id: string;
    name: string;
    scenario: string;
    status: 'completed' | 'failed';
    results: SimpleBenchmarkResult[];
    summary: {
      total_tests: number;
      passed_tests: number;
      failed_tests: number;
      avg_duration_ms: number;
      total_tokens: number;
    };
    errors: string[];
  }> {
    const benchmarkId = `bench-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const results: SimpleBenchmarkResult[] = [];
    const errors: string[] = [];

    try {
      // Run benchmark tests
      for (let i = 0; i < config.testCases; i++) {
        const startTime = Date.now();

        // Simulate different execution times based on scenario
        const baseTime = this.getScenarioTime(config.scenario);
        const duration = baseTime + (Math.random() * 1000);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, duration / 10)); // Fast simulation

        const result: SimpleBenchmarkResult = {
          id: `result-${i}`,
          name: `Test Case ${i + 1}`,
          configuration: config.scenario,
          duration_ms: Math.round(duration),
          tokens_used: Math.round(500 + Math.random() * 1500),
          passed: Math.random() > 0.15, // 85% success rate
          output: `Generated output for test ${i + 1} in ${config.scenario} scenario`,
          timestamp: new Date().toISOString(),
        };

        results.push(result);
      }

      // Calculate summary statistics
      const summary = {
        total_tests: config.testCases,
        passed_tests: results.filter(r => r.passed).length,
        failed_tests: results.filter(r => !r.passed).length,
        avg_duration_ms: Math.round(results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length),
        total_tokens: results.reduce((sum, r) => sum + r.tokens_used, 0),
      };

      return {
        id: benchmarkId,
        name: config.name,
        scenario: config.scenario,
        status: 'completed',
        results,
        summary,
        errors,
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        id: benchmarkId,
        name: config.name,
        scenario: config.scenario,
        status: 'failed',
        results,
        summary: {
          total_tests: config.testCases,
          passed_tests: 0,
          failed_tests: config.testCases,
          avg_duration_ms: 0,
          total_tokens: 0,
        },
        errors,
      };
    }
  }

  private getScenarioTime(scenario: string): number {
    const times: Record<string, number> = {
      'vanilla': 2000,
      'mcp': 3000,
      'atheon': 3500,
    };
    return times[scenario] || 2000;
  }

  async runComparison(config: {
    name: string;
    scenarios: string[];
    testCases: number;
  }): Promise<{
    id: string;
    name: string;
    comparison_results: Array<{
      scenario: string;
      results: SimpleBenchmarkResult[];
      summary: any;
    }>;
  }> {
    const comparisonResults = [];

    for (const scenario of config.scenarios) {
      const result = await this.runBenchmark({
        name: `${config.name} - ${scenario}`,
        scenario,
        testCases: config.testCases,
      });

      comparisonResults.push({
        scenario,
        results: result.results,
        summary: result.summary,
      });
    }

    return {
      id: `comparison-${Date.now()}`,
      name: config.name,
      comparison_results: comparisonResults,
    };
  }
}

export const benchmarkRunner = new SimpleBenchmarkRunner();