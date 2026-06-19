/**
 * Benchmark Library - Main Export
 * This module exports all benchmark functionality including test generation, execution, and measurement
 */

export {
  DeterministicTestCaseGenerator,
  createTestCaseGenerator,
  PREDEFINED_CONFIGS,
  type TestCase,
  type TestCaseGenerator,
  type TestGenerationConfig,
  type ValidationRule,
  type TestCaseMetadata,
  type DeterministicRandom,
  type SeededRandom
} from './test-cases';

export {
  getBenchmarkScenario,
  getBenchmarkScenarioIds,
  createBenchmarkConfig,
  validateBenchmarkConfig,
  BENCHMARK_SCENARIOS,
  COMPARISON_CONFIGS,
  type BenchmarkScenario,
} from './configurations';

export {
  BenchmarkExecutor,
  createBenchmarkExecutor,
  executeBenchmark,
  type BenchmarkExecution,
  type ExecutionStatistics,
  type ConfigurationStats,
  type ProgressCallback,
} from './executor';

export {
  PerformanceCollector,
  createPerformanceCollector,
  StatisticsUtils,
  type PerformanceMetrics,
  type Measurement,
  type StatisticalSummary,
  type ComparisonResult,
  type TrendAnalysis,
} from './measurements';