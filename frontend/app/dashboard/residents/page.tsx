import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusSquare, ClipboardList, Phone, AlertTriangle, ShieldAlert } from 'lucide-react'

export default async function ResidentsPage() {
  const supabase = await createClient()
  const { data: residents } = await supabase.from('residents').select('*').order('name')

  return (
    <div className="space-y-6 min-h-screen pb-12">
      <div className="flex items-center justify-between border-b border-white/50 pb-4 pt-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Resident Directory</h2>
        <Link 
          href="/dashboard/residents/add" 
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold tracking-tight bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm rounded-xl"
        >
          <PlusSquare className="w-4 h-4" /> Add Patient
        </Link>
      </div>

      {!residents || residents.length === 0 ? (
        <div className="text-center py-16 border-2 border-slate-200 rounded-2xl border-dashed bg-white/80 backdrop-blur-sm">
          <p className="text-slate-500 text-sm font-medium">Directory is empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {residents.map((r, i) => (
            <div key={r.id} className="bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-2xl p-5 hover:bg-white transition-all group">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Link href={`/dashboard/residents/${r.id}`} className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-all">{r.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {r.wandering_risk && <span className="flex items-center gap-1 bg-rose-100 text-rose-700 text-xs px-2.5 py-1 font-semibold rounded-lg"><ShieldAlert className="w-3 h-3" /> Elopement</span>}
                      {r.aggression_triggers && <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2.5 py-1 font-semibold rounded-lg"><AlertTriangle className="w-3 h-3" /> Aggression</span>}
                      {r.life_threatening_allergies && r.life_threatening_allergies !== 'None' && <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2.5 py-1 font-semibold rounded-lg"><AlertTriangle className="w-3 h-3" /> Allergy</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-2">
                    <span className="border-r border-slate-200 pr-3">Age: {r.age}</span>
                    {r.room_number && <span className="border-r border-slate-200 pr-3">Rm: {r.room_number}</span>}
                    {r.mobility_status && <span className="border-r border-slate-200 pr-3">Mobility: {r.mobility_status}</span>}
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Ext: {r.family_phone_number}</span>
                  </div>
                </Link>
                <Link 
                  href={`/dashboard/log/${r.id}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold tracking-tight bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                >
                  <ClipboardList className="w-4 h-4" /> Log Entry
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
