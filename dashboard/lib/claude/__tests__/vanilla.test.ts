/**
 * Vanilla Claude Client Unit Tests
 * Tests for the baseline Claude API client
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  VanillaClaudeClient,
  createVanillaClaudeClient
} from '../vanilla';
import {
  ClaudeClientConfig,
  ClaudeMessage,
  DEFAULT_CLAUDE_CONFIG,
  CLAUDE_MODELS
} from '../client';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('VanillaClaudeClient', () => {
  let client: VanillaClaudeClient;

  beforeEach(() => {
    mockFetch.mockClear();
    // Suppress console warnings during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with default config', () => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should accept custom API key', () => {
      client = new VanillaClaudeClient({ apiKey: 'custom-key' });
      const config = client.getConfig();
      expect(config.apiKey).toBe('custom-key');
    });

    it('should accept custom model', () => {
      client = new VanillaClaudeClient({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229'
      });
      const config = client.getConfig();
      expect(config.model).toBe('claude-3-opus-20240229');
    });

    it('should use default model when not provided', () => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });
      const config = client.getConfig();
      expect(config.model).toBe(DEFAULT_CLAUDE_CONFIG.model);
    });

    it('should accept custom max tokens', () => {
      client = new VanillaClaudeClient({
        apiKey: 'test-key',
        maxTokens: 2048
      });
      const config = client.getConfig();
      expect(config.maxTokens).toBe(2048);
    });

    it('should accept custom temperature', () => {
      client = new VanillaClaudeClient({
        apiKey: 'test-key',
        temperature: 0.5
      });
      const config = client.getConfig();
      expect(config.temperature).toBe(0.5);
    });

    it('should accept custom timeout', () => {
      client = new VanillaClaudeClient({
        apiKey: 'test-key',
        timeout: 60000
      });
      const config = client.getConfig();
      expect(config.timeout).toBe(60000);
    });

    it('should accept custom base URL', () => {
      client = new VanillaClaudeClient({
        apiKey: 'test-key',
        baseURL: 'https://custom.api.com'
      });
      const config = client.getConfig();
      expect(config.baseURL).toBe('https://custom.api.com');
    });

    it('should warn when no API key provided', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      new VanillaClaudeClient();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No API key provided')
      );

      process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should use environment variable for API key', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'env-key';

      client = new VanillaClaudeClient();
      const config = client.getConfig();
      expect(config.apiKey).toBe('env-key');

      process.env.ANTHROPIC_API_KEY = originalKey;
    });
  });

  describe('execute - Simulation Mode', () => {
    beforeEach(() => {
      // No API key, so it uses simulation mode
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      client = new VanillaClaudeClient({});
      process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should execute in simulation mode without API key', async () => {
      const messages: ClaudeMessage[] = [
        { role: 'user', content: 'Hello, test case 1 in vanilla scenario' }
      ];

      const { response, metrics } = await client.execute(messages);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(metrics).toBeDefined();
      expect(metrics.success).toBe(true);
    });

    it('should return simulated response with text content', async () => {
      const messages: ClaudeMessage[] = [
        { role: 'user', content: 'Test case 5 in mcp scenario' }
      ];

      const { response } = await client.execute(messages);
      const textContent = response.content.find(c => c.type === 'text');

      expect(textContent).toBeDefined();
      expect(textContent?.text).toBeTruthy();
    });

    it('should calculate tokens in simulation mode', async () => {
      const messages: ClaudeMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const { metrics } = await client.execute(messages);

      expect(metrics.inputTokens).toBeGreaterThan(0);
      expect(metrics.outputTokens).toBeGreaterThan(0);
      expect(metrics.totalTokens).toBe(metrics.inputTokens + metrics.outputTokens);
    });

    it('should record start and end times', async () => {
      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];

      const before = Date.now();
      const { metrics } = await client.execute(messages);
      const after = Date.now();

      expect(metrics.startTime).toBeGreaterThanOrEqual(before);
      expect(metrics.endTime).toBeLessThanOrEqual(after);
      expect(metrics.duration).toBe(metrics.endTime - metrics.startTime);
    });

    it('should generate unique message IDs', async () => {
      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];

      const { response: r1 } = await client.execute(messages);
      const { response: r2 } = await client.execute(messages);

      expect(r1.id).not.toBe(r2.id);
      expect(r1.id).toMatch(/^msg_/);
    });
  });

  describe('execute - API Mode', () => {
    beforeEach(() => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });
    });

    it('should make API request with proper headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];
      await client.execute(messages);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/messages'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-key',
            'anthropic-version': '2023-06-01'
          })
        })
      );
    });

    it('should include request body with messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test prompt' }];
      await client.execute(messages);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.messages).toEqual(messages);
      expect(body.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          type: 'error',
          error: { type: 'invalid_request', message: 'Invalid model' }
        })
      } as Response);

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];

      await expect(client.execute(messages)).rejects.toThrow('Invalid model');
    });

    it('should handle generic HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({})
      } as Response);

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];

      await expect(client.execute(messages)).rejects.toThrow('Internal Server Error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];

      await expect(client.execute(messages)).rejects.toThrow('Claude API call failed');
    });

    it('should handle request timeout', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];

      await expect(client.execute(messages)).rejects.toThrow('Request timeout');
    });
  });

  describe('runBenchmark', () => {
    beforeEach(() => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });
    });

    it('should run benchmark with all parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      const result = await client.runBenchmark(
        'bench-1',
        'test-1',
        'Test Name',
        'Test prompt',
        'You are a helpful assistant'
      );

      expect(result.benchmarkId).toBe('bench-1');
      expect(result.testCaseId).toBe('test-1');
      expect(result.testCaseName).toBe('Test Name');
      expect(result.configuration).toBe('vanilla');
      expect(result.passed).toBe(true);
    });

    it('should include system prompt in messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      await client.runBenchmark(
        'bench-1',
        'test-1',
        'Test',
        'User prompt',
        'System instruction'
      );

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
    });

    it('should combine text content from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [
            { type: 'text', text: 'First line' },
            { type: 'text', text: 'Second line' }
          ],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      const result = await client.runBenchmark('b', 't', 'n', 'p');

      expect(result.output).toContain('First line');
      expect(result.output).toContain('Second line');
    });

    it('should handle benchmark failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const result = await client.runBenchmark('b', 't', 'n', 'p');

      expect(result.passed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metrics.success).toBe(false);
      expect(result.metrics.errorMessage).toBeDefined();
    });

    it('should use model as claudeVersion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-opus-20240229',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      client = new VanillaClaudeClient({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229'
      });

      const result = await client.runBenchmark('b', 't', 'n', 'p');
      expect(result.claudeVersion).toBe('claude-3-opus-20240229');
    });
  });

  describe('runParallelBenchmarks', () => {
    beforeEach(() => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });
    });

    it('should run multiple benchmarks in parallel', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const results = await client.runParallelBenchmarks('bench-1', [
        { id: 't1', name: 'Test 1', prompt: 'Prompt 1' },
        { id: 't2', name: 'Test 2', prompt: 'Prompt 2' },
        { id: 't3', name: 'Test 3', prompt: 'Prompt 3' }
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].testCaseId).toBe('t1');
      expect(results[1].testCaseId).toBe('t2');
      expect(results[2].testCaseId).toBe('t3');
    });

    it('should handle empty test cases array', async () => {
      const results = await client.runParallelBenchmarks('bench-1', []);
      expect(results).toEqual([]);
    });

    it('should pass system prompts correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await client.runParallelBenchmarks('bench-1', [
        { id: 't1', name: 'Test 1', prompt: 'Prompt 1', systemPrompt: 'Be helpful' }
      ]);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.messages).toHaveLength(2);
    });
  });

  describe('testConnection', () => {
    it('should test API connection successfully', async () => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Connection successful!' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 5, output_tokens: 10 }
        })
      } as Response);

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });

      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await client.testConnection();
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('getConfig', () => {
    it('should return copy of config', () => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });

      const config1 = client.getConfig();
      const config2 = client.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Should be a copy
    });

    it('should return full config with all required fields', () => {
      client = new VanillaClaudeClient({ apiKey: 'test-key' });
      const config = client.getConfig();

      expect(config.apiKey).toBeDefined();
      expect(config.model).toBeDefined();
      expect(config.maxTokens).toBeDefined();
      expect(config.temperature).toBeDefined();
      expect(config.timeout).toBeDefined();
      expect(config.baseURL).toBeDefined();
    });
  });
});

describe('createVanillaClaudeClient', () => {
  it('should create VanillaClaudeClient instance', () => {
    const client = createVanillaClaudeClient({ apiKey: 'test-key' });
    expect(client).toBeInstanceOf(VanillaClaudeClient);
  });

  it('should accept partial config', () => {
    const client = createVanillaClaudeClient({ apiKey: 'test-key' });
    expect(client).toBeDefined();
  });
});

describe('DEFAULT_CLAUDE_CONFIG', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_CLAUDE_CONFIG.model).toBe('claude-3-5-sonnet-20241022');
    expect(DEFAULT_CLAUDE_CONFIG.maxTokens).toBe(4096);
    expect(DEFAULT_CLAUDE_CONFIG.temperature).toBe(0.7);
    expect(DEFAULT_CLAUDE_CONFIG.timeout).toBe(30000);
  });
});

describe('CLAUDE_MODELS', () => {
  it('should include all expected models', () => {
    expect(CLAUDE_MODELS['claude-3-5-sonnet-20241022']).toBeDefined();
    expect(CLAUDE_MODELS['claude-3-5-haiku-20241022']).toBeDefined();
    expect(CLAUDE_MODELS['claude-3-opus-20240229']).toBeDefined();
    expect(CLAUDE_MODELS['claude-3-sonnet-20240229']).toBeDefined();
    expect(CLAUDE_MODELS['claude-3-haiku-20240307']).toBeDefined();
  });
});
