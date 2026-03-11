'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const ALERT_TYPES = [
  { value: 'medical', label: '🏥 Medical', color: 'bg-rose-600' },
  { value: 'fall', label: '⬇️ Fall', color: 'bg-orange-600' },
  { value: 'missing', label: '🔍 Missing', color: 'bg-yellow-600' },
  { value: 'fire', label: '🔥 Fire', color: 'bg-red-700' },
  { value: 'other', label: '⚠️ Other', color: 'bg-zinc-600' },
]

export default function EmergencyPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [residents, setResidents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: a }, { data: r }] = await Promise.all([
      supabase.from('emergency_alerts').select('*, residents(name, family_phone_number, family_contact_name)').order('triggered_at', { ascending: false }).limit(20),
      supabase.from('residents').select('id, name'),
    ])
    setAlerts(a || [])
    setResidents(r || [])
  }

  async function handleTrigger(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('emergency_alerts').insert({
      resident_id: form.get('resident_id'),
      alert_type: form.get('alert_type'),
      severity: form.get('severity'),
      description: form.get('description') || null,
      triggered_by: user?.id,
    })
    if (error) { toast.error(error.message); return }

    // Get resident info for WhatsApp
    const resident = residents.find(r => r.id === form.get('resident_id'))
    if (resident) {
      const alertLabel = ALERT_TYPES.find(a => a.value === form.get('alert_type'))?.label || form.get('alert_type')
      toast.success('🚨 Emergency alert triggered!')
    }
    setShowForm(false)
    fetchData()
  }

  async function resolveAlert(id: string) {
    await supabase.from('emergency_alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    toast.success('Alert resolved')
    fetchData()
  }


  const inputClass = "w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
  const sevColors: Record<string, string> = { low: 'bg-yellow-600', medium: 'bg-orange-600', high: 'bg-rose-600', critical: 'bg-red-700' }

  const activeAlerts = alerts.filter(a => !a.resolved)
  const resolvedAlerts = alerts.filter(a => a.resolved)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 text-slate-900">🚨 Emergency Alerts</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 text-sm font-bold rounded-xl bg-rose-600 hover:bg-red-500 text-slate-900 transition-colors animate-pulse">
          ⚠️ Trigger Alert
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleTrigger} className="bg-red-950/30 border border-red-800 rounded-xl p-4 space-y-3">
          <select name="resident_id" required className={inputClass}>
            <option value="">Select Resident *</option>
            {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select name="alert_type" required className={inputClass}>
              {ALERT_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <select name="severity" required className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <textarea name="description" placeholder="Description" rows={2} className={`${inputClass} resize-none`} />
          <button type="submit" className="w-full py-2.5 text-sm font-bold rounded-xl bg-rose-600 hover:bg-red-500 text-slate-900 transition-colors">🚨 Trigger Emergency</button>
        </form>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-red-400 mb-3">🔴 Active Alerts ({activeAlerts.length})</h3>
          <div className="space-y-2">
            {activeAlerts.map((alert: any) => (
              <div key={alert.id} className="bg-red-950/20 border border-red-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-lg text-slate-900 ${sevColors[alert.severity]}`}>{alert.severity.toUpperCase()}</span>
                      <span className="text-slate-900 font-medium">{alert.residents?.name}</span>
                    </div>
                    <p className="text-sm text-slate-500">{alert.alert_type}{alert.description && ` — ${alert.description}`}</p>
                    <p className="text-xs text-slate-500">{new Date(alert.triggered_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                  </div>
                  <div className="flex gap-2">

                    <button onClick={() => resolveAlert(alert.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-700 hover:bg-zinc-600 text-slate-900 transition-colors">
                      ✅ Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      <div>
        <h3 className="text-lg font-bold text-slate-500 mb-3">Resolved ({resolvedAlerts.length})</h3>
        <div className="space-y-2">
          {resolvedAlerts.map((alert: any) => (
            <div key={alert.id} className="bg-white border border-slate-200 rounded-xl p-3 opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 text-sm">{alert.residents?.name} — {alert.alert_type}</p>
                  <p className="text-xs text-slate-500">{new Date(alert.triggered_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="text-xs text-emerald-400">Resolved</span>
              </div>
            </div>
          ))}
          {resolvedAlerts.length === 0 && <p className="text-slate-500 text-sm">No resolved alerts.</p>}
        </div>
      </div>
    </div>
  )
}
