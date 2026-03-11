import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, LayoutDashboard, Settings, UserCircle, LogOut, ShieldAlert, Bell, Dumbbell } from 'lucide-react'
import NavRemindersBadge from './NavRemindersBadge'

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, mobile: true },
  { name: 'Residents', href: '/dashboard/residents', icon: Users, mobile: true },
  { name: 'Activity', href: '/dashboard/activity', icon: Dumbbell, mobile: true },
  { name: 'Reminders', href: '/dashboard/batch-log', icon: Bell, mobile: true },
  { name: 'System Config', href: '/dashboard/admin', icon: Settings, mobile: false },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function handleSignOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  if (!user) redirect('/')

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 bg-gradient-to-br from-blue-50/50 via-emerald-50/20 to-purple-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white/80 backdrop-blur-md border-r border-slate-200 flex-col shrink-0 z-10">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm bg-white flex items-center justify-center">
            <Image src="/logo.png" alt="SevaCare Logo" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">SevaCare</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all"
            >
              <div className="relative flex items-center justify-center p-1">
                <item.icon className="w-5 h-5" />
                {item.name === 'Reminders' && <NavRemindersBadge />}
              </div>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full px-4 py-3 text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left flex items-center gap-3"
            >
              <LogOut className="w-5 h-5" /> Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 pb-28 md:p-6 md:pb-6 h-screen overflow-auto">
        {/* Mobile Header (Optional but good for context) */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm bg-white flex items-center justify-center">
               <Image src="/logo.png" alt="SevaCare Logo" width={36} height={36} className="w-full h-full object-cover" />
             </div>
             <div>
               <h1 className="text-lg font-bold tracking-tight text-slate-900">SevaCare</h1>
               <p className="text-[10px] font-medium text-slate-500 truncate max-w-[150px]">{user.email}</p>
             </div>
           </div>
           
           <Link href="/dashboard/admin" className="p-2.5 bg-white border border-slate-200 shadow-sm rounded-full text-slate-500 hover:text-blue-600 transition-colors z-20">
             <Settings className="w-5 h-5" />
           </Link>
        </div>

        <div className="max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Navigation (WhatsApp / Instagram style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 flex items-center justify-around pb-safe">
        {NAV_ITEMS.filter(item => item.mobile).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 w-full py-3 text-slate-500 hover:text-blue-600 active:bg-slate-50 transition-colors"
          >
            <div className="relative flex items-center justify-center pt-2">
              <item.icon className="w-6 h-6 mb-0.5" />
              {item.name === 'Reminders' && <NavRemindersBadge />}
            </div>
            <span className="text-[10px] font-bold tracking-wide">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
