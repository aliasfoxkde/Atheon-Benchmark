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

interface WebVitalsPayload {
  url: string;
  timestamp: number;
  metrics: PerformanceMetrics;
}

const VITALS_ENDPOINT = '/api/vitals';

/**
 * Send web vitals to analytics endpoint
 * Always-on collection for production monitoring
 */
async function sendToAnalytics(payload: WebVitalsPayload): Promise<void> {
  try {
    await fetch(VITALS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silently fail - don't disrupt user experience for analytics
  }
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Toggle visibility with Ctrl+Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Measure performance metrics using Web Vitals API
    if ('PerformanceObserver' in window) {
      const metricsMap: PerformanceMetrics = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
      };

      // Observe First Contentful Paint
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          metricsMap.fcp = Math.round(entries[entries.length - 1].startTime);
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // Observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          metricsMap.lcp = Math.round(entries[entries.length - 1].startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Observe First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0] as PerformanceEventTiming;
          metricsMap.fid = Math.round(firstInput.processingStart - firstInput.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Observe Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShift.hadRecentInput && layoutShift.value) {
            clsValue += layoutShift.value;
          }
        }
        metricsMap.cls = parseFloat(clsValue.toFixed(3));
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Get navigation timing for TTFB
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        metricsMap.ttfb = Math.round(navTiming.responseStart - navTiming.requestStart);
      }

      // Set metrics after collection period and send to analytics
      const timeoutId = setTimeout(() => {
        setMetrics(metricsMap);
        // Always send to analytics in production
        sendToAnalytics({
          url: window.location.pathname,
          timestamp: Date.now(),
          metrics: metricsMap,
        });
      }, 3000);

      return () => {
        clearTimeout(timeoutId);
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, []);

  // Log performance data in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && metrics) {
      console.log('[Performance Monitor]', metrics);
    }
  }, [metrics]);

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
