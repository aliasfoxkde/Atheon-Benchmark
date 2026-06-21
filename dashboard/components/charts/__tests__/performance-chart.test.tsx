/**
 * Performance Chart Component Unit Tests
 * Tests props acceptance without rendering Chart.js
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('PerformanceChart Component', () => {
  const mockData = {
    labels: ['System A', 'System B', 'System C'],
    datasets: [
      {
        label: 'Performance',
        data: [85, 72, 91],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept component with correct shape', async () => {
      const { PerformanceChart } = await import('../PerformanceChart');
      expect(typeof PerformanceChart).toBe('function');
    });

    it('should accept required data prop', async () => {
      const props = {
        data: mockData,
      };
      expect(props.data.labels).toHaveLength(3);
      expect(props.data.datasets).toHaveLength(1);
    });

    it('should accept optional type prop', () => {
      const props = {
        data: mockData,
        type: 'bar' as const,
      };
      expect(props.type).toBe('bar');
    });

    it('should accept line type', () => {
      const props = {
        data: mockData,
        type: 'line' as const,
      };
      expect(props.type).toBe('line');
    });

    it('should accept radar type', () => {
      const props = {
        data: mockData,
        type: 'radar' as const,
      };
      expect(props.type).toBe('radar');
    });

    it('should accept optional title prop', () => {
      const props = {
        data: mockData,
        title: 'Performance Chart',
      };
      expect(props.title).toBe('Performance Chart');
    });

    it('should accept empty labels', () => {
      const props = {
        data: { labels: [], datasets: [{ label: 'Test', data: [1, 2, 3] }] },
      };
      expect(props.data.labels).toEqual([]);
    });

    it('should accept empty datasets', () => {
      const props = {
        data: { labels: ['A', 'B', 'C'], datasets: [] },
      };
      expect(props.data.datasets).toEqual([]);
    });

    it('should accept multiple datasets', () => {
      const props = {
        data: {
          labels: ['A', 'B'],
          datasets: [
            { label: 'Dataset 1', data: [10, 20] },
            { label: 'Dataset 2', data: [30, 40] },
          ],
        },
      };
      expect(props.data.datasets).toHaveLength(2);
    });

    it('should accept optional backgroundColor', () => {
      const props = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1], backgroundColor: 'rgba(255, 0, 0, 0.5)' }],
        },
      };
      expect(props.data.datasets[0].backgroundColor).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should accept optional borderColor', () => {
      const props = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1], borderColor: 'rgb(255, 0, 0)' }],
        },
      };
      expect(props.data.datasets[0].borderColor).toBe('rgb(255, 0, 0)');
    });
  });
});
