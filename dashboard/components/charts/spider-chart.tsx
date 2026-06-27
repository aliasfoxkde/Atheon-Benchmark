'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useTheme } from '../theme-provider';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SpiderChartProps {
  systems: {
    name: string;
    data: number[];
    color: string;
  }[];
  labels: string[];
  title?: string;
}

export function SpiderChart({ systems, labels, title }: SpiderChartProps) {
  const { resolvedTheme: isDark } = useTheme();

  const textColor = isDark ? 'rgb(212, 212, 212)' : 'rgb(115, 115, 115)';
  const gridColor = isDark ? 'rgba(212, 212, 212, 0.15)' : 'rgba(115, 115, 115, 0.15)';
  const tooltipBg = isDark ? 'rgba(38, 38, 38, 0.95)' : 'rgba(0, 0, 0, 0.8)';

  const data = {
    labels,
    datasets: systems.map((system) => ({
      label: system.name,
      data: system.data,
      backgroundColor: system.color + '25',
      borderColor: system.color,
      borderWidth: 2,
      pointBackgroundColor: system.color,
      pointBorderColor: isDark ? '#27272a' : '#fff',
      pointHoverBackgroundColor: isDark ? '#27272a' : '#fff',
      pointHoverBorderColor: system.color,
    })),
  };

  const options: ChartOptions<'radar'> = {
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
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        titleColor: isDark ? '#fafafa' : '#ffffff',
        bodyColor: isDark ? '#d4d4d4' : '#e4e4e7',
      },
    },
    scales: {
      r: {
        angleLines: {
          color: gridColor,
        },
        grid: {
          color: gridColor,
        },
        pointLabels: {
          color: textColor,
          font: {
            size: 11,
          },
        },
        ticks: {
          color: textColor,
          backdropColor: 'transparent',
          font: {
            size: 10,
          },
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
      {title && (
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {title}
        </h3>
      )}
      <div className="w-full h-96">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}
