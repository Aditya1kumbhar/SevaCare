'use client'

import React, { useState } from 'react'
import { transliterateToDevanagari } from '@/lib/indic-transliteration'
import { Languages, Sparkles } from 'lucide-react'

interface IndicInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  type?: string
  lang?: 'mr' | 'hi'
}

export default function IndicInput({
  value,
  onChange,
  placeholder = 'Type phonetically (e.g. taap, dukhne)...',
  className = '',
  type = 'text',
  lang = 'mr',
}: IndicInputProps) {
  const [indicMode, setIndicMode] = useState(true)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (indicMode && raw) {
      const devanagari = transliterateToDevanagari(raw, lang)
      onChange(devanagari)
    } else {
      onChange(raw)
    }
  }

  return (
    <div className="relative flex items-center w-full">
      <input
        type={type}
        value={value}
        onChange={handleInputChange}
        placeholder={indicMode ? `${placeholder} [Devanagari Auto]` : placeholder}
        className={`${className} pr-24`}
      />
      <button
        type="button"
        onClick={() => setIndicMode(!indicMode)}
        title={indicMode ? "Phonetic Devanagari active. Click to switch to English" : "Click to enable Phonetic Devanagari typing"}
        className={`absolute right-2 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
          indicMode
            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
        }`}
      >
        {indicMode ? <Sparkles className="w-3 h-3 text-amber-600" /> : <Languages className="w-3 h-3" />}
        <span>{indicMode ? (lang === 'mr' ? 'मराठी' : 'हिंदी') : 'English'}</span>
      </button>
    </div>
  )
}
