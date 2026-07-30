'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function ThemeToggleButton({ showLabel = true }: { showLabel?: boolean }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label="Toggle Dark or Light Mode"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-md transition-all active:scale-95 cursor-pointer z-50 shrink-0"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 shrink-0 animate-spin-slow" />
          {showLabel && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          {showLabel && <span>Dark Mode</span>}
        </>
      )}
    </button>
  )
}
