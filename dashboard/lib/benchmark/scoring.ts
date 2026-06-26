/**
 * Benchmark Scoring System
 * Evaluates benchmark results with a composite score (0-100)
 */

import type { BenchmarkResult, BenchmarkMetrics } from './client';

export interface BenchmarkScore {
  overall: number;
  performance: number;
  consistency: number;
  quality: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    nsPerOp: number;      // Lower is better
    filesPerSec: number;  // Higher is better
    bytesPerSec: number;  // Higher is better
    successRate: number; // Higher is better
    consistency: number;  // Lower variance is better
  };
}

export interface BenchmarkScoringConfig {
  weights?: {
    performance: number;
    consistency: number;
    quality: number;
  };
  baselineMetrics?: Partial<BenchmarkMetrics>;
}

const DEFAULT_WEIGHTS = {
  performance: 0.5,
  consistency: 0.25,
  quality: 0.25,
};

const GRADE_THRESHOLDS = {
  'A+': 95,
  'A': 85,
  'B+': 75,
  'B': 65,
  'C': 50,
  'D': 35,
  'F': 0,
};

function calculateGrade(score: number): BenchmarkScore['grade'] {
  if (score >= GRADE_THRESHOLDS['A+']) return 'A+';
  if (score >= GRADE_THRESHOLDS['A']) return 'A';
  if (score >= GRADE_THRESHOLDS['B+']) return 'B+';
  if (score >= GRADE_THRESHOLDS['B']) return 'B';
  if (score >= GRADE_THRESHOLDS['C']) return 'C';
  if (score >= GRADE_THRESHOLDS['D']) return 'D';
  return 'F';
}

function normalizeNsPerOp(nsPerOp: number, baseline?: number): number {
  // Baseline: ~50,000,000 ns/op is typical
  const reference = baseline || 50_000_000;
  // Invert: lower is better, so we normalize inversely
  const normalized = Math.max(0, 1 - (nsPerOp / reference - 1));
  return Math.min(1, Math.max(0, normalized));
}

function normalizeFilesPerSec(filesPerSec: number, baseline?: number): number {
  // Baseline: ~1,000 files/sec is typical
  const reference = baseline || 1_000;
  return Math.min(1, filesPerSec / reference);
}

function normalizeBytesPerSec(bytesPerSec: number, baseline?: number): number {
  // Baseline: ~10,000,000 bytes/sec is typical
  const reference = baseline || 10_000_000;
  return Math.min(1, bytesPerSec / reference);
}

function normalizeSuccessRate(successRate: number): number {
  return successRate; // Already 0-1
}

function calculateConsistency(metrics: BenchmarkMetrics): number {
  // Lower variance in runs = higher consistency
  // This is simplified - real implementation would track variance across runs
  if (metrics.successRate >= 0.99) return 1.0;
  if (metrics.successRate >= 0.95) return 0.8;
  if (metrics.successRate >= 0.90) return 0.6;
  if (metrics.successRate >= 0.80) return 0.4;
  return 0.2;
}

/**
 * Calculate a composite score for a benchmark result
 */
export function calculateBenchmarkScore(
  result: BenchmarkResult,
  config: BenchmarkScoringConfig = {}
): BenchmarkScore {
  const weights = { ...DEFAULT_WEIGHTS, ...config.weights };
  const baseline = config.baselineMetrics;

  const performanceBreakdown = {
    nsPerOp: normalizeNsPerOp(result.metrics.ns_per_op, baseline?.ns_per_op),
    filesPerSec: normalizeFilesPerSec(result.metrics.files_per_sec, baseline?.files_per_sec),
    bytesPerSec: normalizeBytesPerSec(result.metrics.bytes_per_sec, baseline?.bytes_per_sec),
    successRate: normalizeSuccessRate(result.metrics.successRate),
    consistency: calculateConsistency(result.metrics),
  };

  // Weighted average for performance score
  const performanceScore =
    performanceBreakdown.nsPerOp * 0.4 +
    performanceBreakdown.filesPerSec * 0.2 +
    performanceBreakdown.bytesPerSec * 0.2 +
    performanceBreakdown.successRate * 0.2;

  const consistencyScore = performanceBreakdown.consistency;

  // Quality: based on findings density (lower = cleaner = higher quality)
  const findingsPerFile = result.metrics.findings_count / Math.max(1, result.metrics.files_scanned);
  const qualityScore = Math.max(0, 1 - findingsPerFile * 10); // Penalize findings density

  // Composite score
  const overall =
    performanceScore * weights.performance +
    consistencyScore * weights.consistency +
    qualityScore * weights.quality;

  return {
    overall: Math.round(overall * 100),
    performance: Math.round(performanceScore * 100),
    consistency: Math.round(consistencyScore * 100),
    quality: Math.round(qualityScore * 100),
    grade: calculateGrade(overall * 100),
    breakdown: performanceBreakdown,
  };
}

/**
 * Compare two benchmark results
 */
export function compareBenchmarks(
  current: BenchmarkResult,
  previous: BenchmarkResult
): {
  improvement: number; // Percentage point change
  details: {
    nsPerOpChange: number;
    filesPerSecChange: number;
    bytesPerSecChange: number;
    successRateChange: number;
  };
} {
  const details = {
    nsPerOpChange: ((current.metrics.ns_per_op - previous.metrics.ns_per_op) / previous.metrics.ns_per_op) * 100,
    filesPerSecChange: ((current.metrics.files_per_sec - previous.metrics.files_per_sec) / previous.metrics.files_per_sec) * 100,
    bytesPerSecChange: ((current.metrics.bytes_per_sec - previous.metrics.bytes_per_sec) / previous.metrics.bytes_per_sec) * 100,
    successRateChange: (current.metrics.successRate - previous.metrics.successRate) * 100,
  };

  const currentScore = calculateBenchmarkScore(current);
  const previousScore = calculateBenchmarkScore(previous);

  return {
    improvement: currentScore.overall - previousScore.overall,
    details,
  };
}
