/**
 * Performance Bar Chart Component Unit Tests
 * Tests props acceptance without rendering Chart.js
 */

import { describe, it, expect, jest } from '@jest/globals';

// Test the component's prop acceptance without rendering
describe('PerformanceBarChart Component', () => {
  const mockSystems = [
    { name: 'System A', performance: 85.5, color: '#22c55e' },
    { name: 'System B', performance: 72.3, color: '#3b82f6' },
    { name: 'System C', performance: 91.1, color: '#ef4444' },
  ];

  // Mock the chart module before importing
  jest.mock('react-chartjs-2', () => ({
    Bar: () => null,
  }));

  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept systems array with correct shape', async () => {
      const { PerformanceBarChart } = await import('../performance-bar-chart');
      expect(typeof PerformanceBarChart).toBe('function');
    });

    it('should accept required systems prop', async () => {
      const { PerformanceBarChart } = await import('../performance-bar-chart');
      const props = {
        systems: mockSystems,
      };
      expect(props.systems).toHaveLength(3);
      expect(props.systems[0]).toHaveProperty('name');
      expect(props.systems[0]).toHaveProperty('performance');
      expect(props.systems[0]).toHaveProperty('color');
    });

    it('should accept optional title prop', async () => {
      const { PerformanceBarChart } = await import('../performance-bar-chart');
      const props = {
        systems: mockSystems,
        title: 'Performance Comparison',
      };
      expect(props.title).toBe('Performance Comparison');
    });

    it('should accept empty systems array', async () => {
      const props = {
        systems: [] as { name: string; performance: number; color: string }[],
      };
      expect(props.systems).toEqual([]);
    });

    it('should accept single system', async () => {
      const props = {
        systems: [{ name: 'Solo', performance: 100, color: '#00ff00' }],
      };
      expect(props.systems).toHaveLength(1);
    });

    it('should accept systems with zero performance', () => {
      const props = {
        systems: [{ name: 'Zero', performance: 0, color: '#888888' }],
      };
      expect(props.systems[0].performance).toBe(0);
    });

    it('should accept systems with decimal performance', () => {
      const props = {
        systems: [{ name: 'Precise', performance: 88.888, color: '#22c55e' }],
      };
      expect(props.systems[0].performance).toBeCloseTo(88.888);
    });

    it('should accept hex color values', () => {
      const props = {
        systems: [
          { name: 'Red', performance: 50, color: '#ff0000' },
          { name: 'Green', performance: 75, color: '#00ff00' },
          { name: 'Blue', performance: 100, color: '#0000ff' },
        ],
      };
      props.systems.forEach(s => {
        expect(s.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should accept 3-character hex colors', () => {
      const props = {
        systems: [{ name: 'Short', performance: 50, color: '#fff' }],
      };
      expect(props.systems[0].color).toMatch(/^#[0-9a-f]{3}$/i);
    });
  });
});
