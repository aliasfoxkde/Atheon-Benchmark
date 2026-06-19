/**
 * Claude Integration Layer - Main Export
 * This module exports all Claude integration implementations for benchmarking
 */

export {
  VanillaClaudeClient,
  createVanillaClaudeClient
} from './vanilla';

export {
  DEFAULT_CLAUDE_CONFIG,
  CLAUDE_MODELS
} from './client';

export {
  MCPClaudeClient,
  createMCPClaudeClient,
  EXAMPLE_MCP_TOOLS,
  type MCPTool,
  type MCPServer,
  type MCPIntegrationConfig,
  type MCPToolCall
} from './mcp-integration';

export {
  AtheonClaudeClient,
  createAtheonClaudeClient,
  ATHEON_PATTERNS,
  ATHEON_CATEGORIES,
  DEFAULT_ATHEON_CONFIG,
  DEFAULT_QUALITY_GATES,
  type AtheonPattern,
  type AtheonFinding,
  type AtheonConfig,
  type AtheonIntegrationConfig
} from './atheon-integration';

export {
  type ClaudeClientConfig,
  type ClaudeMessage,
  type ClaudeAPIRequest,
  type ClaudeAPIResponse,
  type ClaudeAPIError,
  type BenchmarkMetrics,
  type BenchmarkResult,
  type ClaudeModel
} from './client';

// Re-export factory functions for convenience
export { createVanillaClaudeClient as createClient } from './vanilla';