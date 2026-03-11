import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PdfDownloadButton from './PdfDownloadButton'
import { Activity, Edit, ClipboardList, Phone, AlertTriangle, ShieldAlert, Stethoscope, FileText, Pill, Utensils, HeartPulse } from 'lucide-react'

export default async function ResidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: resident } = await supabase.from('residents').select('*').eq('id', id).single()
  if (!resident) notFound()

  const { data: recentLogs } = await supabase.from('daily_logs').select('*').eq('resident_id', id).order('logged_at', { ascending: false }).limit(10)
  const { data: healthRecords } = await supabase.from('health_records').select('*').eq('resident_id', id).order('recorded_at', { ascending: false }).limit(5)
  
  const statusColors: Record<string, string> = { 
    good: 'text-green-500 bg-green-950 border-green-500', 
    fair: 'text-yellow-500 bg-yellow-950 border-yellow-500', 
    poor: 'text-orange-500 bg-orange-950 border-orange-500', 
    critical: 'text-rose-600 bg-red-950 border-red-500 animate-pulse' 
  }

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{resident.name}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-2">
            <span className="border-r border-slate-200 pr-3">Age: {resident.age}</span>
            {resident.room_number && <span className="border-r border-slate-200 pr-3">Rm: {resident.room_number}</span>}
            {resident.blood_group && <span className="border-r border-slate-200 pr-3">Bld: {resident.blood_group}</span>}
            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> Ext: {resident.family_phone_number}</span>
          </div>

          <div className="mt-5 space-y-2">
            {resident.life_threatening_allergies && resident.life_threatening_allergies !== 'None' && (
              <p className="text-sm font-semibold tracking-tight text-orange-700 bg-orange-50 border-l-4 border-orange-500 pl-3 py-2 rounded-r-lg">
                Allergy: {resident.life_threatening_allergies}
              </p>
            )}
            {resident.critical_conditions?.length > 0 && resident.critical_conditions[0] !== 'None' && (
              <p className="text-sm font-semibold tracking-tight text-rose-700 bg-rose-50 border-l-4 border-rose-500 pl-3 py-2 rounded-r-lg">
                Conditions: {resident.critical_conditions.join(', ')}
              </p>
            )}
            {resident.aggression_triggers && (
              <p className="text-sm font-semibold tracking-tight text-amber-700 bg-amber-50 border-l-4 border-amber-500 pl-3 py-2 rounded-r-lg">
                Triggers: {resident.aggression_triggers}
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-5 flex-wrap">
            {resident.mobility_status && <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 font-semibold rounded-lg">Mobility: {resident.mobility_status}</span>}
            {resident.wandering_risk && <span className="flex items-center gap-1 bg-rose-100 text-rose-700 text-xs px-2.5 py-1 font-semibold rounded-lg"><ShieldAlert className="w-3 h-3" /> Elopement Risk</span>}
            {resident.aggression_triggers && <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2.5 py-1 font-semibold rounded-lg"><AlertTriangle className="w-3 h-3" /> Aggression Risk</span>}
            {resident.communication_barrier && resident.communication_barrier !== 'Clear' && <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-1 font-semibold rounded-lg">Comm: {resident.communication_barrier}</span>}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full md:w-auto">
          <Link href={`/dashboard/residents/${resident.id}/edit`} className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm rounded-2xl transition-all">
            <Edit className="w-5 h-5 mb-1.5" />
            <span className="text-xs font-semibold">Edit</span>
          </Link>
          <div className="flex">
             <PdfDownloadButton resident={resident} healthRecords={healthRecords || []} logs={recentLogs || []} />
          </div>
          <Link href={`/dashboard/residents/${resident.id}/vitals`} className="flex flex-col items-center justify-center p-4 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 shadow-sm rounded-2xl transition-all">
            <Activity className="w-5 h-5 mb-1.5" />
            <span className="text-xs font-semibold text-slate-500">Vitals</span>
          </Link>
          <Link href={`/dashboard/log/${resident.id}`} className="flex flex-col items-center justify-center p-4 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 shadow-sm rounded-2xl transition-all">
            <ClipboardList className="w-5 h-5 mb-1.5" />
            <span className="text-xs font-semibold text-slate-500">Log</span>
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        #medications-schedule:target {
          animation: highlight-pulse 1.5s 4 alternate;
          border-color: #ef4444;
          background-color: #fef2f2;
        }
        @keyframes highlight-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}} />

      {/* Medications Schedule */}
      <div id="medications-schedule" className="scroll-mt-6 rounded-2xl transition-colors duration-1000">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 border-b border-slate-200 pb-3 mb-4 mt-8 flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600" /> Active Medications Schedule
        </h3>
        {resident.medications && resident.medications.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {resident.medications.map((med: any, i: number) => (
              <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-blue-50 text-blue-600 font-bold tracking-tight rounded-xl p-3 text-center min-w-[70px]">
                  {med.time.split(':')[0]}:{med.time.split(':')[1]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{med.name}</p>
                  <p className="text-sm text-slate-500 font-medium">Dose: {med.dosage}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center">
            <p className="text-slate-500 text-sm font-medium">No active medications scheduled.</p>
          </div>
        )}
      </div>

      {/* Health Records */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 border-b border-slate-200 pb-3 mb-4 mt-8 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-blue-600" /> Clinical Vitals History
        </h3>
        {healthRecords && healthRecords.length > 0 ? (
          <div className="space-y-4">
            {healthRecords.map((h: any) => (
              <div key={h.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
                <p className="text-xs font-medium text-slate-500 mb-4 border-b border-slate-100 pb-3">
                  Recorded: {new Date(h.recorded_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour:'numeric', minute:'numeric', hour12:true })}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {h.blood_pressure && <div><p className="text-xs font-medium text-slate-500 mb-1">BP</p><p className="text-lg font-semibold text-slate-900">{h.blood_pressure}</p></div>}
                  {h.heart_rate && <div><p className="text-xs font-medium text-slate-500 mb-1">HR</p><p className="text-lg font-semibold text-slate-900">{h.heart_rate}</p></div>}
                  {h.temperature && <div><p className="text-xs font-medium text-slate-500 mb-1">Temp</p><p className="text-lg font-semibold text-slate-900">{h.temperature}°</p></div>}
                  {h.oxygen_level && <div><p className="text-xs font-medium text-slate-500 mb-1">SpO₂</p><p className="text-lg font-semibold text-slate-900">{h.oxygen_level}%</p></div>}
                  {h.blood_sugar && <div><p className="text-xs font-medium text-slate-500 mb-1">Glucose</p><p className="text-lg font-semibold text-slate-900">{h.blood_sugar}</p></div>}
                  {h.weight && <div><p className="text-xs font-medium text-slate-500 mb-1">Weight</p><p className="text-lg font-semibold text-slate-900">{h.weight} kg</p></div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 border-dashed rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm font-medium">No clinical vitals on record.</p>
          </div>
        )}
      </div>

      {/* Recent Daily Logs */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 border-b border-slate-200 pb-3 mb-4 mt-8 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-500" /> Recent Status Logs
        </h3>
        {recentLogs && recentLogs.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            {recentLogs.map((log: any, i: number) => (
              <div key={log.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${statusColors[log.status] || 'text-slate-600 bg-slate-100 border border-slate-200'}`}>
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </span>
                  <div className="flex gap-2">
                    {log.meal_taken && <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md"><Utensils className="w-3 h-3"/> Meal</span>}
                    {log.medication_taken && <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md"><Pill className="w-3 h-3"/> Meds</span>}
                    {log.mood && <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">Mood: {log.mood}</span>}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(log.logged_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour:'numeric', minute:'numeric', hour12:true })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 border-dashed rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm font-medium">No log entries detected.</p>
          </div>
        )}
      </div>


    </div>
  )
}
