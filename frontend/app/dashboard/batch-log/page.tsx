'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Pill, AlertTriangle, Clock, ArrowRight } from 'lucide-react'

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
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('residents').select('id, name, room_number, medications')
      
      if (data) {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMin = now.getMinutes()
        
        let pendingAlerts: MedAlert[] = []

        data.forEach(r => {
          if (r.medications && Array.isArray(r.medications)) {
            r.medications.forEach((med: any) => {
              if (med.time) {
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

    load()
    // Refresh alerts every minute
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <p className="text-slate-500 text-center py-16 text-sm font-medium">Scanning medication schedules...</p>

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 bg-slate-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 pb-4 pt-4 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-600" /> Action Center: Reminders
        </h2>
        <p className="text-sm text-slate-500 mt-1">Aggressive monitoring for scheduled medications.</p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Pill className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All Clear</h3>
          <p className="text-slate-500 mt-1">No immediate medication actions required.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, idx) => (
            <Link 
              key={idx} 
              href={`/dashboard/residents/${alert.residentId}#medications-schedule`}
              className={`block bg-white border-l-4 shadow-sm rounded-2xl p-5 hover:shadow-md hover:scale-[1.01] transition-all group ${
                alert.isOverdue ? 'border-rose-500' : 'border-amber-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${alert.isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                    {alert.isOverdue ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {alert.residentName} 
                      {alert.roomNumber && <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">Rm {alert.roomNumber}</span>}
                    </h3>
                    <p className="text-slate-600 font-medium mt-1">
                      The medication <strong className="text-slate-900">{alert.medName} ({alert.medDosage})</strong> at <strong className="text-slate-900">{alert.medTime}</strong> should be given to the resident.
                    </p>
                  </div>
                </div>
                
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                    alert.isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {alert.isOverdue ? 'Overdue' : 'Upcoming'}
                  </span>
                  <div className="bg-slate-50 p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-400 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
