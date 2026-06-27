import { logger } from '../logging';
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
        logger.warn('LCP not supported');
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
  private boundErrorHandler: (e: ErrorEvent) => void;
  private boundRejectionHandler: (e: PromiseRejectionEvent) => void;

  constructor() {
    this.boundErrorHandler = this.handleError.bind(this);
    this.boundRejectionHandler = this.handlePromiseRejection.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.boundErrorHandler);
      window.addEventListener('unhandledrejection', this.boundRejectionHandler);
    }
  }

  /** Cleanup event listeners to prevent memory leaks */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.boundErrorHandler);
      window.removeEventListener('unhandledrejection', this.boundRejectionHandler);
    }
    this.errors = [];
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
let globalIntervalId: ReturnType<typeof setInterval> | null = null;

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
 * @returns cleanup function to stop periodic collection
 */
export function initAnalytics(): (() => void) | void {
  if (typeof window === 'undefined') return;

  const analytics = getAnalytics();

  // Collect initial metrics after page load
  if (document.readyState === 'complete') {
    analytics.collectMetrics();
  } else if (typeof window.addEventListener === 'function') {
    window.addEventListener('load', () => {
      setTimeout(() => analytics.collectMetrics(), 100);
    });
  }

  // Collect metrics periodically
  globalIntervalId = setInterval(() => {
    analytics.collectMetrics();
  }, 30000); // Every 30 seconds

  // Log analytics in development
  if (process.env.NODE_ENV === 'development' && typeof window.addEventListener === 'function') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        logger.debug('[Analytics]', analytics.exportData());
      }, 1000);
    });
  }

  // Return cleanup function
  return () => {
    if (globalIntervalId !== null) {
      clearInterval(globalIntervalId);
      globalIntervalId = null;
    }
  };
}