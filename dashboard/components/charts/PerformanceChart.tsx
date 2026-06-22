/**
 * Performance Chart Component
 * Uses Chart.js for data visualization
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Chart, ChartConfiguration } from 'chart.js';

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
                  color: 'rgba(0, 0, 0, 0.87)',
                  font: {
                    size: 16,
                    weight: 'bold',
                  },
                },
                legend: {
                  labels: {
                    color: 'rgba(0, 0, 0, 0.7)',
                  },
                },
              },
              scales: {
                x: {
                  ticks: {
                    color: 'rgba(0, 0, 0, 0.7)',
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                  },
                },
                y: {
                  ticks: {
                    color: 'rgba(0, 0, 0, 0.7)',
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
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
  }, [data, type, title]);

  return (
    <div className="w-full h-80">
      <canvas ref={canvasRef} />
    </div>
  );
}
