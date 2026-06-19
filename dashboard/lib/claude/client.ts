/**
 * Claude API Client Configuration and Types
 * This module provides the base configuration and types for Claude API integration
 */

export interface ClaudeClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  baseURL?: string;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
}

export interface ClaudeAPIRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  temperature?: number;
  top_k?: number;
  top_p?: number;
  tools?: any[];
  tool_choice?: any;
  stream?: boolean;
}

export interface ClaudeAPIResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text?: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeAPIError {
  type: string;
  error: {
    type: string;
    message: string;
  };
}

export interface BenchmarkMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  success: boolean;
  errorMessage?: string;
}

export interface BenchmarkResult {
  benchmarkId: string;
  testCaseId: string;
  testCaseName: string;
  configuration: 'vanilla' | 'mcp' | 'atheon';
  claudeVersion: string;
  metrics: BenchmarkMetrics;
  output: string;
  passed: boolean;
  error?: string;
}

// Default Claude configuration
export const DEFAULT_CLAUDE_CONFIG: Partial<ClaudeClientConfig> = {
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 30000,
};

// Available Claude models for benchmarking
export const CLAUDE_MODELS = {
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet (latest)',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
  'claude-3-haiku-20240307': 'Claude 3 Haiku',
} as const;

export type ClaudeModel = keyof typeof CLAUDE_MODELS;