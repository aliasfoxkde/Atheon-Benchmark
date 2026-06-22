/**
 * Benchmark Configurations
 * Predefined configurations for different benchmark scenarios
 */

import { TestGenerationConfig, PREDEFINED_CONFIGS } from './test-cases';

// Default retry count for API calls
export const DEFAULT_MAX_RETRIES = 3;

// Define BenchmarkConfig locally since we're in a different directory structure
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

/**
 * Complete benchmark configuration for different scenarios
 */
export interface BenchmarkScenario {
  id: string;
  name: string;
  description: string;
  test_configs: TestGenerationConfig[];
  claude_config: {
    model: string;
    timeout: number;
    max_retries: number;
  };
  mcp_config?: {
    enabled: boolean;
    servers: string[];
  };
  atheon_config?: {
    enabled: boolean;
    categories: string[];
    severity: ('critical' | 'high' | 'medium' | 'low')[];
  };
  quality_gates?: {
    enabled: boolean;
    strict: boolean;
    allowed_findings?: number;
  };
  execution: {
    parallel_tests: number;
    warmup_runs: number;
    cooldown_ms: number;
  };
  metadata: {
    expected_duration_ms: number;
    estimated_cost_usd: number;
    complexity_score: number;
  };
}

/**
 * Predefined benchmark scenarios
 */
export const BENCHMARK_SCENARIOS: BenchmarkScenario[] = [
  {
    id: 'vanilla-baseline',
    name: 'Vanilla Claude Baseline',
    description: 'Baseline benchmark with vanilla Claude API (no MCP or Atheon)',
    test_configs: [
      PREDEFINED_CONFIGS['basic-code-generation'],
      PREDEFINED_CONFIGS['security-scan'],
    ],
    claude_config: {
      model: 'claude-3-5-sonnet-20241022',
      timeout: 30000,
      max_retries: DEFAULT_MAX_RETRIES,
    },
    execution: {
      parallel_tests: 5,
      warmup_runs: 2,
      cooldown_ms: 1000,
    },
    metadata: {
      expected_duration_ms: 60000,
      estimated_cost_usd: 0.05,
      complexity_score: 30,
    },
  },
  {
    id: 'mcp-enabled',
    name: 'MCP-Enabled Benchmark',
    description: 'Benchmark with generic MCP tool integration',
    test_configs: [
      PREDEFINED_CONFIGS['basic-code-generation'],
      PREDEFINED_CONFIGS['security-scan'],
    ],
    claude_config: {
      model: 'claude-3-5-sonnet-20241022',
      timeout: 45000,
      max_retries: DEFAULT_MAX_RETRIES,
    },
    mcp_config: {
      enabled: true,
      servers: ['time-server', 'calculator'],
    },
    execution: {
      parallel_tests: 5,
      warmup_runs: 2,
      cooldown_ms: 1000,
    },
    metadata: {
      expected_duration_ms: 80000,
      estimated_cost_usd: 0.08,
      complexity_score: 50,
    },
  },
  {
    id: 'atheon-integrated',
    name: 'Atheon-Integrated Benchmark',
    description: 'Benchmark with Atheon pattern matching and quality gates',
    test_configs: [
      PREDEFINED_CONFIGS['basic-code-generation'],
      PREDEFINED_CONFIGS['security-scan'],
      PREDEFINED_CONFIGS['pattern-matching-hard'],
    ],
    claude_config: {
      model: 'claude-3-5-sonnet-20241022',
      timeout: 60000,
      max_retries: DEFAULT_MAX_RETRIES,
    },
    mcp_config: {
      enabled: true,
      servers: ['atheon-mcp'],
    },
    atheon_config: {
      enabled: true,
      categories: ['secrets', 'code-quality', 'security'],
      severity: ['critical', 'high', 'medium'],
    },
    quality_gates: {
      enabled: true,
      strict: false,
      allowed_findings: 5,
    },
    execution: {
      parallel_tests: 3,
      warmup_runs: 1,
      cooldown_ms: 2000,
    },
    metadata: {
      expected_duration_ms: 120000,
      estimated_cost_usd: 0.15,
      complexity_score: 70,
    },
  },
  {
    id: 'comprehensive-comparison',
    name: 'Comprehensive Comparison',
    description: 'Full comparison across all configurations with extensive test cases',
    test_configs: [
      PREDEFINED_CONFIGS['basic-code-generation'],
      PREDEFINED_CONFIGS['security-scan'],
      PREDEFINED_CONFIGS['pattern-matching-hard'],
      {
        category: 'analysis',
        difficulty: 'medium',
        count: 8,
        claude_model: 'claude-3-5-sonnet-20241022',
        tags: ['analysis', 'comprehensive'],
      },
      {
        category: 'optimization',
        difficulty: 'hard',
        count: 4,
        claude_model: 'claude-3-5-sonnet-20241022',
        tags: ['optimization', 'hard'],
      },
    ],
    claude_config: {
      model: 'claude-3-5-sonnet-20241022',
      timeout: 60000,
      max_retries: DEFAULT_MAX_RETRIES,
    },
    execution: {
      parallel_tests: 4,
      warmup_runs: 2,
      cooldown_ms: 1500,
    },
    metadata: {
      expected_duration_ms: 300000,
      estimated_cost_usd: 0.50,
      complexity_score: 85,
    },
  },
];

/**
 * Configuration for different comparison modes
 */
export const COMPARISON_CONFIGS = {
  /**
   * Compare vanilla vs MCP vs Atheon
   */
  'full-comparison': {
    configurations: ['vanilla-baseline', 'mcp-enabled', 'atheon-integrated'],
    test_configs: [
      PREDEFINED_CONFIGS['basic-code-generation'],
      PREDEFINED_CONFIGS['security-scan'],
    ],
    metrics: ['duration', 'tokens', 'accuracy', 'cost'],
    statistical_tests: ['t-test', 'mann-whitney', 'anova'],
  },

  /**
   * Compare different Claude models
   */
  'model-comparison': {
    configurations: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    test_configs: [PREDEFINED_CONFIGS['basic-code-generation']],
    metrics: ['duration', 'tokens', 'cost', 'accuracy'],
    statistical_tests: ['t-test'],
  },

  /**
   * Compare Atheon vs non-Atheon
   */
  'atheon-impact': {
    configurations: ['vanilla-baseline', 'atheon-integrated'],
    test_configs: [
      PREDEFINED_CONFIGS['security-scan'],
      PREDEFINED_CONFIGS['pattern-matching-hard'],
    ],
    metrics: ['duration', 'tokens', 'findings', 'quality-gates'],
    statistical_tests: ['t-test', 'mann-whitney'],
  },
};

/**
 * Get benchmark scenario by ID
 */
export function getBenchmarkScenario(id: string): BenchmarkScenario | undefined {
  return BENCHMARK_SCENARIOS.find(scenario => scenario.id === id);
}

/**
 * Get all benchmark scenario IDs
 */
export function getBenchmarkScenarioIds(): string[] {
  return BENCHMARK_SCENARIOS.map(scenario => scenario.id);
}

/**
 * Create custom benchmark configuration
 */
export function createBenchmarkConfig(
  id: string,
  name: string,
  description: string,
  options: Partial<BenchmarkScenario> = {}
): BenchmarkScenario {
  return {
    id,
    name,
    description,
    test_configs: options.test_configs || [PREDEFINED_CONFIGS['basic-code-generation']],
    claude_config: options.claude_config || {
      model: 'claude-3-5-sonnet-20241022',
      timeout: 30000,
      max_retries: DEFAULT_MAX_RETRIES,
    },
    mcp_config: options.mcp_config,
    atheon_config: options.atheon_config,
    quality_gates: options.quality_gates,
    execution: options.execution || {
      parallel_tests: 5,
      warmup_runs: 2,
      cooldown_ms: 1000,
    },
    metadata: options.metadata || {
      expected_duration_ms: 60000,
      estimated_cost_usd: 0.05,
      complexity_score: 30,
    },
  };
}

/**
 * Validate benchmark configuration
 */
export function validateBenchmarkConfig(config: BenchmarkScenario): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.id || config.id.trim() === '') {
    errors.push('Configuration ID is required');
  }

  if (!config.name || config.name.trim() === '') {
    errors.push('Configuration name is required');
  }

  if (!config.test_configs || config.test_configs.length === 0) {
    errors.push('At least one test configuration is required');
  }

  if (!config.claude_config || !config.claude_config.model) {
    errors.push('Claude model is required');
  }

  if (!config.execution) {
    errors.push('Execution configuration is required');
  } else {
    if (config.execution.parallel_tests < 1) {
      errors.push('Parallel tests must be at least 1');
    }
    if (config.execution.warmup_runs < 0) {
      errors.push('Warmup runs cannot be negative');
    }
    if (config.execution.cooldown_ms < 0) {
      errors.push('Cooldown cannot be negative');
    }
  }

  // Validate MCP configuration
  if (config.mcp_config?.enabled) {
    if (!config.mcp_config.servers || config.mcp_config.servers.length === 0) {
      errors.push('MCP servers are required when MCP is enabled');
    }
  }

  // Validate Atheon configuration
  if (config.atheon_config?.enabled) {
    if (!config.atheon_config.categories || config.atheon_config.categories.length === 0) {
      errors.push('Atheon categories are required when Atheon is enabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}