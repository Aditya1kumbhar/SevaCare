import { createClient } from '@/lib/supabase/server'
import { Users, ClipboardList, ShieldAlert, Package, Activity, Pill, Utensils } from 'lucide-react'

export default async function DashboardOverview() {
  const supabase = await createClient()

  const [
    { count: residentCount },
    { count: logCount },
    { count: alertCount },
    { count: staffCount },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('residents').select('*', { count: 'exact', head: true }),
    supabase.from('daily_logs').select('*', { count: 'exact', head: true }),
    supabase.from('emergency_alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('staff').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('daily_logs').select('*, residents(name)').order('logged_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Resident Census', value: residentCount ?? 0, icon: Users, color: 'text-blue-700', bgClass: 'bg-blue-50', borderClass: 'border-blue-100' },
    { label: 'Log Entries', value: logCount ?? 0, icon: ClipboardList, color: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-100' },
    { label: 'Active Personnel', value: staffCount ?? 0, icon: Activity, color: 'text-purple-700', bgClass: 'bg-purple-50', borderClass: 'border-purple-100' },
    { label: 'Active Alerts', value: alertCount ?? 0, icon: ShieldAlert, color: 'text-rose-700', bgClass: 'bg-rose-50', borderClass: 'border-rose-100' },
  ]

  const statusColors: Record<string, string> = {
    good: 'text-green-500 bg-green-950 px-2 py-0.5 border border-green-500',
    fair: 'text-yellow-500 bg-yellow-950 px-2 py-0.5 border border-yellow-500',
    poor: 'text-orange-500 bg-orange-950 px-2 py-0.5 border border-orange-500',
    critical: 'text-rose-600 bg-red-950 px-2 py-0.5 border border-red-500 animate-pulse',
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 border-b border-slate-200 pb-4">
        Facility Overview
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`p-6 border shadow-sm rounded-2xl flex flex-col justify-between items-start hover:shadow-md transition-all ${stat.bgClass} ${stat.borderClass}`}>
            <stat.icon className={`w-7 h-7 mb-4 ${stat.color} opacity-90`} />
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className={`text-sm font-semibold mt-1 saturate-150 ${stat.color}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Logs */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 border-b border-slate-200 pb-3 mb-4 mt-8">
          Recent Log Entries
        </h3>
        {recentLogs && recentLogs.length > 0 ? (
          <div className="border border-white/50 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden">
            {recentLogs.map((log: any, i: number) => (
              <div key={log.id} className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between ${i !== 0 ? 'border-t border-slate-100/50' : ''}`}>
                <div className="mb-2 sm:mb-0">
                  <p className="text-slate-900 font-semibold">{log.residents?.name || 'Unknown Resident'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(log.logged_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute:'numeric', hour12:true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider rounded-md ${statusColors[log.status] || 'text-slate-500 border border-slate-300 px-2 py-1'}`}>
                    {log.status}
                  </span>
                  {log.meal_taken && (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md px-2 py-1">
                      <Utensils className="w-3 h-3" /> Meal
                    </span>
                  )}
                  {log.medication_taken && (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md px-2 py-1">
                      <Pill className="w-3 h-3" /> Meds
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-slate-200 border-dashed rounded-2xl text-center bg-white/80 backdrop-blur-sm">
            <p className="text-slate-500 text-sm font-medium">No log entries recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
