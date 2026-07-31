import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, LayoutDashboard, LogOut, ShieldAlert, Bell, Mic, Video, Settings } from 'lucide-react'
import NavRemindersBadge from './NavRemindersBadge'
import SyncStatusIndicator from './SyncStatusIndicator'
import EmergencyListener from '@/components/EmergencyListener'
import { Translate } from '@/components/Translate'
import { translations } from '@/lib/translations'
import ThemeToggleButton from '@/components/ThemeToggleButton'

import AnimatedNavLink from '@/components/AnimatedNavLink'

type TranslationKey = keyof typeof translations['en']

const NAV_ITEMS: { name: string; tKey: TranslationKey; href: string; icon: any; mobile: boolean }[] = [
  { name: 'Dashboard', tKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard, mobile: true },
  { name: 'Residents', tKey: 'residents', href: '/residents', icon: Users, mobile: true },
  { name: 'Voice Assistant', tKey: 'voiceAssistant', href: '/voice-assistant', icon: Mic, mobile: true },
  { name: 'Telemedicine', tKey: 'telemedicine', href: '/telemedicine', icon: Video, mobile: true },
  { name: 'Reminders', tKey: 'reminders', href: '/reminders', icon: Bell, mobile: true },
  { name: 'Settings', tKey: 'systemConfig', href: '/settings', icon: Settings, mobile: false },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-10">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm bg-white flex items-center justify-center">
              <Image src="/logo.png" alt="SevaCare Logo" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">SevaCare</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mb-1">{user.email}</p>
              <SyncStatusIndicator />
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <AnimatedNavLink
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl"
            >
              <div className="relative flex items-center justify-center p-1">
                <item.icon className="w-5 h-5" />
                {item.name === 'Reminders' && <NavRemindersBadge />}
              </div>
              <Translate id={item.tKey} fallback={item.name} />
            </AnimatedNavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all text-left flex items-center gap-3 cursor-pointer"
            >
              <LogOut className="w-5 h-5" /> <Translate id="logOut" fallback="Log Out" />
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 pb-28 md:p-6 md:pb-6 h-screen overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm bg-white flex items-center justify-center">
               <Image src="/logo.png" alt="SevaCare Logo" width={36} height={36} className="w-full h-full object-cover" />
             </div>
             <div>
               <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">SevaCare</h1>
               <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{user.email}</p>
             </div>
           </div>
           
           <div className="flex items-center gap-2 z-20">
             <AnimatedNavLink href="/settings" isMobile={true} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 shrink-0">
               <Settings className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
             </AnimatedNavLink>
             <SyncStatusIndicator />
           </div>
        </div>

        <div className="max-w-5xl mx-auto">{children}</div>
        <EmergencyListener />
      </main>

      {/* Mobile Bottom Navigation (5 Core Tabs) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 flex items-center justify-around pb-safe">
        {NAV_ITEMS.filter(item => item.mobile).map((item) => (
          <AnimatedNavLink
             key={item.href}
             href={item.href}
             isMobile={true}
             className="flex flex-col items-center justify-center gap-1 w-full py-3 text-slate-500 hover:text-blue-600"
          >
             <div className="relative flex items-center justify-center pt-2">
               <item.icon className="w-6 h-6 mb-0.5" />
               {item.name === 'Reminders' && <NavRemindersBadge />}
             </div>
             <span className="text-[10px] font-bold tracking-wide"><Translate id={item.tKey} fallback={item.name} /></span>
          </AnimatedNavLink>
        ))}
      </nav>
    </div>
  )
}
