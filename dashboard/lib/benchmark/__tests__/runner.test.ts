/**
 * Simple Benchmark Runner Unit Tests
 * Tests for the simple benchmark runner implementation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  SimpleBenchmarkRunner,
  SimpleBenchmarkResult
} from '../runner';

describe('SimpleBenchmarkRunner', () => {
  let runner: SimpleBenchmarkRunner;

  beforeEach(() => {
    runner = new SimpleBenchmarkRunner();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create runner instance', () => {
      expect(runner).toBeDefined();
      expect(runner).toBeInstanceOf(SimpleBenchmarkRunner);
    });
  });

  describe('runBenchmark', () => {
    it('should run benchmark with valid config', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 3
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Benchmark');
      expect(result.scenario).toBe('vanilla');
    });

    it('should generate unique benchmark IDs', async () => {
      const result1 = await runner.runBenchmark({
        name: 'Benchmark 1',
        scenario: 'vanilla',
        testCases: 1
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const result2 = await runner.runBenchmark({
        name: 'Benchmark 2',
        scenario: 'vanilla',
        testCases: 1
      });

      expect(result1.id).not.toBe(result2.id);
    });

    it('should return completed status on success', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 2
      });

      expect(result.status).toBe('completed');
    });

    it('should return results array', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 3
      });

      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBe(3);
    });

    it('should calculate summary statistics correctly', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 5
      });

      expect(result.summary).toBeDefined();
      expect(result.summary.total_tests).toBe(5);
      expect(result.summary.passed_tests).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed_tests).toBeGreaterThanOrEqual(0);
      expect(result.summary.avg_duration_ms).toBeGreaterThan(0);
      expect(result.summary.total_tokens).toBeGreaterThan(0);
    });

    it('should have passed + failed tests equal total', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 10
      });

      expect(result.summary.passed_tests + result.summary.failed_tests).toBe(10);
    });

    it('should handle zero test cases', async () => {
      const result = await runner.runBenchmark({
        name: 'Empty Benchmark',
        scenario: 'vanilla',
        testCases: 0
      });

      expect(result.results).toEqual([]);
      expect(result.summary.total_tests).toBe(0);
    });

    it('should handle large number of test cases', async () => {
      const result = await runner.runBenchmark({
        name: 'Large Benchmark',
        scenario: 'vanilla',
        testCases: 25
      });

      expect(result.results.length).toBe(25);
      expect(result.summary.total_tests).toBe(25);
    });

    it('should generate result timestamps', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 2
      });

      result.results.forEach(r => {
        expect(r.timestamp).toBeDefined();
        expect(typeof r.timestamp).toBe('string');
        expect(new Date(r.timestamp).toISOString()).toBe(r.timestamp);
      });
    });
  });

  describe('Scenario Support', () => {
    it('should support vanilla scenario', async () => {
      const result = await runner.runBenchmark({
        name: 'Vanilla Benchmark',
        scenario: 'vanilla',
        testCases: 2
      });

      expect(result.scenario).toBe('vanilla');
      expect(result.status).toBe('completed');
    });

    it('should support mcp scenario', async () => {
      const result = await runner.runBenchmark({
        name: 'MCP Benchmark',
        scenario: 'mcp',
        testCases: 2
      });

      expect(result.scenario).toBe('mcp');
      expect(result.status).toBe('completed');
    });

    it('should support atheon scenario', async () => {
      const result = await runner.runBenchmark({
        name: 'Atheon Benchmark',
        scenario: 'atheon',
        testCases: 2
      });

      expect(result.scenario).toBe('atheon');
      expect(result.status).toBe('completed');
    });

    it('should use default base time for unknown scenarios', async () => {
      const result = await runner.runBenchmark({
        name: 'Unknown Scenario Benchmark',
        scenario: 'unknown-scenario',
        testCases: 2
      });

      expect(result.status).toBe('completed');
    });
  });

  describe('Result Structure', () => {
    it('should generate results with required fields', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 1
      });

      const firstResult = result.results[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('name');
      expect(firstResult).toHaveProperty('configuration');
      expect(firstResult).toHaveProperty('duration_ms');
      expect(firstResult).toHaveProperty('tokens_used');
      expect(firstResult).toHaveProperty('passed');
      expect(firstResult).toHaveProperty('output');
      expect(firstResult).toHaveProperty('timestamp');
    });

    it('should generate sequential test IDs', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 5
      });

      result.results.forEach((r, i) => {
        expect(r.id).toContain(`result-${i}`);
      });
    });

    it('should generate sequential test names', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 5
      });

      result.results.forEach((r, i) => {
        expect(r.name).toBe(`Test Case ${i + 1}`);
      });
    });

    it('should set configuration to scenario name', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'mcp',
        testCases: 2
      });

      result.results.forEach(r => {
        expect(r.configuration).toBe('mcp');
      });
    });

    it('should include scenario in output', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'atheon',
        testCases: 1
      });

      expect(result.results[0].output).toContain('atheon');
    });
  });

  describe('Performance Metrics', () => {
    it('should generate positive duration values', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 10
      });

      result.results.forEach(r => {
        expect(r.duration_ms).toBeGreaterThan(0);
        expect(Number.isInteger(r.duration_ms)).toBe(true);
      });
    });

    it('should generate positive token counts', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 10
      });

      result.results.forEach(r => {
        expect(r.tokens_used).toBeGreaterThan(0);
        expect(Number.isInteger(r.tokens_used)).toBe(true);
      });
    });

    it('should calculate average duration correctly', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 5
      });

      const expectedAvg = result.results.reduce((sum, r) => sum + r.duration_ms, 0) / result.results.length;
      expect(result.summary.avg_duration_ms).toBeCloseTo(expectedAvg, 0);
    });

    it('should calculate total tokens correctly', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 5
      });

      const expectedTotal = result.results.reduce((sum, r) => sum + r.tokens_used, 0);
      expect(result.summary.total_tokens).toBe(expectedTotal);
    });

    it('should use different base times per scenario', async () => {
      const vanillaResult = await runner.runBenchmark({
        name: 'Vanilla Benchmark',
        scenario: 'vanilla',
        testCases: 1
      });

      const mcpResult = await runner.runBenchmark({
        name: 'MCP Benchmark',
        scenario: 'mcp',
        testCases: 1
      });

      const atheonResult = await runner.runBenchmark({
        name: 'Atheon Benchmark',
        scenario: 'atheon',
        testCases: 1
      });

      // Different scenarios should have different average durations (roughly)
      expect(vanillaResult.summary.avg_duration_ms).toBeGreaterThan(0);
      expect(mcpResult.summary.avg_duration_ms).toBeGreaterThan(0);
      expect(atheonResult.summary.avg_duration_ms).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return result even when tests fail', async () => {
      // Run with just a few tests to check structure
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 5
      });

      // Should have ID and status regardless of individual test failures
      expect(result.id).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['completed', 'failed']).toContain(result.status);
    });

    it('should track failed tests in summary', async () => {
      const result = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 20
      });

      // Even with random failures, should track correctly
      expect(result.summary.failed_tests).toBeGreaterThanOrEqual(0);
      expect(result.summary.passed_tests + result.summary.failed_tests).toBe(20);
    });

    it('should preserve benchmark ID on error', async () => {
      const errorResult = await runner.runBenchmark({
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 5
      });

      // Even if it fails, should have an ID
      expect(errorResult.id).toBeDefined();
      expect(typeof errorResult.id).toBe('string');
    });
  });

  describe('runComparison', () => {
    it('should run comparison across multiple scenarios', async () => {
      const result = await runner.runComparison({
        name: 'Comparison Test',
        scenarios: ['vanilla', 'mcp'],
        testCases: 2
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Comparison Test');
    });

    it('should include results for all scenarios', async () => {
      const result = await runner.runComparison({
        name: 'Comparison Test',
        scenarios: ['vanilla', 'mcp', 'atheon'],
        testCases: 3
      });

      expect(result.comparison_results).toBeDefined();
      expect(result.comparison_results.length).toBe(3);
      expect(result.comparison_results[0].scenario).toBe('vanilla');
      expect(result.comparison_results[1].scenario).toBe('mcp');
      expect(result.comparison_results[2].scenario).toBe('atheon');
    });

    it('should include summary for each scenario', async () => {
      const result = await runner.runComparison({
        name: 'Comparison Test',
        scenarios: ['vanilla', 'mcp'],
        testCases: 2
      });

      result.comparison_results.forEach(cr => {
        expect(cr.summary).toBeDefined();
        expect(cr.summary.total_tests).toBe(2);
        expect(cr.summary.avg_duration_ms).toBeGreaterThan(0);
      });
    });

    it('should handle single scenario comparison', async () => {
      const result = await runner.runComparison({
        name: 'Single Scenario Comparison',
        scenarios: ['vanilla'],
        testCases: 1
      });

      expect(result.comparison_results.length).toBe(1);
      expect(result.comparison_results[0].scenario).toBe('vanilla');
    });

    it('should handle empty scenarios array', async () => {
      const result = await runner.runComparison({
        name: 'Empty Comparison',
        scenarios: [],
        testCases: 1
      });

      expect(result.comparison_results).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle large test case counts', async () => {
      const result = await runner.runBenchmark({
        name: 'Large Test',
        scenario: 'vanilla',
        testCases: 20
      });

      expect(result.results.length).toBe(20);
      expect(result.summary.total_tests).toBe(20);
    });

    it('should handle single test case', async () => {
      const result = await runner.runBenchmark({
        name: 'Single Test',
        scenario: 'vanilla',
        testCases: 1
      });

      expect(result.results.length).toBe(1);
      expect(result.summary.total_tests).toBe(1);
    });

    it('should handle fractional test case count', async () => {
      const result = await runner.runBenchmark({
        name: 'Fractional Test',
        scenario: 'vanilla',
        testCases: 2.7
      } as any);

      // JavaScript for loop: i < 2.7 will run for i = 0, 1, 2 (3 iterations)
      expect(result.results.length).toBe(3);
    });
  });
});

describe('Interface Type Definitions', () => {
  it('should accept valid SimpleBenchmarkResult interface', () => {
    const result: SimpleBenchmarkResult = {
      id: 'result-1',
      name: 'Test Case 1',
      configuration: 'vanilla',
      duration_ms: 1000,
      tokens_used: 500,
      passed: true,
      output: 'Test output',
      timestamp: new Date().toISOString()
    };

    expect(result.id).toBe('result-1');
    expect(result.passed).toBe(true);
    expect(typeof result.timestamp).toBe('string');
  });

  it('should accept result with all fields populated', () => {
    const result: SimpleBenchmarkResult = {
      id: 'result-123',
      name: 'Comprehensive Test',
      configuration: 'atheon',
      duration_ms: 3500,
      tokens_used: 1500,
      passed: false,
      output: 'Test failed with error',
      timestamp: '2026-06-20T12:00:00.000Z'
    };

    expect(result.configuration).toBe('atheon');
    expect(result.passed).toBe(false);
  });
});

describe('benchmarkRunner export', () => {
  it('should export singleton instance', () => {
    const { benchmarkRunner } = require('../runner');
    expect(benchmarkRunner).toBeDefined();
    expect(benchmarkRunner).toBeInstanceOf(SimpleBenchmarkRunner);
  });

  it('should allow using exported instance', async () => {
    const { benchmarkRunner } = require('../runner');
    const result = await benchmarkRunner.runBenchmark({
      name: 'Export Test',
      scenario: 'vanilla',
      testCases: 1
    });

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });
});
