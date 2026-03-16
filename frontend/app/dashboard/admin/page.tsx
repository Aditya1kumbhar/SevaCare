'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, ShieldCheck, Bell, LogOut, Moon, ChevronRight, UserCircle, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    loadUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-md mx-auto min-h-[85vh] pb-12 flex flex-col">
      {/* WhatsApp Profile Header */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full border-4 border-white shadow-lg flex items-center justify-center mb-4">
          <UserCircle className="w-14 h-14 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Admin</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">{user?.email || 'Loading...'}</p>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mx-2">
        
        {/* Account Info */}
        <div className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Account Key</p>
              <p className="text-xs text-slate-500 truncate w-32 sm:w-48">{user?.id || '...'}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Notifications</p>
              <p className="text-xs text-slate-500">Alerts, Sounds</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>

        {/* Display */}
        <div className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Display</p>
              <p className="text-xs text-slate-500">Theme, Layout</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>

        {/* App Info */}
        <div className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{t.appInfo}</p>
              <p className="text-xs text-slate-500">v1.1.0 Enterprise</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>

        {/* Language Switcher */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <p className="text-sm font-bold text-slate-800 mb-3">{t.language}</p>
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage('hi')}
              className={`flex-1 py-2.5 text-xs font-bold border-l border-r border-slate-200 transition-colors ${language === 'hi' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              हिन्दी
            </button>
            <button 
              onClick={() => setLanguage('mr')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${language === 'mr' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              मराठी
            </button>
          </div>
        </div>

      </div>

      <div className="mt-6 mx-2">
        <button 
          onClick={handleLogout}
          className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex items-center justify-center gap-2 text-rose-600 font-bold active:bg-rose-50 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-5 h-5" /> Log Out
        </button>
      </div>

    </div>
  )
}
