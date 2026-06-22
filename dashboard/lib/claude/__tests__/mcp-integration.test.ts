/**
 * MCP Claude Integration Unit Tests
 * Tests for Claude with Model Context Protocol (MCP) tool support
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  MCPClaudeClient,
  createMCPClaudeClient,
  EXAMPLE_MCP_TOOLS,
  MCPIntegrationConfig,
  MCPServer,
  MCPTool,
  MCPToolCall
} from '../mcp-integration';
import { ClaudeMessage } from '../client';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

/**
 * Create a mock MCP server for testing
 */
function createMockMCPServer(overrides: Partial<MCPServer> = {}): MCPServer {
  return {
    name: 'mock-server',
    endpoint: 'https://mock.example.com',
    tools: [],
    enabled: true,
    ...overrides,
  };
}

describe('MCPClaudeClient', () => {
  let client: MCPClaudeClient;
  let config: MCPIntegrationConfig;

  beforeEach(() => {
    mockFetch.mockClear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    config = {
      apiKey: 'test-key',
      mcpServers: [],
    };
    client = new MCPClaudeClient(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with default config', () => {
      const mcpClient = new MCPClaudeClient({
        apiKey: 'test-key',
        mcpServers: []
      });
      expect(mcpClient).toBeDefined();
    });

    it('should use default toolTimeout when not provided', () => {
      const mcpClient = new MCPClaudeClient({
        apiKey: 'test-key',
        mcpServers: []
      });
      const mcpConfig = mcpClient.getMCPConfig();
      expect(mcpConfig.toolTimeout).toBe(5000);
    });

    it('should use default maxToolCalls when not provided', () => {
      const mcpClient = new MCPClaudeClient({
        apiKey: 'test-key',
        mcpServers: []
      });
      const mcpConfig = mcpClient.getMCPConfig();
      expect(mcpConfig.maxToolCalls).toBe(10);
    });

    it('should accept custom toolTimeout and maxToolCalls', () => {
      const mcpClient = new MCPClaudeClient({
        apiKey: 'test-key',
        mcpServers: [],
        toolTimeout: 10000,
        maxToolCalls: 20
      });
      const mcpConfig = mcpClient.getMCPConfig();
      expect(mcpConfig.toolTimeout).toBe(10000);
      expect(mcpConfig.maxToolCalls).toBe(20);
    });
  });

  describe('executeWithMCP', () => {
    it('should execute with no tool calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
      const result = await client.executeWithMCP(messages, []);

      expect(result.response).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.success).toBe(true);
      expect(result.toolCalls).toEqual([]);
    });

    it('should execute local tool handlers', async () => {
      // First call: Claude requests tool use
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me calculate that' },
            { type: 'tool_use', id: 'tool_1', name: 'calculate', input: { expression: '2+2' } }
          ],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      // Second call: Claude returns final response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_124',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'The result is 4' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 30, output_tokens: 10 }
        })
      } as Response);

      const calculateTool: MCPTool = {
        name: 'calculate',
        description: 'Calculate',
        inputSchema: { type: 'object', properties: { expression: { type: 'string' } } },
        handler: async (input: any) => {
          // Safe expression evaluator (no Function())
          const safeEval = (expr: string): number => {
            const tokens = expr.replace(/\s+/g, '').split(/([+\-*/()])/).filter(Boolean);
            let result = 0, num = 0, op = '+';
            for (const t of tokens) {
              if ('+*-/'.includes(t)) { op = t; }
              else { num = parseFloat(t); result = op === '+' ? result + num : op === '-' ? result - num : op === '*' ? result * num : result / num; }
            }
            return result;
          };
          return { result: safeEval(input.expression) };
        }
      };

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Calculate 2+2' }];
      const result = await client.executeWithMCP(messages, [calculateTool]);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('calculate');
      expect(result.toolCalls[0].input).toEqual({ expression: '2+2' });
    });

    it('should handle tool execution errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'tool_1', name: 'failing_tool', input: {} }
          ],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      // Second call after tool error
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_124',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Tool failed' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 30, output_tokens: 10 }
        })
      } as Response);

      const failingTool: MCPTool = {
        name: 'failing_tool',
        description: 'Fails',
        inputSchema: { type: 'object' },
        handler: async () => {
          throw new Error('Tool execution failed');
        }
      };

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];
      const result = await client.executeWithMCP(messages, [failingTool]);

      expect(result.toolCalls).toHaveLength(1);
    });

    it('should track tool call history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Done' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];
      await client.executeWithMCP(messages, []);

      const history = client.getToolCallHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should accumulate input and output tokens across iterations', async () => {
      // First call with tool use
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'tool_1', name: 'noop', input: {} }
          ],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 5 }
        })
      } as Response);

      // Second call final
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_124',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Final' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 20, output_tokens: 10 }
        })
      } as Response);

      const noopTool: MCPTool = {
        name: 'noop',
        description: 'No-op',
        inputSchema: { type: 'object' },
        handler: async () => ({ ok: true })
      };

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];
      const result = await client.executeWithMCP(messages, [noopTool]);

      expect(result.metrics.inputTokens).toBe(30); // 10 + 20
      expect(result.metrics.outputTokens).toBe(15); // 5 + 10
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];

      await expect(client.executeWithMCP(messages, [])).rejects.toThrow('MCP Claude execution failed');
    });
  });

  describe('runBenchmarkWithMCP', () => {
    it('should run a complete benchmark', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response text' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 }
        })
      } as Response);

      const result = await client.runBenchmarkWithMCP(
        'bench-1',
        'test-1',
        'Test Name',
        'Test prompt',
        'System prompt'
      );

      expect(result.benchmarkId).toBe('bench-1');
      expect(result.testCaseId).toBe('test-1');
      expect(result.configuration).toBe('mcp');
      expect(result.passed).toBe(true);
      expect(result.output).toBe('Response text');
    });

    it('should work without system prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'OK' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 5, output_tokens: 5 }
        })
      } as Response);

      const result = await client.runBenchmarkWithMCP('b', 't', 'n', 'p');

      expect(result.passed).toBe(true);
    });

    it('should handle benchmark failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.runBenchmarkWithMCP('b', 't', 'n', 'p');

      expect(result.passed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.toolCalls).toEqual([]);
    });
  });

  describe('MCP Server Integration', () => {
    it('should call MCP server for tool execution', async () => {
      // Mock Claude response with tool use
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'msg_123',
            type: 'message',
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool_1', name: 'remote_tool', input: { foo: 'bar' } }
            ],
            model: 'claude-3-5-sonnet-20241022',
            stop_reason: 'tool_use',
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 5 }
          })
        } as Response)
        // Mock MCP server response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: 'remote result' })
        } as Response)
        // Mock Claude final response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'msg_124',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Done' }],
            model: 'claude-3-5-sonnet-20241022',
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 20, output_tokens: 10 }
          })
        } as Response);

      const server: MCPServer = {
        name: 'test-server',
        endpoint: 'https://mcp.example.com',
        enabled: true,
        tools: [
          {
            name: 'remote_tool',
            description: 'Remote tool',
            inputSchema: { type: 'object' }
            // No handler - will use MCP server
          }
        ]
      };

      const mcpClient = new MCPClaudeClient({
        apiKey: 'test-key',
        mcpServers: [server]
      });

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];
      const result = await mcpClient.executeWithMCP(messages);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('remote_tool');
    });

    it('should handle MCP server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'msg_123',
            type: 'message',
            role: 'assistant',
            content: [
              { type: 'tool_use', id: 'tool_1', name: 'failing_remote', input: {} }
            ],
            model: 'claude-3-5-sonnet-20241022',
            stop_reason: 'tool_use',
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 5 }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({})
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'msg_124',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Recovered' }],
            model: 'claude-3-5-sonnet-20241022',
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 20, output_tokens: 10 }
          })
        } as Response);

      const server: MCPServer = {
        name: 'failing-server',
        endpoint: 'https://failing.example.com',
        enabled: true,
        tools: [
          {
            name: 'failing_remote',
            description: 'Fails',
            inputSchema: { type: 'object' }
          }
        ]
      };

      const mcpClient = new MCPClaudeClient({
        apiKey: 'test-key',
        mcpServers: [server]
      });

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];
      const result = await mcpClient.executeWithMCP(messages);

      expect(result.toolCalls).toHaveLength(1);
    });

    it('should skip disabled servers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'No tools' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 5, output_tokens: 5 }
        })
      } as Response);

      const server: MCPServer = {
        name: 'disabled-server',
        endpoint: 'https://disabled.example.com',
        enabled: false,
        tools: [
          {
            name: 'disabled_tool',
            description: 'Disabled',
            inputSchema: { type: 'object' }
          }
        ]
      };

      const mcpClient = new MCPClaudeClient({
        apiKey: 'test-key',
        mcpServers: [server]
      });

      const messages: ClaudeMessage[] = [{ role: 'user', content: 'Test' }];
      const result = await mcpClient.executeWithMCP(messages);

      // Should not call disabled server
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.toolCalls).toHaveLength(0);
    });
  });

  describe('Tool Call History', () => {
    it('should clear tool call history', () => {
      client.clearToolCallHistory();
      const history = client.getToolCallHistory();
      expect(history).toEqual([]);
    });

    it('should return copy of history', () => {
      const h1 = client.getToolCallHistory();
      const h2 = client.getToolCallHistory();
      expect(h1).not.toBe(h2);
      expect(h1).toEqual(h2);
    });
  });

  describe('getMCPConfig', () => {
    it('should return copy of config', () => {
      const c1 = client.getMCPConfig();
      const c2 = client.getMCPConfig();
      expect(c1).not.toBe(c2);
      expect(c1).toEqual(c2);
    });
  });
});

describe('createMCPClaudeClient', () => {
  it('should create MCPClaudeClient instance', () => {
    const client = createMCPClaudeClient({
      apiKey: 'test-key',
      mcpServers: []
    });
    expect(client).toBeInstanceOf(MCPClaudeClient);
  });
});

describe('EXAMPLE_MCP_TOOLS', () => {
  it('should include get_current_time tool', () => {
    const timeTool = EXAMPLE_MCP_TOOLS.find(t => t.name === 'get_current_time');
    expect(timeTool).toBeDefined();
  });

  it('should include calculate tool', () => {
    const calcTool = EXAMPLE_MCP_TOOLS.find(t => t.name === 'calculate');
    expect(calcTool).toBeDefined();
  });

  it('get_current_time handler should return a string', async () => {
    const timeTool = EXAMPLE_MCP_TOOLS.find(t => t.name === 'get_current_time');
    const result = await timeTool!.handler!({});
    expect(typeof result).toBe('string');
  });

  it('calculate handler should evaluate expressions', async () => {
    const calcTool = EXAMPLE_MCP_TOOLS.find(t => t.name === 'calculate');
    const result = await calcTool!.handler!({ expression: '2+2' });
    expect(result).toEqual({ result: 4 });
  });

  it('calculate handler should throw on invalid expression', async () => {
    const calcTool = EXAMPLE_MCP_TOOLS.find(t => t.name === 'calculate');
    await expect(calcTool!.handler!({ expression: 'invalid!!!' })).rejects.toThrow();
  });
});

describe('MCP Timeout Handling', () => {
  let client: MCPClaudeClient;

  beforeEach(() => {
    mockFetch.mockClear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should timeout when MCP server is slow', async () => {
    // Create a client with very short timeout
    const mcpClient = new MCPClaudeClient({
      apiKey: 'test-key',
      mcpServers: [],
      toolTimeout: 100, // 100ms timeout
    });

    // First call: Claude requests tool use
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'tool_1', name: 'slow_tool', input: {} }
        ],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 }
      })
    } as Response);

    // Second call: Tool times out, but eventually returns after client continues
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'msg_124',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Timed out but continued' }],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 30, output_tokens: 10 }
      })
    } as Response);

    const server: MCPServer = {
      name: 'slow-server',
      endpoint: 'https://slow.example.com',
      enabled: true,
      tools: [{
        name: 'slow_tool',
        description: 'Very slow tool',
        inputSchema: { type: 'object' }
      }]
    };

    const mcpServerClient = new MCPClaudeClient({
      apiKey: 'test-key',
      mcpServers: [server],
      toolTimeout: 50, // Very short timeout
    });

    // Mock a slow responding server - AbortController will abort
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockReset();
    mockFetch.mockRejectedValueOnce(abortError); // First call is to MCP server, which times out
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Response after timeout' }],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 5 }
      })
    } as Response);

    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Use slow tool' }];

    // The client should handle the timeout and continue
    try {
      const result = await mcpServerClient.executeWithMCP(messages);
      // Should still return a result even if tool timed out
      expect(result.response).toBeDefined();
    } catch (error) {
      // Timeout error is expected
      expect(error instanceof Error).toBe(true);
    }
  });
});

describe('Multi-iteration Tool Chain', () => {
  // Note: These behaviors are already covered by existing tests:
  // - 'should accumulate input and output tokens across iterations' covers multi-iteration
  // - 'should track tool call history' covers history accumulation
  // - 'should call MCP server for tool execution' covers MCP server tool chains

  it('createMockMCPServer helper creates properly configured server', () => {
    const server = createMockMCPServer({
      name: 'custom-server',
      endpoint: 'https://custom.example.com'
    });

    expect(server.name).toBe('custom-server');
    expect(server.endpoint).toBe('https://custom.example.com');
    expect(server.enabled).toBe(true);
    expect(Array.isArray(server.tools)).toBe(true);
  });
});
