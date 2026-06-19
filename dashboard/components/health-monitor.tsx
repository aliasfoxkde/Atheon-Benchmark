/**
 * Health Monitor Component
 * Provides health monitoring and status reporting for the dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface HealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  latency?: number;
}

export function HealthMonitor() {
  const [healthChecks, setHealthChecks] = useState<HealthStatus[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const performHealthChecks = async () => {
      const checks: HealthStatus[] = [];

      // Check static data availability
      try {
        const start = performance.now();
        const response = await fetch('/benchmark-results.json');
        const end = performance.now();

        if (response.ok) {
          const data = await response.json();
          checks.push({
            name: 'Benchmark Data',
            status: 'healthy',
            message: `${data.length} results available`,
            latency: Math.round(end - start)
          });
        } else {
          checks.push({
            name: 'Benchmark Data',
            status: 'unhealthy',
            message: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        checks.push({
          name: 'Benchmark Data',
          status: 'unhealthy',
          message: 'Failed to fetch'
        });
      }

      // Check metadata
      try {
        const start = performance.now();
        const response = await fetch('/benchmark-metadata.json');
        const end = performance.now();

        if (response.ok) {
          checks.push({
            name: 'Metadata',
            status: 'healthy',
            message: 'Metadata loaded',
            latency: Math.round(end - start)
          });
        } else {
          checks.push({
            name: 'Metadata',
            status: 'degraded',
            message: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        checks.push({
          name: 'Metadata',
          status: 'degraded',
          message: 'Failed to fetch'
        });
      }

      // Check page performance
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        const loadTime = perfData.loadEventEnd - perfData.startTime;
        checks.push({
          name: 'Page Load',
          status: loadTime < 3000 ? 'healthy' : loadTime < 5000 ? 'degraded' : 'unhealthy',
          message: `${Math.round(loadTime)}ms load time`,
          latency: Math.round(loadTime)
        });
      }

      setHealthChecks(checks);
    };

    performHealthChecks();
    const interval = setInterval(performHealthChecks, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const overallStatus = healthChecks.length === 0
    ? 'unknown'
    : healthChecks.some(check => check.status === 'unhealthy')
    ? 'unhealthy'
    : healthChecks.some(check => check.status === 'degraded')
    ? 'degraded'
    : 'healthy';

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        title="Show health monitor"
      >
        <Activity className={`w-5 h-5 ${
          overallStatus === 'healthy' ? 'text-green-500' :
          overallStatus === 'degraded' ? 'text-yellow-500' :
          overallStatus === 'unhealthy' ? 'text-red-500' :
          'text-zinc-400'
        }`} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">System Health</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {healthChecks.map((check, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="mt-0.5">{getStatusIcon(check.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{check.name}</p>
                {check.latency && (
                  <span className="text-xs text-zinc-500">{check.latency}ms</span>
                )}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{check.message}</p>
            </div>
          </div>
        ))}
        {healthChecks.length === 0 && (
          <p className="text-sm text-zinc-500 text-center">Loading health status...</p>
        )}
      </div>
    </div>
  );
}