'use client';

import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import type { KeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: '?', description: 'Show this help modal' },
  { key: 'r', description: 'Refresh data' },
  { key: 'f', description: 'Toggle filters' },
  { key: '/', description: 'Focus search' },
  { key: 'Escape', description: 'Close modal / Clear selection' },
  { key: 'h', description: 'Go to Home' },
  { key: 'b', description: 'Go to Benchmark' },
  { key: 's', description: 'Go to Status' },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}: KeyboardShortcutsModalProps) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 id="keyboard-shortcuts-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {shortcut.description}
                </span>
                <kbd className="px-3 py-1.5 text-sm font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  {shortcut.key === ' ' ? 'Space' : shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-200 dark:bg-zinc-700 rounded">?</kbd> anywhere to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
}
