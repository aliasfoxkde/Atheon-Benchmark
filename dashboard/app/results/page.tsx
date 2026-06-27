/**
 * Results Page
 * Display and analyze benchmark results from GitHub with enhanced UI/UX
 */

'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  createCachedGitHubResultsFetcher,
  DEFAULT_GITHUB_CONFIG,
  filterResults,
  compareSystems,
  getResultsStatistics,
  buildResultGitHubUrl,
  type BenchmarkReport,
  type ResultsFilter,
} from '@/lib/github/cache';
import { exportAndDownloadResults } from '@/lib/utils';
import { Search, TrendingUp, Clock, Server, Cpu, HardDrive, Filter, Download, RefreshCw, Calendar, BarChart3, LineChart, Activity, Keyboard, GitCompare, Share2, Check } from 'lucide-react';
import { SpiderChart } from '@/components/charts/spider-chart';
import { PerformanceBarChart } from '@/components/charts/performance-bar-chart';
import { TrendLineChart } from '@/components/charts/trend-line-chart';
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts-modal';
import { SystemComparisonModal } from '@/components/system-comparison-modal';
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';

function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<BenchmarkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResultsFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [cacheStats, setCacheStats] = useState<{total_systems: number, is_cached: boolean, last_updated: number | null}>({total_systems: 0, is_cached: false, last_updated: null});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [showExportError, setShowExportError] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize from URL params on mount
  useEffect(() => {
    const systemsParam = searchParams.get('systems');
    const osParam = searchParams.get('os');
    const archParam = searchParams.get('arch');
    const hostnameParam = searchParams.get('hostname');

    if (systemsParam) {
      const systemIds = systemsParam.split(',').filter(Boolean);
      setSelectedSystems(new Set(systemIds));
    }
    if (osParam || archParam || hostnameParam) {
      setFilter({
        os: osParam || undefined,
        arch: archParam || undefined,
        hostname: hostnameParam || undefined,
      });
      setShowFilters(true);
    }
  }, [searchParams]);

  // Update URL when selections change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (selectedSystems.size > 0) {
      params.set('systems', Array.from(selectedSystems).join(','));
    }
    if (filter.os) params.set('os', filter.os);
    if (filter.arch) params.set('arch', filter.arch);
    if (filter.hostname) params.set('hostname', filter.hostname);

    const newURL = params.toString() ? `?${params.toString()}` : '/results';
    router.replace(newURL, { scroll: false });
  }, [selectedSystems, filter, router]);

  useEffect(() => {
    if (!loading && results.length > 0) {
      updateURL();
    }
  }, [selectedSystems, filter, loading, results.length, updateURL]);

  // Copy shareable URL
  const copyShareURL = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const filteredResults = Object.keys(filter).length > 0 ? filterResults(results, filter) : results;
  const statistics = getResultsStatistics(filteredResults);
  const systemComparisons = compareSystems(filteredResults);

  const selectedSystemData = filteredResults.filter(r => selectedSystems.has(r.system_id));

  const toggleSystemSelection = (systemId: string) => {
    const newSelection = new Set(selectedSystems);
    if (newSelection.has(systemId)) {
      newSelection.delete(systemId);
    } else {
      newSelection.add(systemId);
    }
    setSelectedSystems(newSelection);
  };

  const clearSelection = () => {
    setSelectedSystems(new Set());
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from static file first (for deployed sites)
      try {
        const response = await fetch('/benchmark-results.json');
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setCacheStats({
            total_systems: data.length,
            is_cached: true,
            last_updated: Date.now()
          });
          console.log('[Results] Loaded from static file');
          return;
        }
      } catch {
        console.log('[Results] Static file not available, trying GitHub API...');
      }

      // Fallback to GitHub API for local development
      const fetcher = createCachedGitHubResultsFetcher(DEFAULT_GITHUB_CONFIG);
      const data = await fetcher.fetchAllResults();

      // Update cache statistics
      const stats = fetcher.getCachedStatistics();
      setCacheStats(stats);

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
      console.error('[Results] Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load results on mount
  useEffect(() => {
    loadResults();
  }, []);

  // Auto-refresh polling every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[Results] Auto-refreshing data...');
      loadResults();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (focusedIndex === -1) return;

      const systems = filteredResults;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, systems.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === 'Enter' && focusedIndex >= 0 && focusedIndex < systems.length) {
        event.preventDefault();
        const system = systems[focusedIndex];
        toggleSystemSelection(system.system_id);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setFocusedIndex(-1);
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, filteredResults]);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'r',
      description: 'Refresh data',
      action: () => {
        loadResults();
        setShowRefreshToast(true);
        setTimeout(() => setShowRefreshToast(false), 2000);
      },
    },
    {
      key: 'f',
      description: 'Toggle filters',
      action: () => setShowFilters((prev) => !prev),
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcuts(true),
    },
    {
      key: 'Escape',
      description: 'Close modal / Clear selection',
      action: () => {
        setShowShortcuts(false);
        setFocusedIndex(-1);
        clearSelection();
      },
    },
    {
      key: 'h',
      description: 'Go to Home',
      action: () => window.location.href = '/',
    },
    {
      key: 'c',
      description: 'Copy shareable URL',
      action: () => {
        if (selectedSystems.size > 0) {
          copyShareURL();
        }
      },
    },
  ];

  useKeyboardShortcuts(shortcuts, true);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin delay-75"></div>
        </div>
        <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 font-medium">Loading benchmark results...</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          {cacheStats.is_cached ? '💫 Using cached data (fast)' : '🔄 Fetching from GitHub repository...'}
        </p>
        {cacheStats.total_systems > 0 && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {cacheStats.total_systems} systems cached
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.162-3.21l.816-3.636M8 12h.01M15 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error loading results</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={loadResults}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
            >
              Try Again
            </button>
            <a
              href="https://github.com/aliasfoxkde/Atheon-Benchmark-Results"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl transition-colors"
            >
              View GitHub Repository
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Benchmark Results
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Community benchmark results from <span className="font-semibold text-zinc-900 dark:text-zinc-50">{statistics.total_systems}</span> systems
            </p>
            <div className="flex items-center gap-2 text-sm">
              {cacheStats.is_cached && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-medium">
                  💫 Cached ({new Date(cacheStats.last_updated || 0).toLocaleTimeString()})
                </span>
              )}
              <button
                onClick={loadResults}
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
              >
                {cacheStats.is_cached ? 'Refresh data' : 'Reload'}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadResults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" role="region" aria-label="Benchmark statistics">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Total Systems</p>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50" aria-live="polite">{statistics.total_systems}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl border border-green-200 dark:border-green-800 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Success Rate</p>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {statistics.success_rate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Avg Duration</p>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {Math.round(statistics.avg_duration_ms)}ms
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Total Benchmarks</p>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{statistics.total_benchmarks}</p>
        </div>
      </div>

      {/* Interactive Charts Section */}
      {filteredResults.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Performance Analytics</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Interactive visualizations of benchmark data</p>
            </div>
          </div>

          {/* Spider Charts for System Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SpiderChart
              title="System Performance Comparison"
              systems={
                systemComparisons
                  .slice(0, 5)
                  .map((system, index) => ({
                    name: system.system_info.hostname,
                    data: [
                      system.success_rate || 0,
                      100 - (system.avg_duration_ms / 1000) * 10, // Normalize duration
                      (system.total_tests / 10) * 10, // Normalize test count
                      system.system_info.cpu.includes('M') ? 90 : 70, // CPU power indicator
                      parseFloat(system.system_info.ram) || 8, // RAM indicator
                    ],
                    color: [`#3b82f6`, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index],
                  }))
              }
              labels={['Success Rate', 'Speed Score', 'Test Coverage', 'CPU Power', 'RAM Capacity']}
            />

            <PerformanceBarChart
              title="Top Performing Systems"
              systems={
                systemComparisons
                  .sort((a, b) => b.success_rate - a.success_rate)
                  .slice(0, 8)
                  .map((system, index) => ({
                    name: system.system_info.hostname,
                    performance: system.success_rate,
                    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'][index],
                  }))
              }
            />
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendLineChart
              title="Success Rate Trends"
              data={[
                {
                  label: 'Top Systems',
                  values: systemComparisons.slice(0, 5).map((s) => s.success_rate),
                  color: '#3b82f6',
                },
                {
                  label: 'Average',
                  values: [statistics.success_rate, statistics.success_rate, statistics.success_rate, statistics.success_rate, statistics.success_rate],
                  color: '#f59e0b',
                },
              ]}
              labels={systemComparisons.slice(0, 5).map((s) => s.system_info.hostname)}
            />

            <TrendLineChart
              title="Performance Duration Trends"
              data={[
                {
                  label: 'Duration (ms)',
                  values: systemComparisons.slice(0, 5).map((s) => s.avg_duration_ms),
                  color: '#10b981',
                },
              ]}
              labels={systemComparisons.slice(0, 5).map((s) => s.system_info.hostname)}
            />
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Search System
              </label>
              <input
                type="text"
                placeholder="Search by hostname..."
                value={filter.hostname || ''}
                onChange={(e) => setFilter({ ...filter, hostname: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Operating System
              </label>
              <select
                value={filter.os || 'all'}
                onChange={(e) => setFilter({ ...filter, os: e.target.value === 'all' ? undefined : e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Systems</option>
                <option value="linux">Linux</option>
                <option value="windows">Windows</option>
                <option value="darwin">macOS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Architecture
              </label>
              <select
                value={filter.arch || 'all'}
                onChange={(e) => setFilter({ ...filter, arch: e.target.value === 'all' ? undefined : e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Architectures</option>
                <option value="amd64">amd64</option>
                <option value="arm64">arm64</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Date Range
              </label>
              <select
                onChange={(e) => {
                  const days = parseInt(e.target.value);
                  if (days === 0) {
                    setFilter({ ...filter, dateFrom: undefined, dateTo: undefined });
                  } else {
                    const date = new Date();
                    date.setDate(date.getDate() - days);
                    setFilter({ ...filter, dateFrom: date.toISOString(), dateTo: undefined });
                  }
                }}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="0">All time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Selection Actions */}
      {selectedSystems.size > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedSystems.size} system{selectedSystems.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyShareURL}
              className="px-3 py-1 text-sm bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors border border-zinc-300 dark:border-zinc-700 flex items-center gap-1"
              title="Copy shareable URL"
            >
              {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-sm bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors border border-zinc-300 dark:border-zinc-700"
            >
              Clear Selection
            </button>
            {selectedSystems.size >= 2 && (
              <button
                onClick={() => setShowComparison(true)}
                className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1"
              >
                <GitCompare className="w-3 h-3" />
                Compare
              </button>
            )}
            <button
              onClick={() => {
                const selectedResults = filteredResults.filter(r => selectedSystems.has(r.system_id));
                if (selectedResults.length > 0) {
                  exportAndDownloadResults(selectedResults, `benchmark-export-${new Date().toISOString().split('T')[0]}.csv`);
                } else {
                  setShowExportError(true);
                  setTimeout(() => setShowExportError(false), 3000);
                }
              }}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Benchmark results table">
            <thead className="bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider" scope="col">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4" aria-hidden="true" />
                    System
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider" scope="col">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" aria-hidden="true" />
                    Hardware
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider" scope="col">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    Avg Duration
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider" scope="col">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                    Success Rate
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider" scope="col">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4" aria-hidden="true" />
                    Total Tests
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider" scope="col">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    Submitted
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Server className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                          No benchmark results found
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                          Be the first to submit benchmark results! Download the runner and contribute to the community.
                        </p>
                        <div className="flex gap-4 justify-center">
                          <a
                            href="https://github.com/aliasfoxkde/Atheon-Benchmark/tree/main/runner"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg"
                          >
                            Download Runner
                          </a>
                          <a
                            href="https://github.com/aliasfoxkde/Atheon-Benchmark-Results"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
                          >
                            View Repository
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                systemComparisons.map((system, index) => (
                  <tr
                    key={system.system_id}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                      selectedSystems.has(system.system_id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } ${focusedIndex === index ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                    tabIndex={0}
                    onFocus={() => setFocusedIndex(index)}
                    onClick={() => toggleSystemSelection(system.system_id)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSystemSelection(system.system_id);
                      }
                    }}
                    aria-selected={selectedSystems.has(system.system_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="px-6 py-4" scope="row">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedSystems.has(system.system_id)}
                          onChange={() => toggleSystemSelection(system.system_id)}
                          className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500"
                          aria-label={`Select ${system.system_info.hostname}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-50">
                            {system.system_info.hostname}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {system.system_info.os}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {system.system_info.cpu}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {system.system_info.ram}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                      {Math.round(system.avg_duration_ms)}ms
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-full h-2 rounded-full ${
                            system.success_rate >= 90
                              ? 'bg-green-500'
                              : system.success_rate >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${system.success_rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {system.success_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                      {system.total_tests}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(system.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(buildResultGitHubUrl(system.system_id, system.submitted_at?.split('T')[0].replace(/-/g, '/')), '_blank')}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View on GitHub"
                          aria-label="View on GitHub"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 19c-5 1-7-7-7s2 7 7 7 7-7 7-7-7-2 7-7 7-7zm0-2v6M3 13h6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            const report = filteredResults.find(r => r.system_id === system.system_id);
                            if (report) {
                              exportAndDownloadResults([report], `benchmark-${system.system_id}-${system.submitted_at?.split('T')[0] || 'results'}.csv`);
                            }
                          }}
                          className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Download results"
                          aria-label="Download results"
                        >
                          <Download className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="bg-zinc-50 dark:bg-zinc-800 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              Showing <span className="font-semibold">{filteredResults.length}</span> systems
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Data from GitHub repository
              </span>
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Keyboard shortcuts"
                aria-label="Show keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Refresh Toast */}
      {showRefreshToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          🔄 Refreshing data...
        </div>
      )}


      {/* Export Error Toast */}
      {showExportError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          ⚠️ Please select at least one result to export
        </div>
      )}

      {/* System Comparison Modal */}
      <SystemComparisonModal
        systems={selectedSystemData}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin delay-75"></div>
      </div>
      <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 font-medium">Loading benchmark results...</p>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsPageContent />
    </Suspense>
  );
}
