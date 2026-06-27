/**
 * Performance Chart Component
 * Uses Chart.js for data visualization with dark mode support
 */

'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadChart = async () => {
      const { Chart } = await import('chart.js');

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
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
        }
      }
    };

    loadChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, type, title, isDark]);

  return (
    <div className="w-full h-80">
      <canvas ref={canvasRef} />
    </div>
  );
}
