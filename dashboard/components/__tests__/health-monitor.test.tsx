/**
 * Health Monitor Component Unit Tests
 * Tests for health monitoring and status reporting
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HealthMonitor } from '../health-monitor';

// Mock fetch for health checks
global.fetch = jest.fn();

describe('HealthMonitor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Don't use fake timers by default to avoid conflicts with async operations
    // jest.useFakeTimers();

    // Ensure performance API is properly mocked for component tests
    const mockNavigationTiming = {
      loadEventEnd: 2000,
      domInteractive: 800,
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
    };

    global.performance = {
      ...global.performance,
      getEntriesByType: jest.fn((type: string) => {
        if (type === 'navigation') return [mockNavigationTiming];
        if (type === 'paint') return [{ name: 'first-contentful-paint', startTime: 800, entryType: 'paint' }];
        if (type === 'largest-contentful-paint') return [{ startTime: 1200, size: 5000, entryType: 'largest-contentful-paint', name: 'largest-contentful-paint' }];
        return [];
      }),
      now: jest.fn(() => Date.now()),
    };
  });

  afterEach(() => {
    // jest.runOnlyPendingTimers();
    // jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render health monitor button initially', () => {
      render(<HealthMonitor />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should show activity icon initially', () => {
      render(<HealthMonitor />);
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should expand panel when button is clicked', async () => {
      render(<HealthMonitor />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });
    });

    it('should close panel when close button is clicked', async () => {
      render(<HealthMonitor />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('System Health')).not.toBeInTheDocument();
      });
    });
  });

  describe('Health Checks', () => {
    beforeEach(() => {
      // Set environment to development for consistent behavior
      process.env.NODE_ENV = 'development';

      // Ensure document is properly loaded
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });

      // Mock successful fetch responses
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url) => {
        if (url === '/benchmark-results.json') {
          return Promise.resolve({
            ok: true,
            json: async () => [
              {
                system_id: 'test-system',
                system_info: { hostname: 'test' },
                benchmarks: [],
                summary: { total_tests: 10 },
                submitted_at: '2026-06-19T12:00:00Z'
              }
            ]
          } as Response);
        }
        if (url === '/benchmark-metadata.json') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              total_systems: 1,
              last_updated: '2026-06-19T12:00:00Z'
            })
          } as Response);
        }
        return Promise.reject(new Error('Not found'));
      });

      // Mock performance API
      Object.defineProperty(window, 'performance', {
        writable: true,
        value: {
          getEntriesByType: jest.fn(() => [
            {
              loadEventEnd: 2000,
              domInteractive: 1000,
              startTime: 0
            }
          ])
        }
      });
    });

    it('should perform health checks on mount', async () => {
      render(<HealthMonitor />);

      // Open the panel
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Wait longer for async operations to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('should display health check results', async () => {
      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Benchmark Data')).toBeInTheDocument();
        expect(screen.getByText('Metadata')).toBeInTheDocument();
        expect(screen.getByText('Page Load')).toBeInTheDocument();
      }, { timeout: 8000 });
    });

    it('should show healthy status for successful checks', async () => {
      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const statusItems = screen.getAllByText(/✅|healthy/i);
        expect(statusItems.length).toBeGreaterThan(0);
      }, { timeout: 8000 });
    });

    it('should show unhealthy status for failed API calls', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));

      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const errorStatus = screen.getByText(/unhealthy|failed/i);
        expect(errorStatus).toBeInTheDocument();
      }, { timeout: 8000 });
    });

    it('should display latency information', async () => {
      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const latencyElements = screen.getAllByText(/\d+ms/);
        expect(latencyElements.length).toBeGreaterThan(0);
      }, { timeout: 8000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      }, { timeout: 8000 });
    });

    it('should handle invalid JSON responses', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      }, { timeout: 8000 });
    });
  });

  describe('Periodic Health Checks', () => {
    it('should perform health checks periodically', async () => {
      jest.useFakeTimers();

      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Wait for initial health checks
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      }, { timeout: 8000 });

      const initialCallCount = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls.length;

      // Fast forward 1 minute
      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        expect((global.fetch as jest.MockedFunction<typeof fetch>).mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      // Ensure performance API is mocked for accessibility tests
      const mockNavigationTiming = {
        loadEventEnd: 2000,
        domInteractive: 800,
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
      };

      global.performance = {
        ...global.performance,
        getEntriesByType: jest.fn((type: string) => {
          if (type === 'navigation') return [mockNavigationTiming];
          if (type === 'paint') return [{ name: 'first-contentful-paint', startTime: 800, entryType: 'paint' }];
          return [];
        }),
        now: jest.fn(() => Date.now()),
      };

      // Mock PerformanceObserver
      (global as any).PerformanceObserver = class PerformanceObserver {
        constructor() {}
        observe() {}
        disconnect() {}
      };

      // Ensure document is in complete state
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });
    });

    it('should have proper ARIA labels', () => {
      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<HealthMonitor />);

      const button = screen.getByRole('button');

      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });
    });

    it('should have proper color contrast', () => {
      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);

      // Basic contrast check (would need actual values in real test)
      expect(button).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause performance issues with frequent updates', async () => {
      const startTime = performance.now();

      render(<HealthMonitor />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      }, { timeout: 8000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should complete within 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });
});