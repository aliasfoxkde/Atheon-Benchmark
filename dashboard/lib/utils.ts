import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * CSV Export Utilities for Benchmark Results
 */

export interface BenchmarkReport {
  system_id: string;
  system_info: {
    hostname: string;
    cpu: string;
    ram: string;
    os: string;
    arch: string;
    go_version: string;
    timestamp: string;
  };
  benchmarks: Array<{
    id: string;
    name: string;
    duration_ms: number;
    tokens_used: number;
    passed: boolean;
    output: string;
    timestamp: string;
  }>;
  summary: {
    total_tests: number;
    passed: number;
    failed: number;
    avg_duration_ms: number;
    total_tokens: number;
  };
  submitted_at: string;
}

/**
 * Convert benchmark results to CSV format
 */
export function exportResultsToCSV(results: BenchmarkReport[]): string {
  const headers = [
    'System ID',
    'Hostname',
    'CPU',
    'RAM',
    'OS',
    'Architecture',
    'Go Version',
    'Submitted At',
    'Total Tests',
    'Passed',
    'Failed',
    'Avg Duration (ms)',
    'Total Tokens',
    'Benchmark Name',
    'Benchmark Duration (ms)',
    'Benchmark Tokens',
    'Benchmark Passed',
  ];

  const rows: string[][] = [];

  for (const report of results) {
    for (const benchmark of report.benchmarks) {
      rows.push([
        escapeCSV(report.system_id),
        escapeCSV(report.system_info.hostname),
        escapeCSV(report.system_info.cpu),
        escapeCSV(report.system_info.ram),
        escapeCSV(report.system_info.os),
        escapeCSV(report.system_info.arch),
        escapeCSV(report.system_info.go_version),
        escapeCSV(report.submitted_at),
        String(report.summary.total_tests),
        String(report.summary.passed),
        String(report.summary.failed),
        String(report.summary.avg_duration_ms),
        String(report.summary.total_tokens),
        escapeCSV(benchmark.name),
        String(benchmark.duration_ms),
        String(benchmark.tokens_used),
        benchmark.passed ? 'true' : 'false',
      ]);
    }
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger browser download of CSV content
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export benchmark results and trigger download
 */
export function exportAndDownloadResults(results: BenchmarkReport[], filename?: string): void {
  const csv = exportResultsToCSV(results);
  const defaultFilename = `benchmark-results-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename || defaultFilename);
}