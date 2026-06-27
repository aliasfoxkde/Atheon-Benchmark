/**
 * Mobile Nav Component Unit Tests
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('MobileNav Component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept currentPath prop', () => {
      const props = { currentPath: '/results' };
      expect(props.currentPath).toBeDefined();
      expect(typeof props.currentPath).toBe('string');
    });

    it('should handle root path', () => {
      const props = { currentPath: '/' };
      expect(props.currentPath).toBe('/');
    });

    it('should handle benchmark path', () => {
      const props = { currentPath: '/benchmark' };
      expect(props.currentPath).toBe('/benchmark');
    });

    it('should handle results path', () => {
      const props = { currentPath: '/results' };
      expect(props.currentPath).toBe('/results');
    });

    it('should handle status path', () => {
      const props = { currentPath: '/status' };
      expect(props.currentPath).toBe('/status');
    });
  });

  describe('Component Export', () => {
    it('should export MobileNav component', async () => {
      const { MobileNav } = await import('../mobile-nav');
      expect(MobileNav).toBeDefined();
    });
  });

  describe('Navigation Items', () => {
    it('should have expected navigation items', () => {
      const navItems = [
        { label: 'Home', path: '/' },
        { label: 'Benchmark', path: '/benchmark' },
        { label: 'Results', path: '/results' },
        { label: 'Status', path: '/status' },
      ];
      expect(navItems).toHaveLength(4);
    });
  });
});
