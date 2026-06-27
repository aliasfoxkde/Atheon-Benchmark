'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../theme-provider';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceBarChartProps {
  systems: {
    name: string;
    performance: number;
    color: string;
  }[];
  title?: string;
}

export function PerformanceBarChart({ systems, title }: PerformanceBarChartProps) {
  const { resolvedTheme: isDark } = useTheme();

  const textColor = isDark ? 'rgb(212, 212, 212)' : 'rgb(115, 115, 115)';
  const gridColor = isDark ? 'rgba(212, 212, 212, 0.1)' : 'rgba(115, 115, 115, 0.1)';
  const tooltipBg = isDark ? 'rgba(38, 38, 38, 0.95)' : 'rgba(0, 0, 0, 0.8)';

  const data = {
    labels: systems.map((s) => s.name),
    datasets: [
      {
        label: 'Performance Score',
        data: systems.map((s) => s.performance),
        backgroundColor: systems.map((s) => s.color + 'cc'),
        borderColor: systems.map((s) => s.color),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: tooltipBg,
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        titleColor: isDark ? '#fafafa' : '#ffffff',
        bodyColor: isDark ? '#d4d4d4' : '#e4e4e7',
        callbacks: {
          label: (context) => `Score: ${context.parsed.y?.toFixed(2) || 'N/A'}%`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          font: {
            size: 11,
          },
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
      {title && (
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {title}
        </h3>
      )}
      <div className="w-full h-80">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
