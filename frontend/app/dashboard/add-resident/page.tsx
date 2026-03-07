"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useResidents } from "@/lib/residents-context"
import { toast } from "sonner"

const CHRONIC_ILLNESSES = ["Diabetes", "BP", "Heart Disease", "Asthma", "None"]
const MOBILITY_OPTIONS = ["Independent", "Uses Walker", "Wheelchair", "Bedridden"]
const GENDER_OPTIONS = ["Male", "Female", "Other"] as const

interface MedicationForm {
  name: string
  dose: string
  frequency: string
  time: string
}

const emptyMedication: MedicationForm = { name: "", dose: "", frequency: "", time: "" }

interface DraftFormData {
  name: string
  age: string
  gender: string
  emergencyName: string
  emergencyPhone: string
  chronicIllnesses: string[]
  mobilityStatus: string
  memoryLoss: boolean | null
  anxietyDepression: boolean | null
  allergies: string
  medications: MedicationForm[]
}

function PillToggle({
  label,
  selected,
  onToggle,
}: {
  label: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-sm border px-4 py-2 text-sm font-medium transition-all ${
        selected
          ? "border-flipkart-blue bg-flipkart-blue text-white shadow-sm"
          : "border-border bg-card text-flipkart-text hover:border-flipkart-blue/40 hover:bg-flipkart-blue/5"
      }`}
    >
      {label}
    </button>
  )
}

function YesNoToggle({
  value,
  onChange,
  id,
}: {
  value: boolean | null
  onChange: (val: boolean) => void
  id: string
}) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-labelledby={id}>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 rounded-sm border py-2.5 text-center text-sm font-medium transition-all ${
          value === true
            ? "border-flipkart-blue bg-flipkart-blue text-white shadow-sm"
            : "border-border bg-card text-flipkart-text hover:border-flipkart-blue/40"
        }`}
        role="radio"
        aria-checked={value === true}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 rounded-sm border py-2.5 text-center text-sm font-medium transition-all ${
          value === false
            ? "border-flipkart-green bg-flipkart-green text-white shadow-sm"
            : "border-border bg-card text-flipkart-text hover:border-flipkart-green/40"
        }`}
        role="radio"
        aria-checked={value === false}
      >
        No
      </button>
    </div>
  )
}

export default function AddResidentPage() {
  const router = useRouter()
  const { addResident } = useResidents()

  // Form state
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<string>("")
  const [chronicIllnesses, setChronicIllnesses] = useState<string[]>([])
  const [mobilityStatus, setMobilityStatus] = useState("")
  const [memoryLoss, setMemoryLoss] = useState<boolean | null>(null)
  const [anxietyDepression, setAnxietyDepression] = useState<boolean | null>(null)
  const [allergies, setAllergies] = useState("")
  const [emergencyName, setEmergencyName] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [medications, setMedications] = useState<MedicationForm[]>([{ ...emptyMedication }])

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem("addResidentDraft")
    if (draft) {
      try {
        const data: DraftFormData = JSON.parse(draft)
        setName(data.name)
        setAge(data.age)
        setGender(data.gender)
        setEmergencyName(data.emergencyName)
        setEmergencyPhone(data.emergencyPhone)
        setChronicIllnesses(data.chronicIllnesses)
        setMobilityStatus(data.mobilityStatus)
        setMemoryLoss(data.memoryLoss)
        setAnxietyDepression(data.anxietyDepression)
        setAllergies(data.allergies)
        setMedications(data.medications && data.medications.length > 0 ? data.medications : [{ ...emptyMedication }])
      } catch (error) {
        console.error("Failed to load draft:", error)
      }
    }
  }, [])

  // Save draft to localStorage whenever form changes
  useEffect(() => {
    const draft: DraftFormData = {
      name,
      age,
      gender,
      emergencyName,
      emergencyPhone,
      chronicIllnesses,
      mobilityStatus,
      memoryLoss,
      anxietyDepression,
      allergies,
      medications,
    }
    localStorage.setItem("addResidentDraft", JSON.stringify(draft))
  }, [name, age, gender, emergencyName, emergencyPhone, chronicIllnesses, mobilityStatus, memoryLoss, anxietyDepression, allergies, medications])

  const toggleIllness = (illness: string) => {
    if (illness === "None") {
      setChronicIllnesses((prev) => (prev.includes("None") ? [] : ["None"]))
      return
    }
    setChronicIllnesses((prev) => {
      const without = prev.filter((i) => i !== "None")
      return without.includes(illness)
        ? without.filter((i) => i !== illness)
        : [...without, illness]
    })
  }

  const addMedication = () => {
    setMedications((prev) => [...prev, { ...emptyMedication }])
  }

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMedication = (index: number, field: keyof MedicationForm, value: string) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    )
  }

  // Validation functions
  const validateStep1 = () => {
    if (!name.trim() || !age || !gender) {
      toast.error("Please fill in all required fields in Step 1")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (mobilityStatus === "" || memoryLoss === null || anxietyDepression === null) {
      toast.error("Please fill in all required fields in Step 2")
      return false
    }
    return true
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (currentStep === 0 && validateStep1()) {
      setCurrentStep(1)
    } else if (currentStep === 1 && validateStep2()) {
      setCurrentStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !age || !gender || !mobilityStatus || memoryLoss === null || anxietyDepression === null) {
      toast.error("Please fill in all required fields")
      return
    }

    const validMedications = medications
      .filter((m) => m.name.trim() !== "")
      .map((m) => ({
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        time: m.time,
      }))

    const illnesses = chronicIllnesses.filter((i) => i !== "None")

    try {
      const newResident = await addResident({
        name: name.trim(),
        age: Number(age),
        gender: gender as "Male" | "Female" | "Other",
        chronicIllnesses: illnesses,
        mobilityStatus,
        memoryLoss: memoryLoss,
        anxietyDepression: anxietyDepression,
        allergies: allergies.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
      })

      console.log("✅ Resident created:", newResident.id)

      // Now add medications if any
      if (validMedications.length > 0) {
        console.log("💊 Adding medications:", validMedications)
        for (const med of validMedications) {
          try {
            const { medicationsService } = await import("@/lib/services/medicationsService")
            await medicationsService.create(newResident.id, med)
            console.log("✅ Medication added:", med.name)
          } catch (medError) {
            console.error("❌ Failed to add medication:", med.name, medError)
            toast.error(`Failed to add medication: ${med.name}`)
          }
        }
      }

      // Clear draft after successful submission
      localStorage.removeItem("addResidentDraft")

      toast.success("Resident created successfully!")
      router.push("/dashboard")
    } catch (error) {
      // Error is already handled and shown as toast in the context
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-flipkart-gray">
      <Navbar />

      {/* MOBILE WIZARD VIEW (visible on xs-md) */}
      <div className="block md:hidden">
        <main className="mx-auto w-full flex-1 px-3 py-4 sm:px-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm text-flipkart-blue transition-colors hover:text-flipkart-blue-dark"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Header */}
          <div className="mb-4 rounded-sm bg-card px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:px-5 sm:py-4">
            <h1 className="text-lg font-medium text-flipkart-text">Add New Resident</h1>
            <p className="mt-0.5 text-xs text-flipkart-text-light">Complete all steps to register a new resident</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6 flex items-center justify-between rounded-sm bg-card px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:px-5">
            <div className="flex gap-2">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    step === currentStep
                      ? "bg-flipkart-blue scale-100"
                      : step < currentStep
                        ? "bg-flipkart-green"
                        : "bg-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-flipkart-text-light">
              Step {currentStep + 1} of 3
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 pb-32">
            {/* STEP 1: Personal Information */}
            {currentStep === 0 && (
              <section className="rounded-sm bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:p-5">
                <h2 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-wider text-flipkart-text-light">
                  Personal Information
                </h2>

                {/* Full Name */}
                <div className="mb-4 flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-flipkart-text-light">
                    Full Name <span className="text-[#ff6161]">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Kamala Devi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                    required
                  />
                </div>

                {/* Age */}
                <div className="mb-4 flex flex-col gap-1.5">
                  <Label htmlFor="age" className="text-xs font-medium text-flipkart-text-light">
                    Age <span className="text-[#ff6161]">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min={50}
                    max={120}
                    placeholder="e.g. 76"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-11 rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                    required
                  />
                </div>

                {/* Gender - Pill Toggles */}
                <fieldset className="mb-4">
                  <legend className="mb-2 text-xs font-medium text-flipkart-text-light">
                    Gender <span className="text-[#ff6161]">*</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map((g) => (
                      <PillToggle
                        key={g}
                        label={g}
                        selected={gender === g}
                        onToggle={() => setGender(g)}
                      />
                    ))}
                  </div>
                </fieldset>

                {/* Emergency Contact */}
                <div>
                  <p className="mb-2 text-xs font-medium text-flipkart-text-light">Emergency Contact</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <Input
                      placeholder="Name"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="h-11 flex-1 rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                    />
                    <Input
                      placeholder="Phone"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="h-11 flex-1 rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                      type="tel"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* STEP 2: Health Conditions */}
            {currentStep === 1 && (
              <section className="rounded-sm bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:p-5">
                <h2 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-wider text-flipkart-text-light">
                  Health Conditions
                </h2>

                {/* Chronic Illnesses */}
                <fieldset className="mb-5">
                  <legend className="mb-2 text-xs font-medium text-flipkart-text-light">
                    Chronic Illnesses
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {CHRONIC_ILLNESSES.map((illness) => (
                      <PillToggle
                        key={illness}
                        label={illness}
                        selected={chronicIllnesses.includes(illness)}
                        onToggle={() => toggleIllness(illness)}
                      />
                    ))}
                  </div>
                </fieldset>

                {/* Mobility Status */}
                <div className="mb-5 flex flex-col gap-1.5">
                  <Label htmlFor="mobility" className="text-xs font-medium text-flipkart-text-light">
                    Mobility Status <span className="text-[#ff6161]">*</span>
                  </Label>
                  <Select value={mobilityStatus} onValueChange={setMobilityStatus}>
                    <SelectTrigger id="mobility" className="h-11 rounded-sm border-border bg-white text-sm text-flipkart-text">
                      <SelectValue placeholder="Select mobility status" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOBILITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Memory Loss */}
                <div className="mb-5">
                  <p id="memory-label" className="mb-2 text-xs font-medium text-flipkart-text-light">
                    Memory Loss / Confusion <span className="text-[#ff6161]">*</span>
                  </p>
                  <YesNoToggle value={memoryLoss} onChange={setMemoryLoss} id="memory-label" />
                </div>

                {/* Anxiety / Depression */}
                <div className="mb-5">
                  <p id="anxiety-label" className="mb-2 text-xs font-medium text-flipkart-text-light">
                    Anxiety / Depression <span className="text-[#ff6161]">*</span>
                  </p>
                  <YesNoToggle value={anxietyDepression} onChange={setAnxietyDepression} id="anxiety-label" />
                </div>

                {/* Allergies */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="allergies" className="text-xs font-medium text-flipkart-text-light">
                    Allergies
                  </Label>
                  <Textarea
                    id="allergies"
                    placeholder="List any known allergies..."
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="min-h-[70px] rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                    rows={3}
                  />
                </div>
              </section>
            )}

            {/* STEP 3: Medications */}
            {currentStep === 2 && (
              <section className="rounded-sm bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:p-5">
                <h2 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-wider text-flipkart-text-light">
                  Medications
                </h2>

                <div className="flex flex-col gap-3">
                  {medications.map((med, index) => (
                    <div key={index} className="rounded-sm border border-border bg-flipkart-gray/50 p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-flipkart-text-light">
                          Medicine {index + 1}
                        </span>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="flex items-center gap-1 text-xs font-medium text-[#ff6161] transition-colors hover:text-[#ff6161]/80"
                            aria-label={`Remove medication ${index + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="Medicine Name"
                          value={med.name}
                          onChange={(e) => updateMedication(index, "name", e.target.value)}
                          className="h-10 rounded-sm border-border bg-white text-sm focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                        />
                        <Input
                          placeholder="Dose"
                          value={med.dose}
                          onChange={(e) => updateMedication(index, "dose", e.target.value)}
                          className="h-10 rounded-sm border-border bg-white text-sm focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                        />
                        <Select
                          value={med.frequency}
                          onValueChange={(val) => updateMedication(index, "frequency", val)}
                        >
                          <SelectTrigger className="h-10 rounded-sm border-border bg-white text-sm">
                            <SelectValue placeholder="Frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Once daily">Once daily</SelectItem>
                            <SelectItem value="Twice daily">Twice daily</SelectItem>
                            <SelectItem value="Three times daily">Three times daily</SelectItem>
                            <SelectItem value="As needed">As needed</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Time (e.g. 08:00 AM)"
                          value={med.time}
                          onChange={(e) => updateMedication(index, "time", e.target.value)}
                          className="h-10 rounded-sm border-border bg-white text-sm focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addMedication}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-dashed border-flipkart-blue/40 bg-flipkart-blue/5 text-sm font-medium text-flipkart-blue transition-colors hover:bg-flipkart-blue/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Medicine
                </button>
              </section>
            )}
          </form>

          {/* Fixed Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-flipkart-gray px-3 py-3 shadow-lg sm:px-4">
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-white font-medium text-flipkart-text transition-all hover:bg-flipkart-gray disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {currentStep < 2 ? (
                <button
                  onClick={handleNext}
                  className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-flipkart-blue font-medium text-white transition-all hover:bg-flipkart-blue/90 sm:text-sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={(e) => {
                    const form = document.querySelector("form")
                    if (form) {
                      form.dispatchEvent(new Event("submit", { bubbles: true }))
                    }
                  }}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-sm bg-flipkart-orange font-medium text-white transition-all hover:bg-flipkart-orange/90 sm:text-sm"
                >
                  Save Resident
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* DESKTOP SINGLE-PAGE VIEW (visible on md+) */}
      <div className="hidden md:block">
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm text-flipkart-blue transition-colors hover:text-flipkart-blue-dark"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Header */}
          <div className="mb-4 rounded-sm bg-card px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h1 className="text-lg font-medium text-flipkart-text">
              Add New Resident
            </h1>
            <p className="mt-0.5 text-xs text-flipkart-text-light">
              Fill in the details to register a new resident
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 pb-8">
            {/* --- Personal Information --- */}
            <section className="rounded-sm bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <h2 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-wider text-flipkart-text-light">
                Personal Information
              </h2>

              {/* Full Name */}
              <div className="mb-4 flex flex-col gap-1.5">
                <Label htmlFor="name-desktop" className="text-xs font-medium text-flipkart-text-light">
                  Full Name <span className="text-[#ff6161]">*</span>
                </Label>
                <Input
                  id="name-desktop"
                  placeholder="e.g. Kamala Devi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                  required
                />
              </div>

              {/* Age */}
              <div className="mb-4 flex flex-col gap-1.5">
                <Label htmlFor="age-desktop" className="text-xs font-medium text-flipkart-text-light">
                  Age <span className="text-[#ff6161]">*</span>
                </Label>
                <Input
                  id="age-desktop"
                  type="number"
                  min={50}
                  max={120}
                  placeholder="e.g. 76"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-11 rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                  required
                />
              </div>

              {/* Gender - Pill Toggles */}
              <fieldset className="mb-4">
                <legend className="mb-2 text-xs font-medium text-flipkart-text-light">
                  Gender <span className="text-[#ff6161]">*</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <PillToggle
                      key={g}
                      label={g}
                      selected={gender === g}
                      onToggle={() => setGender(g)}
                    />
                  ))}
                </div>
              </fieldset>

              {/* Emergency Contact */}
              <div>
                <p className="mb-2 text-xs font-medium text-flipkart-text-light">Emergency Contact</p>
                <div className="flex gap-3">
                  <Input
                    placeholder="Name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="h-11 flex-1 rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                  />
                  <Input
                    placeholder="Phone"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="h-11 flex-1 rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                    type="tel"
                  />
                </div>
              </div>
            </section>

            {/* --- Health Conditions --- */}
            <section className="rounded-sm bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <h2 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-wider text-flipkart-text-light">
                Health Conditions
              </h2>

              {/* Chronic Illnesses - Multi-select pills */}
              <fieldset className="mb-5">
                <legend className="mb-2 text-xs font-medium text-flipkart-text-light">
                  Chronic Illnesses
                </legend>
                <div className="flex flex-wrap gap-2">
                  {CHRONIC_ILLNESSES.map((illness) => (
                    <PillToggle
                      key={illness}
                      label={illness}
                      selected={chronicIllnesses.includes(illness)}
                      onToggle={() => toggleIllness(illness)}
                    />
                  ))}
                </div>
              </fieldset>

              {/* Mobility Status */}
              <div className="mb-5 flex flex-col gap-1.5">
                <Label htmlFor="mobility-desktop" className="text-xs font-medium text-flipkart-text-light">
                  Mobility Status <span className="text-[#ff6161]">*</span>
                </Label>
                <Select value={mobilityStatus} onValueChange={setMobilityStatus}>
                  <SelectTrigger id="mobility-desktop" className="h-11 rounded-sm border-border bg-white text-sm text-flipkart-text">
                    <SelectValue placeholder="Select mobility status" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOBILITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Memory Loss */}
              <div className="mb-5">
                <p id="memory-label-desktop" className="mb-2 text-xs font-medium text-flipkart-text-light">
                  Memory Loss / Confusion <span className="text-[#ff6161]">*</span>
                </p>
                <YesNoToggle value={memoryLoss} onChange={setMemoryLoss} id="memory-label-desktop" />
              </div>

              {/* Anxiety / Depression */}
              <div className="mb-5">
                <p id="anxiety-label-desktop" className="mb-2 text-xs font-medium text-flipkart-text-light">
                  Anxiety / Depression <span className="text-[#ff6161]">*</span>
                </p>
                <YesNoToggle value={anxietyDepression} onChange={setAnxietyDepression} id="anxiety-label-desktop" />
              </div>

              {/* Allergies */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="allergies-desktop" className="text-xs font-medium text-flipkart-text-light">
                  Allergies
                </Label>
                <Textarea
                  id="allergies-desktop"
                  placeholder="List any known allergies..."
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="min-h-[70px] rounded-sm border-border bg-white text-sm text-flipkart-text focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                  rows={3}
                />
              </div>
            </section>

            {/* --- Medications --- */}
            <section className="rounded-sm bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <h2 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-wider text-flipkart-text-light">
                Medications
              </h2>

              <div className="flex flex-col gap-3">
                {medications.map((med, index) => (
                  <div key={index} className="rounded-sm border border-border bg-flipkart-gray/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-flipkart-text-light">
                        Medicine {index + 1}
                      </span>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="flex items-center gap-1 text-xs font-medium text-[#ff6161] transition-colors hover:text-[#ff6161]/80"
                          aria-label={`Remove medication ${index + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <Input
                        placeholder="Medicine Name"
                        value={med.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        className="h-10 rounded-sm border-border bg-white text-sm focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                      />
                      <div className="flex gap-2.5">
                        <Input
                          placeholder="Dose"
                          value={med.dose}
                          onChange={(e) => updateMedication(index, "dose", e.target.value)}
                          className="h-10 flex-1 rounded-sm border-border bg-white text-sm focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                        />
                        <Select
                          value={med.frequency}
                          onValueChange={(val) => updateMedication(index, "frequency", val)}
                        >
                          <SelectTrigger className="h-10 flex-1 rounded-sm border-border bg-white text-sm">
                            <SelectValue placeholder="Frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Once daily">Once daily</SelectItem>
                            <SelectItem value="Twice daily">Twice daily</SelectItem>
                            <SelectItem value="Three times daily">Three times daily</SelectItem>
                            <SelectItem value="As needed">As needed</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Time (e.g. 08:00 AM)"
                        value={med.time}
                        onChange={(e) => updateMedication(index, "time", e.target.value)}
                        className="h-10 rounded-sm border-border bg-white text-sm focus:border-flipkart-blue focus-visible:ring-flipkart-blue/20"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMedication}
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-dashed border-flipkart-blue/40 bg-flipkart-blue/5 text-sm font-medium text-flipkart-blue transition-colors hover:bg-flipkart-blue/10"
              >
                <Plus className="h-4 w-4" />
                Add Medicine
              </button>
            </section>

            {/* Submit */}
            <Button
              type="submit"
              className="h-12 w-full rounded-sm bg-flipkart-orange text-base font-semibold text-white shadow-sm hover:bg-flipkart-orange/90"
            >
              Save Resident
            </Button>
          </form>
        </main>
      </div>
    </div>
  )
}
