'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const ALLERGY_OPTIONS = ['None', 'Penicillin', 'Sulfa Drugs', 'Nuts', 'Latex', 'Other']
const MOBILITY_OPTIONS = ['Independent', 'Assisted', 'Bedridden']
const CONDITION_OPTIONS = ['None', 'Diabetes', 'Heart Disease', 'Asthma', 'Hypertension', 'Other']
const COMMUNICATION_OPTIONS = ['Clear', 'Hard of Hearing', 'Non-Verbal', 'Dementia-Impaired']
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function AddResidentPage() {
  const [loading, setLoading] = useState(false)
  const [allergy, setAllergy] = useState('None')
  const [allergyOther, setAllergyOther] = useState('')
  const [mobility, setMobility] = useState('Independent')
  const [conditions, setConditions] = useState<string[]>(['None'])
  const [conditionOther, setConditionOther] = useState('')
  const [wandering, setWandering] = useState(false)
  const [aggression, setAggression] = useState(false)
  const [aggressionNotes, setAggressionNotes] = useState('')
  const [communication, setCommunication] = useState('Clear')

  // Medication tracking
  const [medications, setMedications] = useState<{name: string, dosage: string, time: string}[]>([])

  const router = useRouter()
  const supabase = createClient()

  function toggleCondition(c: string) {
    if (c === 'None') {
      setConditions(['None'])
      return
    }
    setConditions(prev => {
      const filtered = prev.filter(x => x !== 'None')
      if (filtered.includes(c)) return filtered.filter(x => x !== c).length ? filtered.filter(x => x !== c) : ['None']
      return [...filtered, c]
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const finalAllergy = allergy === 'Other' ? allergyOther : allergy
    const finalConditions = conditions.includes('Other') && conditionOther ? [...conditions.filter(c => c !== 'Other'), conditionOther] : conditions

    if (aggression && !aggressionNotes.trim()) {
      toast.error('Aggression triggers MUST be described for staff safety.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('residents').insert({
      name: form.get('name'),
      age: parseInt(form.get('age') as string),
      room_number: form.get('room_number') || null,
      blood_group: form.get('blood_group') || null,
      family_contact_name: form.get('family_contact_name'),
      family_phone_number: form.get('family_phone_number'),
      
      // Strict Liability Fields
      life_threatening_allergies: finalAllergy,
      mobility_status: mobility,
      critical_conditions: finalConditions,
      wandering_risk: wandering,
      aggression_triggers: aggression ? aggressionNotes : null,
      communication_barrier: communication,
      
      // Daily Care Protocol
      medications: medications
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('RESIDENT PROFILE SECURED.')
    router.push('/dashboard/residents')
    router.refresh()
  }

  const inputClass = "w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-slate-900 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all rounded-xl shadow-sm"
  const sectionClass = "bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-6 rounded-2xl space-y-4"
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2"

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 bg-slate-50 min-h-screen">
      <div className="border-b border-slate-200 pb-4 mb-6 pt-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Resident Intake Protocol</h2>
        <p className="text-rose-700 text-xs font-semibold mt-2 bg-rose-50 inline-block px-2.5 py-1 border border-rose-200 rounded-lg">Strict Liability & Operations Filter</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info */}
        <div className={sectionClass}>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-3 mb-4">1. Basic Identity</h3>
          <input name="name" placeholder="Full Legal Name *" required className={inputClass} />
          <div className="grid grid-cols-3 gap-3">
            <input name="age" type="number" placeholder="Age *" required min={1} max={150} className={inputClass} />
            <input name="room_number" placeholder="Room Number" className={inputClass} />
            <select name="blood_group" className={inputClass}>
              <option value="">Blood Group</option>
              {BLOOD_GROUP_OPTIONS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="family_contact_name" placeholder="Family Contact Name *" required className={inputClass} />
            <input name="family_phone_number" placeholder="Emergency Phone *" required className={inputClass} />
          </div>
        </div>

        {/* Physical Health (Liability) */}
        <div className={`${sectionClass} border-rose-100 bg-white`}>
          <h3 className="text-sm font-semibold tracking-tight text-rose-600 border-b-2 border-rose-100 pb-3 mb-4">2. Physical Liability Protocols</h3>
          
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Life-Threatening Allergies</label>
            <select 
              value={allergy} onChange={e => setAllergy(e.target.value)}
              className={`${inputClass} mt-0 text-slate-900 bg-white ${allergy !== 'None' ? 'border-rose-300 text-rose-700 bg-rose-50' : ''}`}
            >
              {ALLERGY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {allergy === 'Other' && (
              <input value={allergyOther} onChange={e => setAllergyOther(e.target.value)} placeholder="Specify allergy (e.g., Shellfish) *" required className={`${inputClass} mt-2 border-rose-300`} />
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Mobility Escalation Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              {MOBILITY_OPTIONS.map(opt => (
                <button
                  key={opt} type="button" onClick={() => setMobility(opt)}
                  className={`py-3 px-2 text-sm font-semibold tracking-tight transition-all border-r border-slate-200 last:border-r-0 ${mobility === opt ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-white'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Critical Chronic Conditions</label>
            <div className="grid grid-cols-2 gap-0 border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-2">
              {CONDITION_OPTIONS.map(opt => (
                <button
                  key={opt} type="button" onClick={() => toggleCondition(opt)}
                  className={`py-3 px-2 text-sm font-semibold tracking-tight transition-all border-r border-b border-slate-200 last:border-r-0 nth-child(even):border-r-0 ${conditions.includes(opt) ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-white'}`}
                >
                  {conditions.includes(opt) ? '✓ ' : ''}{opt}
                </button>
              ))}
            </div>
            {conditions.includes('Other') && (
              <input value={conditionOther} onChange={e => setConditionOther(e.target.value)} placeholder="Specify critical condition *" required className={`${inputClass} mt-3 border-amber-300`} />
            )}
          </div>
        </div>

        {/* Mental Health (Staff Safety) */}
        <div className={`${sectionClass} border-amber-200 bg-white`}>
          <h3 className="text-sm font-semibold tracking-tight text-amber-600 border-b-2 border-amber-100 pb-3 mb-4">3. Cognitive & Safety Risks</h3>
          
          <div className="flex items-center justify-between bg-slate-50 p-5 border border-slate-200 shadow-sm rounded-xl">
            <div>
              <p className="text-slate-900 font-semibold tracking-tight text-sm">Elopement / Wandering Risk</p>
              <p className="text-xs text-rose-600 mt-1 font-medium">Critical Facility Liability Incident</p>
            </div>
            <button
              type="button" onClick={() => setWandering(!wandering)}
              className={`w-24 py-2.5 text-sm font-semibold tracking-tight rounded-xl transition-all ${wandering ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
            >
              {wandering ? 'Detected' : 'None'}
            </button>
          </div>

          <div className="bg-slate-50 p-5 border border-slate-200 shadow-sm rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-900 font-semibold tracking-tight text-sm">Aggression Triggers</p>
                <p className="text-xs text-amber-600 mt-1 font-medium">Required For Staff Safety Protocols</p>
              </div>
              <button
                type="button" onClick={() => setAggression(!aggression)}
                className={`w-24 py-2.5 text-sm font-semibold tracking-tight rounded-xl transition-all ${aggression ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
              >
                {aggression ? 'Active' : 'None'}
              </button>
            </div>
            {aggression && (
              <textarea 
                value={aggressionNotes} onChange={e => setAggressionNotes(e.target.value)}
                placeholder="Describe triggers explicitly (e.g., 'Strikes out when touched on left arm', 'Agitated by loud noises') *" required
                rows={2} className={`${inputClass} border-amber-300 bg-amber-50 resize-none`} 
              />
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Communication Barrier</label>
            <p className="text-xs text-slate-500 mb-3">Dictates visual check frequency requirements.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              {COMMUNICATION_OPTIONS.map(opt => (
                <button
                  key={opt} type="button" onClick={() => setCommunication(opt)}
                  className={`py-3 px-2 text-sm font-semibold tracking-tight transition-all border-r border-b border-slate-200 last:border-r-0 ${communication === opt ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-white'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Care Protocol (Medications) */}
        <div className={`${sectionClass} border-blue-200 bg-white`}>
          <div className="flex items-center justify-between border-b-2 border-blue-100 pb-3 mb-4">
            <h3 className="text-sm font-semibold tracking-tight text-blue-600">4. Daily Care Protocol & Medications</h3>
            <button
              type="button"
              onClick={() => setMedications([...medications, { name: '', dosage: '', time: '08:00' }])}
              className="text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
            >
              + Add Medication
            </button>
          </div>
          
          {medications.length === 0 ? (
            <p className="text-sm font-medium text-slate-400 text-center py-4">No active medications logged.</p>
          ) : (
            <div className="space-y-3">
              {medications.map((med, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 border border-slate-200 shadow-sm rounded-xl items-center">
                  <input
                    placeholder="Medicine Name (e.g., Aspirin)"
                    value={med.name}
                    onChange={e => {
                      const newMeds = [...medications]
                      newMeds[index].name = e.target.value
                      setMedications(newMeds)
                    }}
                    required
                    className="flex-1 w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none placeholder-zinc-500"
                  />
                  <input
                    placeholder="Dosage (e.g., 10mg)"
                    value={med.dosage}
                    onChange={e => {
                      const newMeds = [...medications]
                      newMeds[index].dosage = e.target.value
                      setMedications(newMeds)
                    }}
                    required
                    className="w-full sm:w-32 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none placeholder-zinc-500"
                  />
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <input
                      type="time"
                      value={med.time}
                      onChange={e => {
                        const newMeds = [...medications]
                        newMeds[index].time = e.target.value
                        setMedications(newMeds)
                      }}
                      required
                      className="flex-1 sm:w-32 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setMedications(medications.filter((_, i) => i !== index))}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent"
                      title="Remove Medication"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 sticky bottom-4 p-4 border border-slate-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
          <button type="button" onClick={() => router.back()} className="w-1/3 py-3.5 text-sm font-semibold tracking-tight bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="w-2/3 py-3.5 text-sm font-semibold tracking-tight bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm">
            {loading ? 'Processing...' : 'Save Resident Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
