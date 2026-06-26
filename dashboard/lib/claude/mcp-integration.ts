/**
 * MCP Claude Integration
 * Claude API integration with generic MCP (Model Context Protocol) server support
 * This implementation adds MCP tool capabilities to the baseline Claude functionality
 */

import {
  VanillaClaudeClient
} from './vanilla';

import {
  ClaudeClientConfig,
  ClaudeMessage,
  BenchmarkMetrics,
  BenchmarkResult
} from './client';

export interface MCPServer {
  name: string;
  endpoint: string;
  tools: MCPTool[];
  enabled: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler?: (input: any) => Promise<any>;
}

export interface MCPToolCall {
  name: string;
  input: Record<string, any>;
}

export interface MCPIntegrationConfig extends ClaudeClientConfig {
  mcpServers: MCPServer[];
  toolTimeout?: number;
  maxToolCalls?: number;
}

export class MCPClaudeClient extends VanillaClaudeClient {
  private mcpConfig: MCPIntegrationConfig;
  private toolCallHistory: MCPToolCall[] = [];

  constructor(config: MCPIntegrationConfig) {
    super(config);
    this.mcpConfig = {
      ...config,
      toolTimeout: config.toolTimeout || 5000,
      maxToolCalls: config.maxToolCalls || 10,
    };
  }

  /**
   * Execute with MCP tool support
   */
  async executeWithMCP(
    messages: ClaudeMessage[],
    availableTools?: MCPTool[]
  ): Promise<{
    response: any;
    metrics: BenchmarkMetrics;
    toolCalls: MCPToolCall[];
  }> {
    const startTime = Date.now();
    const tools = availableTools || this.getAllTools();
    const toolCalls: MCPToolCall[] = [];
    let response: any;
    let error: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      // Initial request with tools
      const initialRequest = {
        model: this.mcpConfig.model || 'claude-3-5-sonnet-20241022',
        max_tokens: this.mcpConfig.maxTokens || 4096,
        messages,
        tools: this.formatToolsForClaude(tools),
        temperature: this.mcpConfig.temperature,
      };

      response = await this.makeRequest(initialRequest);
      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;

      let iterations = 0;
      const maxIterations = this.mcpConfig.maxToolCalls || 10;

      // Handle tool use loops
      while (iterations < maxIterations) {
        const toolUseBlocks = response.content.filter(
          (block: any) => block.type === 'tool_use'
        );

        if (toolUseBlocks.length === 0) {
          break; // No more tool calls needed
        }

        // Execute tool calls
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block: any) => {
            const toolName = block.name;
            const toolInput = block.input;

            toolCalls.push({ name: toolName, input: toolInput });

            try {
              const result = await this.executeTool(toolName, toolInput, tools);
              return {
                tool_use_id: block.id,
                output: JSON.stringify(result),
              };
            } catch (error) {
              return {
                tool_use_id: block.id,
                output: JSON.stringify({ error: error instanceof Error ? error.message : 'Tool execution failed' }),
              };
            }
          })
        );

        // Add tool results to conversation
        const assistantMessage = {
          role: 'assistant' as const,
          content: response.content,
        };

        const userMessage = {
          role: 'user' as const,
          content: toolResults,
        };

        messages.push(assistantMessage, userMessage);

        // Make next request
        const nextRequest = {
          model: this.mcpConfig.model || 'claude-3-5-sonnet-20241022',
          max_tokens: this.mcpConfig.maxTokens || 4096,
          messages,
          tools: this.formatToolsForClaude(tools),
          temperature: this.mcpConfig.temperature,
        };

        response = await this.makeRequest(nextRequest);
        inputTokens += response.usage.input_tokens;
        outputTokens += response.usage.output_tokens;

        iterations++;
      }

      this.toolCallHistory.push(...toolCalls);

      const metrics: BenchmarkMetrics = {
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        success: true,
      };

      return { response, metrics, toolCalls };

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error occurred';

      const metrics: BenchmarkMetrics = {
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        success: false,
        errorMessage: error,
      };

      throw new Error(`MCP Claude execution failed: ${error}`);
    }
  }

  /**
   * Run benchmark with MCP tools
   */
  async runBenchmarkWithMCP(
    benchmarkId: string,
    testCaseId: string,
    testCaseName: string,
    prompt: string,
    systemPrompt?: string,
    availableTools?: MCPTool[]
  ): Promise<BenchmarkResult & { toolCalls: MCPToolCall[] }> {
    const messages: ClaudeMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    try {
      const { response, metrics, toolCalls } = await this.executeWithMCP(messages, availableTools);

      const output = response.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');

      return {
        benchmarkId,
        testCaseId,
        testCaseName,
        configuration: 'mcp',
        claudeVersion: this.mcpConfig.model || 'unknown',
        metrics,
        output,
        passed: true,
        toolCalls,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        benchmarkId,
        testCaseId,
        testCaseName,
        configuration: 'mcp',
        claudeVersion: this.mcpConfig.model || 'unknown',
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
        toolCalls: [],
      };
    }
  }

  /**
   * Execute a specific tool
   */
  private async executeTool(
    toolName: string,
    toolInput: Record<string, any>,
    availableTools: MCPTool[]
  ): Promise<any> {
    const tool = availableTools.find(t => t.name === toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    if (tool.handler) {
      // Execute local handler
      return await tool.handler(toolInput);
    } else {
      // Execute via MCP server
      return await this.executeMCPTool(toolName, toolInput);
    }
  }

  /**
   * Execute tool via MCP server
   */
  private async executeMCPTool(toolName: string, toolInput: Record<string, any>): Promise<any> {
    const startTime = Date.now();
    const traceId = `mcp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

    // Find the server that hosts this tool
    const server = this.mcpConfig.mcpServers.find(s =>
      s.tools.some(t => t.name === toolName)
    );

    if (!server) {
      throw new Error(`No server found for tool: ${toolName}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.mcpConfig.toolTimeout);

    try {
      const response = await fetch(`${server.endpoint}/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-ID': traceId,
        },
        body: JSON.stringify(toolInput),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      console.log(`[MCP Trace] ${traceId} ${toolName} completed in ${duration}ms`);

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      console.error(`[MCP Trace] ${traceId} ${toolName} failed after ${duration}ms:`, error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Tool execution timeout exceeded');
        }
        throw error;
      }

      throw new Error('Unknown tool execution error');
    }
  }

  /**
   * Get all tools from all enabled servers
   */
  private getAllTools(): MCPTool[] {
    const allTools: MCPTool[] = [];

    for (const server of this.mcpConfig.mcpServers) {
      if (server.enabled) {
        allTools.push(...server.tools);
      }
    }

    return allTools;
  }

  /**
   * Format tools for Claude API
   */
  private formatToolsForClaude(tools: MCPTool[]): any[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  /**
   * Get tool call history
   */
  getToolCallHistory(): MCPToolCall[] {
    return [...this.toolCallHistory];
  }

  /**
   * Clear tool call history
   */
  clearToolCallHistory(): void {
    this.toolCallHistory = [];
  }

  /**
   * Get MCP configuration
   */
  getMCPConfig(): MCPIntegrationConfig {
    return { ...this.mcpConfig };
  }
}

// Factory function for creating MCP Claude clients
export function createMCPClaudeClient(config: MCPIntegrationConfig): MCPClaudeClient {
  return new MCPClaudeClient(config);
}

// Example tool definitions for testing
export const EXAMPLE_MCP_TOOLS: MCPTool[] = [
  {
    name: 'get_current_time',
    description: 'Get the current time in a specific timezone',
    inputSchema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'IANA timezone name (e.g., "America/New_York")',
        },
      },
    },
    handler: async (input) => {
      const timezone = input.timezone || 'UTC';
      return new Date().toLocaleString('en-US', { timeZone: timezone });
    },
  },
  {
    name: 'calculate',
    description: 'Perform basic mathematical calculations',
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate',
        },
      },
      required: ['expression'],
    },
    handler: async (input) => {
      try {
        // Validate expression contains only safe mathematical characters
        const safePattern = /^[\d+\-*/().%\s]+$/;
        if (!safePattern.test(input.expression)) {
          throw new Error('Expression contains invalid characters');
        }
        // Safe recursive descent parser - no Function() or eval()
        const expr = input.expression.replace(/\s+/g, '');
        let pos = 0;

        function parseExpression(): number {
          let left = parseTerm();
          while (pos < expr.length) {
            const op = expr[pos];
            if (op === '+' || op === '-') {
              pos++;
              const right = parseTerm();
              left = op === '+' ? left + right : left - right;
            } else {
              break;
            }
          }
          return left;
        }

        function parseTerm(): number {
          let left = parseFactor();
          while (pos < expr.length) {
            const op = expr[pos];
            if (op === '*' || op === '/' || op === '%') {
              pos++;
              const right = parseFactor();
              if (op === '*') left = left * right;
              else if (op === '/') left = left / right;
              else left = left % right;
            } else {
              break;
            }
          }
          return left;
        }

        function parseFactor(): number {
          if (expr[pos] === '(') {
            pos++;
            const result = parseExpression();
            if (expr[pos] !== ')') throw new Error('Missing closing parenthesis');
            pos++;
            return result;
          }
          let numStr = '';
          while (pos < expr.length && /[\d.]/.test(expr[pos])) {
            numStr += expr[pos++];
          }
          if (numStr === '') throw new Error('Expected number');
          return parseFloat(numStr);
        }

        const result = parseExpression();
        return { result };
      } catch (error) {
        throw new Error(`Invalid expression: ${input.expression}`);
      }
    },
  },
];