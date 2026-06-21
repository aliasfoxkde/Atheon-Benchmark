/**
 * Benchmark Configurations Unit Tests
 * Tests for predefined benchmark scenarios and configurations
 */

import { describe, it, expect } from '@jest/globals';
import {
  BenchmarkConfig,
  BenchmarkScenario,
  BENCHMARK_SCENARIOS,
  COMPARISON_CONFIGS,
  getBenchmarkScenario,
  getBenchmarkScenarioIds,
  createBenchmarkConfig,
  validateBenchmarkConfig
} from '../configurations';

describe('BenchmarkConfig Interface', () => {
  it('should accept valid benchmark configuration', () => {
    const config: BenchmarkConfig = {
      timeout: 30000,
      max_retries: 3,
      parallel_tests: 5,
      claude_model: 'claude-3-5-sonnet-20241022',
      mcp_config: {
        enabled: true,
        servers: ['server1', 'server2']
      },
      atheon_config: {
        enabled: true,
        categories: ['security', 'code-quality']
      },
      quality_gates: {
        enabled: true,
        strict: false
      }
    };

    expect(config.timeout).toBe(30000);
    expect(config.max_retries).toBe(3);
    expect(config.parallel_tests).toBe(5);
    expect(config.mcp_config?.enabled).toBe(true);
  });

  it('should accept minimal configuration', () => {
    const config: BenchmarkConfig = {
      timeout: 10000,
      max_retries: 1,
      parallel_tests: 1
    };

    expect(config.timeout).toBe(10000);
    expect(config.max_retries).toBe(1);
    expect(config.parallel_tests).toBe(1);
  });
});

describe('BenchmarkScenario Interface', () => {
  it('should accept valid scenario configuration', () => {
    const scenario: BenchmarkScenario = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'A test scenario',
      test_configs: [],
      claude_config: {
        model: 'claude-3-5-sonnet-20241022',
        timeout: 30000,
        max_retries: 3
      },
      execution: {
        parallel_tests: 5,
        warmup_runs: 2,
        cooldown_ms: 1000
      },
      metadata: {
        expected_duration_ms: 60000,
        estimated_cost_usd: 0.05,
        complexity_score: 30
      }
    };

    expect(scenario.id).toBe('test-scenario');
    expect(scenario.claude_config.model).toBe('claude-3-5-sonnet-20241022');
    expect(scenario.execution.parallel_tests).toBe(5);
  });
});

describe('BENCHMARK_SCENARIOS', () => {
  it('should export non-empty array', () => {
    expect(BENCHMARK_SCENARIOS).toBeDefined();
    expect(BENCHMARK_SCENARIOS.length).toBeGreaterThan(0);
  });

  it('should contain predefined scenarios', () => {
    const scenarioIds = BENCHMARK_SCENARIOS.map(s => s.id);
    expect(scenarioIds).toContain('vanilla-baseline');
    expect(scenarioIds).toContain('mcp-enabled');
    expect(scenarioIds).toContain('atheon-integrated');
    expect(scenarioIds).toContain('comprehensive-comparison');
  });

  it('should have scenarios with valid structure', () => {
    BENCHMARK_SCENARIOS.forEach(scenario => {
      expect(scenario).toHaveProperty('id');
      expect(scenario).toHaveProperty('name');
      expect(scenario).toHaveProperty('description');
      expect(scenario).toHaveProperty('test_configs');
      expect(scenario).toHaveProperty('claude_config');
      expect(scenario).toHaveProperty('execution');
      expect(scenario).toHaveProperty('metadata');
    });
  });

  it('should have unique scenario IDs', () => {
    const ids = BENCHMARK_SCENARIOS.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  describe('vanilla-baseline scenario', () => {
    let scenario: BenchmarkScenario;

    beforeAll(() => {
      scenario = getBenchmarkScenario('vanilla-baseline')!;
    });

    it('should exist', () => {
      expect(scenario).toBeDefined();
    });

    it('should have correct configuration', () => {
      expect(scenario.id).toBe('vanilla-baseline');
      expect(scenario.name).toBe('Vanilla Claude Baseline');
      expect(scenario.execution.parallel_tests).toBe(5);
      expect(scenario.execution.warmup_runs).toBe(2);
      expect(scenario.execution.cooldown_ms).toBe(1000);
    });

    it('should not have MCP or Atheon config', () => {
      expect(scenario.mcp_config).toBeUndefined();
      expect(scenario.atheon_config).toBeUndefined();
    });

    it('should have reasonable timeouts', () => {
      expect(scenario.claude_config.timeout).toBe(30000);
      expect(scenario.claude_config.max_retries).toBe(3);
    });
  });

  describe('mcp-enabled scenario', () => {
    let scenario: BenchmarkScenario;

    beforeAll(() => {
      scenario = getBenchmarkScenario('mcp-enabled')!;
    });

    it('should exist', () => {
      expect(scenario).toBeDefined();
    });

    it('should have MCP configuration', () => {
      expect(scenario.mcp_config).toBeDefined();
      expect(scenario.mcp_config?.enabled).toBe(true);
      expect(scenario.mcp_config?.servers).toContain('time-server');
      expect(scenario.mcp_config?.servers).toContain('calculator');
    });

    it('should have longer timeout for MCP overhead', () => {
      expect(scenario.claude_config.timeout).toBe(45000);
    });

    it('should have metadata with cost estimate', () => {
      expect(scenario.metadata.estimated_cost_usd).toBeGreaterThan(0);
      expect(scenario.metadata.complexity_score).toBeGreaterThan(0);
    });
  });

  describe('atheon-integrated scenario', () => {
    let scenario: BenchmarkScenario;

    beforeAll(() => {
      scenario = getBenchmarkScenario('atheon-integrated')!;
    });

    it('should exist', () => {
      expect(scenario).toBeDefined();
    });

    it('should have Atheon configuration', () => {
      expect(scenario.atheon_config).toBeDefined();
      expect(scenario.atheon_config?.enabled).toBe(true);
      expect(scenario.atheon_config?.categories).toContain('secrets');
      expect(scenario.atheon_config?.categories).toContain('security');
    });

    it('should have quality gates configuration', () => {
      expect(scenario.quality_gates).toBeDefined();
      expect(scenario.quality_gates?.enabled).toBe(true);
      expect(scenario.quality_gates?.strict).toBe(false);
      expect(scenario.quality_gates?.allowed_findings).toBe(5);
    });

    it('should have both MCP and Atheon', () => {
      expect(scenario.mcp_config).toBeDefined();
      expect(scenario.mcp_config?.enabled).toBe(true);
      expect(scenario.atheon_config).toBeDefined();
      expect(scenario.atheon_config?.enabled).toBe(true);
    });

    it('should have higher complexity score', () => {
      expect(scenario.metadata.complexity_score).toBe(70);
    });
  });

  describe('comprehensive-comparison scenario', () => {
    let scenario: BenchmarkScenario;

    beforeAll(() => {
      scenario = getBenchmarkScenario('comprehensive-comparison')!;
    });

    it('should exist', () => {
      expect(scenario).toBeDefined();
    });

    it('should have multiple test configurations', () => {
      expect(scenario.test_configs.length).toBeGreaterThan(2);
    });

    it('should include different categories', () => {
      const categories = scenario.test_configs.map(c => c.category);
      expect(categories).toContain('code-generation');
      expect(categories).toContain('security');
      expect(categories).toContain('analysis');
      expect(categories).toContain('optimization');
    });

    it('should have highest complexity score', () => {
      expect(scenario.metadata.complexity_score).toBe(85);
    });

    it('should have longer expected duration', () => {
      expect(scenario.metadata.expected_duration_ms).toBe(300000);
    });
  });
});

describe('COMPARISON_CONFIGS', () => {
  it('should export comparison configurations', () => {
    expect(COMPARISON_CONFIGS).toBeDefined();
    expect(Object.keys(COMPARISON_CONFIGS).length).toBeGreaterThan(0);
  });

  it('should contain predefined comparison modes', () => {
    expect(COMPARISON_CONFIGS).toHaveProperty('full-comparison');
    expect(COMPARISON_CONFIGS).toHaveProperty('model-comparison');
    expect(COMPARISON_CONFIGS).toHaveProperty('atheon-impact');
  });

  describe('full-comparison config', () => {
    it('should compare all main configurations', () => {
      const config = COMPARISON_CONFIGS['full-comparison'];
      expect(config.configurations).toContain('vanilla-baseline');
      expect(config.configurations).toContain('mcp-enabled');
      expect(config.configurations).toContain('atheon-integrated');
    });

    it('should have multiple metrics', () => {
      const config = COMPARISON_CONFIGS['full-comparison'];
      expect(config.metrics).toContain('duration');
      expect(config.metrics).toContain('tokens');
      expect(config.metrics).toContain('accuracy');
      expect(config.metrics).toContain('cost');
    });

    it('should have statistical tests', () => {
      const config = COMPARISON_CONFIGS['full-comparison'];
      expect(config.statistical_tests.length).toBeGreaterThan(0);
    });
  });

  describe('model-comparison config', () => {
    it('should have model configurations', () => {
      const config = COMPARISON_CONFIGS['model-comparison'];
      expect(config.configurations.length).toBeGreaterThan(0);
    });

    it('should focus on performance metrics', () => {
      const config = COMPARISON_CONFIGS['model-comparison'];
      expect(config.metrics).toContain('duration');
      expect(config.metrics).toContain('tokens');
    });
  });

  describe('atheon-impact config', () => {
    it('should compare vanilla vs Atheon', () => {
      const config = COMPARISON_CONFIGS['atheon-impact'];
      expect(config.configurations).toContain('vanilla-baseline');
      expect(config.configurations).toContain('atheon-integrated');
    });

    it('should include quality gate metrics', () => {
      const config = COMPARISON_CONFIGS['atheon-impact'];
      expect(config.metrics).toContain('findings');
      expect(config.metrics).toContain('quality-gates');
    });
  });
});

describe('getBenchmarkScenario', () => {
  it('should return scenario for valid ID', () => {
    const scenario = getBenchmarkScenario('vanilla-baseline');
    expect(scenario).toBeDefined();
    expect(scenario?.id).toBe('vanilla-baseline');
  });

  it('should return undefined for invalid ID', () => {
    const scenario = getBenchmarkScenario('non-existent-scenario');
    expect(scenario).toBeUndefined();
  });

  it('should return correct scenario for each valid ID', () => {
    const ids = BENCHMARK_SCENARIOS.map(s => s.id);
    ids.forEach(id => {
      const scenario = getBenchmarkScenario(id);
      expect(scenario?.id).toBe(id);
    });
  });

  it('should return scenario objects with all required properties', () => {
    const scenario = getBenchmarkScenario('mcp-enabled');
    expect(scenario).toHaveProperty('id');
    expect(scenario).toHaveProperty('name');
    expect(scenario).toHaveProperty('description');
    expect(scenario).toHaveProperty('test_configs');
    expect(scenario).toHaveProperty('claude_config');
    expect(scenario).toHaveProperty('execution');
    expect(scenario).toHaveProperty('metadata');
  });
});

describe('getBenchmarkScenarioIds', () => {
  it('should return array of IDs', () => {
    const ids = getBenchmarkScenarioIds();
    expect(Array.isArray(ids)).toBe(true);
  });

  it('should return all scenario IDs', () => {
    const ids = getBenchmarkScenarioIds();
    expect(ids.length).toBe(BENCHMARK_SCENARIOS.length);
  });

  it('should contain expected IDs', () => {
    const ids = getBenchmarkScenarioIds();
    expect(ids).toContain('vanilla-baseline');
    expect(ids).toContain('mcp-enabled');
    expect(ids).toContain('atheon-integrated');
  });

  it('should have unique IDs', () => {
    const ids = getBenchmarkScenarioIds();
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });
});

describe('createBenchmarkConfig', () => {
  it('should create config with required fields', () => {
    const config = createBenchmarkConfig('custom-1', 'Custom', 'A custom config');
    expect(config.id).toBe('custom-1');
    expect(config.name).toBe('Custom');
    expect(config.description).toBe('A custom config');
  });

  it('should use default test_configs', () => {
    const config = createBenchmarkConfig('c', 'n', 'd');
    expect(config.test_configs).toBeDefined();
    expect(Array.isArray(config.test_configs)).toBe(true);
  });

  it('should use default claude_config', () => {
    const config = createBenchmarkConfig('c', 'n', 'd');
    expect(config.claude_config.model).toBe('claude-3-5-sonnet-20241022');
    expect(config.claude_config.timeout).toBe(30000);
    expect(config.claude_config.max_retries).toBe(3);
  });

  it('should use default execution config', () => {
    const config = createBenchmarkConfig('c', 'n', 'd');
    expect(config.execution.parallel_tests).toBe(5);
    expect(config.execution.warmup_runs).toBe(2);
    expect(config.execution.cooldown_ms).toBe(1000);
  });

  it('should use default metadata', () => {
    const config = createBenchmarkConfig('c', 'n', 'd');
    expect(config.metadata.expected_duration_ms).toBe(60000);
    expect(config.metadata.estimated_cost_usd).toBe(0.05);
    expect(config.metadata.complexity_score).toBe(30);
  });

  it('should accept partial options override', () => {
    const config = createBenchmarkConfig('c', 'n', 'd', {
      claude_config: { model: 'claude-3-opus', timeout: 60000, max_retries: 5 },
      execution: { parallel_tests: 10, warmup_runs: 5, cooldown_ms: 2000 },
    });
    expect(config.claude_config.model).toBe('claude-3-opus');
    expect(config.claude_config.timeout).toBe(60000);
    expect(config.execution.parallel_tests).toBe(10);
  });

  it('should accept MCP config', () => {
    const config = createBenchmarkConfig('c', 'n', 'd', {
      mcp_config: { enabled: true, servers: ['s1'] },
    });
    expect(config.mcp_config?.enabled).toBe(true);
    expect(config.mcp_config?.servers).toContain('s1');
  });

  it('should accept Atheon config', () => {
    const config = createBenchmarkConfig('c', 'n', 'd', {
      atheon_config: { enabled: true, categories: ['secrets'] },
    });
    expect(config.atheon_config?.enabled).toBe(true);
    expect(config.atheon_config?.categories).toContain('secrets');
  });
});

describe('validateBenchmarkConfig', () => {
  it('should validate a complete valid config', () => {
    const config = createBenchmarkConfig('c', 'n', 'd');
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject empty ID', () => {
    const config = createBenchmarkConfig('', 'n', 'd');
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Configuration ID is required');
  });

  it('should reject whitespace-only ID', () => {
    const config = createBenchmarkConfig('   ', 'n', 'd');
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
  });

  it('should reject empty name', () => {
    const config = createBenchmarkConfig('c', '', 'd');
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Configuration name is required');
  });

  it('should reject empty test_configs', () => {
    const config = { ...createBenchmarkConfig('c', 'n', 'd'), test_configs: [] };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one test configuration is required');
  });

  it('should reject missing claude_config model', () => {
    const config = { ...createBenchmarkConfig('c', 'n', 'd'), claude_config: { timeout: 30000, max_retries: 3 } };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Claude model is required');
  });

  it('should reject missing execution', () => {
    const config = { ...createBenchmarkConfig('c', 'n', 'd'), execution: undefined };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Execution configuration is required');
  });

  it('should reject parallel_tests < 1', () => {
    const config = { ...createBenchmarkConfig('c', 'n', 'd'), execution: { parallel_tests: 0, warmup_runs: 0, cooldown_ms: 0 } };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Parallel tests must be at least 1');
  });

  it('should reject negative warmup_runs', () => {
    const config = { ...createBenchmarkConfig('c', 'n', 'd'), execution: { parallel_tests: 1, warmup_runs: -1, cooldown_ms: 0 } };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Warmup runs cannot be negative');
  });

  it('should reject negative cooldown_ms', () => {
    const config = { ...createBenchmarkConfig('c', 'n', 'd'), execution: { parallel_tests: 1, warmup_runs: 0, cooldown_ms: -1 } };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Cooldown cannot be negative');
  });

  it('should reject MCP enabled without servers', () => {
    const config = { ...createBenchmarkConfig('c', 'n', 'd'), mcp_config: { enabled: true, servers: [] } };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('MCP servers are required when MCP is enabled');
  });

  it('should reject Atheon enabled without categories', () => {
    const config = { ...createBenchmarkConfig('c', 'n', 'd'), atheon_config: { enabled: true, categories: [] } };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Atheon categories are required when Atheon is enabled');
  });

  it('should return multiple errors', () => {
    const config = { ...createBenchmarkConfig('', '', 'd'), test_configs: [], execution: undefined };
    const result = validateBenchmarkConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('Configuration values validation', () => {
  it('should have positive timeout values', () => {
    BENCHMARK_SCENARIOS.forEach(scenario => {
      expect(scenario.claude_config.timeout).toBeGreaterThan(0);
    });
  });

  it('should have positive max_retries values', () => {
    BENCHMARK_SCENARIOS.forEach(scenario => {
      expect(scenario.claude_config.max_retries).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have positive parallel_tests values', () => {
    BENCHMARK_SCENARIOS.forEach(scenario => {
      expect(scenario.execution.parallel_tests).toBeGreaterThan(0);
    });
  });

  it('should have reasonable complexity scores (0-100)', () => {
    BENCHMARK_SCENARIOS.forEach(scenario => {
      expect(scenario.metadata.complexity_score).toBeGreaterThanOrEqual(0);
      expect(scenario.metadata.complexity_score).toBeLessThanOrEqual(100);
    });
  });

  it('should have positive cost estimates', () => {
    BENCHMARK_SCENARIOS.forEach(scenario => {
      expect(scenario.metadata.estimated_cost_usd).toBeGreaterThan(0);
    });
  });

  it('should have positive duration estimates', () => {
    BENCHMARK_SCENARIOS.forEach(scenario => {
      expect(scenario.metadata.expected_duration_ms).toBeGreaterThan(0);
    });
  });
});
