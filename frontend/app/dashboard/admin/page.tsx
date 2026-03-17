'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Bell, LogOut, ChevronRight, UserCircle, Info, Volume2, Users, ClipboardList, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { requestNotificationPermission, showLocalNotification } from '@/lib/push-notifications'
import { toast } from 'sonner'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<string>('default')
  const [stats, setStats] = useState({ residents: 0, logs: 0, alerts: 0, staff: 0 })
  const [showAppInfo, setShowAppInfo] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Check notification permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission)
        setNotificationsEnabled(Notification.permission === 'granted')
      }

      // Load real stats
      const [
        { count: residentCount },
        { count: logCount },
        { count: alertCount },
        { count: staffCount },
      ] = await Promise.all([
        supabase.from('residents').select('*', { count: 'exact', head: true }),
        supabase.from('daily_logs').select('*', { count: 'exact', head: true }),
        supabase.from('emergency_alerts').select('*', { count: 'exact', head: true }),
        supabase.from('staff').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        residents: residentCount ?? 0,
        logs: logCount ?? 0,
        alerts: alertCount ?? 0,
        staff: staffCount ?? 0,
      })
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function toggleNotifications() {
    if (notificationsEnabled) {
      // Can't programmatically revoke — tell user
      toast.info('To disable notifications, use your browser settings for this site.')
      return
    }
    const granted = await requestNotificationPermission()
    setNotificationsEnabled(granted)
    setNotificationPermission(granted ? 'granted' : 'denied')
    if (granted) {
      toast.success('✅ Emergency notifications enabled!')
    } else {
      toast.error('Notifications were blocked. Please allow them in browser settings.')
    }
  }

  function testAlarm() {
    // Play the Web Audio alarm
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.frequency.value = freq
        osc.type = 'square'
        gain.gain.setValueAtTime(0.3, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      const now = audioCtx.currentTime
      for (let i = 0; i < 4; i++) {
        playBeep(880, now + i * 0.3, 0.15)
      }
    } catch (e) {
      console.warn('Audio test failed:', e)
    }

    // Also show a test notification
    showLocalNotification(
      '🔔 Test Alert — SevaCare',
      'This is a test emergency notification. If you can see this, notifications are working!',
      'test-notification'
    )
    toast.success('🔔 Test alarm played! Check for a browser notification too.')
  }

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '...'

  return (
    <div className="max-w-md mx-auto min-h-[85vh] pb-12 flex flex-col">
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full border-4 border-white shadow-lg flex items-center justify-center mb-4">
          <UserCircle className="w-14 h-14 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Admin</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">{user?.email || 'Loading...'}</p>
        <p className="text-xs text-slate-400 mt-0.5">Member since {createdAt}</p>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mx-2">
        
        {/* Account Info */}
        <div className="flex items-center justify-between p-4 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{t.accountKey}</p>
              <p className="text-xs text-slate-500 truncate w-32 sm:w-48">{user?.id || '...'}</p>
            </div>
          </div>
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{t.notifications}</p>
              <p className="text-xs text-slate-500">
                {notificationsEnabled ? 'Emergency alerts active' : 'Tap to enable alerts'}
              </p>
            </div>
          </div>
          {/* Toggle Switch */}
          <button
            onClick={toggleNotifications}
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Test Alarm */}
        <div className="flex items-center justify-between p-4 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Test Emergency Alarm</p>
              <p className="text-xs text-slate-500">Hear the alert sound + test notification</p>
            </div>
          </div>
          <button
            onClick={testAlarm}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors border border-amber-200"
          >
            🔔 Test
          </button>
        </div>

        {/* App Info (Expandable) */}
        <div>
          <button
            onClick={() => setShowAppInfo(!showAppInfo)}
            className="w-full flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800">{t.appInfo}</p>
                <p className="text-xs text-slate-500">v2.0.0 · Real-time Emergency</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${showAppInfo ? 'rotate-90' : ''}`} />
          </button>

          {/* Expanded Stats */}
          {showAppInfo && (
            <div className="px-4 pb-4 pt-2 bg-slate-50 border-b border-slate-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                  <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{stats.residents}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Residents</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                  <ClipboardList className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{stats.logs}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Log Entries</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                  <ShieldAlert className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{stats.alerts}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Alerts</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                  <UserCircle className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{stats.staff}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Staff</p>
                </div>
              </div>
              <div className="text-center pt-1">
                <p className="text-[10px] text-slate-400">SevaCare © 2026 • Built with Next.js + Supabase</p>
              </div>
            </div>
          )}
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
          <LogOut className="w-5 h-5" /> {t.logOut}
        </button>
      </div>

    </div>
  )
}
