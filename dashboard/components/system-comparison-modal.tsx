'use client';

import { X, Trophy, TrendingUp, Clock, Cpu, Server, Calendar } from 'lucide-react';
import type { BenchmarkReport } from '@/lib/github/cache';

interface SystemComparisonModalProps {
  systems: BenchmarkReport[];
  isOpen: boolean;
  onClose: () => void;
}

interface MetricRow {
  label: string;
  values: { system: string; value: string | number; rank: number }[];
  higherIsBetter: boolean;
}

export function SystemComparisonModal({ systems, isOpen, onClose }: SystemComparisonModalProps) {
  if (!isOpen || systems.length < 2) return null;

  const metrics: MetricRow[] = [
    {
      label: 'Success Rate',
      values: systems.map((s) => {
        const rate = s.summary?.total_tests
          ? (s.summary.passed / s.summary.total_tests) * 100
          : 0;
        return {
          system: s.system_info.hostname,
          value: `${rate.toFixed(1)}%`,
          rank: 0,
        };
      }),
      higherIsBetter: true,
    },
    {
      label: 'Avg Duration',
      values: systems.map((s) => ({
        system: s.system_info.hostname,
        value: `${s.summary?.avg_duration_ms?.toFixed(0) || 0}ms`,
        rank: 0,
      })),
      higherIsBetter: false,
    },
    {
      label: 'Total Tests',
      values: systems.map((s) => ({
        system: s.system_info.hostname,
        value: s.summary?.total_tests || 0,
        rank: 0,
      })),
      higherIsBetter: true,
    },
    {
      label: 'Total Tokens',
      values: systems.map((s) => ({
        system: s.system_info.hostname,
        value: s.summary?.total_tokens?.toLocaleString() || 0,
        rank: 0,
      })),
      higherIsBetter: false,
    },
  ];

  // Calculate success rate and ranks for each metric
  const systemsWithSuccessRate = systems.map((s) => ({
    ...s,
    success_rate: s.summary?.total_tests
      ? (s.summary.passed / s.summary.total_tests) * 100
      : 0,
  }));

  metrics.forEach((metric) => {
    const values = metric.values.map((v) =>
      typeof v.value === 'string' ? parseFloat(v.value.replace(/[^0-9.]/g, '')) || 0 : v.value
    );

    const sortedValues = [...values].sort((a, b) =>
      metric.higherIsBetter ? b - a : a - b
    );

    metric.values.forEach((v) => {
      const numVal = typeof v.value === 'string'
        ? parseFloat(v.value.replace(/[^0-9.]/g, '')) || 0
        : v.value;
      v.rank = sortedValues.indexOf(numVal) + 1;
    });
  });

  const getRankStyle = (rank: number, total: number) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    if (rank === total) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
  };

  const getRankIcon = (rank: number, total: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 id="comparison-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              System Comparison
            </h2>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              {systems.length} systems
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* System Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {systems.map((system) => (
              <div
                key={system.system_id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500">System</span>
                </div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {system.system_info.hostname}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {system.system_info.os}
                </p>
                <div className="mt-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    <span className="truncate">{system.system_info.cpu}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(system.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Metrics Comparison Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Metric
                  </th>
                  {systems.map((s) => (
                    <th
                      key={s.system_id}
                      className="px-4 py-3 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
                    >
                      {s.system_info.hostname.slice(0, 12)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {metrics.map((metric) => (
                  <tr key={metric.label} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {metric.label}
                    </td>
                    {metric.values.map((v, idx) => (
                      <td key={idx} className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${getRankStyle(v.rank, systems.length)}`}>
                            {getRankIcon(v.rank, systems.length)}
                            {v.value}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span>Best</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span>Lowest</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            Select at least 2 systems to compare. Rankings are relative to the selected systems.
          </p>
        </div>
      </div>
    </div>
  );
}
