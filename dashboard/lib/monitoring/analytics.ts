/**
 * Monitoring and Analytics Utilities
 * Provides performance monitoring, error tracking, and analytics
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export interface ErrorMetrics {
  errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    url: string;
    userAgent: string;
  }>;
  totalErrors: number;
}

/**
 * Collect performance metrics from the Performance API
 */
export function collectPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined') return null;

  try {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!perfData) return null;

    const paintTiming = performance.getEntriesByType('paint');
    const fcp = paintTiming.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

    // Get LCP (largest contentful paint)
    let lcp = 0;
    if (PerformanceObserver) {
      try {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          lcp = lcpEntries[lcpEntries.length - 1].startTime;
        }
      } catch (e) {
        console.warn('LCP not supported');
      }
    }

    return {
      pageLoadTime: perfData.loadEventEnd - perfData.startTime,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      firstInputDelay: 0, // Requires event timing
      cumulativeLayoutShift: 0, // Requires layout shift
      timeToInteractive: perfData.domInteractive - perfData.startTime,
    };
  } catch (error) {
    console.error('Failed to collect performance metrics:', error);
    return null;
  }
}

/**
 * Track JavaScript errors
 */
export class ErrorTracker {
  private errors: ErrorMetrics['errors'] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }
  }

  private handleError(event: ErrorEvent) {
    this.errors.push({
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift();
    }
  }

  private handlePromiseRejection(event: PromiseRejectionEvent) {
    this.errors.push({
      message: event.reason?.toString() || 'Unhandled promise rejection',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    if (this.errors.length > 50) {
      this.errors.shift();
    }
  }

  getErrors(): ErrorMetrics {
    return {
      errors: [...this.errors],
      totalErrors: this.errors.length,
    };
  }

  clearErrors(): void {
    this.errors = [];
  }
}

/**
 * Analytics data collector
 */
export class AnalyticsCollector {
  private metrics: PerformanceMetrics[] = [];
  private errorTracker: ErrorTracker;

  constructor() {
    this.errorTracker = new ErrorTracker();
  }

  /**
   * Collect current page metrics
   */
  collectMetrics(): void {
    if (typeof window === 'undefined') return;

    const metrics = collectPerformanceMetrics();
    if (metrics) {
      this.metrics.push(metrics);

      // Keep only last 100 metric collections
      if (this.metrics.length > 100) {
        this.metrics.shift();
      }
    }
  }

  /**
   * Get average metrics
   */
  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const sum = this.metrics.reduce(
      (acc, metrics) => ({
        pageLoadTime: acc.pageLoadTime + metrics.pageLoadTime,
        firstContentfulPaint: acc.firstContentfulPaint + metrics.firstContentfulPaint,
        largestContentfulPaint: acc.largestContentfulPaint + metrics.largestContentfulPaint,
        firstInputDelay: acc.firstInputDelay + metrics.firstInputDelay,
        cumulativeLayoutShift: acc.cumulativeLayoutShift + metrics.cumulativeLayoutShift,
        timeToInteractive: acc.timeToInteractive + metrics.timeToInteractive,
      }),
      {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        timeToInteractive: 0,
      }
    );

    const count = this.metrics.length;
    return {
      pageLoadTime: Math.round(sum.pageLoadTime / count),
      firstContentfulPaint: Math.round(sum.firstContentfulPaint / count),
      largestContentfulPaint: Math.round(sum.largestContentfulPaint / count),
      firstInputDelay: Math.round(sum.firstInputDelay / count),
      cumulativeLayoutShift: Math.round((sum.cumulativeLayoutShift / count) * 1000) / 1000,
      timeToInteractive: Math.round(sum.timeToInteractive / count),
    };
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    return this.errorTracker.getErrors();
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    return JSON.stringify({
      metrics: this.getAverageMetrics(),
      errors: this.getErrorMetrics(),
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    }, null, 2);
  }
}

// Global analytics instance
let globalAnalytics: AnalyticsCollector | null = null;

/**
 * Get or create global analytics instance
 */
export function getAnalytics(): AnalyticsCollector {
  if (!globalAnalytics) {
    globalAnalytics = new AnalyticsCollector();
  }
  return globalAnalytics;
}

/**
 * Initialize analytics on page load
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  const analytics = getAnalytics();

  // Collect initial metrics after page load
  if (document.readyState === 'complete') {
    analytics.collectMetrics();
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => analytics.collectMetrics(), 100);
    });
  }

  // Collect metrics periodically
  setInterval(() => {
    analytics.collectMetrics();
  }, 30000); // Every 30 seconds

  // Log analytics in development
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.log('[Analytics]', analytics.exportData());
      }, 1000);
    });
  }
}