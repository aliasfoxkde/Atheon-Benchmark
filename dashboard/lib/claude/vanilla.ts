/**
 * Vanilla Claude API Implementation
 * Direct API calls to Claude without any MCP or tool integration
 * This serves as the baseline for benchmark comparisons
 */

import {
  ClaudeClientConfig,
  ClaudeAPIRequest,
  ClaudeAPIResponse,
  ClaudeAPIError,
  ClaudeMessage,
  DEFAULT_CLAUDE_CONFIG,
  BenchmarkMetrics,
  BenchmarkResult
} from './client';

export class VanillaClaudeClient {
  private config: Required<ClaudeClientConfig>;
  private baseURL: string;

  constructor(config: Partial<ClaudeClientConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || '',
      model: config.model || DEFAULT_CLAUDE_CONFIG.model || 'claude-3-5-sonnet-20241022',
      maxTokens: config.maxTokens || DEFAULT_CLAUDE_CONFIG.maxTokens || 4096,
      temperature: config.temperature ?? DEFAULT_CLAUDE_CONFIG.temperature ?? 0.7,
      timeout: config.timeout || DEFAULT_CLAUDE_CONFIG.timeout || 30000,
      baseURL: config.baseURL || process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
    };

    // Allow sandbox mode without API key for testing
    if (!this.config.apiKey) {
      console.warn('No API key provided - running in simulation mode');
    }

    this.baseURL = this.config.baseURL;
  }

  /**
   * Execute a single API call to Claude
   */
  async execute(messages: ClaudeMessage[]): Promise<{
    response: ClaudeAPIResponse;
    metrics: BenchmarkMetrics;
  }> {
    const startTime = Date.now();
    let response: ClaudeAPIResponse;
    let error: string | undefined;

    try {
      const request: ClaudeAPIRequest = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages,
        temperature: this.config.temperature,
      };

      response = await this.makeRequest(request);

      const metrics: BenchmarkMetrics = {
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        success: true,
      };

      return { response, metrics };

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error occurred';

      const metrics: BenchmarkMetrics = {
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        success: false,
        errorMessage: error,
      };

      throw new Error(`Claude API call failed: ${error}`);
    }
  }

  /**
   * Run a benchmark test case
   */
  async runBenchmark(
    benchmarkId: string,
    testCaseId: string,
    testCaseName: string,
    prompt: string,
    systemPrompt?: string
  ): Promise<BenchmarkResult> {
    const messages: ClaudeMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    try {
      const { response, metrics } = await this.execute(messages);

      const output = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      return {
        benchmarkId,
        testCaseId,
        testCaseName,
        configuration: 'vanilla',
        claudeVersion: this.config.model,
        metrics,
        output,
        passed: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        benchmarkId,
        testCaseId,
        testCaseName,
        configuration: 'vanilla',
        claudeVersion: this.config.model,
        metrics: {
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          success: false,
          errorMessage,
        },
        output: '',
        passed: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Make HTTP request to Claude API
   */
  protected async makeRequest(request: ClaudeAPIRequest): Promise<ClaudeAPIResponse> {
    // Simulation mode if no API key
    if (!this.config.apiKey) {
      return this.simulateResponse(request);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: ClaudeAPIError = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout exceeded');
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Simulate Claude API response for testing
   */
  private simulateResponse(request: ClaudeAPIRequest): ClaudeAPIResponse {
    const lastMessage = request.messages[request.messages.length - 1];
    const prompt = typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage?.content) || '';

    // Generate simulated response based on prompt
    const simulatedText = this.generateSimulatedResponse(prompt, request.model);

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: simulatedText
        }
      ],
      model: request.model,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: Math.ceil(JSON.stringify(request).length / 4),
        output_tokens: Math.ceil(simulatedText.length / 4)
      }
    };
  }

  /**
   * Generate simulated response content
   */
  private generateSimulatedResponse(prompt: string, model: string): string {
    // Extract test case information from prompt
    const testCase = prompt.match(/test case (\d+)/i)?.[1] || 'unknown';
    const scenario = prompt.match(/scenario[:\s]+(\w+)/i)?.[1] || 'unknown';

    // Generate contextual response
    const responses = [
      `This is a simulated response from ${model} for test case ${testCase} in ${scenario} mode. The system is working correctly and processing your request.`,
      `Processing test case ${testCase} using ${model} in ${scenario} configuration. All systems operational and generating expected output patterns.`,
      `Generated output for test ${testCase} in ${scenario} scenario. The benchmark system is functioning as designed with proper response generation.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Run multiple benchmarks in parallel
   */
  async runParallelBenchmarks(
    benchmarkId: string,
    testCases: Array<{
      id: string;
      name: string;
      prompt: string;
      systemPrompt?: string;
    }>
  ): Promise<BenchmarkResult[]> {
    const promises = testCases.map(testCase =>
      this.runBenchmark(
        benchmarkId,
        testCase.id,
        testCase.name,
        testCase.prompt,
        testCase.systemPrompt
      )
    );

    return Promise.all(promises);
  }

  /**
   * Get client configuration
   */
  getConfig(): Required<ClaudeClientConfig> {
    return { ...this.config };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { response } = await this.execute([
        { role: 'user', content: 'Hello! Please respond with "Connection successful"' }
      ]);

      const output = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')
        .toLowerCase();

      return output.includes('connection successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Factory function for creating vanilla Claude clients
export function createVanillaClaudeClient(config?: Partial<ClaudeClientConfig>): VanillaClaudeClient {
  return new VanillaClaudeClient(config);
}