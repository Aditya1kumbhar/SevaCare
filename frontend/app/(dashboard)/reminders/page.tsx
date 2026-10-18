'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Pill, AlertTriangle, Clock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { Translate } from '@/components/Translate'

type MedAlert = {
  residentId: string
  residentName: string
  roomNumber: string | null
  medName: string
  medDosage: string
  medTime: string
  isOverdue: boolean
}

export default function RemindersPage() {
  const [alerts, setAlerts] = useState<MedAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [recordingKey, setRecordingKey] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const supabase = createClient()
  const { t } = useLanguage()

  const load = async () => {
    // 1. Fetch residents with medication schedules
    const { data: residents } = await supabase
      .from('residents')
      .select('id, name, room_number, medications')

    // 2. Fetch today's already administered medications to prevent duplicate alerts
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    let administeredKeys = new Set<string>()
    try {
      const { data: administrations } = await supabase
        .from('medication_administrations')
        .select('resident_id, medication_name, scheduled_time, status')
        .gte('administered_at', todayStart.toISOString())

      if (administrations) {
        administrations
          .filter(a => a.status === 'given')
          .forEach(a => {
            administeredKeys.add(`${a.resident_id}:${a.medication_name}:${a.scheduled_time || ''}`)
          })
      }
    } catch (e) {
      console.warn('Could not query medication_administrations (table may still be propagating):', e)
    }

    if (residents) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMin = now.getMinutes()

      let pendingAlerts: MedAlert[] = []

      residents.forEach(r => {
        if (r.medications && Array.isArray(r.medications)) {
          r.medications.forEach((med: any) => {
            if (med.time) {
              const medKey = `${r.id}:${med.name}:${med.time}`
              // Skip if already administered today
              if (administeredKeys.has(medKey)) return

              const [h, m] = med.time.split(':').map(Number)
              const isOverdue = (currentHour > h) || (currentHour === h && currentMin >= m)

              // Show alerts for anything due within the next 2 hours or already overdue today
              if (isOverdue || (h - currentHour <= 2 && h >= currentHour)) {
                pendingAlerts.push({
                  residentId: r.id,
                  residentName: r.name,
                  roomNumber: r.room_number,
                  medName: med.name,
                  medDosage: med.dosage,
                  medTime: med.time,
                  isOverdue
                })
              }
            }
          })
        }
      })

      // Sort by time
      pendingAlerts.sort((a, b) => a.medTime.localeCompare(b.medTime))
      setAlerts(pendingAlerts)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Refresh alerts every minute
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkGiven = async (medAlert: MedAlert) => {
    const key = `${medAlert.residentId}-${medAlert.medName}-${medAlert.medTime}`
    setRecordingKey(key)

    try {
      const { smartFetch } = await import('@/lib/offline-db')
      const res = await smartFetch('/api/record-medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: medAlert.residentId,
          medication_name: medAlert.medName,
          dosage: medAlert.medDosage,
          scheduled_time: medAlert.medTime,
          status: 'given',
          notes: 'Administered via Reminders Action Center'
        })
      }, 'BATCH_MEDS')

      const result = await res.json()
      if (result.success || result.offline) {
        // Optimistically remove from list
        setAlerts(prev => prev.filter(a => !(
          a.residentId === medAlert.residentId &&
          a.medName === medAlert.medName &&
          a.medTime === medAlert.medTime
        )))
        setActionNotice(result.offline 
          ? `Recorded offline: ${medAlert.medName} for ${medAlert.residentName}` 
          : `Administered: ${medAlert.medName} for ${medAlert.residentName}`)
        setTimeout(() => setActionNotice(null), 4000)
      } else {
        window.alert(result.error || 'Failed to record medication administration')
      }
    } catch (err: any) {
      console.error('Failed to administer medication:', err)
      window.alert(err.message || 'Error administering medication')
    } finally {
      setRecordingKey(null)
    }
  }

  if (loading) return <p className="text-slate-500 text-center py-16 text-sm font-medium"><Translate id="scanningMedications" fallback="Scanning medication schedules..." /></p>

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 bg-slate-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 pb-4 pt-4 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-600" /> <Translate id="actionCenterReminders" fallback="Action Center: Reminders" />
        </h2>
        <p className="text-sm text-slate-500 mt-1"><Translate id="monitoringMedications" fallback="Aggressive monitoring for scheduled medications." /></p>
      </div>

      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Pill className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900"><Translate id="allClear" fallback="All Clear" /></h3>
          <p className="text-slate-500 mt-1"><Translate id="noImmediateActions" fallback="No immediate medication actions required." /></p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, idx) => {
            const isRecording = recordingKey === `${alert.residentId}-${alert.medName}-${alert.medTime}`

            return (
              <div 
                key={`${alert.residentId}-${alert.medName}-${alert.medTime}-${idx}`}
                className={`bg-white border-l-4 shadow-sm rounded-2xl p-5 transition-all ${
                  alert.isOverdue ? 'border-rose-500' : 'border-amber-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <Link 
                    href={`/residents/${alert.residentId}#medications-schedule`}
                    className="flex items-start gap-4 flex-1 group"
                  >
                    <div className={`p-3 rounded-xl ${alert.isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      {alert.isOverdue ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                        {alert.residentName} 
                        {alert.roomNumber && <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md"><Translate id="rm" fallback="Rm" /> {alert.roomNumber}</span>}
                      </h3>
                      <p className="text-slate-600 font-medium mt-1">
                        {t.theMedication} <strong className="text-slate-900">{alert.medName} ({alert.medDosage})</strong> {t.atTime} <strong className="text-slate-900">{alert.medTime}</strong> {t.shouldBeGiven}
                      </p>
                    </div>
                  </Link>
                  
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                      alert.isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {alert.isOverdue ? <Translate id="overdue" fallback="Overdue" /> : <Translate id="upcoming" fallback="Upcoming" />}
                    </span>

                    <button
                      type="button"
                      disabled={isRecording}
                      onClick={() => handleMarkGiven(alert)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
                      title="Mark medication as administered"
                    >
                      {isRecording ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Given</span>
                    </button>

                    <Link 
                      href={`/residents/${alert.residentId}#medications-schedule`}
                      className="bg-slate-50 p-2 rounded-full hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors"
                      aria-label="View resident medication schedule"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

