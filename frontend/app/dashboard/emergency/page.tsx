'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AlertTriangle, Clock, CheckCircle2, ExternalLink, Phone } from 'lucide-react'

const ALERT_TYPES = [
  { value: 'medical', label: '🏥 Medical', color: 'bg-rose-600' },
  { value: 'fall', label: '⬇️ Fall', color: 'bg-orange-600' },
  { value: 'missing', label: '🔍 Missing', color: 'bg-yellow-600' },
  { value: 'fire', label: '🔥 Fire', color: 'bg-red-700' },
  { value: 'other', label: '⚠️ Other', color: 'bg-zinc-600' },
]

const ESCALATION_SECONDS = 300 // 5 minutes

function EscalationTimer({ alert, onEscalate }: { alert: any; onEscalate: (alert: any) => void }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(alert.triggered_at).getTime()) / 1000)
    return Math.max(0, ESCALATION_SECONDS - elapsed)
  })
  const [escalated, setEscalated] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0 && !escalated) {
      setEscalated(true)
      onEscalate(alert)
      return
    }
    if (secondsLeft <= 0) return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsLeft, escalated])

  const minutes = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const progress = ((ESCALATION_SECONDS - secondsLeft) / ESCALATION_SECONDS) * 100
  const isUrgent = secondsLeft < 60

  if (escalated) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold animate-pulse border border-red-300">
        <Phone className="w-3.5 h-3.5" />
        ESCALATED — Admin Notified
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold flex items-center gap-1.5 ${isUrgent ? 'text-red-600 animate-pulse' : 'text-amber-600'}`}>
          <Clock className="w-3.5 h-3.5" />
          {isUrgent ? '⚠️ ESCALATION IMMINENT' : 'Auto-Escalation in'}
        </span>
        <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}>
          {minutes}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default function EmergencyPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [residents, setResidents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  // Subscribe to realtime for live updates on THIS page
  useEffect(() => {
    const channel = supabase
      .channel('emergency-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, () => {
        fetchData() // Refresh the list on any change
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchData() {
    const [{ data: a }, { data: r }] = await Promise.all([
      supabase.from('emergency_alerts').select('*, residents(name, family_phone_number, family_contact_name)').order('triggered_at', { ascending: false }).limit(30),
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
    toast.success('🚨 Emergency alert triggered!')
    setShowForm(false)
    fetchData()
  }

  async function resolveAlert(id: string) {
    await supabase.from('emergency_alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    toast.success('✅ Alert resolved')
    fetchData()
  }

  const handleEscalation = useCallback((alert: any) => {
    const residentName = alert.residents?.name || 'Unknown'
    const familyPhone = alert.residents?.family_phone_number
    const familyName = alert.residents?.family_contact_name || 'Family'
    const elapsed = Math.floor((Date.now() - new Date(alert.triggered_at).getTime()) / 60000)

    const message = encodeURIComponent(
      `🚨 URGENT ESCALATION from SevaCare\n\n` +
      `Resident: ${residentName}\n` +
      `Alert: ${alert.alert_type?.toUpperCase()} (${alert.severity?.toUpperCase()})\n` +
      `${alert.description ? `Details: ${alert.description}\n` : ''}` +
      `Unresolved for: ${elapsed} minutes\n\n` +
      `Please respond immediately.`
    )

    // Open WhatsApp with the family/admin number
    if (familyPhone) {
      const cleanPhone = familyPhone.replace(/\D/g, '')
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
    }

    toast.error(`🚨 Alert for ${residentName} has been ESCALATED!`, {
      duration: 30000,
      description: familyPhone
        ? `WhatsApp opened for ${familyName}`
        : 'No family phone on file — please contact admin manually',
    })
  }, [])

  const inputClass = "w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
  const sevColors: Record<string, string> = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    medium: 'bg-orange-100 text-orange-800 border-orange-300',
    high: 'bg-rose-100 text-rose-800 border-rose-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  }
  const sevBorders: Record<string, string> = {
    low: 'border-yellow-200',
    medium: 'border-orange-200',
    high: 'border-rose-300',
    critical: 'border-red-400 shadow-red-100 shadow-lg',
  }

  const activeAlerts = alerts.filter(a => !a.resolved)
  const resolvedAlerts = alerts.filter(a => a.resolved)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">🚨 Emergency Alerts</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time monitoring • Auto-escalation for critical alerts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 text-sm font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-md hover:shadow-lg">
          ⚠️ Trigger Alert
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleTrigger} className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <select name="resident_id" required className={inputClass}>
            <option value="">Select Resident *</option>
            {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select name="alert_type" required className={inputClass}>
              {ALERT_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <select name="severity" required className={inputClass}>
              <option value="low">🟡 Low</option>
              <option value="medium">🟠 Medium</option>
              <option value="high">🔴 High</option>
              <option value="critical">🚨 Critical</option>
            </select>
          </div>
          <textarea name="description" placeholder="Description (optional)" rows={2} className={`${inputClass} resize-none`} />
          <button type="submit" className="w-full py-3 text-sm font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md">
            🚨 Trigger Emergency
          </button>
        </form>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-rose-600 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            Active Alerts ({activeAlerts.length})
          </h3>
          <div className="space-y-3">
            {activeAlerts.map((alert: any) => {
              const isHighSeverity = alert.severity === 'high' || alert.severity === 'critical'
              return (
                <div key={alert.id} className={`bg-white border-2 rounded-2xl p-5 transition-all ${sevBorders[alert.severity] || 'border-slate-200'} ${isHighSeverity ? 'animate-pulse-subtle' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${sevColors[alert.severity]}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-slate-900 font-semibold">{alert.residents?.name || 'Unknown'}</span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-600 text-sm capitalize">{alert.alert_type}</span>
                      </div>
                      {alert.description && (
                        <p className="text-sm text-slate-600 mb-1.5">{alert.description}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(alert.triggered_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-3">
                      {alert.residents?.family_phone_number && (
                        <a
                          href={`https://wa.me/${alert.residents.family_phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(`SevaCare Alert: ${alert.alert_type?.toUpperCase()} for ${alert.residents?.name}. Severity: ${alert.severity?.toUpperCase()}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                      <button onClick={() => resolveAlert(alert.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolve
                      </button>
                    </div>
                  </div>

                  {/* Escalation Timer for critical/high alerts */}
                  {isHighSeverity && (
                    <EscalationTimer alert={alert} onEscalate={handleEscalation} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Active Alerts */}
      {activeAlerts.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-emerald-800 font-semibold">All Clear</p>
          <p className="text-xs text-emerald-600 mt-1">No active emergency alerts at this time.</p>
        </div>
      )}

      {/* Resolved */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-400 mb-3">Resolved ({resolvedAlerts.length})</h3>
          <div className="space-y-2">
            {resolvedAlerts.map((alert: any) => (
              <div key={alert.id} className="bg-white border border-slate-100 rounded-xl p-3.5 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-700 text-sm font-medium">{alert.residents?.name} — <span className="capitalize">{alert.alert_type}</span></p>
                    <p className="text-xs text-slate-400">{new Date(alert.triggered_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Resolved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
