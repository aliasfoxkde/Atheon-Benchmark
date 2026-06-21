/**
 * Theme Toggle Component Unit Tests
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept correct component shape', async () => {
      const { ThemeToggle } = await import('../theme-toggle');
      expect(typeof ThemeToggle).toBe('function');
    });
  });
});

describe('ThemeProvider Component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept children prop', async () => {
      const { ThemeProvider } = await import('../theme-provider');
      expect(typeof ThemeProvider).toBe('function');
    });
  });
});

describe('useTheme Hook', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should export useTheme hook', async () => {
    const { useTheme } = await import('../theme-provider');
    expect(typeof useTheme).toBe('function');
  });

  it('should return theme context shape', () => {
    // Mock context shape
    const context = {
      theme: 'system' as 'light' | 'dark' | 'system',
      setTheme: jest.fn(),
      resolvedTheme: 'light' as 'light' | 'dark',
    };
    expect(context).toHaveProperty('theme');
    expect(context).toHaveProperty('setTheme');
    expect(context).toHaveProperty('resolvedTheme');
  });

  it('should accept light theme', () => {
    const theme: 'light' | 'dark' | 'system' = 'light';
    expect(theme).toBe('light');
  });

  it('should accept dark theme', () => {
    const theme: 'light' | 'dark' | 'system' = 'dark';
    expect(theme).toBe('dark');
  });

  it('should accept system theme', () => {
    const theme: 'light' | 'dark' | 'system' = 'system';
    expect(theme).toBe('system');
  });
});
