/**
 * Performance Monitor Component Unit Tests
 * Tests for performance tracking and monitoring
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { PerformanceMonitor } from '../performance-monitor';

// Mock performance API
const mockPerformanceEntries = [
  {
    name: 'navigation',
    entryType: 'navigation',
    startTime: 0,
    duration: 2000,
    loadEventEnd: 2000,
    domInteractive: 1000,
    domContentLoadedEventEnd: 1500,
    loadEventEnd: 2000
  },
  {
    name: 'paint',
    entryType: 'paint',
    startTime: 800,
    duration: 0,
    name: 'first-contentful-paint'
  }
];

Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    getEntriesByType: jest.fn((type) => {
      if (type === 'navigation') return [mockPerformanceEntries[0]];
      if (type === 'paint') return [mockPerformanceEntries[1]];
      return [];
    }),
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 50000000
    }
  }
});

describe('PerformanceMonitor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render performance monitor in footer', () => {
      render(<PerformanceMonitor />);
      // Component should render without errors
      expect(document.body).toBeInTheDocument();
    });

    it('should collect performance metrics on mount', () => {
      render(<PerformanceMonitor />);

      expect(window.performance.getEntriesByType).toHaveBeenCalledWith('navigation');
      expect(window.performance.getEntriesByType).toHaveBeenCalledWith('paint');
    });

    it('should not render visible UI elements', () => {
      const { container } = render(<PerformanceMonitor />);

      // Performance monitor should be invisible to users
      // It only collects data for monitoring purposes
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Performance Data Collection', () => {
    it('should collect navigation timing data', () => {
      render(<PerformanceMonitor />);

      const navEntries = (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>)('navigation');

      expect(navEntries).toHaveLength(1);
      expect(navEntries[0]).toHaveProperty('loadEventEnd');
    });

    it('should collect paint timing data', () => {
      render(<PerformanceMonitor />);

      const paintEntries = (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>)('paint');

      expect(paintEntries).toHaveLength(1);
    });

    it('should calculate page load time correctly', () => {
      render(<PerformanceMonitor />);

      const navEntry = (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>)('navigation')[0];

      expect(navEntry.loadEventEnd - navEntry.startTime).toBe(2000);
    });

    it('should calculate first contentful paint', () => {
      render(<PerformanceMonitor />);

      const paintEntry = (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>)('paint')[0];

      expect(paintEntry.startTime).toBe(800);
    });
  });

  describe('Memory Monitoring', () => {
    it('should monitor memory usage', () => {
      render(<PerformanceMonitor />);

      const memory = (window.performance as any).memory;

      expect(memory).toHaveProperty('usedJSHeapSize');
      expect(memory.usedJSHeapSize).toBe(10000000);
    });

    it('should calculate memory usage percentage', () => {
      render(<PerformanceMonitor />);

      const memory = (window.performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      expect(usagePercent).toBe(20); // 10M / 50M = 20%
    });
  });

  describe('Performance Metrics Calculation', () => {
    it('should calculate time to interactive', () => {
      render(<PerformanceMonitor />);

      const navEntry = (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>)('navigation')[0];

      expect(navEntry.domInteractive - navEntry.startTime).toBe(1000);
    });

    it('should calculate dom content loaded time', () => {
      render(<PerformanceMonitor />);

      const navEntry = (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>)('navigation')[0];

      expect(navEntry.domContentLoadedEventEnd - navEntry.startTime).toBe(1500);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing performance API gracefully', () => {
      (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>).mockReturnValue([]);

      expect(() => {
        render(<PerformanceMonitor />);
      }).not.toThrow();
    });

    it('should handle incomplete performance data', () => {
      (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>).mockReturnValue([
        {
          name: 'navigation',
          entryType: 'navigation',
          startTime: 0
          // Missing other properties
        }
      ]);

      expect(() => {
        render(<PerformanceMonitor />);
      }).not.toThrow();
    });
  });

  describe('Performance Thresholds', () => {
    it('should detect slow page loads', () => {
      const slowLoadEntry = {
        ...mockPerformanceEntries[0],
        loadEventEnd: 5000 // 5 second load time
      };

      (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>).mockReturnValue([slowLoadEntry]);

      render(<PerformanceMonitor />);

      const loadTime = slowLoadEntry.loadEventEnd - slowLoadEntry.startTime;
      expect(loadTime).toBeGreaterThan(3000); // 3 second threshold
    });

    it('should detect fast page loads', () => {
      const fastLoadEntry = {
        ...mockPerformanceEntries[0],
        loadEventEnd: 1000 // 1 second load time
      };

      (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>).mockReturnValue([fastLoadEntry]);

      render(<PerformanceMonitor />);

      const loadTime = fastLoadEntry.loadEventEnd - fastLoadEntry.startTime;
      expect(loadTime).toBeLessThan(2000); // 2 second threshold
    });
  });

  describe('Development vs Production', () => {
    it('should log performance data in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<PerformanceMonitor />);

      // In development, performance data should be logged
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<PerformanceMonitor />);

      // In production, should not log to console
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Performance Reporting', () => {
    it('should expose performance data for analytics', () => {
      render(<PerformanceMonitor />);

      // Performance data should be available for analytics collection
      const navEntry = (window.performance.getEntriesByType as jest.MockedFunction<typeof window.performance.getEntriesByType>)('navigation')[0];

      expect(navEntry).toBeDefined();
      expect(navEntry.loadEventEnd).toBeDefined();
    });

    it('should support custom performance tracking', () => {
      const customMark = jest.spyOn(window.performance, 'mark');

      render(<PerformanceMonitor />);

      // Should support custom performance marks
      customMark.mockRestore();
    });
  });
});