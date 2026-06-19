/**
 * Atheon Benchmark Dashboard - Main Library Export
 * This module exports all functionality for the benchmark system
 */

// Claude Integration
export * from './claude';

// Benchmark System
export * from './benchmark';

// Atheon Integration
export * from './atheon';

// Re-export commonly used types and utilities
export {
  // Claude types
  type ClaudeClientConfig,
  type ClaudeMessage,
  type ClaudeAPIRequest,
  type ClaudeAPIResponse,
  type BenchmarkMetrics,
  type BenchmarkResult,
  type ClaudeModel,
} from './claude';

export {
  // Benchmark types
  type TestCase,
  type TestCaseGenerator,
  type TestGenerationConfig,
  type BenchmarkScenario,
  type BenchmarkExecution,
  type ExecutionStatistics,
  type PerformanceMetrics,
} from './benchmark';

export {
  // Atheon types
  type QualityGateConfig,
  type QualityGateResult,
  type ValidationResult,
} from './atheon';

// Utility functions
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();