/**
 * Benchmark Page - Real Atheon Performance Metrics
 *
 * This page displays real benchmark results from actual Atheon pattern matching runs.
 * Metrics include: ns/op, files/sec, bytes/sec, memory usage, CPU%, and findings.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Cpu, HardDrive, Clock, Zap, MemoryStick, CheckCircle2, XCircle } from 'lucide-react';
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

  useEffect(() => {
    // Load benchmark data from static JSON
    fetch('/benchmark-results.json')
      .then(res => res.json())
      .then(data => {
        setBenchmarkData(data);
        if (data.length > 0) {
          setSelectedBenchmark(data[0]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load benchmarks:', err);
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
    return bytes + ' B';
  };

  const formatDuration = (ms: number): string => {
    if (ms >= 1000) return (ms / 1000).toFixed(2) + 's';
    return ms + 'ms';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Atheon Benchmark
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Real pattern matching performance metrics
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to Home
            </Link>
            <Link href="/results" className="text-blue-600 dark:text-blue-400 hover:underline">
              View Results →
            </Link>
          </div>
        </div>

        {/* Benchmark Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Select Benchmark Run
          </label>
          <div className="flex gap-2 flex-wrap">
            {benchmarkData.map((result, idx) => (
              <button
                key={result.system_id}
                onClick={() => setSelectedBenchmark(result)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedBenchmark?.system_id === result.system_id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                }`}
              >
                <span className="font-medium">{result.system_info.hostname}</span>
                <span className="text-xs ml-2 opacity-60">
                  {new Date(result.submitted_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedBenchmark && (
          <>
            {/* System Info */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                System Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">CPU</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedBenchmark.system_info.cpu}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MemoryStick className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">RAM</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedBenchmark.system_info.ram}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">OS</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedBenchmark.system_info.os}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">Go Version</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedBenchmark.system_info.go_version}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-zinc-500 uppercase">Speed</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatNumber(selectedBenchmark.metrics.ns_per_op)}
                </p>
                <p className="text-xs text-zinc-500">ns per operation</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-zinc-500 uppercase">Throughput</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatNumber(selectedBenchmark.metrics.files_per_sec)}
                </p>
                <p className="text-xs text-zinc-500">files per second</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-zinc-500 uppercase">CPU</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {selectedBenchmark.metrics.cpu_percent.toFixed(1)}%
                </p>
                <p className="text-xs text-zinc-500">utilization</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-zinc-500 uppercase">Findings</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatNumber(selectedBenchmark.metrics.findings_count)}
                </p>
                <p className="text-xs text-zinc-500">patterns detected</p>
              </div>
            </div>

            {/* Benchmark Trending */}
            <div className="mb-6">
              <BenchmarkTrending
                currentMetrics={selectedBenchmark.metrics}
                systemId={selectedBenchmark.system_id}
              />
            </div>

            {/* Side Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <PatternBreakdown
                findingsCount={selectedBenchmark.metrics.findings_count}
                systemId={selectedBenchmark.system_id}
              />
              <VersionComparison
                currentVersion={selectedBenchmark.system_info.atheon_version}
                systemId={selectedBenchmark.system_id}
              />
              <BenchmarkExport
                data={selectedBenchmark}
                filename={`atheon-bench-${selectedBenchmark.system_id}`}
              />
            </div>

            {/* Detailed Metrics */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Detailed Performance Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Operations/sec</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(selectedBenchmark.metrics.ops_per_sec)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Bytes/sec</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatBytes(selectedBenchmark.metrics.bytes_per_sec)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Total Files Scanned</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(selectedBenchmark.metrics.files_scanned)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Total Bytes Scanned</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatBytes(selectedBenchmark.metrics.bytes_scanned)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Memory/Op</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatBytes(selectedBenchmark.metrics.alloced_bytes_per_op)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Allocations/Op</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(selectedBenchmark.metrics.allocations_per_op)}
                  </p>
                </div>
              </div>
            </div>

            {/* Benchmark Results */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Benchmark Results
              </h2>
              <div className="space-y-4">
                {selectedBenchmark.benchmarks.map((bench) => (
                  <div
                    key={bench.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center gap-4">
                      {bench.passed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {bench.name}
                        </p>
                        <p className="text-sm text-zinc-500">{bench.output}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatDuration(bench.duration_ms)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {bench.files_scanned} files, {formatBytes(bench.bytes_scanned)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>About these benchmarks:</strong> These results are from real Atheon pattern matching
            runs measuring actual performance metrics including scan speed (ns/op), throughput
            (files/sec), memory allocation, and CPU utilization. Results vary based on hardware
            specifications and file characteristics.
          </p>
        </div>
      </div>
    </div>
  );
}
