'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, ShieldAlert } from 'lucide-react'

const ALLERGY_OPTIONS = ['None', 'Penicillin', 'Sulfa Drugs', 'Nuts', 'Latex', 'Other']
const MOBILITY_OPTIONS = ['Independent', 'Assisted', 'Bedridden']
const CONDITION_OPTIONS = ['None', 'Diabetes', 'Heart Disease', 'Asthma', 'Hypertension', 'Other']
const COMMUNICATION_OPTIONS = ['Clear', 'Hard of Hearing', 'Non-Verbal', 'Dementia-Impaired']
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function EditResidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  
  const [fetching, setFetching] = useState(true) // Changed from loading
  const [loading, setLoading] = useState(false) // Changed from saving
  const [resident, setResident] = useState<any>(null) // Added resident state
  
  // Basic Info States
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  // familyContactName and familyPhoneNumber will be handled by formData directly in handleSubmit
  // const [familyContactName, setFamilyContactName] = useState('')
  // const [familyPhoneNumber, setFamilyPhoneNumber] = useState('')

  // Liability States
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

  useEffect(() => {
    async function fetchResident() {
      const { data, error } = await supabase.from('residents').select('*').eq('id', id).single()
      if (error || !data) {
        toast.error('Could not load resident')
        router.back()
        return
      }

      setResident(data) // Set resident data
      setName(data.name || '')
      setAge(data.age?.toString() || '')
      setRoomNumber(data.room_number || '')
      setBloodGroup(data.blood_group || '')
      // setFamilyContactName(data.family_contact_name || '')
      // setFamilyPhoneNumber(data.family_phone_number || '')

      // Parse Allergies
      if (data.life_threatening_allergies) {
        if (ALLERGY_OPTIONS.includes(data.life_threatening_allergies)) {
          setAllergy(data.life_threatening_allergies)
        } else {
          setAllergy('Other')
          setAllergyOther(data.life_threatening_allergies)
        }
      }

      // Mobility
      if (data.mobility_status) setMobility(data.mobility_status)

      // Conditions
      if (data.critical_conditions && data.critical_conditions.length > 0) {
        const knownConditions = data.critical_conditions.filter((c: string) => CONDITION_OPTIONS.includes(c))
        const unknownCondition = data.critical_conditions.find((c: string) => !CONDITION_OPTIONS.includes(c))
        
        if (unknownCondition) {
          setConditions([...knownConditions, 'Other'])
          setConditionOther(unknownCondition)
        } else {
          setConditions(knownConditions)
        }
      }

      // Mental Health
      setWandering(!!data.wandering_risk)
      if (data.aggression_triggers) {
        setAggression(true)
        setAggressionNotes(data.aggression_triggers)
      }
      if (data.communication_barrier) setCommunication(data.communication_barrier)

      // Medications
      if (data.medications && Array.isArray(data.medications)) {
        setMedications(data.medications)
      }

      setFetching(false) // Changed from setLoading
    }

    fetchResident()
  }, [id, supabase, router])

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
    setLoading(true) // Changed from setSaving

    const formData = new FormData(e.currentTarget);

    const finalAllergy = allergy === 'Other' ? allergyOther : allergy
    const finalConditions = conditions.includes('Other') && conditionOther ? [...conditions.filter(c => c !== 'Other'), conditionOther] : conditions

    if (aggression && !aggressionNotes.trim()) {
      toast.error('Aggression triggers MUST be described for staff safety.')
      setLoading(false) // Changed from setSaving
      return
    }

    const { error } = await supabase.from('residents').update({
      name,
      age: parseInt(age),
      room_number: roomNumber || null,
      blood_group: bloodGroup || null,
      family_contact_name: formData.get('family_contact_name'),
      family_phone_number: formData.get('family_phone_number'),
      
      // Strict Liability Fields
      life_threatening_allergies: finalAllergy,
      mobility_status: mobility,
      critical_conditions: finalConditions,
      wandering_risk: wandering,
      aggression_triggers: aggression ? aggressionNotes : null,
      communication_barrier: communication,
      
      // Daily Care Protocol
      medications: medications
    }).eq('id', id)

    if (error) { toast.error(error.message); setLoading(false); return } // Changed from setSaving
    toast.success('PROFILE UPDATE SECURED.') // Changed toast message
    router.push(`/dashboard/residents/${id}`)
    router.refresh()
  }

  const inputClass = "w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-slate-900 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all rounded-xl shadow-sm"
  const sectionClass = "bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-6 rounded-2xl space-y-4"
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2"

  if (fetching) return <p className="text-slate-500 text-center py-16 text-sm  font-medium">RETRIEVING RECORD...</p> // Changed from loading

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 bg-slate-50 min-h-screen">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">UPDATE RESIDENT PROTOCOL</h2>
        <p className="text-rose-600 text-xs uppercase tracking-widest mt-2 font-bold bg-red-950/30 inline-block px-2 py-1 border border-red-900/50">STRICT LIABILITY & OPERATIONS FILTER</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info */}
        <div className={sectionClass}>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-200 pb-2 mb-4">1. BASIC IDENTITY MATRIX</h3>
          <input name="name" defaultValue={resident?.name} onChange={e => setName(e.target.value)} placeholder="FULL LEGAL NAME *" required className={inputClass} />
          <div className="grid grid-cols-3 gap-3">
            <input value={age} onChange={e => setAge(e.target.value)} type="number" placeholder="Age *" required min={1} max={150} className={inputClass} />
            <input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="Room Number" className={inputClass} />
            <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className={inputClass}>
              <option value="">Blood Group</option>
              {BLOOD_GROUP_OPTIONS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="family_contact_name" defaultValue={resident?.family_contact_name} placeholder="FAMILY CONTACT NAME *" required className={inputClass} />
            <input name="family_phone_number" defaultValue={resident?.family_phone_number} placeholder="EMERGENCY PHONE *" required className={inputClass} />
          </div>
        </div>

        {/* Physical Health (Liability) */}
        <div className={`${sectionClass} border-red-900 bg-slate-50`}>
          <h3 className="text-sm font-semibold tracking-tight text-rose-600 border-b-2 border-red-900/50 pb-2 mb-4">2. PHYSICAL LIABILITY PROTOCOLS</h3>
          
          <div>
            <label className={labelClass}>LIFE-THREATENING ALLERGIES</label>
            <select 
              value={allergy} onChange={e => setAllergy(e.target.value)}
              className={`${inputClass} mt-0 text-slate-900 bg-slate-50 ${allergy !== 'None' ? 'border-red-600 text-rose-600 font-bold bg-red-950/20' : ''}`}
            >
              {ALLERGY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {allergy === 'Other' && (
              <input value={allergyOther} onChange={e => setAllergyOther(e.target.value)} placeholder="SPECIFY ALLERGY (E.G., SHELLFISH) *" required className={`${inputClass} mt-2 border-red-500`} />
            )}
          </div>

          <div>
            <label className={labelClass}>MOBILITY ESCALATION LEVEL</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-slate-200 shadow-sm rounded-xl">
              {MOBILITY_OPTIONS.map(opt => (
                <button
                  key={opt} type="button" onClick={() => setMobility(opt)}
                  className={`py-4 px-2 text-xs font-semibold tracking-tight transition-all border-r border-slate-200 last:border-r-0 ${mobility === opt ? 'bg-blue-600 text-slate-900' : 'bg-slate-50 text-slate-500 hover:bg-white'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>CRITICAL CHRONIC CONDITIONS</label>
            <div className="grid grid-cols-2 gap-0 border border-slate-200 shadow-sm rounded-xl mt-2">
              {CONDITION_OPTIONS.map(opt => (
                <button
                  key={opt} type="button" onClick={() => toggleCondition(opt)}
                  className={`py-4 px-2 text-xs font-semibold tracking-tight transition-all border-r border-b border-slate-200 last:border-r-0 ${conditions.includes(opt) ? 'bg-orange-600 text-slate-900' : 'bg-slate-50 text-slate-500 hover:bg-white'}`}
                >
                  {conditions.includes(opt) ? '[✓] ' : ''}{opt}
                </button>
              ))}
            </div>
            {conditions.includes('Other') && (
              <input value={conditionOther} onChange={e => setConditionOther(e.target.value)} placeholder="SPECIFY CRITICAL CONDITION *" required className={`${inputClass} mt-2 border-orange-500`} />
            )}
          </div>
        </div>

        {/* Mental Health (Staff Safety) */}
        <div className={`${sectionClass} border-yellow-900 bg-slate-50`}>
          <h3 className="text-sm font-semibold tracking-tight text-yellow-500 border-b-2 border-yellow-900/50 pb-2 mb-4">3. COGNITIVE / SAFETY RISKS</h3>
          
          <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-200 shadow-sm rounded-xl">
            <div>
              <p className="text-slate-900 font-semibold tracking-tight text-xs">ELOPEMENT / WANDERING RISK</p>
              <p className="text-xs text-rose-600  mt-1">CRITICAL FACILITY LIABILITY INCIDENT</p>
            </div>
            <button
              type="button" onClick={() => setWandering(!wandering)}
              className={`w-20 py-3 font-semibold tracking-tight transition-all ${wandering ? 'bg-rose-600 text-white border-2 border-red-500' : 'bg-slate-50 text-slate-500 border border-slate-200 shadow-sm rounded-xl'}`}
            >
              {wandering ? 'DETECT' : 'NONE'}
            </button>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 shadow-sm rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-900 font-semibold tracking-tight text-xs">AGGRESSION TRIGGERS</p>
                <p className="text-xs text-yellow-500  mt-1">REQUIRED FOR STAFF SAFETY PROTOCOLS</p>
              </div>
              <button
                type="button" onClick={() => setAggression(!aggression)}
                className={`w-20 py-3 font-semibold tracking-tight transition-all ${aggression ? 'bg-orange-600 text-slate-900 border-2 border-orange-500' : 'bg-slate-50 text-slate-500 border border-slate-200 shadow-sm rounded-xl'}`}
              >
                {aggression ? 'ACTIVE' : 'NONE'}
              </button>
            </div>
            {aggression && (
              <textarea 
                value={aggressionNotes} onChange={e => setAggressionNotes(e.target.value)}
                placeholder="DESCRIBE TRIGGERS EXPLICITLY (E.G., 'STRIKES OUT WHEN TOUCHED ON LEFT ARM', 'AGITATED BY LOUD NOISES') *" required
                rows={2} className={`${inputClass} border-red-500/50 bg-red-950/20 resize-none`} 
              />
            )}
          </div>

          <div>
            <label className={labelClass}>COMMUNICATION BARRIER</label>
            <p className="text-xs  text-slate-500 mb-2">DICTATES VISUAL CHECK FREQUENCY REQUIREMENTS.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-slate-200 shadow-sm rounded-xl">
              {COMMUNICATION_OPTIONS.map(opt => (
                <button
                  key={opt} type="button" onClick={() => setCommunication(opt)}
                  className={`py-4 px-2 text-xs font-semibold tracking-tight transition-all border-r border-b border-slate-200 last:border-r-0 ${communication === opt ? 'bg-blue-600 text-slate-900' : 'bg-slate-50 text-slate-500 hover:bg-white'}`}
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
            <h3 className="text-sm font-semibold tracking-tight text-blue-600">4. DAILY CARE PROTOCOL & MEDICATIONS</h3>
            <button
              type="button"
              onClick={() => setMedications([...medications, { name: '', dosage: '', time: '08:00' }])}
              className="text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
            >
              + ADD MEDICATION
            </button>
          </div>
          
          {medications.length === 0 ? (
            <p className="text-sm font-medium text-slate-400 text-center py-4">NO ACTIVE MEDICATIONS LOGGED.</p>
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
        <div className="flex gap-0 sticky bottom-4 border border-slate-200 shadow-sm rounded-xl bg-slate-50">
          <button type="button" onClick={() => router.back()} className="w-1/3 py-5 text-sm font-semibold tracking-tight bg-slate-50 hover:bg-white text-slate-500 transition-all border-r border-slate-200">
            ABORT
          </button>
          <button type="submit" disabled={loading} className="w-2/3 py-5 text-sm font-semibold tracking-tight bg-green-600 hover:bg-green-700 text-white disabled:bg-[#e0e0e0] disabled:text-slate-500 transition-all">
            {loading ? 'PROCESSING...' : 'UPDATE PROFILE RECORD'}
          </button>
        </div>
      </form>
    </div>
  )
}
