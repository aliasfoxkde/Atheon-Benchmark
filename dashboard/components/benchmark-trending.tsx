'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle, Settings } from 'lucide-react';

interface BenchmarkHistoryEntry {
  timestamp: string;
  ns_per_op: number;
  files_per_sec: number;
  bytes_per_sec: number;
  findings_count: number;
  files_scanned: number;
  cpu_percent: number;
}

interface AnomalyThresholds {
  warning: number;  // Standard deviations for warning
  critical: number; // Standard deviations for critical
}

interface MetricAnomaly {
  metric: string;
  zScore: number;
  severity: 'warning' | 'critical' | null;
  deviation: number; // Percentage deviation from mean
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
  anomalyThresholds?: AnomalyThresholds;
}

// Calculate standard deviation
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

export function BenchmarkTrending({
  currentMetrics,
  systemId,
  anomalyThresholds = { warning: 2, critical: 3 }
}: BenchmarkTrendingProps) {
  const [history, setHistory] = useState<BenchmarkHistoryEntry[]>([]);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [percentChange, setPercentChange] = useState(0);
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [anomalySeverity, setAnomalySeverity] = useState<'warning' | 'critical' | null>(null);
  const [metricAnomalies, setMetricAnomalies] = useState<MetricAnomaly[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [localThresholds, setLocalThresholds] = useState<AnomalyThresholds>(anomalyThresholds);

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
      const anomalies: MetricAnomaly[] = [];

      // Check each metric for anomalies
      const metricsToCheck = [
        { key: 'ns_per_op', value: currentMetrics.ns_per_op, lowerIsBetter: true },
        { key: 'files_per_sec', value: currentMetrics.files_per_sec, lowerIsBetter: false },
        { key: 'bytes_per_sec', value: currentMetrics.bytes_per_sec, lowerIsBetter: false },
        { key: 'cpu_percent', value: currentMetrics.cpu_percent, lowerIsBetter: true },
      ] as const;

      let maxSeverity: 'warning' | 'critical' | null = null;
      let maxZScore = 0;

      for (const metric of metricsToCheck) {
        const values = recent.map(h => (h as any)[metric.key] as number);
        if (values.some(v => v === 0)) continue; // Skip if any value is 0

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sigma = stdDev(values);
        const current = metric.value;

        if (sigma > 0) {
          const zScore = Math.abs((current - mean) / sigma);
          const deviation = ((current - mean) / mean) * 100;

          let severity: 'warning' | 'critical' | null = null;
          if (zScore > localThresholds.critical) {
            severity = 'critical';
          } else if (zScore > localThresholds.warning) {
            severity = 'warning';
          }

          if (severity && zScore > maxZScore) {
            maxZScore = zScore;
            maxSeverity = severity;
          }

          anomalies.push({
            metric: metric.key,
            zScore,
            severity,
            deviation,
          });
        }
      }

      setMetricAnomalies(anomalies.filter(a => a.severity !== null));
      setIsAnomaly(maxSeverity !== null);
      setAnomalySeverity(maxSeverity);
    }

    // Persist to localStorage
    localStorage.setItem(`benchmark-history-${systemId}`, JSON.stringify(newHistory));
  }, [currentMetrics, history, localThresholds]);

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

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'ns_per_op': return { emoji: '⚡', label: 'nanoseconds per operation' };
      case 'files_per_sec': return { emoji: '📁', label: 'files per second' };
      case 'bytes_per_sec': return { emoji: '📊', label: 'bytes per second' };
      case 'cpu_percent': return { emoji: '🔥', label: 'CPU percent' };
      default: return { emoji: '📈', label: 'default' };
    }
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
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            title="Anomaly detection settings"
          >
            <Settings className="w-3 h-3 text-zinc-400" />
          </button>
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(percentChange).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs">
          <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">Anomaly Detection Thresholds (σ)</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-zinc-500">Warning σ:</label>
              <input
                type="number"
                value={localThresholds.warning}
                onChange={(e) => setLocalThresholds({ ...localThresholds, warning: parseFloat(e.target.value) || 2 })}
                className="w-full mt-1 px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-zinc-100"
                min="1"
                max="5"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-zinc-500">Critical σ:</label>
              <input
                type="number"
                value={localThresholds.critical}
                onChange={(e) => setLocalThresholds({ ...localThresholds, critical: parseFloat(e.target.value) || 3 })}
                className="w-full mt-1 px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-zinc-100"
                min="1"
                max="5"
                step="0.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* Multi-metric sparkline visualization */}
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
              className={`flex-1 ${barColor} rounded-t transition-colors`}
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

      {/* Per-metric anomaly details */}
      {metricAnomalies.length > 0 && (
        <div className={`mt-3 pt-3 border-t ${anomalySeverity === 'critical' ? 'border-red-200 dark:border-red-800' : 'border-yellow-200 dark:border-yellow-800'}`}>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Anomalous Metrics:</p>
          <div className="flex flex-wrap gap-2">
            {metricAnomalies.map((a) => (
              <span
                key={a.metric}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                  a.severity === 'critical'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}
                title={`z-score: ${a.zScore.toFixed(2)}σ, deviation: ${a.deviation > 0 ? '+' : ''}${a.deviation.toFixed(1)}%`}
              >
                {getMetricIcon(a.metric).emoji} {a.metric.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
