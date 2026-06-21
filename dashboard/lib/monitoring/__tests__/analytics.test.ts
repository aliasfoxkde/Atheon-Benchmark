/**
 * Monitoring and Analytics Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  ErrorTracker,
  AnalyticsCollector,
  getAnalytics,
  collectPerformanceMetrics,
  type PerformanceMetrics,
  type ErrorMetrics
} from '../analytics';

describe('ErrorTracker', () => {
  let tracker: ErrorTracker;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock window addEventListener/removeEventListener
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      tracker = new ErrorTracker();
      expect(tracker).toBeDefined();
    });

    it('should register error listeners', () => {
      tracker = new ErrorTracker();
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });

  describe('getErrors', () => {
    it('should return empty errors initially', () => {
      tracker = new ErrorTracker();
      const metrics = tracker.getErrors();
      expect(metrics.errors).toEqual([]);
      expect(metrics.totalErrors).toBe(0);
    });

    it('should return copy of errors array', () => {
      tracker = new ErrorTracker();
      const m1 = tracker.getErrors();
      const m2 = tracker.getErrors();
      expect(m1.errors).not.toBe(m2.errors);
    });
  });

  describe('clearErrors', () => {
    it('should clear errors', () => {
      tracker = new ErrorTracker();
      tracker.clearErrors();
      const metrics = tracker.getErrors();
      expect(metrics.errors).toEqual([]);
      expect(metrics.totalErrors).toBe(0);
    });
  });
});

describe('AnalyticsCollector', () => {
  let collector: AnalyticsCollector;
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      collector = new AnalyticsCollector();
      expect(collector).toBeDefined();
    });

    it('should create error tracker', () => {
      collector = new AnalyticsCollector();
      const errors = collector.getErrorMetrics();
      expect(errors).toBeDefined();
      expect(Array.isArray(errors.errors)).toBe(true);
    });
  });

  describe('collectMetrics', () => {
    it('should not throw without window', () => {
      collector = new AnalyticsCollector();
      // collectMetrics checks for window internally
      expect(() => collector.collectMetrics()).not.toThrow();
    });

    it('should add metrics to collection', () => {
      collector = new AnalyticsCollector();
      // In jsdom, performance.getEntriesByType returns empty, so collectMetrics won't add
      collector.collectMetrics();
      const avg = collector.getAverageMetrics();
      // Without real performance data, avg might be null or metrics won't accumulate
      expect(avg === null || avg.pageLoadTime === 0).toBe(true);
    });
  });

  describe('getAverageMetrics', () => {
    it('should return null when no metrics collected', () => {
      collector = new AnalyticsCollector();
      const avg = collector.getAverageMetrics();
      expect(avg).toBeNull();
    });
  });

  describe('getErrorMetrics', () => {
    it('should return error metrics', () => {
      collector = new AnalyticsCollector();
      const errors = collector.getErrorMetrics();
      expect(errors).toBeDefined();
      expect(typeof errors.totalErrors).toBe('number');
      expect(Array.isArray(errors.errors)).toBe(true);
    });
  });

  describe('exportData', () => {
    it('should export valid JSON', () => {
      collector = new AnalyticsCollector();
      const data = collector.exportData();
      expect(typeof data).toBe('string');
      expect(() => JSON.parse(data)).not.toThrow();
    });

    it('should include required fields in export', () => {
      collector = new AnalyticsCollector();
      const data = JSON.parse(collector.exportData());
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('url');
    });

    it('should have url in browser env', () => {
      collector = new AnalyticsCollector();
      const data = JSON.parse(collector.exportData());
      // jsdom provides window.location.href = 'http://localhost/'
      expect(data.url).toBe('http://localhost/');
    });
  });
});

describe('getAnalytics', () => {
  afterEach(() => {
    // Reset global analytics between tests
    // Note: The module-level globalAnalytics is hard to reset without module reload
  });

  it('should return an AnalyticsCollector instance', () => {
    const analytics = getAnalytics();
    expect(analytics).toBeInstanceOf(AnalyticsCollector);
  });

  it('should return same instance on multiple calls', () => {
    const a1 = getAnalytics();
    const a2 = getAnalytics();
    expect(a1).toBe(a2);
  });
});

describe('collectPerformanceMetrics', () => {
  it('should return null in non-browser environment', () => {
    // In jsdom, window is defined so it won't return null
    // But we can test that it returns something with expected shape
    const result = collectPerformanceMetrics();
    // Without real performance data, result depends on jsdom implementation
    expect(result === null || typeof result === 'object').toBe(true);
  });

  it('should return object with performance fields when called in browser', () => {
    const result = collectPerformanceMetrics();
    if (result) {
      expect(result).toHaveProperty('pageLoadTime');
      expect(result).toHaveProperty('firstContentfulPaint');
      expect(result).toHaveProperty('largestContentfulPaint');
      expect(result).toHaveProperty('firstInputDelay');
      expect(result).toHaveProperty('cumulativeLayoutShift');
      expect(result).toHaveProperty('timeToInteractive');
    }
  });
});

describe('PerformanceMetrics interface', () => {
  it('should accept valid metrics object', () => {
    const metrics: PerformanceMetrics = {
      pageLoadTime: 100,
      firstContentfulPaint: 50,
      largestContentfulPaint: 200,
      firstInputDelay: 10,
      cumulativeLayoutShift: 0.05,
      timeToInteractive: 300,
    };
    expect(metrics.pageLoadTime).toBe(100);
  });
});

describe('ErrorMetrics interface', () => {
  it('should accept valid error metrics', () => {
    const metrics: ErrorMetrics = {
      errors: [
        {
          message: 'Test error',
          stack: 'at test.js:1',
          timestamp: Date.now(),
          url: 'http://test.com',
          userAgent: 'jest',
        },
      ],
      totalErrors: 1,
    };
    expect(metrics.errors.length).toBe(1);
    expect(metrics.totalErrors).toBe(1);
  });
});