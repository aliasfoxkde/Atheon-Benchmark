'use client';

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Copy, Check } from 'lucide-react';

interface BenchmarkExportProps {
  data: unknown;
  filename?: string;
}

export function BenchmarkExport({ data, filename = 'benchmark-results' }: BenchmarkExportProps) {
  const [copied, setCopied] = useState(false);

  const exportJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!data || typeof data !== 'object') return;

    const results = Array.isArray(data) ? data : [data];
    const csvRows: string[] = [];

    // Extract all unique keys from nested objects
    const headers = ['system_id', 'atheon_version', 'go_version', 'os', 'arch',
      'ns_per_op', 'files_per_sec', 'bytes_per_sec', 'ops_per_sec',
      'alloced_bytes_per_op', 'allocations_per_op', 'cpu_percent',
      'findings_count', 'files_scanned', 'bytes_scanned', 'submitted_at'];

    csvRows.push(headers.join(','));

    for (const result of results) {
      const row = headers.map(header => {
        // Handle nested paths like "metrics.ns_per_op"
        const parts = header.split('.');
        let value: unknown = result;

        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) {
            value = (value as Record<string, unknown>)[part];
          } else {
            return '';
          }
        }

        // Escape CSV values
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvRows.push(row.join(','));
    }

    const csvStr = csvRows.join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Export Results
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={exportJSON}
          className="flex flex-col items-center gap-1 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <FileJson className="w-5 h-5 text-blue-500" />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">JSON</span>
        </button>

        <button
          onClick={exportCSV}
          className="flex flex-col items-center gap-1 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <FileSpreadsheet className="w-5 h-5 text-green-500" />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">CSV</span>
        </button>

        <button
          onClick={copyToClipboard}
          className="flex flex-col items-center gap-1 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <Copy className="w-5 h-5 text-zinc-500" />
          )}
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>

      <p className="text-xs text-zinc-400 mt-3 text-center">
        Export benchmark results for external analysis
      </p>
    </div>
  );
}
