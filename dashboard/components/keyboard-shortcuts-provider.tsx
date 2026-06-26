'use client';

import { useState, useCallback } from 'react';
import { KeyboardShortcutsModal } from './keyboard-shortcuts-modal';
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts';

interface ShortcutAction {
  description: string;
  action: () => void;
}

const GLOBAL_SHORTCUTS = [
  { key: '?', description: 'Show keyboard shortcuts' },
];

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const shortcuts = [
    ...GLOBAL_SHORTCUTS.map(s => ({
      ...s,
      action: s.key === '?' ? openModal : undefined,
    })),
    ...DEFAULT_SHORTCUTS,
  ];

  useKeyboardShortcuts(shortcuts as any, true);

  return (
    <>
      {children}
      <KeyboardShortcutsModal
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
}
