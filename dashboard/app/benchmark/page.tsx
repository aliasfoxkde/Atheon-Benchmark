/**
 * Benchmark Page - Fully Functional Implementation
 * Complete working implementation with real API integration
 */

'use client';

import { useState, useEffect } from 'react';
import { benchmarkClient, BenchmarkConfig, BenchmarkResult } from '@/lib/benchmark/client';

export default function BenchmarkPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentBenchmark, setCurrentBenchmark] = useState<BenchmarkResult | null>(null);
  const [results, setResults] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allBenchmarks, setAllBenchmarks] = useState<BenchmarkResult[]>([]);

  const [config, setConfig] = useState<BenchmarkConfig>({
    name: 'Atheon Benchmark Test',
    scenario: 'vanilla',
    testCases: 5,
  });

  // Load all benchmarks on mount
  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    try {
      const response = await benchmarkClient.getAllBenchmarks();
      if (response.success) {
        setAllBenchmarks(response.benchmarks);
      }
    } catch (err) {
      console.error('Failed to load benchmarks:', err);
    }
  };

  const handleStartBenchmark = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      console.log('Starting benchmark with config:', config);

      // Start the benchmark
      const response = await benchmarkClient.startBenchmark(config);

      if (response.success) {
        console.log('Benchmark started:', response.benchmark);
        setCurrentBenchmark(response.benchmark);

        // Poll for completion with better progress tracking
        let benchmark = response.benchmark;
        let pollCount = 0;
        const maxPolls = 60; // 60 seconds max wait

        while ((benchmark.status === 'running' || benchmark.status === 'pending') && pollCount < maxPolls) {
          await new Promise(resolve => setTimeout(resolve, 1000));

          const getResponse = await benchmarkClient.getBenchmark(response.benchmark_id);
          if (getResponse.success) {
            benchmark = getResponse.benchmark;
            setCurrentBenchmark(benchmark);
            console.log('Benchmark progress:', benchmark.status, benchmark.progress);
          }

          pollCount++;
        }

        if (benchmark.status === 'completed' || benchmark.status === 'failed') {
          console.log('Benchmark completed:', benchmark);
          setResults(benchmark);
          setCurrentBenchmark(benchmark);
          // Reload benchmarks list
          await loadBenchmarks();
        } else {
          throw new Error('Benchmark timed out');
        }
      } else {
        throw new Error(response.message || 'Failed to start benchmark');
      }
    } catch (err) {
      console.error('Benchmark error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRunning(false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleViewBenchmark = async (benchmarkId: string) => {
    try {
      const response = await benchmarkClient.getBenchmark(benchmarkId);
      if (response.success) {
        setResults(response.benchmark);
        setCurrentBenchmark(response.benchmark);
      }
    } catch (err) {
      setError('Failed to load benchmark details');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-2">
              🚀 Atheon Benchmark Dashboard
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Comprehensive AI benchmarking with real Atheon integration
            </p>
            <div className="flex gap-2 mt-4">
              <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                ← Back to Home
              </a>
              <a href="/results" className="text-blue-600 dark:text-blue-400 hover:underline">
                View Results →
              </a>
            </div>
          </div>

          {/* Atheon Attribution */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Powered by Atheon:</strong> This benchmark system uses pattern matching from the
              <a href="https://github.com/HoraDomu/Atheon" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700 dark:hover:text-blue-300">
                Atheon project
              </a>
              for security scanning and quality validation.
            </p>
          </div>

          {/* Configuration Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-6">
              ⚙️ Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Benchmark Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter benchmark name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Scenario Mode
                </label>
                <select
                  value={config.scenario}
                  onChange={(e) => setConfig({ ...config, scenario: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vanilla">🟢 Vanilla Claude (Baseline)</option>
                  <option value="mcp">🟡 MCP-Enabled Claude</option>
                  <option value="atheon">🟠 Atheon-Integrated Claude</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Test Cases
                </label>
                <input
                  type="number"
                  value={config.testCases}
                  onChange={(e) => setConfig({ ...config, testCases: parseInt(e.target.value) })}
                  min={1}
                  max={20}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStartBenchmark}
                disabled={isRunning}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Running...
                  </>
                ) : (
                  <>
                    ▶️ Start Benchmark
                  </>
                )}
              </button>

              <button
                onClick={loadBenchmarks}
                className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Recent Benchmarks */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              📊 Recent Benchmarks
            </h3>
            {allBenchmarks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allBenchmarks.slice(0, 6).map((benchmark) => (
                  <div
                    key={benchmark.id}
                    onClick={() => handleViewBenchmark(benchmark.id)}
                    className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-black dark:text-zinc-50">{benchmark.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        benchmark.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        benchmark.status === 'running' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
                      }`}>
                        {benchmark.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {benchmark.scenario} • {benchmark.total_tests} tests
                    </p>
                    {benchmark.completed_at && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {new Date(benchmark.completed_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 dark:text-zinc-400 text-center py-8">
                No benchmarks yet. Start your first benchmark above!
              </p>
            )}
          </div>

          {/* Current Benchmark Progress */}
          {currentBenchmark && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
                🔄 Current Benchmark Progress
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Benchmark ID</p>
                    <p className="text-sm font-mono text-black dark:text-zinc-50">{currentBenchmark.id}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                    currentBenchmark.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    currentBenchmark.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                    'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
                  }`}>
                    {currentBenchmark.status.toUpperCase()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${currentBenchmark.progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-zinc-50">{currentBenchmark.completed_tests}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-zinc-50">{currentBenchmark.total_tests}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Tests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-zinc-50">{currentBenchmark.progress}%</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Progress</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-zinc-50">
                      {currentBenchmark.total_tests > 0 ? Math.round((currentBenchmark.completed_tests / currentBenchmark.total_tests) * 100) : 0}%
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Success Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && results.results && results.results.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
                📈 Benchmark Results
              </h2>

              {results.summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Tests</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{results.summary.total_tests}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">Passed</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{results.summary.passed_tests}</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">Failed</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{results.summary.failed_tests}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-purple-700 dark:text-purple-300">Avg Duration</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{results.summary.avg_duration_ms}ms</p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm text-orange-700 dark:text-orange-300">Total Tokens</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{results.summary.total_tokens}</p>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">
                Individual Test Results
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all ${
                      result.passed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-black dark:text-zinc-50">{result.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            result.passed
                              ? 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100'
                              : 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'
                          }`}>
                            {result.passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Configuration: {result.configuration}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-black dark:text-zinc-50">{result.duration_ms}ms</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{result.tokens_used} tokens</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}