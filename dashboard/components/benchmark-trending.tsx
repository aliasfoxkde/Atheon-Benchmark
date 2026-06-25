'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from 'lucide-react';

interface BenchmarkHistoryEntry {
  timestamp: string;
  ns_per_op: number;
  files_per_sec: number;
  bytes_per_sec: number;
  findings_count: number;
  files_scanned: number;
  cpu_percent: number;
}

interface BenchmarkTrendingProps {
  currentMetrics: {
    ns_per_op: number;
    files_per_sec: number;
    bytes_per_sec: number;
    findings_count: number;
    files_scanned: number;
    cpu_percent: number;
  };
  systemId: string;
}

// Normal CDF for statistical analysis
function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

// Calculate standard deviation
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

export function BenchmarkTrending({ currentMetrics, systemId }: BenchmarkTrendingProps) {
  const [history, setHistory] = useState<BenchmarkHistoryEntry[]>([]);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [percentChange, setPercentChange] = useState(0);
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [anomalySeverity, setAnomalySeverity] = useState<'warning' | 'critical' | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`benchmark-history-${systemId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      } catch (e) {
        console.error('Failed to parse benchmark history:', e);
      }
    }
  }, [systemId]);

  // Save current metrics to history
  useEffect(() => {
    if (!currentMetrics || currentMetrics.ns_per_op === 0) return;

    const entry: BenchmarkHistoryEntry = {
      timestamp: new Date().toISOString(),
      ...currentMetrics,
    };

    const newHistory = [...history, entry].slice(-20); // Keep last 20 entries
    setHistory(newHistory);

    // Calculate trend
    if (newHistory.length >= 2) {
      const prev = newHistory[newHistory.length - 2];
      const curr = entry;
      const change = ((curr.ns_per_op - prev.ns_per_op) / prev.ns_per_op) * 100;
      setPercentChange(change);
      if (change < -5) {
        setTrend('down'); // Lower ns/op is better
      } else if (change > 5) {
        setTrend('up');
      } else {
        setTrend('stable');
      }
    }

    // Anomaly detection using rolling statistics
    if (newHistory.length >= 5) {
      const recent = newHistory.slice(0, -1); // Exclude current run
      const values = recent.map(h => h.ns_per_op);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sigma = stdDev(values);
      const current = currentMetrics.ns_per_op;

      if (sigma > 0) {
        const zScore = Math.abs((current - mean) / sigma);
        // Z-score > 2σ = warning, > 3σ = critical (99.7% confidence)
        if (zScore > 3) {
          setIsAnomaly(true);
          setAnomalySeverity('critical');
        } else if (zScore > 2) {
          setIsAnomaly(true);
          setAnomalySeverity('warning');
        } else {
          setIsAnomaly(false);
          setAnomalySeverity(null);
        }
      }
    }

    // Persist to localStorage
    localStorage.setItem(`benchmark-history-${systemId}`, JSON.stringify(newHistory));
  }, [currentMetrics]);

  const formatNumber = (n: number): string => {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(0);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-red-500';
      case 'down':
        return 'text-green-500';
      default:
        return 'text-zinc-500';
    }
  };

  const getAnomalyColor = () => {
    return anomalySeverity === 'critical' ? 'text-red-500' : 'text-yellow-500';
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Performance Trend
        </h3>
        <div className="flex items-center gap-2">
          {isAnomaly && (
            <div className={`flex items-center gap-1 text-xs ${getAnomalyColor()}`} title="Performance anomaly detected">
              <AlertTriangle className="w-3 h-3" />
              <span>{anomalySeverity === 'critical' ? 'Critical' : 'Warning'}</span>
            </div>
          )}
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(percentChange).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Simple sparkline visualization */}
      <div className="h-16 flex items-end gap-1 mb-4">
        {history.slice(-10).map((entry, idx) => {
          const maxNs = Math.max(...history.slice(-10).map(e => e.ns_per_op));
          const minNs = Math.min(...history.slice(-10).map(e => e.ns_per_op));
          const range = maxNs - minNs || 1;
          const height = ((entry.ns_per_op - minNs) / range) * 100;
          const isCurrent = idx === history.slice(-10).length - 1 && isAnomaly;
          const barColor = isCurrent
            ? anomalySeverity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
            : 'bg-blue-500 dark:bg-blue-400';

          return (
            <div
              key={idx}
              className={`flex-1 ${barColor} rounded-t`}
              style={{ height: `${Math.max(height, 5)}%` }}
              title={`${formatNumber(entry.ns_per_op)} ns/op`}
            />
          );
        })}
      </div>

      {/* Historical stats */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-zinc-500">Current</p>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {formatNumber(currentMetrics.ns_per_op)} ns/op
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Best</p>
          <p className="font-semibold text-green-600 dark:text-green-400">
            {history.length > 0 ? formatNumber(Math.min(...history.map(h => h.ns_per_op))) : '-'}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Avg (last 5)</p>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {history.length > 0
              ? formatNumber(history.slice(-5).reduce((a, b) => a + b.ns_per_op, 0) / Math.min(5, history.length))
              : '-'}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Runs</p>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{history.length}</p>
        </div>
      </div>

      {/* Anomaly explanation */}
      {isAnomaly && (
        <div className={`mt-3 pt-3 border-t ${anomalySeverity === 'critical' ? 'border-red-200 dark:border-red-800' : 'border-yellow-200 dark:border-yellow-800'}`}>
          <p className="text-xs text-zinc-500">
            Current performance deviates {anomalySeverity === 'critical' ? 'significantly' : 'moderately'} from baseline.
            Current: {formatNumber(currentMetrics.ns_per_op)} ns/op
          </p>
        </div>
      )}
    </div>
  );
}
