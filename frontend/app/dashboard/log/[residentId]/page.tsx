'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Utensils, Pill, Smile, Meh, Frown, Angry, ClipboardList } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'good', label: 'Optimal', active: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' },
  { value: 'fair', label: 'Fair', active: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' },
  { value: 'poor', label: 'Poor', active: 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm' },
  { value: 'critical', label: 'Critical', active: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm' },
]

const MOOD_OPTIONS = [
  { value: 'happy', label: 'Stable', icon: Smile },
  { value: 'neutral', label: 'Neutral', icon: Meh },
  { value: 'sad', label: 'Withdrawn', icon: Frown },
  { value: 'agitated', label: 'Agitated', icon: Angry },
]

export default function LogStatusPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const [resident, setResident] = useState<any>(null)
  const [status, setStatus] = useState('')
  const [mood, setMood] = useState('')
  const [mealTaken, setMealTaken] = useState(false)
  const [medicationTaken, setMedicationTaken] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchResident() {
      const { data } = await supabase
        .from('residents')
        .select('*')
        .eq('id', residentId)
        .single()
      setResident(data)
    }
    fetchResident()
  }, [residentId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!status) {
      toast.error('Please select a health status')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/log-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: residentId,
          status,
          mood: mood || null,
          meal_taken: mealTaken,
          medication_taken: medicationTaken,
          notes: notes || null,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Failed to log status')
        setLoading(false)
        return
      }

      toast.success('Status logged!')

      // Redirect back to dashboard


      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!resident) {
    return <p className="text-slate-500 text-center py-16 text-sm font-medium">Retrieving record...</p>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto bg-slate-50 min-h-screen pb-12">
      <div className="border-b border-slate-200 pb-4 mb-6 pt-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Status Log Entry
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Patient: {resident.name} • Age {resident.age}
          {resident.room_number && ` • Rm ${resident.room_number}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Health Status */}
        <div className="space-y-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <label className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 block">
            Overall Clinical Status *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`py-4 text-sm font-semibold tracking-tight rounded-xl transition-all border ${
                  status === opt.value
                    ? opt.active
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meal & Medication */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMealTaken(!mealTaken)}
            className={`py-6 text-sm font-semibold tracking-tight rounded-2xl transition-all border flex flex-col items-center gap-2 shadow-sm ${
              mealTaken
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Utensils className="w-6 h-6" />
            Meals {mealTaken ? 'Verified' : 'Pending'}
          </button>
          <button
            type="button"
            onClick={() => setMedicationTaken(!medicationTaken)}
            className={`py-6 text-sm font-semibold tracking-tight rounded-2xl transition-all border flex flex-col items-center gap-2 shadow-sm ${
              medicationTaken
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Pill className="w-6 h-6" />
            Meds {medicationTaken ? 'Verified' : 'Pending'}
          </button>
        </div>

        {/* Mood */}
        <div className="space-y-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <label className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 block">
            Behavioral State
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMood(mood === opt.value ? '' : opt.value)}
                className={`py-4 text-xs font-semibold tracking-tight rounded-xl transition-all border flex flex-col items-center justify-center gap-1.5 ${
                  mood === opt.value
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <opt.icon className="w-5 h-5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <textarea
          placeholder="Additional clinical notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-4 text-sm bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
        />

        {/* Submit */}
        <div className="flex gap-3 sticky bottom-4 p-4 border border-slate-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-1/3 py-3.5 text-sm font-semibold tracking-tight bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !status}
            className="w-2/3 py-3.5 text-sm font-semibold tracking-tight bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : <><ClipboardList className="w-4 h-4"/> Save Entry</>}
          </button>
        </div>
      </form>
    </div>
  )
}
