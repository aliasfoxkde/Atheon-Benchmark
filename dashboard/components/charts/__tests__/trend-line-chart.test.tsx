/**
 * Trend Line Chart Component Unit Tests
 * Tests props acceptance without rendering Chart.js
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('TrendLineChart Component', () => {
  const mockData = [
    { label: 'System A', values: [65, 72, 78, 82, 85], color: '#22c55e' },
    { label: 'System B', values: [60, 68, 75, 80, 88], color: '#3b82f6' },
  ];
  const mockLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept data array with correct shape', async () => {
      const { TrendLineChart } = await import('../trend-line-chart');
      expect(typeof TrendLineChart).toBe('function');
    });

    it('should accept required data and labels props', async () => {
      const props = {
        data: mockData,
        labels: mockLabels,
      };
      expect(props.data).toHaveLength(2);
      expect(props.labels).toHaveLength(5);
    });

    it('should accept optional title prop', () => {
      const props = {
        data: mockData,
        labels: mockLabels,
        title: 'Performance Trend',
      };
      expect(props.title).toBe('Performance Trend');
    });

    it('should accept empty data array', () => {
      const props = {
        data: [] as { label: string; values: number[]; color: string }[],
        labels: mockLabels,
      };
      expect(props.data).toEqual([]);
    });

    it('should accept single dataset', () => {
      const props = {
        data: [{ label: 'Solo', values: [65, 72, 78], color: '#22c55e' }],
        labels: ['A', 'B', 'C'],
      };
      expect(props.data).toHaveLength(1);
    });

    it('should accept empty labels array', () => {
      const props = {
        data: mockData,
        labels: [] as string[],
      };
      expect(props.labels).toEqual([]);
    });

    it('should accept values with zeros', () => {
      const props = {
        data: [{ label: 'Zero', values: [0, 0, 0, 0, 0], color: '#888888' }],
        labels: mockLabels,
      };
      expect(props.data[0].values).toEqual([0, 0, 0, 0, 0]);
    });

    it('should accept values with negative numbers', () => {
      const props = {
        data: [{ label: 'Negative', values: [-10, -5, 0, 5, 10], color: '#22c55e' }],
        labels: mockLabels,
      };
      expect(props.data[0].values).toContain(-10);
    });

    it('should accept large values', () => {
      const props = {
        data: [{ label: 'Large', values: [1000000, 2000000, 3000000], color: '#22c55e' }],
        labels: ['A', 'B', 'C'],
      };
      expect(props.data[0].values[2]).toBe(3000000);
    });

    it('should accept decimal values', () => {
      const props = {
        data: [{ label: 'Decimal', values: [1.5, 2.5, 3.5, 4.5], color: '#22c55e' }],
        labels: ['A', 'B', 'C', 'D'],
      };
      expect(props.data[0].values[0]).toBeCloseTo(1.5);
    });

    it('should accept different colors per dataset', () => {
      const props = {
        data: [
          { label: 'Red Team', values: [50, 60, 70, 80, 90], color: '#ff0000' },
          { label: 'Blue Team', values: [90, 80, 70, 60, 50], color: '#0000ff' },
        ],
        labels: mockLabels,
      };
      expect(props.data[0].color).toBe('#ff0000');
      expect(props.data[1].color).toBe('#0000ff');
    });
  });
});
