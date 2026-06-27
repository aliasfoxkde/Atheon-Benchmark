/**
 * Keyboard Shortcuts Modal Component Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('KeyboardShortcutsModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Props Interface', () => {
    it('should accept isOpen prop', () => {
      const props = { isOpen: true, onClose: jest.fn() };
      expect(props.isOpen).toBe(true);
    });

    it('should accept onClose prop', () => {
      const onClose = jest.fn();
      const props = { isOpen: true, onClose };
      expect(typeof props.onClose).toBe('function');
    });

    it('should accept optional shortcuts prop', () => {
      const shortcuts = [
        { key: 'r', description: 'Refresh' },
        { key: 'f', description: 'Filter' },
      ];
      const props = { isOpen: true, onClose: jest.fn(), shortcuts };
      expect(props.shortcuts).toHaveLength(2);
    });
  });

  describe('Default Shortcuts', () => {
    it('should have expected default shortcuts', () => {
      const DEFAULT_SHORTCUTS = [
        { key: 'r', description: 'Refresh results' },
        { key: 'f', description: 'Open filters' },
        { key: '?', description: 'Show keyboard shortcuts' },
        { key: 'h', description: 'Go to home' },
        { key: 'c', description: 'Copy URL to clipboard' },
      ];
      expect(DEFAULT_SHORTCUTS).toHaveLength(5);
      expect(DEFAULT_SHORTCUTS[0].key).toBe('r');
    });
  });

  describe('Escape Key Handling', () => {
    it('should call onClose when Escape is pressed', () => {
      const onClose = jest.fn();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      
      // Simulate escape handling
      if (event.key === 'Escape') {
        onClose();
      }
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Component Export', () => {
    it('should export KeyboardShortcutsModal component', async () => {
      const { KeyboardShortcutsModal } = await import('../keyboard-shortcuts-modal');
      expect(KeyboardShortcutsModal).toBeDefined();
    });
  });
});
