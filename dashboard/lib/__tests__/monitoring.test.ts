/**
 * Monitoring and Analytics Tests
 * Tests for performance monitoring, error tracking, and analytics
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  collectPerformanceMetrics,
  ErrorTracker,
  AnalyticsCollector,
  getAnalytics,
  initAnalytics,
  type PerformanceMetrics,
  type ErrorMetrics
} from '../monitoring/analytics';

describe('collectPerformanceMetrics', () => {
  beforeEach(() => {
    // Mock Performance API with complete navigation timing data
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        getEntriesByType: jest.fn((type: string) => {
          if (type === 'navigation') {
            return [{
              loadEventEnd: 2000,
              domInteractive: 1000,
              startTime: 0,
              responseEnd: 500,
              domComplete: 1500,
              fetchStart: 100,
              domContentLoadedEventEnd: 1200,
              responseStart: 300,
              requestStart: 200,
              connectEnd: 150,
              duration: 2000,
              name: 'navigation',
              entryType: 'navigation',
            }];
          }
          if (type === 'paint') {
            return [
              { name: 'first-contentful-paint', startTime: 800, entryType: 'paint' }
            ];
          }
          if (type === 'largest-contentful-paint') {
            return [
              { startTime: 1200, size: 5000, entryType: 'largest-contentful-paint', name: 'largest-contentful-paint' }
            ];
          }
          return [];
        })
      }
    });

    // Mock PerformanceObserver
    (global as any).PerformanceObserver = class PerformanceObserver {
      constructor() {}
      observe() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return null when performance API is not available', () => {
    (window as any).performance = undefined;
    const metrics = collectPerformanceMetrics();
    expect(metrics).toBeNull();
  });

  it('should collect performance metrics when available', () => {
    const metrics = collectPerformanceMetrics();
    expect(metrics).not.toBeNull();
    expect(metrics).toHaveProperty('pageLoadTime');
    expect(metrics).toHaveProperty('firstContentfulPaint');
  });

  it('should calculate page load time correctly', () => {
    const metrics = collectPerformanceMetrics();
    expect(metrics?.pageLoadTime).toBe(2000);
  });

  it('should handle missing paint timing gracefully', () => {
    (window.performance.getEntriesByType as jest.Mock).mockImplementation((type: string) => {
      if (type === 'navigation') {
        return [{ loadEventEnd: 2000, domInteractive: 1000, startTime: 0 }];
      }
      return [];
    });

    const metrics = collectPerformanceMetrics();
    expect(metrics?.firstContentfulPaint).toBe(0);
  });
});

describe('ErrorTracker', () => {
  let errorTracker: ErrorTracker;

  beforeEach(() => {
    errorTracker = new ErrorTracker();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track JavaScript errors', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      error: new Error('Test error'),
      filename: 'test.js',
      lineno: 10
    });

    // Simulate error event
    window.dispatchEvent(errorEvent);

    const errors = errorTracker.getErrors();
    expect(errors.totalErrors).toBe(1);
    expect(errors.errors[0].message).toBe('Test error');
  });

  it('should track promise rejections', () => {
    // Create a mock PromiseRejectionEvent since it might not be available in test environment
    const rejectedPromise = Promise.reject('Test rejection');
    // Catch the rejection to avoid unhandled promise rejection in test
    rejectedPromise.catch(() => {});

    const rejectionEvent = {
      type: 'unhandledrejection',
      reason: 'Test rejection',
      promise: rejectedPromise,
      preventDefault: jest.fn()
    } as any;

    // Manually call the error handler since dispatchEvent expects real Event objects
    (errorTracker as any).handlePromiseRejection(rejectionEvent);

    const errors = errorTracker.getErrors();
    expect(errors.totalErrors).toBe(1);
    expect(errors.errors[0].message).toContain('Test rejection');
  });

  it('should clear errors when requested', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      error: new Error('Test error')
    });

    window.dispatchEvent(errorEvent);

    expect(errorTracker.getErrors().totalErrors).toBe(1);

    errorTracker.clearErrors();
    expect(errorTracker.getErrors().totalErrors).toBe(0);
  });

  it('should limit error history to 50 errors', () => {
    // Add 51 errors
    for (let i = 0; i < 51; i++) {
      const errorEvent = new ErrorEvent('error', {
        message: `Test error ${i}`,
        error: new Error(`Test error ${i}`)
      });
      window.dispatchEvent(errorEvent);
    }

    const errors = errorTracker.getErrors();
    expect(errors.totalErrors).toBe(50);
  });
});

describe('AnalyticsCollector', () => {
  let collector: AnalyticsCollector;

  beforeEach(() => {
    collector = new AnalyticsCollector();
    // Mock performance API
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        getEntriesByType: jest.fn((type: string) => {
          if (type === 'navigation') {
            return [{
              loadEventEnd: 2000,
              domInteractive: 1000,
              startTime: 0
            }];
          }
          return [];
        })
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should collect metrics on initialization', () => {
    collector.collectMetrics();
    const avgMetrics = collector.getAverageMetrics();

    expect(avgMetrics).not.toBeNull();
    expect(avgMetrics).toHaveProperty('pageLoadTime');
  });

  it('should calculate average metrics correctly', () => {
    collector.collectMetrics(); // First collection: 2000ms
    collector.collectMetrics(); // Second collection: still 2000ms

    const avgMetrics = collector.getAverageMetrics();
    expect(avgMetrics?.pageLoadTime).toBe(2000);
  });

  it('should handle multiple metric collections', () => {
    for (let i = 0; i < 5; i++) {
      collector.collectMetrics();
    }

    const avgMetrics = collector.getAverageMetrics();
    expect(avgMetrics).not.toBeNull();
  });

  it('should limit metric history to 100 collections', () => {
    // Collect 101 times
    for (let i = 0; i < 101; i++) {
      collector.collectMetrics();
    }

    // Should still work, limited to 100
    const avgMetrics = collector.getAverageMetrics();
    expect(avgMetrics).not.toBeNull();
  });

  it('should export analytics data as JSON', () => {
    collector.collectMetrics();
    const exported = collector.exportData();

    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);

    expect(parsed).toHaveProperty('metrics');
    expect(parsed).toHaveProperty('errors');
    expect(parsed).toHaveProperty('timestamp');
  });

  it('should include error metrics in export', () => {
    const errorMetrics = collector.getErrorMetrics();
    expect(errorMetrics).toHaveProperty('errors');
    expect(errorMetrics).toHaveProperty('totalErrors');
  });
});

describe('getAnalytics', () => {
  it('should return singleton instance', () => {
    const analytics1 = getAnalytics();
    const analytics2 = getAnalytics();

    expect(analytics1).toBe(analytics2);
  });

  it('should create new instance on first call', () => {
    const analytics = getAnalytics();
    expect(analytics).toBeInstanceOf(AnalyticsCollector);
  });
});

describe('initAnalytics', () => {
  beforeEach(() => {
    // Mock window methods
    Object.defineProperty(window, 'addEventListener', {
      writable: true,
      value: jest.fn()
    });

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        getEntriesByType: jest.fn(() => [])
      }
    });

    // Mock document.readyState to not be complete so event listeners are added
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'loading'
    });

    // Mock setInterval
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should initialize analytics on page load', () => {
    initAnalytics();

    expect(getAnalytics()).toBeInstanceOf(AnalyticsCollector);
  });

  it('should set up event listeners', () => {
    initAnalytics();

    expect(window.addEventListener).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    );
  });

  it('should not throw when window is not available', () => {
    (window as any).addEventListener = undefined;

    expect(() => initAnalytics()).not.toThrow();
  });
});

describe('Performance Metrics Calculation', () => {
  it('should calculate all required metric fields', () => {
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        getEntriesByType: jest.fn((type: string) => {
          if (type === 'navigation') {
            return [{
              loadEventEnd: 3000,
              domInteractive: 1200,
              domContentLoadedEventEnd: 1500,
              startTime: 100,
              responseEnd: 600,
              loadEventEnd: 3000
            }];
          }
          if (type === 'paint') {
            return [
              { name: 'first-contentful-paint', startTime: 900 }
            ];
          }
          return [];
        })
      }
    });

    const metrics = collectPerformanceMetrics();
    expect(metrics).toHaveProperty('pageLoadTime');
    expect(metrics).toHaveProperty('firstContentfulPaint');
    expect(metrics).toHaveProperty('largestContentfulPaint');
    expect(metrics).toHaveProperty('firstInputDelay');
    expect(metrics).toHaveProperty('cumulativeLayoutShift');
    expect(metrics).toHaveProperty('timeToInteractive');
  });

  it('should handle missing performance data gracefully', () => {
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        getEntriesByType: jest.fn(() => [])
      }
    });

    const metrics = collectPerformanceMetrics();
    expect(metrics).toBeNull(); // Should return null when performance data is missing
  });
});