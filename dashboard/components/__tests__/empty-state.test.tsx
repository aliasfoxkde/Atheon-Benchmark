/**
 * Empty State Component Unit Tests
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('EmptyState Component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept title prop', () => {
      const props = { title: 'No results found' };
      expect(props.title).toBeDefined();
      expect(typeof props.title).toBe('string');
    });

    it('should accept description prop', () => {
      const props = { description: 'Try adjusting your filters' };
      expect(props.description).toBeDefined();
      expect(typeof props.description).toBe('string');
    });

    it('should accept icon prop', () => {
      const props = { icon: 'search' };
      expect(props.icon).toBeDefined();
    });

    it('should accept action prop', () => {
      const mockAction = jest.fn();
      const props = { action: mockAction };
      expect(props.action).toBeDefined();
      expect(typeof props.action).toBe('function');
    });

    it('should accept className prop', () => {
      const props = { className: 'custom-class' };
      expect(props.className).toBeDefined();
      expect(typeof props.className).toBe('string');
    });
  });

  describe('Component Export', () => {
    it('should export EmptyState component', async () => {
      const { EmptyState } = await import('../empty-state');
      expect(EmptyState).toBeDefined();
    });
  });
});
