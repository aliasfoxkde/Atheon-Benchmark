'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action?: () => void;
  tags?: string[];
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for modifier keys
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      for (const shortcut of shortcuts) {
        if (shortcut.key.toLowerCase() === key && shortcut.action) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: '?',
    description: 'Show keyboard shortcuts',
    tags: ['help'],
  },
  {
    key: 'r',
    description: 'Refresh data',
    tags: ['navigation'],
  },
  {
    key: 'f',
    description: 'Toggle filters',
    tags: ['filter'],
  },
  {
    key: '/',
    description: 'Focus search',
    tags: ['search'],
  },
  {
    key: 'escape',
    description: 'Close modal / Clear selection',
    tags: ['navigation'],
  },
  {
    key: 'h',
    description: 'Go to Home',
    tags: ['navigation'],
  },
  {
    key: 'b',
    description: 'Go to Benchmark',
    tags: ['navigation'],
  },
  {
    key: 's',
    description: 'Go to Status',
    tags: ['navigation'],
  },
];
