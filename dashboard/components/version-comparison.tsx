'use client';

import { useState, useEffect } from 'react';
import { GitCompare, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface VersionMetrics {
  version: string;
  ns_per_op: number;
  files_per_sec: number;
  bytes_per_sec: number;
  cpu_percent: number;
  findings_count: number;
  timestamp: string;
}

interface VersionComparisonProps {
  currentVersion: string;
  systemId: string;
}

export function VersionComparison({ currentVersion, systemId }: VersionComparisonProps) {
  const [versions, setVersions] = useState<VersionMetrics[]>([]);
  const [selectedOld, setSelectedOld] = useState<VersionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load version history from localStorage
    const stored = localStorage.getItem(`version-history-${systemId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVersions(parsed);
      } catch (e) {
        console.error('Failed to parse version history:', e);
      }
    }
    setLoading(false);
  }, [systemId]);

  // Save current version to history when version changes
  useEffect(() => {
    if (!currentVersion || currentVersion === 'unknown') return;

    const entry: VersionMetrics = {
      version: currentVersion,
      ns_per_op: 0, // Would come from actual metrics
      files_per_sec: 0,
      bytes_per_sec: 0,
      cpu_percent: 0,
      findings_count: 0,
      timestamp: new Date().toISOString(),
    };

    const existing = versions.find(v => v.version === currentVersion);
    if (!existing) {
      const newVersions = [...versions, entry].slice(-10); // Keep last 10 versions
      setVersions(newVersions);
      localStorage.setItem(`version-history-${systemId}`, JSON.stringify(newVersions));
    }
  }, [currentVersion]);

  const formatNumber = (n: number): string => {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(0);
  };

  const getTrendIcon = (current: number, previous: number, higherIsBetter: boolean = false) => {
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 5) return <Minus className="w-3 h-3 text-zinc-400" />;
    const isImprovement = higherIsBetter ? current > previous : current < previous;
    return isImprovement
      ? <TrendingDown className="w-3 h-3 text-green-500" />
      : <TrendingUp className="w-3 h-3 text-red-500" />;
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <GitCompare className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Version Comparison
        </h3>
      </div>

      {versions.length < 2 ? (
        <div className="text-center py-6 text-zinc-500 dark:text-zinc-400 text-sm">
          <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Need at least 2 versions to compare</p>
          <p className="text-xs mt-1">Version history builds as you run benchmarks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version, idx) => {
            const isLatest = idx === versions.length - 1;
            const prevVersion = idx > 0 ? versions[idx - 1] : null;

            return (
              <div key={version.version + idx} className="relative">
                {/* Version pill */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isLatest
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    v{version.version}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(version.timestamp).toLocaleDateString()}
                  </span>
                </div>

                {/* Metrics comparison with previous version */}
                {prevVersion && (
                  <div className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Speed (ns/op)</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(version.ns_per_op, prevVersion.ns_per_op)}
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {formatNumber(version.ns_per_op)}
                        </span>
                        <span className="text-zinc-400">
                          ({getChangePercent(version.ns_per_op, prevVersion.ns_per_op)})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Files/sec</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(version.files_per_sec, prevVersion.files_per_sec, true)}
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {version.files_per_sec.toFixed(1)}
                        </span>
                        <span className="text-zinc-400">
                          ({getChangePercent(version.files_per_sec, prevVersion.files_per_sec)})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Arrow to next version */}
                {idx < versions.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 absolute -left-3 top-1/2 -translate-y-1/2 rotate-90" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-green-500" /> Faster
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-red-500" /> Slower
        </span>
        <span className="flex items-center gap-1">
          <Minus className="w-3 h-3 text-zinc-400" /> Within 5%
        </span>
      </div>
    </div>
  );
}
