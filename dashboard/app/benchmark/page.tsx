/**
 * Benchmark Page - Real Atheon Performance Metrics
 *
 * This page displays real benchmark results from actual Atheon pattern matching runs.
 * Metrics include: ns/op, files/sec, bytes/sec, memory usage, CPU%, and findings.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Cpu, HardDrive, Clock, Zap, MemoryStick, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { BenchmarkTrending } from '@/components/benchmark-trending';
import { PatternBreakdown } from '@/components/pattern-breakdown';
import { VersionComparison } from '@/components/version-comparison';
import { BenchmarkExport } from '@/components/benchmark-export';

interface BenchmarkMetric {
  ns_per_op: number;
  bytes_per_sec: number;
  files_per_sec: number;
  ops_per_sec: number;
  alloced_bytes_per_op: number;
  allocations_per_op: number;
  peak_rss_bytes: number;
  cpu_percent: number;
  findings_count: number;
  files_scanned: number;
  bytes_scanned: number;
}

interface SystemInfo {
  hostname: string;
  cpu: string;
  ram: string;
  os: string;
  arch: string;
  go_version: string;
  atheon_version: string;
}

interface BenchmarkResult {
  system_id: string;
  system_info: SystemInfo;
  benchmarks: Array<{
    id: string;
    name: string;
    category: string;
    duration_ms: number;
    files_scanned: number;
    bytes_scanned: number;
    findings: number;
    ns_per_op: number;
    passed: boolean;
    output: string;
  }>;
  metrics: BenchmarkMetric;
  summary: {
    total_tests: number;
    passed: number;
    failed: number;
    avg_duration_ms: number;
    total_tokens: number;
  };
  submitted_at: string;
}

export default function BenchmarkPage() {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResult[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load benchmark data from static JSON
    fetch('/benchmark-results.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        setBenchmarkData(data);
        if (data.length > 0) {
          setSelectedBenchmark(data[0]);
        }
        setIsLoading(false);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load benchmarks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load benchmark data');
        setIsLoading(false);
      });
  }, []);

  const formatNumber = (n: number): string => {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(0);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
    return bytes.toFixed(0) + ' B';
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getScore = (benchmark: BenchmarkResult): number => {
    const { metrics } = benchmark;
    const speedScore = Math.min(100, (1e9 / metrics.ns_per_op) * 10);
    const filesScore = Math.min(100, (metrics.files_per_sec / 1e6) * 100);
    const qualityScore = metrics.findings_count > 0 ? Math.min(100, (metrics.findings_count / 100) * 100) : 50;
    return Math.round((speedScore + filesScore + qualityScore) / 3);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin delay-75"></div>
          </div>
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 font-medium">Loading benchmark data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Unable to Load Benchmarks</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
            >
              Retry
            </button>
            <a
              href="https://github.com/aliasfoxkde/Atheon-Benchmark-Results"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl transition-colors"
            >
              View Repository
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Benchmark Results</h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Real performance metrics from Atheon pattern matching
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/results"
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <span>View All Results</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Benchmark Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {benchmarkData.map((benchmark) => {
              const score = getScore(benchmark);
              const isSelected = selectedBenchmark?.system_id === benchmark.system_id;
              return (
                <button
                  key={benchmark.system_id}
                  onClick={() => setSelectedBenchmark(benchmark)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScoreBg(score)}`}>
                      <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                        {benchmark.system_info.hostname}
                      </p>
                      <p className="text-xs text-zinc-500">{benchmark.system_info.os}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Benchmark Details */}
        {selectedBenchmark && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                  <span className="text-xs text-zinc-500 uppercase">Speed</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatNumber(selectedBenchmark.metrics.ns_per_op)}
                </p>
                <p className="text-xs text-zinc-500">ns/op</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-blue-500" aria-hidden="true" />
                  <span className="text-xs text-zinc-500 uppercase">Files</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatNumber(selectedBenchmark.metrics.files_per_sec)}
                </p>
                <p className="text-xs text-zinc-500">files/sec</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-green-500" aria-hidden="true" />
                  <span className="text-xs text-zinc-500 uppercase">CPU</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedBenchmark.metrics.cpu_percent.toFixed(0)}%
                </p>
                <p className="text-xs text-zinc-500">utilization</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MemoryStick className="w-4 h-4 text-purple-500" aria-hidden="true" />
                  <span className="text-xs text-zinc-500 uppercase">Memory</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatBytes(selectedBenchmark.metrics.peak_rss_bytes)}
                </p>
                <p className="text-xs text-zinc-500">peak RSS</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Performance Trend */}
              <BenchmarkTrending
                currentMetrics={{
                  ns_per_op: selectedBenchmark.metrics.ns_per_op,
                  files_per_sec: selectedBenchmark.metrics.files_per_sec,
                  bytes_per_sec: selectedBenchmark.metrics.bytes_per_sec,
                  findings_count: selectedBenchmark.metrics.findings_count,
                  files_scanned: selectedBenchmark.metrics.files_scanned,
                  cpu_percent: selectedBenchmark.metrics.cpu_percent,
                }}
                systemId={selectedBenchmark.system_id}
              />

              {/* Pattern Breakdown */}
              <PatternBreakdown
                findingsCount={selectedBenchmark.metrics.findings_count}
                systemId={selectedBenchmark.system_id}
              />
            </div>

            {/* Individual Benchmark Results */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Individual Results</h2>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {selectedBenchmark.benchmarks.map((benchmark) => (
                  <div key={benchmark.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {benchmark.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                      )}
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{benchmark.name}</p>
                        <p className="text-sm text-zinc-500">{benchmark.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDuration(benchmark.duration_ms)}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {formatNumber(benchmark.files_scanned)} files
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="mb-8">
              <BenchmarkExport data={selectedBenchmark} filename={`benchmark-${selectedBenchmark.system_id}`} />
            </div>

            {/* System Info */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">System Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Hostname</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedBenchmark.system_info.hostname}</p>
                </div>
                <div>
                  <p className="text-zinc-500">CPU</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedBenchmark.system_info.cpu}</p>
                </div>
                <div>
                  <p className="text-zinc-500">OS</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedBenchmark.system_info.os} ({selectedBenchmark.system_info.arch})</p>
                </div>
                <div>
                  <p className="text-zinc-500">Go Version</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedBenchmark.system_info.go_version}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedBenchmark && benchmarkData.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Play className="w-8 h-8 text-zinc-400" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No Benchmarks Yet</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">Run your first benchmark to see results here.</p>
            <a
              href="https://github.com/aliasfoxkde/Atheon-Benchmark"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
