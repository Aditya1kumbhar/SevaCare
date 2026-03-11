'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const SHIFT_TYPES = [
  { value: 'morning', label: '🌅 Morning (6AM-2PM)', color: 'bg-yellow-600' },
  { value: 'afternoon', label: '☀️ Afternoon (2PM-10PM)', color: 'bg-orange-600' },
  { value: 'night', label: '🌙 Night (10PM-6AM)', color: 'bg-indigo-600' },
]

const ROLES = ['nurse', 'caretaker', 'doctor', 'volunteer', 'admin']

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showAddShift, setShowAddShift] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: s }, { data: sc }] = await Promise.all([
      supabase.from('staff').select('*').eq('is_active', true).order('name'),
      supabase.from('schedules').select('*, staff(name, role)').order('shift_date', { ascending: false }).limit(20),
    ])
    setStaffList(s || [])
    setSchedules(sc || [])
  }

  async function handleAddStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from('staff').insert({
      name: form.get('name'), role: form.get('role'), phone: form.get('phone') || null,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Staff added!')
    setShowAddStaff(false)
    fetchData()
  }

  async function handleAddShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from('schedules').insert({
      staff_id: form.get('staff_id'), shift_date: form.get('shift_date'), shift_type: form.get('shift_type'),
    })
    if (error) { toast.error(error.message); return }
    toast.success('Shift scheduled!')
    setShowAddShift(false)
    fetchData()
  }

  const inputClass = "w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
  const shiftColors: Record<string, string> = { morning: 'bg-yellow-600', afternoon: 'bg-orange-600', night: 'bg-indigo-600' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 text-slate-900">👩‍⚕️ Staff & Scheduling</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowAddStaff(!showAddStaff)} className="px-3 py-2 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">+ Staff</button>
          <button onClick={() => setShowAddShift(!showAddShift)} className="px-3 py-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-900 transition-colors">+ Shift</button>
        </div>
      </div>

      {/* Add Staff Form */}
      {showAddStaff && (
        <form onSubmit={handleAddStaff} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input name="name" placeholder="Name *" required className={inputClass} />
            <select name="role" required className={inputClass}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <input name="phone" placeholder="Phone" className={inputClass} />
          </div>
          <button type="submit" className="w-full py-2.5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">Save</button>
        </form>
      )}

      {/* Add Shift Form */}
      {showAddShift && (
        <form onSubmit={handleAddShift} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <select name="staff_id" required className={inputClass}>
              <option value="">Select Staff</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
            </select>
            <input name="shift_date" type="date" required className={inputClass} />
            <select name="shift_type" required className={inputClass}>
              {SHIFT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-900 transition-colors">Schedule</button>
        </form>
      )}

      {/* Staff List */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Active Staff ({staffList.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {staffList.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-slate-900 font-medium">{s.name}</p>
              <p className="text-xs text-slate-500 capitalize">{s.role} {s.phone && `· ${s.phone}`}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Schedules */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Recent Shifts</h3>
        <div className="space-y-2">
          {schedules.map((sc: any) => (
            <div key={sc.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-slate-900 text-sm font-medium">{sc.staff?.name}</p>
                <p className="text-xs text-slate-500">{sc.staff?.role} · {new Date(sc.shift_date).toLocaleDateString('en-IN')}</p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg text-slate-900 ${shiftColors[sc.shift_type] || 'bg-zinc-600'}`}>
                {sc.shift_type}
              </span>
            </div>
          ))}
          {schedules.length === 0 && <p className="text-slate-500 text-sm">No shifts scheduled.</p>}
        </div>
      </div>
    </div>
  )
}
