-- Atheon Benchmark Dashboard Database Schema for Cloudflare D1
-- This schema defines the structure for storing benchmark results, configurations, and user data

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- ============================================
-- BENCHMARKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS benchmarks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  configuration_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  total_tests INTEGER NOT NULL DEFAULT 0,
  completed_tests INTEGER NOT NULL DEFAULT 0,
  failed_tests INTEGER NOT NULL DEFAULT 0,
  claude_version TEXT,
  atheon_version TEXT,
  mcp_enabled BOOLEAN DEFAULT FALSE,
  metadata JSON, -- Additional metadata as JSON
  FOREIGN KEY (configuration_id) REFERENCES configurations(id) ON DELETE CASCADE
);

-- ============================================
-- CONFIGURATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS configurations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT, -- User or system that created the configuration
  is_public BOOLEAN DEFAULT FALSE,
  config JSON NOT NULL, -- Configuration details as JSON
  tags TEXT -- Comma-separated tags
);

-- ============================================
-- BENCHMARK_RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS benchmark_results (
  id TEXT PRIMARY KEY,
  benchmark_id TEXT NOT NULL,
  test_case_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
  duration_ms INTEGER,
  tokens_used INTEGER,
  claude_model TEXT,
  mcp_enabled BOOLEAN DEFAULT FALSE,
  atheon_enabled BOOLEAN DEFAULT FALSE,
  output TEXT, -- Generated output
  expected_output TEXT, -- Expected output for validation
  accuracy REAL, -- Accuracy score (0-1)
  passed BOOLEAN, -- Whether the test passed
  error_message TEXT,
  metadata JSON,
  FOREIGN KEY (benchmark_id) REFERENCES benchmarks(id) ON DELETE CASCADE
);

-- ============================================
-- TEST_CASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS test_cases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- code-generation, pattern-matching, security, etc.
  difficulty TEXT NOT NULL, -- easy, medium, hard
  input_prompt TEXT NOT NULL,
  expected_output TEXT,
  validation_rules JSON, -- Validation rules as JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSON
);

-- ============================================
-- PERFORMANCE_METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS performance_metrics (
  id TEXT PRIMARY KEY,
  benchmark_id TEXT NOT NULL,
  metric_name TEXT NOT NULL, -- latency, tokens, accuracy, etc.
  metric_value REAL NOT NULL,
  metric_unit TEXT, -- ms, tokens, percentage, etc.
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (benchmark_id) REFERENCES benchmarks(id) ON DELETE CASCADE
);

-- ============================================
-- QUALITY_GATES_RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quality_gates_results (
  id TEXT PRIMARY KEY,
  benchmark_result_id TEXT NOT NULL,
  gate_name TEXT NOT NULL, -- atheon-secrets, atheon-code-quality, etc.
  passed BOOLEAN NOT NULL,
  findings_count INTEGER NOT NULL DEFAULT 0,
  severity TEXT, -- critical, high, medium, low
  details JSON, -- Detailed findings as JSON
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (benchmark_result_id) REFERENCES benchmark_results(id) ON DELETE CASCADE
);

-- ============================================
-- COMPARISONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comparisons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  benchmark_ids TEXT NOT NULL, -- Comma-separated benchmark IDs to compare
  is_public BOOLEAN DEFAULT FALSE
);

-- ============================================
-- USERS TABLE (Optional, for authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  role TEXT NOT NULL DEFAULT 'user', -- admin, user
  metadata JSON
);

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- Benchmarks indexes
CREATE INDEX IF NOT EXISTS idx_benchmarks_status ON benchmarks(status);
CREATE INDEX IF NOT EXISTS idx_benchmarks_created_at ON benchmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_benchmarks_configuration_id ON benchmarks(configuration_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_mcp_enabled ON benchmarks(mcp_enabled);

-- Benchmark results indexes
CREATE INDEX IF NOT EXISTS idx_benchmark_results_benchmark_id ON benchmark_results(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_results_status ON benchmark_results(status);
CREATE INDEX IF NOT EXISTS idx_benchmark_results_test_case_id ON benchmark_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_results_mcp_enabled ON benchmark_results(mcp_enabled);
CREATE INDEX IF NOT EXISTS idx_benchmark_results_atheon_enabled ON benchmark_results(atheon_enabled);

-- Configurations indexes
CREATE INDEX IF NOT EXISTS idx_configurations_is_public ON configurations(is_public);
CREATE INDEX IF NOT EXISTS idx_configurations_created_at ON configurations(created_at DESC);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_benchmark_id ON performance_metrics(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);

-- Quality gates results indexes
CREATE INDEX IF NOT EXISTS idx_quality_gates_results_benchmark_result_id ON quality_gates_results(benchmark_result_id);
CREATE INDEX IF NOT EXISTS idx_quality_gates_results_gate_name ON quality_gates_results(gate_name);
CREATE INDEX IF NOT EXISTS idx_quality_gates_results_passed ON quality_gates_results(passed);

-- Test cases indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_category ON test_cases(category);
CREATE INDEX IF NOT EXISTS idx_test_cases_difficulty ON test_cases(difficulty);
CREATE INDEX IF NOT EXISTS idx_test_cases_is_active ON test_cases(is_active);

-- Comparisons indexes
CREATE INDEX IF NOT EXISTS idx_comparisons_is_public ON comparisons(is_public);
CREATE INDEX IF NOT EXISTS idx_comparisons_created_at ON comparisons(created_at DESC);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for benchmark summary statistics
CREATE VIEW IF NOT EXISTS v_benchmark_summary AS
SELECT
  b.id,
  b.name,
  b.status,
  b.created_at,
  b.completed_at,
  b.total_tests,
  b.completed_tests,
  b.failed_tests,
  b.mcp_enabled,
  b.atheon_version,
  c.name as configuration_name,
  COUNT(DISTINCT br.id) as result_count,
  AVG(br.duration_ms) as avg_duration_ms,
  AVG(br.accuracy) as avg_accuracy,
  SUM(br.tokens_used) as total_tokens_used
FROM benchmarks b
LEFT JOIN configurations c ON b.configuration_id = c.id
LEFT JOIN benchmark_results br ON b.id = br.benchmark_id
GROUP BY b.id;

-- View for performance comparison
CREATE VIEW IF NOT EXISTS v_performance_comparison AS
SELECT
  b.configuration_id,
  b.mcp_enabled,
  b.atheon_version,
  AVG(br.duration_ms) as avg_duration_ms,
  AVG(br.accuracy) as avg_accuracy,
  SUM(br.tokens_used) as total_tokens_used,
  COUNT(br.id) as total_tests,
  COUNT(CASE WHEN br.passed = 1 THEN 1 END) as passed_tests
FROM benchmarks b
LEFT JOIN benchmark_results br ON b.id = br.benchmark_id
WHERE b.status = 'completed'
GROUP BY b.configuration_id, b.mcp_enabled, b.atheon_version;

-- View for quality gates summary
CREATE VIEW IF NOT EXISTS v_quality_gates_summary AS
SELECT
  br.benchmark_id,
  qgr.gate_name,
  COUNT(qgr.id) as total_gates,
  SUM(CASE WHEN qgr.passed = 1 THEN 1 ELSE 0 END) as passed_gates,
  SUM(qgr.findings_count) as total_findings,
  AVG(CASE WHEN qgr.severity = 'critical' THEN 1 ELSE 0 END) as critical_rate
FROM benchmark_results br
LEFT JOIN quality_gates_results qgr ON br.id = qgr.benchmark_result_id
GROUP BY br.benchmark_id, qgr.gate_name;

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Update updated_at timestamp for configurations
CREATE TRIGGER IF NOT EXISTS update_configurations_updated_at
AFTER UPDATE ON configurations
BEGIN
  UPDATE configurations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update updated_at timestamp for users
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update benchmark status and counts
CREATE TRIGGER IF NOT EXISTS update_benchmark_counts
AFTER INSERT ON benchmark_results
BEGIN
  UPDATE benchmarks
  SET completed_tests = completed_tests + 1,
      failed_tests = failed_tests + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END
  WHERE id = NEW.benchmark_id;
END;

-- ============================================
-- SAMPLE DATA SEEDING (Optional, for development)
-- ============================================

-- Insert default configuration
INSERT OR IGNORE INTO configurations (id, name, description, is_public, config)
VALUES (
  'default-config',
  'Default Configuration',
  'Default benchmark configuration with balanced settings',
  TRUE,
  json_object('timeout', 30000, 'max_retries', 3, 'parallel_tests', 5)
);

-- Insert sample test cases
INSERT OR IGNORE INTO test_cases (id, name, description, category, difficulty, input_prompt, validation_rules)
VALUES
  ('test-001', 'Simple Code Generation', 'Generate a simple function', 'code-generation', 'easy', 'Write a function to add two numbers', json_object('min_length', 50, 'max_length', 500)),
  ('test-002', 'Pattern Detection', 'Test pattern detection capabilities', 'pattern-matching', 'medium', 'Analyze this code for security issues: API_KEY=sk-test123', json_object('patterns', ['API_KEY'])),
  ('test-003', 'Complex Algorithm', 'Generate a more complex algorithm', 'code-generation', 'hard', 'Implement a binary search tree', json_object('min_length', 200, 'max_length', 2000));

-- ============================================
-- MIGRATION VERSION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Insert initial migration version
INSERT OR IGNORE INTO schema_migrations (version, description)
VALUES (1, 'Initial database schema for Atheon Benchmark Dashboard');