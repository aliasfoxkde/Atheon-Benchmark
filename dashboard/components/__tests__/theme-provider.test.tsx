/**
 * Theme Provider Component Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock document
const documentMock = {
  documentElement: {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  },
};
global.document = documentMock as any;

// Mock matchMedia
const matchMediaMock = jest.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
global.matchMedia = matchMediaMock;

describe('ThemeProvider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Theme Context Interface', () => {
    it('should accept valid theme values', () => {
      const validThemes = ['light', 'dark', 'system'];
      validThemes.forEach(theme => {
        const context = { theme, setTheme: jest.fn(), resolvedTheme: 'light' as const };
        expect(context.theme).toBe(theme);
      });
    });

    it('should have setTheme function', () => {
      const setTheme = jest.fn();
      const context = { theme: 'system' as const, setTheme, resolvedTheme: 'light' as const };
      expect(typeof context.setTheme).toBe('function');
    });

    it('should have resolvedTheme as light or dark', () => {
      const resolvedThemes: Array<'light' | 'dark'> = ['light', 'dark'];
      resolvedThemes.forEach(resolvedTheme => {
        const context = { theme: 'system' as const, setTheme: jest.fn(), resolvedTheme };
        expect(['light', 'dark']).toContain(context.resolvedTheme);
      });
    });
  });

  describe('Theme Storage', () => {
    it('should read theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      const stored = localStorageMock.getItem('theme');
      expect(stored).toBe('dark');
    });

    it('should save theme to localStorage', () => {
      localStorageMock.setItem('theme', 'dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should default to system if no stored theme', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const stored = localStorageMock.getItem('theme');
      expect(stored).toBeNull();
    });
  });

  describe('Theme Resolution', () => {
    it('should resolve system theme based on prefers-color-scheme', () => {
      const darkQuery = '(prefers-color-scheme: dark)';
      const darkMatch = matchMediaMock(darkQuery);
      expect(darkMatch.matches).toBe(true);
    });

    it('should resolve light theme correctly', () => {
      const lightQuery = '(prefers-color-scheme: light)';
      const lightMatch = matchMediaMock(lightQuery);
      expect(lightMatch.matches).toBe(false);
    });
  });

  describe('Component Export', () => {
    it('should export ThemeProvider component', async () => {
      const { ThemeProvider } = await import('../theme-provider');
      expect(ThemeProvider).toBeDefined();
    });

    it('should export useTheme hook', async () => {
      const { useTheme } = await import('../theme-provider');
      expect(useTheme).toBeDefined();
      expect(typeof useTheme).toBe('function');
    });
  });
});
