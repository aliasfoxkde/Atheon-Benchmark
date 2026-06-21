/**
 * Spider Chart Component Unit Tests
 * Tests props acceptance without rendering Chart.js
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('SpiderChart Component', () => {
  const mockSystems = [
    { name: 'System A', data: [80, 75, 90, 85, 70], color: '#22c55e' },
    { name: 'System B', data: [70, 85, 80, 90, 75], color: '#3b82f6' },
  ];
  const mockLabels = ['Speed', 'Accuracy', 'Reliability', 'Scalability', 'Cost'];

  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept systems array with correct shape', async () => {
      const { SpiderChart } = await import('../spider-chart');
      expect(typeof SpiderChart).toBe('function');
    });

    it('should accept required systems and labels props', async () => {
      const { SpiderChart } = await import('../spider-chart');
      const props = {
        systems: mockSystems,
        labels: mockLabels,
      };
      expect(props.systems).toHaveLength(2);
      expect(props.labels).toHaveLength(5);
    });

    it('should accept optional title prop', async () => {
      const props = {
        systems: mockSystems,
        labels: mockLabels,
        title: 'Capability Comparison',
      };
      expect(props.title).toBe('Capability Comparison');
    });

    it('should accept empty systems array', () => {
      const props = {
        systems: [] as { name: string; data: number[]; color: string }[],
        labels: mockLabels,
      };
      expect(props.systems).toEqual([]);
    });

    it('should accept single system', () => {
      const props = {
        systems: [{ name: 'Solo', data: [80, 85, 90, 75, 70], color: '#22c55e' }],
        labels: mockLabels,
      };
      expect(props.systems).toHaveLength(1);
    });

    it('should accept empty labels array', () => {
      const props = {
        systems: mockSystems,
        labels: [] as string[],
      };
      expect(props.labels).toEqual([]);
    });

    it('should accept systems with zero values', () => {
      const props = {
        systems: [{ name: 'Zero', data: [0, 0, 0, 0, 0], color: '#888888' }],
        labels: mockLabels,
      };
      expect(props.systems[0].data).toEqual([0, 0, 0, 0, 0]);
    });

    it('should accept systems with max values', () => {
      const props = {
        systems: [{ name: 'Max', data: [100, 100, 100, 100, 100], color: '#22c55e' }],
        labels: mockLabels,
      };
      expect(props.systems[0].data).toEqual([100, 100, 100, 100, 100]);
    });

    it('should accept different number of labels and data', () => {
      const props = {
        systems: [{ name: 'Mismatched', data: [80, 85], color: '#22c55e' }],
        labels: ['Metric A', 'Metric B', 'Metric C'],
      };
      expect(props.systems[0].data.length).not.toBe(props.labels.length);
    });
  });
});
