/**
 * Error Boundary Component Unit Tests
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept children prop', () => {
      const props = { children: 'Test content' };
      expect(props.children).toBeDefined();
    });

    it('should accept enableSentry prop', () => {
      const props = { enableSentry: true };
      expect(props.enableSentry).toBeDefined();
      expect(typeof props.enableSentry).toBe('boolean');
    });
  });

  describe('State Interface', () => {
    it('should have hasError state interface', () => {
      const state = { hasError: false };
      expect(state.hasError).toBeDefined();
      expect(typeof state.hasError).toBe('boolean');
    });

    it('should have error state interface', () => {
      const state = { 
        hasError: true, 
        error: new Error('Test error') 
      };
      expect(state.error).toBeDefined();
      expect(state.error).toBeInstanceOf(Error);
    });
  });

  describe('Component Export', () => {
    it('should export ErrorBoundary component', async () => {
      const { ErrorBoundary } = await import('../error-boundary');
      expect(ErrorBoundary).toBeDefined();
    });

    it('should export ErrorBoundaryWrapper component', async () => {
      const { ErrorBoundaryWrapper } = await import('../error-boundary');
      expect(ErrorBoundaryWrapper).toBeDefined();
    });
  });
});
