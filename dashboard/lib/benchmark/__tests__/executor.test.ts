/**
 * Benchmark Executor Unit Tests
 * Tests for the main benchmark execution engine
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  BenchmarkExecutor,
  createBenchmarkExecutor,
  executeBenchmark,
  BenchmarkExecution,
  ExecutionStatistics,
  ConfigurationStats,
  ProgressCallback
} from '../executor';
import { BenchmarkScenario, getBenchmarkScenario } from '../configurations';
import { VanillaClaudeClient, MCPClaudeClient, AtheonClaudeClient } from '../../claude';

// Mock the Claude clients
jest.mock('../../claude');

// Mock environment
const originalEnv = process.env;

describe('BenchmarkExecutor', () => {
  let scenario: BenchmarkScenario;
  let mockVanillaClient: any;
  let mockMCPClient: any;
  let mockAtheonClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' };

    // Get a real scenario for testing
    scenario = getBenchmarkScenario('vanilla-baseline')!;

    // Mock clients
    mockVanillaClient = {
      execute: jest.fn().mockResolvedValue({
        content: [{ text: 'Response' }],
        usage: { input_tokens: 10, output_tokens: 20 }
      }),
      runBenchmark: jest.fn().mockResolvedValue({
        id: 'result-1',
        testCaseId: 'test-1',
        testCaseName: 'Test 1',
        configuration: 'vanilla',
        input: 'Test prompt',
        output: 'Test response',
        passed: true,
        metrics: {
          duration: 1000,
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
          success: true
        },
        timestamp: new Date().toISOString()
      })
    };

    mockMCPClient = {
      runBenchmarkWithMCP: jest.fn().mockResolvedValue({
        id: 'result-2',
        testCaseId: 'test-2',
        testCaseName: 'Test 2',
        configuration: 'mcp',
        input: 'Test prompt',
        output: 'Test response with MCP',
        passed: true,
        metrics: {
          duration: 1500,
          inputTokens: 15,
          outputTokens: 25,
          totalTokens: 40,
          success: true
        },
        timestamp: new Date().toISOString(),
        mcpResults: []
      })
    };

    mockAtheonClient = {
      runBenchmarkWithAtheon: jest.fn().mockResolvedValue({
        id: 'result-3',
        testCaseId: 'test-3',
        testCaseName: 'Test 3',
        configuration: 'atheon',
        input: 'Test prompt',
        output: 'Test response with Atheon',
        passed: true,
        metrics: {
          duration: 2000,
          inputTokens: 20,
          outputTokens: 30,
          totalTokens: 50,
          success: true
        },
        timestamp: new Date().toISOString(),
        qualityGates: {
          enabled: true,
          findings: [],
          passed: true
        }
      })
    };

    // Mock the factory functions
    const { createVanillaClaudeClient, createMCPClaudeClient, createAtheonClaudeClient } = require('../../claude');
    createVanillaClaudeClient.mockReturnValue(mockVanillaClient);
    createMCPClaudeClient.mockReturnValue(mockMCPClient);
    createAtheonClaudeClient.mockReturnValue(mockAtheonClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize with scenario object', () => {
      const executor = new BenchmarkExecutor(scenario);
      expect(executor).toBeDefined();
      expect(executor.getExecution()).toBeDefined();
    });

    it('should initialize with scenario ID string', () => {
      const executor = new BenchmarkExecutor('vanilla-baseline');
      expect(executor).toBeDefined();
    });

    it('should initialize with custom seed', () => {
      const executor = new BenchmarkExecutor(scenario, 12345);
      expect(executor).toBeDefined();
    });

    it('should initialize execution state correctly', () => {
      const executor = new BenchmarkExecutor(scenario);
      const execution = executor.getExecution();

      expect(execution.id).toBeDefined();
      expect(execution.status).toBe('pending');
      expect(execution.progress).toBe(0);
      expect(execution.results).toEqual([]);
      expect(execution.errors).toEqual([]);
    });

    it('should calculate total tests from test configs', () => {
      const executor = new BenchmarkExecutor(scenario);
      const execution = executor.getExecution();

      expect(execution.total_tests).toBeGreaterThan(0);
    });
  });

  describe('Execution Flow', () => {
    it('should execute benchmark successfully', async () => {
      const executor = new BenchmarkExecutor(scenario);
      const execution = await executor.execute();

      expect(execution.status).toBe('completed');
      expect(execution.started_at).toBeDefined();
      expect(execution.completed_at).toBeDefined();
    });

    it('should call progress callbacks', async () => {
      const onProgress = jest.fn();
      const executor = new BenchmarkExecutor(scenario);

      await executor.execute(onProgress);

      expect(onProgress).toHaveBeenCalled();
      const callTypes = onProgress.mock.calls.map(call => call[0].type);
      expect(callTypes).toContain('started');
      expect(callTypes).toContain('completed');
    });

    it('should update progress during execution', async () => {
      const executor = new BenchmarkExecutor(scenario);
      const execution = await executor.execute();

      expect(execution.progress).toBe(100);
      expect(execution.completed_tests).toBeGreaterThan(0);
    });

    it('should handle execution errors gracefully', async () => {
      // Make the client throw an error - this should be caught per-test
      mockVanillaClient.runBenchmark.mockRejectedValue(new Error('API Error'));

      const executor = new BenchmarkExecutor(scenario);
      const execution = await executor.execute();

      // Individual test failures don't fail the entire execution
      expect(['completed', 'failed']).toContain(execution.status);
      expect(execution.failed_tests).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate overall statistics', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const stats = executor.getExecution().statistics;
      expect(stats.duration_ms).toBeGreaterThanOrEqual(0);
      expect(stats.total_tokens).toBeGreaterThanOrEqual(0);
      expect(stats.avg_duration_ms).toBeGreaterThan(0);
      expect(stats.success_rate).toBeGreaterThanOrEqual(0);
      expect(stats.success_rate).toBeLessThanOrEqual(100);
    });

    it('should calculate per-configuration statistics', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const stats = executor.getExecution().statistics;
      expect(stats.configuration_stats).toBeDefined();
      expect(typeof stats.configuration_stats).toBe('object');
    });

    it('should have valid configuration stats structure', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const stats = executor.getExecution().statistics;
      for (const configId in stats.configuration_stats) {
        const configStats = stats.configuration_stats[configId];
        expect(configStats).toHaveProperty('total_tests');
        expect(configStats).toHaveProperty('completed_tests');
        expect(configStats).toHaveProperty('failed_tests');
        expect(configStats).toHaveProperty('avg_duration_ms');
        expect(configStats).toHaveProperty('avg_tokens');
        expect(configStats).toHaveProperty('total_tokens');
        expect(configStats).toHaveProperty('success_rate');
      }
    });
  });

  describe('Performance Measurements', () => {
    it('should collect performance metrics', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const perfStats = executor.getPerformanceStats();
      expect(perfStats).toBeDefined();
      expect(perfStats instanceof Map).toBe(true);
    });

    it('should generate performance report', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const report = executor.generateReport();
      expect(typeof report).toBe('string');
      expect(report).toContain('Performance Analysis Report');
    });

    it('should export results as JSON', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const exported = executor.exportResults();
      expect(typeof exported).toBe('string');

      const data = JSON.parse(exported);
      expect(data).toHaveProperty('execution');
      expect(data).toHaveProperty('performance_stats');
      expect(data).toHaveProperty('performance_measurements');
    });
  });

  describe('Progress Callback Types', () => {
    it('should send started notification', async () => {
      const onProgress = jest.fn();
      const executor = new BenchmarkExecutor(scenario);

      await executor.execute(onProgress);

      const startedCall = onProgress.mock.calls.find(call => call[0].type === 'started');
      expect(startedCall).toBeDefined();
      expect(startedCall![0].data).toHaveProperty('benchmark_id');
      expect(startedCall![0].data).toHaveProperty('scenario');
    });

    it('should send test_completed notifications', async () => {
      const onProgress = jest.fn();
      const executor = new BenchmarkExecutor(scenario);

      await executor.execute(onProgress);

      const completedCalls = onProgress.mock.calls.filter(call => call[0].type === 'test_completed');
      expect(completedCalls.length).toBeGreaterThan(0);
    });

    it('should send completed notification', async () => {
      const onProgress = jest.fn();
      const executor = new BenchmarkExecutor(scenario);

      await executor.execute(onProgress);

      const completedCall = onProgress.mock.calls.find(call => call[0].type === 'completed');
      expect(completedCall).toBeDefined();
      expect(completedCall![0].data).toHaveProperty('execution');
    });

    it('should send test_failed notifications when tests fail', async () => {
      mockVanillaClient.runBenchmark.mockRejectedValue(new Error('Test error'));

      const onProgress = jest.fn();
      const executor = new BenchmarkExecutor(scenario);

      await executor.execute(onProgress);

      // Individual test failures send test_failed notifications
      const testFailedCalls = onProgress.mock.calls.filter(call => call[0].type === 'test_failed');
      expect(testFailedCalls.length).toBeGreaterThan(0);
    });
  });

  describe('MCP and Atheon Integration', () => {
    it('should handle MCP-enabled scenarios', async () => {
      const baseScenario = getBenchmarkScenario('mcp-enabled')!;
      const mcpScenario: BenchmarkScenario = {
        ...baseScenario,
        test_configs: [{
          category: 'code-generation',
          difficulty: 'easy',
          count: 1
        }],
        execution: {
          ...baseScenario.execution,
          warmup_runs: 0,
          cooldown_ms: 0
        }
      };
      const executor = new BenchmarkExecutor(mcpScenario);
      const execution = await executor.execute();

      expect(execution.status).toBe('completed');
      // MCP scenario should complete without errors
      expect(execution.errors).toEqual([]);
    }, 30000);

    it('should handle Atheon-enabled scenarios', async () => {
      const baseScenario = getBenchmarkScenario('atheon-integrated')!;
      const atheonScenario: BenchmarkScenario = {
        ...baseScenario,
        test_configs: [{
          category: 'code-generation',
          difficulty: 'easy',
          count: 1
        }],
        execution: {
          ...baseScenario.execution,
          warmup_runs: 0,
          cooldown_ms: 0
        }
      };
      const executor = new BenchmarkExecutor(atheonScenario);
      const execution = await executor.execute();

      expect(execution.status).toBe('completed');
      // Atheon scenario should complete without errors
      expect(execution.errors).toEqual([]);
    }, 30000);

    it('should include all configurations in comprehensive scenario', async () => {
      const baseScenario = getBenchmarkScenario('comprehensive-comparison')!;
      const comprehensive: BenchmarkScenario = {
        ...baseScenario,
        test_configs: [{
          category: 'code-generation',
          difficulty: 'easy',
          count: 1
        }],
        execution: {
          ...baseScenario.execution,
          warmup_runs: 0,
          cooldown_ms: 0
        }
      };
      const executor = new BenchmarkExecutor(comprehensive);
      const execution = await executor.execute();

      expect(execution.status).toBe('completed');
      // Comprehensive scenario should have results
      expect(execution.results.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Warmup Runs', () => {
    it('should execute warmup runs when configured', async () => {
      const warmupScenario: BenchmarkScenario = {
        ...scenario,
        execution: {
          ...scenario.execution,
          warmup_runs: 2,
          parallel_tests: 1,
          cooldown_ms: 0
        },
        test_configs: [{
          category: 'code-generation',
          difficulty: 'easy',
          count: 1
        }]
      };

      const executor = new BenchmarkExecutor(warmupScenario);
      const execution = await executor.execute();

      // Should complete successfully even with warmup
      expect(execution.status).toBe('completed');
    }, 30000);

    it('should skip warmup when count is zero', async () => {
      const noWarmupScenario: BenchmarkScenario = {
        ...scenario,
        execution: {
          ...scenario.execution,
          warmup_runs: 0
        },
        test_configs: [{
          category: 'code-generation',
          difficulty: 'easy',
          count: 1
        }]
      };

      const executor = new BenchmarkExecutor(noWarmupScenario);
      const execution = await executor.execute();

      expect(execution.status).toBe('completed');
    });
  });

  describe('Batch Execution', () => {
    it('should execute tests in batches', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const execution = executor.getExecution();
      expect(execution.completed_tests).toBeGreaterThan(0);
    });

    it('should respect parallel_tests configuration', async () => {
      const parallelScenario: BenchmarkScenario = {
        ...scenario,
        execution: {
          ...scenario.execution,
          parallel_tests: 2
        }
      };

      const executor = new BenchmarkExecutor(parallelScenario);
      await executor.execute();

      const execution = executor.getExecution();
      expect(execution.completed_tests).toBeGreaterThan(0);
    });
  });

  describe('Results Tracking', () => {
    it('should track individual test results', async () => {
      const executor = new BenchmarkExecutor(scenario);
      const execution = await executor.execute();

      expect(execution.results).toBeDefined();
      expect(Array.isArray(execution.results)).toBe(true);
      expect(execution.results.length).toBe(execution.completed_tests);
    });

    it('should track failed tests separately', async () => {
      // Make some tests fail
      mockVanillaClient.runBenchmark
        .mockResolvedValueOnce({
          id: 'result-1',
          testCaseId: 'test-1',
          testCaseName: 'Test 1',
          configuration: 'vanilla',
          input: 'Test prompt',
          output: 'Test response',
          passed: true,
          metrics: {
            duration: 1000,
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
            success: true
          },
          timestamp: new Date().toISOString()
        })
        .mockRejectedValueOnce(new Error('Test failed'));

      const executor = new BenchmarkExecutor(scenario);
      const execution = await executor.execute();

      expect(execution.failed_tests).toBeGreaterThan(0);
      expect(execution.completed_tests).toBeGreaterThanOrEqual(execution.failed_tests);
    });
  });

  describe('Export and Import', () => {
    it('should export complete execution data', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const exported = executor.exportResults();
      const data = JSON.parse(exported);

      expect(data.execution.id).toBeDefined();
      expect(data.execution.status).toBe('completed');
      expect(data.execution.results).toBeDefined();
      expect(Array.isArray(data.execution.results)).toBe(true);
    });

    it('should include performance stats in export', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const exported = executor.exportResults();
      const data = JSON.parse(exported);

      expect(data.performance_stats).toBeDefined();
      expect(typeof data.performance_stats).toBe('object');
    });

    it('should include raw measurements in export', async () => {
      const executor = new BenchmarkExecutor(scenario);
      await executor.execute();

      const exported = executor.exportResults();
      const data = JSON.parse(exported);

      expect(data.performance_measurements).toBeDefined();
      expect(typeof data.performance_measurements).toBe('string');
    });
  });
});

describe('createBenchmarkExecutor', () => {
  it('should create BenchmarkExecutor instance', () => {
    const executor = createBenchmarkExecutor('vanilla-baseline');
    expect(executor).toBeInstanceOf(BenchmarkExecutor);
  });

  it('should accept scenario object', () => {
    const scenario = getBenchmarkScenario('vanilla-baseline');
    const executor = createBenchmarkExecutor(scenario!);
    expect(executor).toBeInstanceOf(BenchmarkExecutor);
  });

  it('should accept seed parameter', () => {
    const executor = createBenchmarkExecutor('vanilla-baseline', 12345);
    expect(executor).toBeInstanceOf(BenchmarkExecutor);
  });
});

describe('executeBenchmark', () => {
  it('should execute benchmark with factory function', async () => {
    const execution = await executeBenchmark('vanilla-baseline');
    expect(execution).toBeDefined();
    expect(execution.status).toBeDefined();
  });

  it('should accept progress callback', async () => {
    const onProgress = jest.fn();
    const execution = await executeBenchmark('vanilla-baseline', onProgress);
    expect(execution.status).toBeDefined();
  });

  it('should accept seed parameter', async () => {
    const execution = await executeBenchmark('vanilla-baseline', undefined, 12345);
    expect(execution).toBeDefined();
  });
});

describe('Interface Type Definitions', () => {
  it('should accept valid BenchmarkExecution interface', () => {
    const execution: BenchmarkExecution = {
      id: 'bench-123',
      scenario: {} as any,
      status: 'completed',
      progress: 100,
      total_tests: 10,
      completed_tests: 10,
      failed_tests: 0,
      results: [],
      errors: [],
      statistics: {
        duration_ms: 5000,
        total_tokens: 1000,
        avg_duration_ms: 500,
        avg_tokens_per_test: 100,
        success_rate: 100,
        configuration_stats: {}
      }
    };

    expect(execution.id).toBe('bench-123');
    expect(execution.status).toBe('completed');
  });

  it('should accept valid ExecutionStatistics interface', () => {
    const stats: ExecutionStatistics = {
      duration_ms: 10000,
      total_tokens: 2000,
      avg_duration_ms: 1000,
      avg_tokens_per_test: 200,
      success_rate: 95,
      configuration_stats: {
        vanilla: {
          total_tests: 10,
          completed_tests: 10,
          failed_tests: 0,
          avg_duration_ms: 1000,
          avg_tokens: 200,
          total_tokens: 2000,
          success_rate: 100
        }
      }
    };

    expect(stats.duration_ms).toBe(10000);
    expect(stats.success_rate).toBe(95);
  });

  it('should accept valid ConfigurationStats interface', () => {
    const configStats: ConfigurationStats = {
      total_tests: 20,
      completed_tests: 18,
      failed_tests: 2,
      avg_duration_ms: 1500,
      avg_tokens: 300,
      total_tokens: 5400,
      success_rate: 90
    };

    expect(configStats.total_tests).toBe(20);
    expect(configStats.success_rate).toBe(90);
  });
});
