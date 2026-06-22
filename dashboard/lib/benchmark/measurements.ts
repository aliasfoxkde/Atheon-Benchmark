/**
 * Performance Measurement and Statistical Analysis
 * This module provides comprehensive measurement and statistical analysis capabilities
 */

// Statistical constants
export const CONFIDENCE_LEVEL_95 = 1.96;  // Z-score for 95% confidence interval
export const P_VALUE_THRESHOLD = 0.05;    // Standard significance threshold
export const DEFAULT_CONFIDENCE_LEVEL = 0.95;  // 95% confidence level

export interface Measurement {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  memory_mb?: number;
  cpu_percent?: number;
  success: boolean;
  error_message?: string;
}

export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  confidence_interval_95: { lower: number; upper: number };
}

export interface ComparisonResult {
  metric: string;
  baseline: StatisticalSummary;
  treatment: StatisticalSummary;
  difference: number;
  percent_change: number;
  statistical_significance: {
    test: string;
    p_value: number;
    significant: boolean;
    confidence: number;
  };
}

export interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  correlation: number;
  r_squared: number;
  data_points: Array<{ timestamp: number; value: number }>;
}

/**
 * Performance measurement collector
 */
export class PerformanceCollector {
  private measurements: Map<string, Measurement[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Start measuring a specific operation
   */
  startMeasurement(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }

  /**
   * Stop measuring and record the result
   */
  stopMeasurement(operationId: string, value: number, metadata?: Record<string, any>): void {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      throw new Error(`No start time found for operation: ${operationId}`);
    }

    const measurement: Measurement = {
      timestamp: Date.now(),
      value,
      metadata: {
        ...metadata,
        duration_ms: Date.now() - startTime,
      },
    };

    const measurements = this.measurements.get(operationId) || [];
    measurements.push(measurement);
    this.measurements.set(operationId, measurements);

    this.startTimes.delete(operationId);
  }

  /**
   * Get measurements for an operation
   */
  getMeasurements(operationId: string): Measurement[] {
    return this.measurements.get(operationId) || [];
  }

  /**
   * Get all measurements
   */
  getAllMeasurements(): Map<string, Measurement[]> {
    return new Map(this.measurements);
  }

  /**
   * Clear measurements for an operation
   */
  clearMeasurements(operationId?: string): void {
    if (operationId) {
      this.measurements.delete(operationId);
    } else {
      this.measurements.clear();
    }
  }

  /**
   * Get statistical summary for measurements
   */
  getStatisticalSummary(operationId: string): StatisticalSummary | null {
    const measurements = this.getMeasurements(operationId);
    if (measurements.length === 0) return null;

    const values = measurements.map(m => m.value).sort((a, b) => a - b);
    return this.calculateStatistics(values);
  }

  /**
   * Calculate comprehensive statistics
   */
  calculateStatistics(values: number[]): StatisticalSummary {
    const n = values.length;
    if (n === 0) {
      throw new Error('Cannot calculate statistics on empty array');
    }

    // Basic statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const min = values[0];
    const max = values[n - 1];

    // Percentiles
    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * n) - 1;
      return values[Math.max(0, Math.min(index, n - 1))];
    };

    // Standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const std_dev = Math.sqrt(variance);

    // Median
    const median = n % 2 === 0
      ? (values[n / 2 - 1] + values[n / 2]) / 2
      : values[Math.floor(n / 2)];

    // 95% confidence interval
    const margin = CONFIDENCE_LEVEL_95 * std_dev / Math.sqrt(n);
    const confidenceInterval = {
      lower: mean - margin,
      upper: mean + margin,
    };

    return {
      count: n,
      mean,
      median,
      std_dev,
      min,
      max,
      p25: percentile(25),
      p50: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99),
      confidence_interval_95: confidenceInterval,
    };
  }

  /**
   * Compare two sets of measurements
   */
  compareMeasurements(
    baselineId: string,
    treatmentId: string,
    metric: string = 'value'
  ): ComparisonResult | null {
    const baselineStats = this.getStatisticalSummary(baselineId);
    const treatmentStats = this.getStatisticalSummary(treatmentId);

    if (!baselineStats || !treatmentStats) {
      return null;
    }

    const difference = treatmentStats.mean - baselineStats.mean;
    const percentChange = (difference / baselineStats.mean) * 100;

    // Perform t-test for statistical significance
    const baselineMeasurements = this.getMeasurements(baselineId);
    const treatmentMeasurements = this.getMeasurements(treatmentId);

    const statisticalSignificance = this.performTTest(
      baselineMeasurements.map(m => m.value),
      treatmentMeasurements.map(m => m.value)
    );

    return {
      metric,
      baseline: baselineStats,
      treatment: treatmentStats,
      difference,
      percent_change: percentChange,
      statistical_significance: statisticalSignificance,
    };
  }

  /**
   * Perform independent two-sample t-test
   */
  private performTTest(baseline: number[], treatment: number[]): {
    test: string;
    p_value: number;
    significant: boolean;
    confidence: number;
  } {
    const n1 = baseline.length;
    const n2 = treatment.length;

    const mean1 = baseline.reduce((sum, val) => sum + val, 0) / n1;
    const mean2 = treatment.reduce((sum, val) => sum + val, 0) / n2;

    const var1 = baseline.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
    const var2 = treatment.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);

    // Pooled standard deviation
    const pooledStdDev = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));

    // t-statistic
    const tStat = (mean2 - mean1) / (pooledStdDev * Math.sqrt(1 / n1 + 1 / n2));

    // Degrees of freedom
    const df = n1 + n2 - 2;

    // p-value (simplified approximation)
    const pValue = this.calculatePValue(Math.abs(tStat), df);

    return {
      test: 'independent-two-sample-t-test',
      p_value: pValue,
      significant: pValue < P_VALUE_THRESHOLD,
      confidence: DEFAULT_CONFIDENCE_LEVEL,
    };
  }

  /**
   * Calculate p-value from t-statistic (simplified)
   */
  private calculatePValue(tStat: number, df: number): number {
    // Simplified approximation for demonstration
    // In production, use a proper statistical library
    const tCritical = {
      10: 2.228,
      20: 2.086,
      30: 2.042,
      50: 2.009,
      100: 1.984,
    };

    const critical = tCritical[Math.min(df, 100) as keyof typeof tCritical] || 2.0;
    return tStat > critical ? 0.01 : 0.10;
  }

  /**
   * Analyze trends in measurements over time
   */
  analyzeTrends(operationId: string): TrendAnalysis | null {
    const measurements = this.getMeasurements(operationId);
    if (measurements.length < 2) return null;

    const dataPoints = measurements
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(m => ({ timestamp: m.timestamp, value: m.value }));

    // Simple linear regression for trend
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.timestamp, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.value, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.timestamp * p.value, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.timestamp * p.timestamp, 0);
    const sumY2 = dataPoints.reduce((sum, p) => sum + p.value * p.value, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Correlation coefficient
    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    // R-squared
    const rSquared = correlation * correlation;

    // Determine trend direction
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.001) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      metric: operationId,
      trend,
      slope,
      correlation,
      r_squared: rSquared,
      data_points: dataPoints,
    };
  }

  /**
   * Export measurements as JSON
   */
  exportMeasurements(): string {
    const data: Record<string, Measurement[]> = {};
    for (const [id, measurements] of this.measurements.entries()) {
      data[id] = measurements;
    }
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import measurements from JSON
   */
  importMeasurements(json: string): void {
    try {
      const data = JSON.parse(json) as Record<string, Measurement[]>;
      for (const [id, measurements] of Object.entries(data)) {
        this.measurements.set(id, measurements);
      }
    } catch (error) {
      throw new Error('Invalid JSON format for measurements');
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    const report: string[] = [];
    report.push('=== Performance Analysis Report ===');
    report.push(`Generated at: ${new Date().toISOString()}`);
    report.push('');

    for (const [operationId, measurements] of this.measurements.entries()) {
      const stats = this.getStatisticalSummary(operationId);
      if (!stats) continue;

      report.push(`Operation: ${operationId}`);
      report.push(`  Count: ${stats.count}`);
      report.push(`  Mean: ${stats.mean.toFixed(2)}ms`);
      report.push(`  Median: ${stats.median.toFixed(2)}ms`);
      report.push(`  Std Dev: ${stats.std_dev.toFixed(2)}ms`);
      report.push(`  Range: ${stats.min.toFixed(2)}ms - ${stats.max.toFixed(2)}ms`);
      report.push(`  Percentiles:`);
      report.push(`    p50: ${stats.p50.toFixed(2)}ms`);
      report.push(`    p95: ${stats.p95.toFixed(2)}ms`);
      report.push(`    p99: ${stats.p99.toFixed(2)}ms`);
      report.push(`  95% Confidence Interval: [${stats.confidence_interval_95.lower.toFixed(2)}, ${stats.confidence_interval_95.upper.toFixed(2)}]`);

      const trends = this.analyzeTrends(operationId);
      if (trends) {
        report.push(`  Trend: ${trends.trend} (slope: ${trends.slope.toFixed(6)})`);
        report.push(`  Correlation: ${trends.correlation.toFixed(3)} (R²: ${trends.r_squared.toFixed(3)})`);
      }

      report.push('');
    }

    return report.join('\n');
  }
}

/**
 * Factory function to create performance collectors
 */
export function createPerformanceCollector(): PerformanceCollector {
  return new PerformanceCollector();
}

/**
 * Utility functions for common statistical operations
 */
export class StatisticsUtils {
  /**
   * Calculate mean
   */
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate median
   */
  static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate percentile
   */
  static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Calculate standard deviation
   */
  static stdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.mean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate coefficient of variation
   */
  static coefficientOfVariation(values: number[]): number {
    const mean = this.mean(values);
    if (mean === 0) return 0;
    return (this.stdDev(values) / mean) * 100;
  }

  /**
   * Perform outlier detection using IQR method
   */
  static detectOutliers(values: number[]): { outliers: number[]; cleaned: number[] } {
    if (values.length === 0) return { outliers: [], cleaned: [] };

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = this.percentile(sorted, 25);
    const q3 = this.percentile(sorted, 75);
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers: number[] = [];
    const cleaned: number[] = [];

    for (const value of sorted) {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
      } else {
        cleaned.push(value);
      }
    }

    return { outliers, cleaned };
  }

  /**
   * Normalize values to 0-1 range
   */
  static normalize(values: number[]): number[] {
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) return values.map(() => 0.5);

    return values.map(v => (v - min) / range);
  }

  /**
   * Calculate relative difference
   */
  static relativeDifference(baseline: number, treatment: number): number {
    if (baseline === 0) return treatment === 0 ? 0 : Infinity;
    return ((treatment - baseline) / baseline) * 100;
  }

  /**
   * Format duration for display
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  }

  /**
   * Format large numbers
   */
  static formatNumber(value: number): string {
    if (value < 1000) return value.toFixed(2);
    if (value < 1000000) return `${(value / 1000).toFixed(2)}K`;
    if (value < 1000000000) return `${(value / 1000000).toFixed(2)}M`;
    return `${(value / 1000000000).toFixed(2)}B`;
  }
}