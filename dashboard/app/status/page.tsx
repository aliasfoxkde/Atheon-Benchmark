/**
 * API Status Page
 * Display real-time status of all system dependencies and services
 */

'use client';

import { useEffect, useState } from 'react';
import { Globe, Database, Cloud, Cpu, Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface ServiceStatus {
  name: string;
  description: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency?: number;
  lastChecked: Date;
  message?: string;
}

interface ApiEndpoint {
  name: string;
  url: string;
  method: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency?: number;
  lastChecked: Date;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const checkServices = async () => {
    setLoading(true);
    const serviceChecks: ServiceStatus[] = [];
    const endpointChecks: ApiEndpoint[] = [];

    // Check GitHub API
    const githubStart = Date.now();
    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      const githubLatency = Date.now() - githubStart;

      if (response.ok) {
        const data = await response.json();
        serviceChecks.push({
          name: 'GitHub API',
          description: 'GitHub API for benchmark result storage',
          status: 'healthy',
          latency: githubLatency,
          lastChecked: new Date(),
          message: `Rate limit: ${data.rate.remaining}/5000`
        });
      } else {
        serviceChecks.push({
          name: 'GitHub API',
          description: 'GitHub API for benchmark result storage',
          status: response.status >= 500 ? 'degraded' : 'unhealthy',
          latency: githubLatency,
          lastChecked: new Date(),
          message: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      serviceChecks.push({
        name: 'GitHub API',
        description: 'GitHub API for benchmark result storage',
        status: 'unhealthy',
        lastChecked: new Date(),
        message: error instanceof Error ? error.message : 'Connection failed'
      });
    }

    // Check Claude API (just connectivity, not actual API call)
    const claudeStart = Date.now();
    try {
      // Try to reach the Claude API base URL
      const response = await fetch('https://api.anthropic.com/.well-known/status', {
        method: 'HEAD',
        cache: 'no-store'
      });
      const claudeLatency = Date.now() - claudeStart;

      serviceChecks.push({
        name: 'Claude API',
        description: 'Anthropic Claude API for benchmark execution',
        status: response.ok ? 'healthy' : 'degraded',
        latency: claudeLatency,
        lastChecked: new Date(),
        message: response.ok ? 'API reachable' : `HTTP ${response.status}`
      });
    } catch (error) {
      serviceChecks.push({
        name: 'Claude API',
        description: 'Anthropic Claude API for benchmark execution',
        status: 'unhealthy',
        lastChecked: new Date(),
        message: error instanceof Error ? error.message : 'Connection failed'
      });
    }

    // Check Cloudflare services
    const cfStart = Date.now();
    try {
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/status', {
        method: 'GET',
        cache: 'no-store'
      });
      const cfLatency = Date.now() - cfStart;

      serviceChecks.push({
        name: 'Cloudflare',
        description: 'Cloudflare edge network and CDN',
        status: response.ok ? 'healthy' : 'degraded',
        latency: cfLatency,
        lastChecked: new Date(),
        message: response.ok ? 'CDN operational' : `HTTP ${response.status}`
      });
    } catch (error) {
      serviceChecks.push({
        name: 'Cloudflare',
        description: 'Cloudflare edge network and CDN',
        status: 'degraded',
        lastChecked: new Date(),
        message: 'Using fallback routing'
      });
    }

    // Check static benchmark data availability
    const staticStart = Date.now();
    try {
      const response = await fetch('/benchmark-results.json', {
        method: 'HEAD',
        cache: 'no-store'
      });
      const staticLatency = Date.now() - staticStart;

      serviceChecks.push({
        name: 'Benchmark Data',
        description: 'Static benchmark results data file',
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: staticLatency,
        lastChecked: new Date(),
        message: response.ok ? 'Data available' : `HTTP ${response.status}`
      });
    } catch (error) {
      serviceChecks.push({
        name: 'Benchmark Data',
        description: 'Static benchmark results data file',
        status: 'unhealthy',
        lastChecked: new Date(),
        message: 'File not available'
      });
    }

    // Check local API endpoints
    const apiEndpoints = [
      { name: 'Benchmark Results API', url: '/api/v1/results', method: 'GET' },
      { name: 'System Info API', url: '/api/v1/systems', method: 'GET' },
      { name: 'Health Check API', url: '/api/health', method: 'GET' },
    ];

    for (const endpoint of apiEndpoints) {
      const epStart = Date.now();
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          cache: 'no-store'
        });
        const epLatency = Date.now() - epStart;

        endpointChecks.push({
          ...endpoint,
          status: response.ok ? 'healthy' : response.status >= 500 ? 'degraded' : 'unhealthy',
          latency: epLatency,
          lastChecked: new Date()
        });
      } catch (error) {
        endpointChecks.push({
          ...endpoint,
          status: 'unhealthy',
          lastChecked: new Date()
        });
      }
    }

    // Check browser APIs
    const browserChecks: ServiceStatus[] = [];

    // Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      browserChecks.push({
        name: 'Service Worker',
        description: 'PWA service worker for offline support',
        status: registrations.length > 0 ? 'healthy' : 'degraded',
        lastChecked: new Date(),
        message: registrations.length > 0 ? `${registrations.length} worker(s) active` : 'No service workers registered'
      });
    } else {
      browserChecks.push({
        name: 'Service Worker',
        description: 'PWA service worker for offline support',
        status: 'unhealthy',
        lastChecked: new Date(),
        message: 'Not supported in this browser'
      });
    }

    // IndexedDB
    if ('indexedDB' in window) {
      browserChecks.push({
        name: 'IndexedDB',
        description: 'Local storage for offline data',
        status: 'healthy',
        lastChecked: new Date(),
        message: 'Available'
      });
    } else {
      browserChecks.push({
        name: 'IndexedDB',
        description: 'Local storage for offline data',
        status: 'degraded',
        lastChecked: new Date(),
        message: 'Not supported - limited offline support'
      });
    }

    // WebSocket
    if ('WebSocket' in window) {
      browserChecks.push({
        name: 'WebSocket',
        description: 'Real-time communication support',
        status: 'healthy',
        lastChecked: new Date(),
        message: 'Available'
      });
    } else {
      browserChecks.push({
        name: 'WebSocket',
        description: 'Real-time communication support',
        status: 'degraded',
        lastChecked: new Date(),
        message: 'Not supported - SSE fallback required'
      });
    }

    setServices([...serviceChecks, ...browserChecks]);
    setEndpoints(endpointChecks);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getOverallStatus = () => {
    const externalServices = services.filter(s =>
      ['GitHub API', 'Claude API', 'Cloudflare', 'Benchmark Data'].includes(s.name)
    );

    if (externalServices.length === 0) return 'unknown';
    if (externalServices.some(s => s.status === 'unhealthy')) return 'unhealthy';
    if (externalServices.some(s => s.status === 'degraded')) return 'degraded';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                <Activity className="w-8 h-8" />
                API Status
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Real-time status of all system services and dependencies
              </p>
            </div>
            <button
              onClick={checkServices}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Overall Status Banner */}
          <div className={`mt-6 p-4 rounded-xl border ${
            overallStatus === 'healthy'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : overallStatus === 'degraded'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : overallStatus === 'unhealthy'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
          }`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(overallStatus)}
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {overallStatus === 'healthy' && 'All Systems Operational'}
                  {overallStatus === 'degraded' && 'Partial Outage'}
                  {overallStatus === 'unhealthy' && 'Service Disruption'}
                  {overallStatus === 'unknown' && 'Status Unknown'}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Last checked: {lastRefresh.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {service.name === 'GitHub API' && <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
                  {service.name === 'Claude API' && <Cpu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
                  {service.name === 'Cloudflare' && <Cloud className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
                  {service.name === 'Benchmark Data' && <Database className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
                  {service.name === 'Service Worker' && <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
                  {service.name === 'IndexedDB' && <Database className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
                  {service.name === 'WebSocket' && <Activity className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{service.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.description}</p>
                  </div>
                </div>
                {getStatusIcon(service.status)}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{service.message}</span>
                {service.latency && (
                  <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                    {service.latency}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* API Endpoints Table */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              API Endpoints
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Latency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {endpoints.map((endpoint, index) => (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                          {endpoint.url}
                        </code>
                        <a
                          href={endpoint.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                          aria-label={`Open ${endpoint.url} in new tab`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        endpoint.method === 'GET'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : endpoint.method === 'POST'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-400'
                      }`}>
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(endpoint.status)}
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">
                          {endpoint.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {endpoint.latency ? (
                        <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
                          {endpoint.latency}ms
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {endpoints.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
                      Loading endpoint status...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>Status updates automatically every 30 seconds</p>
          <p className="mt-1">
            Need help?{' '}
            <a href="https://github.com/HoraDomu/Atheon-Benchmark/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
              Report an issue on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}