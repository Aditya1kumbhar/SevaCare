'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/LanguageProvider'
import { Language } from '@/lib/translations'
import ThemeToggleButton from '@/components/ThemeToggleButton'
import IndicInput from '@/components/IndicInput'
import { User, Settings, Languages, Shield, LogOut, Info, Sparkles, Check, Database, Video, Mic } from 'lucide-react'
import { toast } from 'sonner'
import anime from 'animejs'

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [indicText, setIndicText] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    toast.success(`Language switched to ${lang === 'mr' ? 'मराठी (Marathi)' : lang === 'hi' ? 'हिंदी (Hindi)' : 'English'}`)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch {
      toast.error('Failed to log out')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Settings className="w-6 h-6 text-blue-600" /> Settings & Preferences
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage language, theme, account identity, and system information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Account & Identity Card */}
        <Card className="border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Account & Identity
            </CardTitle>
            <CardDescription className="text-xs">Your logged-in caretaker session</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Caretaker Email</label>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">{user?.email || 'Loading...'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account UUID</label>
              <p className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300 truncate mt-0.5">{user?.id || '—'}</p>
            </div>

            <div className="pt-2">
              <form action="/api/auth/signout" method="POST">
                <Button
                  type="submit"
                  variant="destructive"
                  onClick={(e) => {
                    anime({ targets: e.currentTarget, scale: [0.94, 1.03, 1], duration: 300, easing: 'spring(1, 80, 12, 0)' })
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl font-bold py-2.5 shadow-md cursor-pointer select-none"
                >
                  <LogOut className="w-4 h-4" /> {t.logOut || 'Log Out'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* 2. Theme & Display Preferences */}
        <Card className="border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" /> Appearance & Theme
            </CardTitle>
            <CardDescription className="text-xs">Customize look and feel across devices</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Color Theme</p>
                <p className="text-xs text-slate-500">Toggle between Light and Dark mode</p>
              </div>
              <ThemeToggleButton showLabel />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Languages className="w-4 h-4 text-blue-600" /> Application Language (i18next)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('mr')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    language === 'mr' ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>मराठी</span>
                  <span className="text-[10px] opacity-80">(Marathi)</span>
                  {language === 'mr' && <Check className="w-3.5 h-3.5 mt-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    language === 'hi' ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>हिंदी</span>
                  <span className="text-[10px] opacity-80">(Hindi)</span>
                  {language === 'hi' && <Check className="w-3.5 h-3.5 mt-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    language === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>English</span>
                  <span className="text-[10px] opacity-80">(English)</span>
                  {language === 'en' && <Check className="w-3.5 h-3.5 mt-0.5" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Indic Phonetic Typing Studio Card */}
        <Card className="border shadow-sm rounded-2xl overflow-hidden md:col-span-2">
          <CardHeader className="bg-amber-500/10 border-b py-4">
            <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-600" /> Native Devanagari Phonetic Transliteration Studio
            </CardTitle>
            <CardDescription className="text-xs">Type in English phonetics (e.g. "taap", "dukhne", "madat") to test instant Marathi/Hindi script conversion.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Transliteration Test Field:</label>
              <IndicInput
                value={indicText}
                onChange={setIndicText}
                lang={language === 'hi' ? 'hi' : 'mr'}
                placeholder="Type phonetically here: taap, dookhne, madat..."
                className="w-full px-4 py-3 bg-background border rounded-xl text-sm font-medium shadow-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {indicText && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Converted Output:</span>
                <span className="text-lg font-extrabold text-amber-900 dark:text-amber-100">{indicText}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Application Info & System Diagnostics */}
        <Card className="border shadow-sm rounded-2xl overflow-hidden md:col-span-2">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" /> Application & System Information
            </CardTitle>
            <CardDescription className="text-xs">Technical capabilities and current operational status</CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase mb-1">
                <Database className="w-4 h-4" /> Offline Engine
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">95%+ Offline Ready</p>
              <p className="text-[11px] text-slate-500 mt-0.5">IndexedDB Dexie.js + Stale-While-Revalidate SW</p>
            </div>

            <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase mb-1">
                <Video className="w-4 h-4" /> Telemedicine
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">WebRTC Engine</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Low Bandwidth Mode (100kbps, 320x240 @ 15fps)</p>
            </div>

            <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase mb-1">
                <Mic className="w-4 h-4" /> Voice Assistant
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Multimodal AI Voice</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Gemini Audio + Groq + Native TTS Stack</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
