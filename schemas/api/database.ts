/**
 * TypeScript interfaces for Atheon Benchmark Dashboard database schema
 * These interfaces map to the D1 database tables defined in database.sql
 */

// ============================================
// BENCHMARK INTERFACES
// ============================================

export interface Benchmark {
  id: string;
  name: string;
  description?: string;
  configuration_id: string;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_tests: number;
  completed_tests: number;
  failed_tests: number;
  claude_version?: string;
  atheon_version?: string;
  mcp_enabled: boolean;
  metadata?: Record<string, any>;
}

export interface BenchmarkSummary {
  id: string;
  name: string;
  status: string;
  created_at: Date;
  completed_at?: Date;
  total_tests: number;
  completed_tests: number;
  failed_tests: number;
  mcp_enabled: boolean;
  atheon_version?: string;
  configuration_name: string;
  result_count: number;
  avg_duration_ms: number;
  avg_accuracy: number;
  total_tokens_used: number;
}

// ============================================
// CONFIGURATION INTERFACES
// ============================================

export interface Configuration {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  is_public: boolean;
  config: Record<string, any>;
  tags?: string;
}

export interface BenchmarkConfig {
  timeout: number;
  max_retries: number;
  parallel_tests: number;
  claude_model?: string;
  mcp_config?: {
    enabled: boolean;
    servers: string[];
  };
  atheon_config?: {
    enabled: boolean;
    categories: string[];
  };
  quality_gates?: {
    enabled: boolean;
    strict: boolean;
  };
}

// ============================================
// BENCHMARK RESULT INTERFACES
// ============================================

export interface BenchmarkResult {
  id: string;
  benchmark_id: string;
  test_case_id: string;
  test_name: string;
  started_at: Date;
  completed_at?: Date;
  status: 'running' | 'completed' | 'failed';
  duration_ms?: number;
  tokens_used?: number;
  claude_model?: string;
  mcp_enabled: boolean;
  atheon_enabled: boolean;
  output?: string;
  expected_output?: string;
  accuracy?: number;
  passed?: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

// ============================================
// TEST CASE INTERFACES
// ============================================

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  category: 'code-generation' | 'pattern-matching' | 'security' | 'analysis' | 'optimization';
  difficulty: 'easy' | 'medium' | 'hard';
  input_prompt: string;
  expected_output?: string;
  validation_rules?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// ============================================
// PERFORMANCE METRIC INTERFACES
// ============================================

export interface PerformanceMetric {
  id: string;
  benchmark_id: string;
  metric_name: 'latency' | 'tokens' | 'accuracy' | 'memory' | 'throughput';
  metric_value: number;
  metric_unit?: 'ms' | 'tokens' | 'percentage' | 'MB' | 'req/s';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  avg_duration_ms: number;
  p50_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
  avg_accuracy: number;
  total_tokens_used: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
}

// ============================================
// QUALITY GATES INTERFACES
// ============================================

export interface QualityGateResult {
  id: string;
  benchmark_result_id: string;
  gate_name: string;
  passed: boolean;
  findings_count: number;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  details?: Record<string, any>;
  timestamp: Date;
}

export interface AtheonFinding {
  pattern: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
  column: number;
  message: string;
  matched_text: string;
}

// ============================================
// COMPARISON INTERFACES
// ============================================

export interface Comparison {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  created_by?: string;
  benchmark_ids: string[];
  is_public: boolean;
}

export interface PerformanceComparison {
  configuration_id: string;
  mcp_enabled: boolean;
  atheon_version?: string;
  avg_duration_ms: number;
  avg_accuracy: number;
  total_tokens_used: number;
  total_tests: number;
  passed_tests: number;
}

// ============================================
// USER INTERFACES (Optional)
// ============================================

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
  role: 'admin' | 'user';
  metadata?: Record<string, any>;
}

// ============================================
// API REQUEST/RESPONSE INTERFACES
// ============================================

export interface CreateBenchmarkRequest {
  name: string;
  description?: string;
  configuration_id?: string;
  config?: BenchmarkConfig;
}

export interface BenchmarkExecutionRequest {
  benchmark_id: string;
  test_cases?: string[];
  config?: BenchmarkConfig;
}

export interface CreateConfigurationRequest {
  name: string;
  description?: string;
  config: BenchmarkConfig;
  is_public?: boolean;
  tags?: string[];
}

export interface CreateTestCaseRequest {
  name: string;
  description?: string;
  category: TestCase['category'];
  difficulty: TestCase['difficulty'];
  input_prompt: string;
  expected_output?: string;
  validation_rules?: Record<string, any>;
}

// ============================================
// REAL-TIME STREAMING INTERFACES
// ============================================

export interface BenchmarkProgressEvent {
  type: 'progress' | 'result' | 'error' | 'complete';
  benchmark_id: string;
  data: {
    current_test?: number;
    total_tests?: number;
    result?: BenchmarkResult;
    error?: string;
    progress?: number;
  };
  timestamp: Date;
}

export interface RealTimeUpdate {
  event_type: 'benchmark_started' | 'test_started' | 'test_completed' | 'benchmark_completed' | 'error';
  benchmark_id: string;
  data: Record<string, any>;
  timestamp: Date;
}

// ============================================
// STATISTICAL ANALYSIS INTERFACES
// ============================================

export interface StatisticalAnalysis {
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  confidence_interval_95: {
    lower: number;
    upper: number;
  };
}

export interface TrendAnalysis {
  period: string;
  metric_name: string;
  data_points: Array<{
    timestamp: Date;
    value: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  change_rate: number;
  correlation: number;
}

// ============================================
// UTILITY TYPE DEFINITIONS
// ============================================

export type BenchmarkStatus = Benchmark['status'];
export type TestCaseCategory = TestCase['category'];
export type TestCaseDifficulty = TestCase['difficulty'];
export type MetricName = PerformanceMetric['metric_name'];
export type QualityGateSeverity = QualityGateResult['severity'];

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}