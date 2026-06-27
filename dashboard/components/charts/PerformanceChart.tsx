/**
 * Performance Chart Component
 * Uses Chart.js for data visualization with dark mode support
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Chart, ChartConfiguration } from 'chart.js';
import { useTheme } from '../theme-provider';

interface PerformanceChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }[];
  };
  type?: 'bar' | 'line' | 'radar';
  title?: string;
}

export function PerformanceChart({ data, type = 'bar', title }: PerformanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const { resolvedTheme: isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createChart = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const { Chart } = await import('chart.js');

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        setError('Could not get canvas context');
        return;
      }

      const titleColor = isDark ? 'rgba(250, 250, 250, 0.87)' : 'rgba(0, 0, 0, 0.87)';
      const labelColor = isDark ? 'rgba(212, 212, 212, 0.7)' : 'rgba(0, 0, 0, 0.7)';
      const gridColor = isDark ? 'rgba(212, 212, 212, 0.1)' : 'rgba(0, 0, 0, 0.1)';

      const config: ChartConfiguration = {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: !!title,
              text: title,
              color: titleColor,
              font: {
                size: 16,
                weight: 'bold',
              },
            },
            legend: {
              labels: {
                color: labelColor,
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: labelColor,
              },
              grid: {
                color: gridColor,
              },
            },
            y: {
              ticks: {
                color: labelColor,
              },
              grid: {
                color: gridColor,
              },
            },
          },
        },
      };

      chartRef.current = new Chart(ctx, config);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create chart:', err);
      setError('Failed to load chart');
      setIsLoading(false);
    }
  }, [data, type, title, isDark]);

  useEffect(() => {
    createChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [createChart]);

  if (error) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-xl">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <canvas ref={canvasRef} aria-label={title || 'Performance chart'} role="img" />
    </div>
  );
}
