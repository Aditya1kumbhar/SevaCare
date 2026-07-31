'use client'

import React, { useRef } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import anime from 'animejs'

export default function ThemeToggleButton({ showLabel = true }: { showLabel?: boolean }) {
  const { theme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isDark = theme === 'dark'

  const toggle = () => {
    if (buttonRef.current) {
      anime({
        targets: buttonRef.current,
        rotate: [0, 360],
        scale: [0.85, 1.1, 1],
        duration: 500,
        easing: 'spring(1, 80, 12, 0)',
      })
    }
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      ref={buttonRef}
      onClick={toggle}
      type="button"
      aria-label="Toggle Dark or Light Mode"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-md cursor-pointer z-50 shrink-0 select-none"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
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
