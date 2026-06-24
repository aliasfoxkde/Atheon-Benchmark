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

// Circuit breaker states
export enum CircuitBreakerState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failing, return fallback
  HALF_OPEN = 'half_open' // Testing recovery
}

export interface CircuitBreakerConfig {
  failureThreshold: number;  // Number of failures before opening (default: 5)
  resetTimeout: number;      // Time in ms before trying half-open (default: 60000)
  monitorWindow: number;     // Time window for counting failures in ms (default: 30000)
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  consecutiveSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private consecutiveSuccesses: number = 0;
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeout: config.resetTimeout ?? 60000,
      monitorWindow: config.monitorWindow ?? 30000,
    };
  }

  private get stats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      consecutiveSuccesses: this.consecutiveSuccesses,
    };
  }

  private isWindowExpired(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime > this.config.monitorWindow;
  }

  private shouldAttemptReset(): boolean {
    if (this.state !== CircuitBreakerState.OPEN) return false;
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  private transitionTo(state: CircuitBreakerState): void {
    this.state = state;
    if (state === CircuitBreakerState.HALF_OPEN) {
      this.consecutiveSuccesses = 0;
    }
  }

  /**
   * Record a successful call - closes circuit after enough successes in half-open
   */
  recordSuccess(): void {
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= 3) {
        // 3 consecutive successes in half-open closes the circuit
        this.transitionTo(CircuitBreakerState.CLOSED);
        this.failureCount = 0;
        this.consecutiveSuccesses = 0;
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
      this.consecutiveSuccesses++;
    }
  }

  /**
   * Record a failed call - opens circuit after threshold failures
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.consecutiveSuccesses = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open opens the circuit again
      this.transitionTo(CircuitBreakerState.OPEN);
    } else if (this.state === CircuitBreakerState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold || this.isWindowExpired()) {
        this.transitionTo(CircuitBreakerState.OPEN);
      }
    }
  }

  /**
   * Get current circuit state, attempting reset to half-open if needed
   */
  getState(): CircuitBreakerState {
    if (this.state === CircuitBreakerState.OPEN && this.shouldAttemptReset()) {
      this.transitionTo(CircuitBreakerState.HALF_OPEN);
    }
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return this.stats;
  }

  /**
   * Check if a call can be executed (circuit is not open)
   */
  canExecute(): boolean {
    return this.getState() !== CircuitBreakerState.OPEN;
  }

  /**
   * Get fallback response when circuit is open
   */
  getFallbackResponse(request: ClaudeAPIRequest): ClaudeAPIResponse {
    return {
      id: `fallback_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: '[Circuit breaker open - service temporarily unavailable. Please retry later.]'
      }],
      model: request.model,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0
      }
    };
  }
}

// Default circuit breaker configuration
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000,
  monitorWindow: 30000,
};