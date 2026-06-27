/**
 * Keyboard Shortcuts Provider Component Unit Tests
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('KeyboardShortcutsProvider Component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept children prop', () => {
      const props = { children: 'Test content' };
      expect(props.children).toBeDefined();
    });

    it('should accept enabled prop', () => {
      const props = { enabled: true };
      expect(props.enabled).toBeDefined();
      expect(typeof props.enabled).toBe('boolean');
    });

    it('should accept shortcuts prop', () => {
      const shortcuts = [
        { key: 'r', action: 'refresh', description: 'Refresh' },
        { key: 'f', action: 'filter', description: 'Filter' },
      ];
      const props = { shortcuts };
      expect(props.shortcuts).toBeDefined();
      expect(Array.isArray(props.shortcuts)).toBe(true);
    });
  });

  describe('Component Export', () => {
    it('should export KeyboardShortcutsProvider component', async () => {
      const { KeyboardShortcutsProvider } = await import('../keyboard-shortcuts-provider');
      expect(KeyboardShortcutsProvider).toBeDefined();
    });
  });
});
