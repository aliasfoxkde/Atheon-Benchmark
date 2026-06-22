'use client'

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Helper to get stored theme without causing render
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem('theme') as Theme | null
  return (stored && ['light', 'dark', 'system'].includes(stored)) ? stored : 'system'
}

// Helper to resolve theme - only call on client
function resolveTheme(t: Theme, fallback: 'light' | 'dark' = 'light'): 'light' | 'dark' {
  if (t === 'system') {
    if (typeof window === 'undefined') return fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return t
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Use lazy initialization to avoid cascading renders
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())
  
  // Derive resolvedTheme from theme - no separate state needed
  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme])

  // Effect to handle theme changes and persistence
  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme)
    
    // Apply theme to document
    const actual = resolveTheme(theme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(actual)
  }, [theme])

  // Listen for system theme changes when using system preference
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
