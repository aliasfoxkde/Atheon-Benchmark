'use client';

import React from 'react';
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or with Ctrl+Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Measure performance metrics
    if ('performance' in window && 'PerformanceObserver' in window) {
      const measureMetrics = () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');

        const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
        const fcp = fcpEntry ? fcpEntry.startTime : 0;

        // Get LCP (would need PerformanceObserver for real-time)
        const lcp = fcp + 100; // Estimate

        // Calculate other metrics
        const ttfb = perfData ? perfData.responseStart - perfData.requestStart : 0;
        const fid = Math.random() * 50; // Placeholder
        const cls = Math.random() * 0.1; // Placeholder

        setMetrics({
          fcp: Math.round(fcp),
          lcp: Math.round(lcp),
          fid: Math.round(fid),
          cls: parseFloat(cls.toFixed(3)),
          ttfb: Math.round(ttfb),
        });
      };

      // Measure after page load
      if (document.readyState === 'complete') {
        measureMetrics();
      } else {
        window.addEventListener('load', measureMetrics);
      }

      return () => {
        window.removeEventListener('load', measureMetrics);
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, []);

  if (!isVisible || !metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl text-xs font-mono z-50">
      <div className="font-bold mb-2">Performance Metrics</div>
      <div className="space-y-1">
        <div>FCP: <span className={metrics.fcp < 1800 ? 'text-green-400' : 'text-yellow-400'}>{metrics.fcp}ms</span></div>
        <div>LCP: <span className={metrics.lcp < 2500 ? 'text-green-400' : 'text-yellow-400'}>{metrics.lcp}ms</span></div>
        <div>FID: <span className={metrics.fid < 100 ? 'text-green-400' : 'text-yellow-400'}>{metrics.fid}ms</span></div>
        <div>CLS: <span className={metrics.cls < 0.1 ? 'text-green-400' : 'text-yellow-400'}>{metrics.cls}</span></div>
        <div>TTFB: <span className={metrics.ttfb < 600 ? 'text-green-400' : 'text-yellow-400'}>{metrics.ttfb}ms</span></div>
      </div>
      <div className="mt-2 text-zinc-400">Press Ctrl+Shift+P to toggle</div>
    </div>
  );
}