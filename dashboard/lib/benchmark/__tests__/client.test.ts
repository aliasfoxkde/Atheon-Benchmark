/**
 * Benchmark Client Unit Tests
 * Tests for benchmark API client functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BenchmarkClient, BenchmarkConfig, BenchmarkResult } from '../client';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock EventSource for SSE streaming
const mockEventSourceInstances: any[] = [];

const MockEventSource = jest.fn().mockImplementation((url: string) => {
  const instance = {
    url,
    onmessage: null,
    onerror: null,
    readyState: 0,
    CLOSED: 2,
    close: jest.fn()
  };
  mockEventSourceInstances.push(instance);
  return instance;
});

(global as any).EventSource = MockEventSource;

describe('BenchmarkClient', () => {
  let client: BenchmarkClient;

  beforeEach(() => {
    mockFetch.mockClear();
    client = new BenchmarkClient('/api');
  });

  afterEach(() => {
    mockFetch.mockClear();
  });

  describe('Constructor', () => {
    it('should initialize with default base URL', () => {
      const defaultClient = new BenchmarkClient();
      expect(defaultClient).toBeDefined();
    });

    it('should initialize with custom base URL', () => {
      const customClient = new BenchmarkClient('/custom-api');
      expect(customClient).toBeDefined();
    });
  });

  describe('startBenchmark', () => {
    it('should start a benchmark with valid config', async () => {
      const config: BenchmarkConfig = {
        name: 'Test Benchmark',
        scenario: 'vanilla',
        testCases: 5
      };

      const mockResponse = {
        success: true,
        benchmark_id: 'bench-123',
        message: 'Benchmark started',
        benchmark: {
          id: 'bench-123',
          name: 'Test Benchmark',
          scenario: 'vanilla',
          status: 'pending',
          progress: 0,
          total_tests: 5,
          completed_tests: 0,
          results: [],
          errors: [],
          created_at: new Date().toISOString()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.startBenchmark(config);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/benchmark',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test Benchmark')
        })
      );
    });

    it('should use default test cases when not provided', async () => {
      const config: BenchmarkConfig = {
        name: 'Test Benchmark',
        scenario: 'mcp'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          benchmark_id: 'bench-456',
          message: 'Benchmark started',
          benchmark: {
            id: 'bench-456',
            name: 'Test Benchmark',
            scenario: 'mcp',
            status: 'pending',
            progress: 0,
            total_tests: 10,
            completed_tests: 0,
            results: [],
            errors: [],
            created_at: new Date().toISOString()
          }
        })
      } as Response);

      await client.startBenchmark(config);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/benchmark',
        expect.objectContaining({
          body: expect.stringContaining('"test_cases":10')
        })
      );
    });

    it('should throw error on HTTP failure', async () => {
      const config: BenchmarkConfig = {
        name: 'Test Benchmark',
        scenario: 'atheon'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(client.startBenchmark(config)).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle all scenario types', async () => {
      const scenarios: Array<BenchmarkConfig['scenario']> = ['vanilla', 'mcp', 'atheon'];

      for (const scenario of scenarios) {
        const config: BenchmarkConfig = {
          name: `Test ${scenario}`,
          scenario
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            benchmark_id: `bench-${scenario}`,
            message: 'Started',
            benchmark: {
              id: `bench-${scenario}`,
              name: config.name,
              scenario,
              status: 'pending',
              progress: 0,
              total_tests: 5,
              completed_tests: 0,
              results: [],
              errors: [],
              created_at: new Date().toISOString()
            }
          })
        } as Response);

        const result = await client.startBenchmark(config);
        expect(result.benchmark.scenario).toBe(scenario);
      }
    });
  });

  describe('getBenchmark', () => {
    it('should get benchmark by ID', async () => {
      const mockBenchmark: BenchmarkResult = {
        id: 'bench-789',
        name: 'Test Benchmark',
        scenario: 'vanilla',
        status: 'completed',
        progress: 100,
        total_tests: 10,
        completed_tests: 10,
        results: [
          {
            id: 'test-1',
            name: 'Test 1',
            configuration: 'vanilla',
            duration_ms: 1000,
            tokens_used: 100,
            passed: true,
            output: 'Success',
            timestamp: new Date().toISOString()
          }
        ],
        summary: {
          total_tests: 10,
          passed_tests: 10,
          failed_tests: 0,
          avg_duration_ms: 1000,
          total_tokens: 1000
        },
        errors: [],
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          benchmark: mockBenchmark
        })
      } as Response);

      const result = await client.getBenchmark('bench-789');

      expect(result.benchmark).toEqual(mockBenchmark);
      expect(mockFetch).toHaveBeenCalledWith('/api/benchmark?id=bench-789');
    });

    it('should throw error on HTTP failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(client.getBenchmark('nonexistent')).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle benchmark without results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          benchmark: {
            id: 'bench-empty',
            name: 'Empty Benchmark',
            scenario: 'vanilla',
            status: 'pending',
            progress: 0,
            total_tests: 0,
            completed_tests: 0,
            results: [],
            errors: [],
            created_at: new Date().toISOString()
          }
        })
      } as Response);

      const result = await client.getBenchmark('bench-empty');
      expect(result.benchmark.results).toEqual([]);
    });
  });

  describe('getAllBenchmarks', () => {
    it('should get all benchmarks', async () => {
      const mockBenchmarks: BenchmarkResult[] = [
        {
          id: 'bench-1',
          name: 'Benchmark 1',
          scenario: 'vanilla',
          status: 'completed',
          progress: 100,
          total_tests: 10,
          completed_tests: 10,
          results: [],
          errors: [],
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          id: 'bench-2',
          name: 'Benchmark 2',
          scenario: 'mcp',
          status: 'running',
          progress: 50,
          total_tests: 10,
          completed_tests: 5,
          results: [],
          errors: [],
          created_at: new Date().toISOString()
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          benchmarks: mockBenchmarks
        })
      } as Response);

      const result = await client.getAllBenchmarks();

      expect(result.benchmarks).toEqual(mockBenchmarks);
      expect(mockFetch).toHaveBeenCalledWith('/api/benchmark');
    });

    it('should handle empty benchmark list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          benchmarks: []
        })
      } as Response);

      const result = await client.getAllBenchmarks();
      expect(result.benchmarks).toEqual([]);
    });

    it('should throw error on HTTP failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      } as Response);

      await expect(client.getAllBenchmarks()).rejects.toThrow('HTTP 500: Server Error');
    });
  });

  describe('streamProgress', () => {
    beforeEach(() => {
      // Clear mock instances before each test
      mockEventSourceInstances.length = 0;
    });

    it('should stream progress updates', async () => {
      const onProgress = jest.fn();
      const onComplete = jest.fn();

      await client.streamProgress('bench-stream', onProgress, onComplete);

      // Get the last created instance
      const mockInstance = mockEventSourceInstances[mockEventSourceInstances.length - 1];
      if (mockInstance && mockInstance.onmessage) {
        mockInstance.onmessage({
          data: JSON.stringify({ type: 'progress', progress: 50 })
        });
      }

      expect(onProgress).toHaveBeenCalledWith({ type: 'progress', progress: 50 });
    });

    it('should call onComplete when benchmark completes', async () => {
      const onProgress = jest.fn();
      const onComplete = jest.fn();

      await client.streamProgress('bench-complete', onProgress, onComplete);

      const mockInstance = mockEventSourceInstances[mockEventSourceInstances.length - 1];
      if (mockInstance && mockInstance.onmessage) {
        mockInstance.onmessage({
          data: JSON.stringify({ type: 'completed', progress: 100 })
        });
      }

      expect(onProgress).toHaveBeenCalledWith({ type: 'completed', progress: 100 });
      expect(onComplete).toHaveBeenCalled();
      expect(mockInstance.close).toHaveBeenCalled();
    });

    it('should handle SSE parse errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const onProgress = jest.fn();

      await client.streamProgress('bench-error', onProgress);

      const mockInstance = mockEventSourceInstances[mockEventSourceInstances.length - 1];
      if (mockInstance && mockInstance.onmessage) {
        mockInstance.onmessage({
          data: 'invalid json{{{'
        });
      }

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle SSE errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const onProgress = jest.fn();

      await client.streamProgress('bench-sse-error', onProgress);

      const mockInstance = mockEventSourceInstances[mockEventSourceInstances.length - 1];
      if (mockInstance && mockInstance.onerror) {
        mockInstance.onerror(new Event('error'));
      }

      expect(consoleSpy).toHaveBeenCalled();
      expect(mockInstance.close).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('runBenchmark', () => {
    it('should run benchmark to completion', async () => {
      const config: BenchmarkConfig = {
        name: 'Complete Benchmark',
        scenario: 'vanilla',
        testCases: 2
      };

      // Mock startBenchmark
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          benchmark_id: 'bench-run',
          benchmark: {
            id: 'bench-run',
            name: 'Complete Benchmark',
            scenario: 'vanilla',
            status: 'running',
            progress: 0,
            total_tests: 2,
            completed_tests: 0,
            results: [],
            errors: [],
            created_at: new Date().toISOString()
          }
        })
      } as Response);

      // Mock getBenchmark calls (running then completed)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          benchmark: {
            id: 'bench-run',
            name: 'Complete Benchmark',
            scenario: 'vanilla',
            status: 'completed',
            progress: 100,
            total_tests: 2,
            completed_tests: 2,
            results: [],
            summary: {
              total_tests: 2,
              passed_tests: 2,
              failed_tests: 0,
              avg_duration_ms: 1000,
              total_tokens: 200
            },
            errors: [],
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          }
        })
      } as Response);

      const result = await client.runBenchmark(config);

      expect(result.status).toBe('completed');
      expect(result.completed_tests).toBe(2);
    });

    it('should throw error when benchmark fails to start', async () => {
      const config: BenchmarkConfig = {
        name: 'Failed Benchmark',
        scenario: 'atheon'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          benchmark_id: null,
          message: 'Failed to start'
        })
      } as Response);

      await expect(client.runBenchmark(config)).rejects.toThrow('Failed to start benchmark');
    });

    it('should poll until benchmark completes', async () => {
      const config: BenchmarkConfig = {
        name: 'Quick Benchmark',
        scenario: 'mcp',
        testCases: 2
      };

      let pollCount = 0;
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('/api/benchmark') && !url.includes('?id=')) {
          // Start benchmark call
          return {
            ok: true,
            json: async () => ({
              success: true,
              benchmark_id: 'bench-poll',
              benchmark: {
                id: 'bench-poll',
                name: 'Quick Benchmark',
                scenario: 'mcp',
                status: 'running',
                progress: 0,
                total_tests: 2,
                completed_tests: 0,
                results: [],
                errors: [],
                created_at: new Date().toISOString()
              }
            })
          } as Response;
        } else {
          // Poll call (after first poll, return completed)
          pollCount++;
          return {
            ok: true,
            json: async () => ({
              success: true,
              benchmark: {
                id: 'bench-poll',
                name: 'Quick Benchmark',
                scenario: 'mcp',
                status: 'completed',
                progress: 100,
                total_tests: 2,
                completed_tests: 2,
                results: [],
                summary: {
                  total_tests: 2,
                  passed_tests: 2,
                  failed_tests: 0,
                  avg_duration_ms: 500,
                  total_tokens: 100
                },
                errors: [],
                created_at: new Date().toISOString(),
                completed_at: new Date().toISOString()
              }
            })
          } as Response;
        }
      });

      jest.useFakeTimers({ doNotFake: ['setTimeout'] });
      const result = await client.runBenchmark(config);
      jest.useRealTimers();

      expect(result.status).toBe('completed');
      expect(pollCount).toBeGreaterThan(0);
    });
  });

  describe('BenchmarkConfig interface', () => {
    it('should accept valid configuration', () => {
      const config: BenchmarkConfig = {
        name: 'Test',
        scenario: 'vanilla',
        testCases: 10
      };

      expect(config.name).toBe('Test');
      expect(config.scenario).toBe('vanilla');
      expect(config.testCases).toBe(10);
    });

    it('should accept configuration without testCases', () => {
      const config: BenchmarkConfig = {
        name: 'Test',
        scenario: 'atheon'
      };

      expect(config.testCases).toBeUndefined();
    });
  });

  describe('BenchmarkResult interface', () => {
    it('should accept valid result structure', () => {
      const result: BenchmarkResult = {
        id: 'bench-result',
        name: 'Test Result',
        scenario: 'vanilla',
        status: 'completed',
        progress: 100,
        total_tests: 10,
        completed_tests: 10,
        results: [],
        errors: [],
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      expect(result.id).toBe('bench-result');
      expect(result.status).toBe('completed');
    });

    it('should accept result with summary', () => {
      const result: BenchmarkResult = {
        id: 'bench-result',
        name: 'Test Result',
        scenario: 'mcp',
        status: 'completed',
        progress: 100,
        total_tests: 10,
        completed_tests: 8,
        results: [],
        summary: {
          total_tests: 10,
          passed_tests: 8,
          failed_tests: 2,
          avg_duration_ms: 1500,
          total_tokens: 5000
        },
        errors: [],
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      expect(result.summary?.passed_tests).toBe(8);
      expect(result.summary?.failed_tests).toBe(2);
    });
  });
});
