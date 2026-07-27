'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'high-contrast'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read saved theme from localStorage
    const saved = localStorage.getItem('sevacare-theme') as Theme | null
    if (saved === 'dark' || saved === 'light' || saved === 'high-contrast') {
      setThemeState(saved)
      applyThemeClasses(saved)
    }
    setMounted(true)
  }, [])

  function applyThemeClasses(newTheme: Theme) {
    const root = document.documentElement
    root.classList.remove('dark', 'high-contrast')
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else if (newTheme === 'high-contrast') {
      root.classList.add('high-contrast')
    }
  }

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
    localStorage.setItem('sevacare-theme', newTheme)
    applyThemeClasses(newTheme)
  }

  function toggleTheme() {
    // Cycle: light -> dark -> high-contrast -> light
    const order: Theme[] = ['light', 'dark', 'high-contrast']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Return a safe default if used outside provider
    return { theme: 'light' as Theme, setTheme: () => {}, toggleTheme: () => {} }
  }
  return ctx
}
