'use client'

import { useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Activity, HeartPulse } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { Translate } from '@/components/Translate'

export default function LogVitalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const bp = form.get('blood_pressure') as string
    const hr = form.get('heart_rate') as string
    const temp = form.get('temperature') as string
    const weight = form.get('weight') as string
    const sugar = form.get('blood_sugar') as string
    const o2 = form.get('oxygen_level') as string
    const notes = form.get('notes') as string

    if (!bp && !hr && !temp && !weight && !sugar && !o2 && !notes) {
      toast.error(t.pleaseEnterAtLeastOneVitalSign)
      setLoading(false)
      return
    }

    try {
      const { smartFetch } = await import('@/lib/offline-db')
      const res = await smartFetch('/api/log-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: id,
          blood_pressure: bp || null,
          heart_rate: hr ? parseInt(hr) : null,
          temperature: temp ? parseFloat(temp) : null,
          weight: weight ? parseFloat(weight) : null,
          blood_sugar: sugar ? parseFloat(sugar) : null,
          oxygen_level: o2 ? parseInt(o2) : null,
          notes: notes || null
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || t.failedToSecureVitals)
        setLoading(false)
        return
      }

      if ((res as any).offline) {
        toast.info(t.vitalsSavedLocally, {
          icon: '☁️'
        })
      } else {
        toast.success(t.vitalsSecured)
      }

      router.push(`/dashboard/residents/${id}`)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(t.connectionErrorVitals)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-4 text-base bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-slate-900 placeholder-zinc-500 focus:outline-none focus:border-blue-600 transition-all rounded-xl shadow-sm  uppercase"
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 mt-4"

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12 bg-slate-50 min-h-screen">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-blue-600" /> <Translate id="clinicalVitalsEntry" fallback="CLINICAL VITALS ENTRY" />
        </h2>
        <p className="text-slate-500  text-xs uppercase tracking-widest mt-2 border-l-2 border-slate-200 pl-2">
          <Translate id="recordPhysicalHealthMeasurements" fallback="RECORD PHYSICAL HEALTH MEASUREMENTS" />
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-6 rounded-2xl">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}><Translate id="bloodPressureUpper" fallback="BLOOD PRESSURE" /></label>
            <input name="blood_pressure" placeholder={t.bpPlaceholder} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><Translate id="heartRateBpm" fallback="HEART RATE (BPM)" /></label>
            <input name="heart_rate" type="number" placeholder={t.hrPlaceholder} min={30} max={250} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><Translate id="temperatureF" fallback="TEMPERATURE (°F)" /></label>
            <input name="temperature" type="number" step="0.1" placeholder={t.tempPlaceholder} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><Translate id="spo2Level" fallback="SPO2 LEVEL (%)" /></label>
            <input name="oxygen_level" type="number" placeholder={t.spo2Placeholder} min={50} max={100} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><Translate id="bloodGlucoseUpper" fallback="BLOOD GLUCOSE (MG/DL)" /></label>
            <input name="blood_sugar" type="number" step="0.1" placeholder={t.glucosePlaceholder} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><Translate id="patientWeight" fallback="PATIENT WEIGHT (KG)" /></label>
            <input name="weight" type="number" step="0.1" placeholder={t.weightPlaceholder} className={inputClass} />
          </div>
        </div>

        <label className={labelClass}><Translate id="additionalClinicalObservations" fallback="ADDITIONAL CLINICAL OBSERVATIONS" /></label>
        <textarea name="notes" placeholder={t.observationsPlaceholder} rows={3} className={`${inputClass} resize-none mb-6`} />

        <div className="flex gap-0 border border-slate-200 shadow-sm rounded-xl bg-slate-50 mt-6">
          <button type="button" onClick={() => router.back()} className="w-1/3 py-5 text-sm font-semibold tracking-tight bg-slate-50 hover:bg-white text-slate-500 transition-all border-r border-slate-200">
            <Translate id="abort" fallback="ABORT" />
          </button>
          <button type="submit" disabled={loading} className="w-2/3 py-5 text-sm font-semibold tracking-tight bg-blue-600 hover:bg-blue-700 text-white disabled:bg-[#e0e0e0] disabled:text-slate-500 transition-all flex items-center justify-center gap-2">
            {loading ? t.processingUpper : <><Activity className="w-5 h-5"/> <Translate id="communicateVitals" fallback="COMMUNICATE VITALS" /></>}
          </button>
        </div>
      </form>
    </div>
  )
}
