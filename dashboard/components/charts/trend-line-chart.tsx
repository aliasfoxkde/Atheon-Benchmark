'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendLineChartProps {
  data: {
    label: string;
    values: number[];
    color: string;
  }[];
  labels: string[];
  title?: string;
}

export function TrendLineChart({ data, labels, title }: TrendLineChartProps) {
  const [isDark, setIsDark] = useState(false);
  const mediaQuery: MediaQueryList | undefined = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : undefined;

  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.classList.contains('dark') ||
        (mediaQuery?.matches ?? false);
      setIsDark(dark);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    mediaQuery?.addEventListener('change', checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery?.removeEventListener('change', checkTheme);
    };
  }, [mediaQuery]);

  const textColor = isDark ? 'rgb(212, 212, 212)' : 'rgb(115, 115, 115)';
  const gridColor = isDark ? 'rgba(212, 212, 212, 0.1)' : 'rgba(115, 115, 115, 0.1)';
  const tooltipBg = isDark ? 'rgba(38, 38, 38, 0.95)' : 'rgba(0, 0, 0, 0.8)';

  const datasets = data.map((dataset) => ({
    label: dataset.label,
    data: dataset.values,
    borderColor: dataset.color,
    backgroundColor: dataset.color + '25',
    borderWidth: 3,
    tension: 0.4,
    fill: true,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: dataset.color,
    pointBorderColor: isDark ? '#27272a' : '#fff',
    pointBorderWidth: 2,
  }));

  const chartData = {
    labels,
    datasets,
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          font: {
            size: 12,
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        mode: 'index' as const,
        intersect: false,
        titleColor: isDark ? '#fafafa' : '#ffffff',
        bodyColor: isDark ? '#d4d4d4' : '#e4e4e7',
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
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
      {title && (
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {title}
        </h3>
      )}
      <div className="w-full h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}