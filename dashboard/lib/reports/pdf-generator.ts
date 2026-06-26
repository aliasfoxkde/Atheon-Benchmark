/**
 * PDF Report Generator
 * Generates benchmark reports in PDF format for download and sharing
 */

import type { BenchmarkReport } from '@/lib/github/cache';

export interface PDFReportOptions {
  title?: string;
  subtitle?: string;
  includeCharts?: boolean;
  pageSize?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Generate a PDF report from benchmark results
 */
export async function generateBenchmarkPDF(
  results: BenchmarkReport[],
  options: PDFReportOptions = {}
): Promise<Blob> {
  const {
    title = 'Atheon Benchmark Report',
    subtitle = 'Community AI Benchmark Results',
    pageSize = 'letter',
    orientation = 'portrait',
  } = options;

  // Build HTML content for the report
  const html = buildReportHTML(results, { title, subtitle, pageSize, orientation });

  // Create a blob from HTML
  const htmlBlob = new Blob([html], { type: 'text/html' });
  const htmlUrl = URL.createObjectURL(htmlBlob);

  // Open in new window for printing/PDF save
  const printWindow = window.open(htmlUrl, '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  // Wait for content to load then trigger print
  await new Promise<void>((resolve) => {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        resolve();
      }, 500);
    };
  });

  // Return empty blob - actual PDF creation happens in print dialog
  return htmlBlob;
}

/**
 * Build HTML content for the report
 */
function buildReportHTML(
  results: BenchmarkReport[],
  options: PDFReportOptions
): string {
  const { title, subtitle, pageSize, orientation } = options;

  const pageWidth = pageSize === 'letter' ? '8.5in' : '210mm';
  const pageHeight = pageSize === 'letter' ? '11in' : '297mm';

  const stats = calculateStats(results);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: 0.75in;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1a1a1a;
    }

    .header {
      text-align: center;
      margin-bottom: 0.5in;
      padding-bottom: 0.25in;
      border-bottom: 2px solid #3b82f6;
    }

    .header h1 {
      font-size: 24pt;
      color: #3b82f6;
      margin-bottom: 0.1in;
    }

    .header p {
      color: #666;
      font-size: 11pt;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.15in;
      margin-bottom: 0.3in;
    }

    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.15in;
      text-align: center;
    }

    .summary-card .value {
      font-size: 18pt;
      font-weight: bold;
      color: #3b82f6;
    }

    .summary-card .label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
    }

    .section {
      margin-bottom: 0.3in;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 0.1in;
      padding-bottom: 0.05in;
      border-bottom: 1px solid #bfdbfe;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }

    th {
      background: #3b82f6;
      color: white;
      padding: 0.08in 0.05in;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 0.08in 0.05in;
      border-bottom: 1px solid #e2e8f0;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .status-pass {
      color: #059669;
      font-weight: bold;
    }

    .status-fail {
      color: #dc2626;
      font-weight: bold;
    }

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      padding: 0.1in;
      border-top: 1px solid #e2e8f0;
    }

    .timestamp {
      text-align: right;
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 0.2in;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="value">${stats.totalSystems}</div>
      <div class="label">Systems</div>
    </div>
    <div class="summary-card">
      <div class="value">${stats.totalBenchmarks}</div>
      <div class="label">Benchmarks</div>
    </div>
    <div class="summary-card">
      <div class="value">${stats.passRate}%</div>
      <div class="label">Pass Rate</div>
    </div>
    <div class="summary-card">
      <div class="value">${stats.avgDuration}ms</div>
      <div class="label">Avg Duration</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Individual System Results</div>
    <table>
      <thead>
        <tr>
          <th>System</th>
          <th>CPU</th>
          <th>Tests</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Pass Rate</th>
          <th>Avg Duration</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(r => `
          <tr>
            <td><strong>${escapeHtml(r.system_info.hostname)}</strong><br><small>${r.system_id.substring(0, 8)}</small></td>
            <td>${escapeHtml(r.system_info.cpu)}</td>
            <td>${r.summary.total_tests}</td>
            <td class="status-pass">${r.summary.passed}</td>
            <td class="status-fail">${r.summary.failed}</td>
            <td>${((r.summary.passed / r.summary.total_tests) * 100).toFixed(1)}%</td>
            <td>${r.summary.avg_duration_ms.toFixed(1)}ms</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Environment Details</div>
    <table>
      <thead>
        <tr>
          <th>System ID</th>
          <th>OS</th>
          <th>Architecture</th>
          <th>Go Version</th>
          <th>RAM</th>
          <th>Submitted</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(r => `
          <tr>
            <td><code>${r.system_id.substring(0, 12)}...</code></td>
            <td>${escapeHtml(r.system_info.os)}</td>
            <td>${escapeHtml(r.system_info.arch)}</td>
            <td>${escapeHtml(r.system_info.go_version)}</td>
            <td>${escapeHtml(r.system_info.ram)}</td>
            <td>${new Date(r.submitted_at).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="timestamp">
    Report generated: ${new Date().toLocaleString()}
  </div>

  <div class="footer">
    Powered by Atheon Benchmark | Community AI Benchmark Platform
  </div>
</body>
</html>
  `.trim();
}

/**
 * Calculate summary statistics
 */
function calculateStats(results: BenchmarkReport[]) {
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;

  for (const r of results) {
    totalTests += r.summary.total_tests;
    totalPassed += r.summary.passed;
    totalFailed += r.summary.failed;
    totalDuration += r.summary.avg_duration_ms;
  }

  return {
    totalSystems: results.length,
    totalBenchmarks: totalTests,
    passRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0',
    avgDuration: totalDuration > 0 ? (totalDuration / results.length).toFixed(1) : '0',
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Download report as HTML (can be saved as PDF via browser)
 */
export function downloadHTMLReport(
  results: BenchmarkReport[],
  options: PDFReportOptions = {}
): void {
  const html = buildReportHTML(results, options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `benchmark-report-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}