"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { jsPDF } from "jspdf"
import {
  ArrowLeft,
  Download,
  Camera,
  Trash2,
  Pill,
  Phone,
  Footprints,
  Brain,
  Activity,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useResidents } from "@/lib/residents-context"
import { toast } from "sonner"
import type { Resident } from "@/lib/residents-context"

interface ResidentProfileProps {
  residentId: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getConditionStyle(condition: string) {
  switch (condition) {
    case "Diabetes":
      return "bg-red-50 text-red-600 border border-red-100"
    case "BP":
      return "bg-orange-50 text-orange-600 border border-orange-100"
    case "Heart Disease":
      return "bg-rose-50 text-rose-600 border border-rose-100"
    case "Asthma":
      return "bg-sky-50 text-sky-600 border border-sky-100"
    default:
      return "bg-gray-50 text-gray-600 border border-gray-100"
  }
}

export function ResidentProfile({ residentId }: ResidentProfileProps) {
  const router = useRouter()
  const { getResident, deleteResident } = useResidents()
  const [resident, setResident] = useState<Resident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    // Don't fetch if resident is being deleted
    if (isDeleting) return

    let isMounted = true

    const fetchResident = async () => {
      try {
        setIsLoading(true)
        const data = await getResident(residentId)

        // Only update state if component is still mounted
        if (isMounted) {
          console.log("📋 Resident data fetched:", data)
          console.log("💊 Medications:", data?.medications)
          console.log("📊 Medications count:", data?.medications?.length || 0)
          setResident(data)
        }
      } catch (error: any) {
        // Only show error if component is still mounted
        if (!isMounted) {
          console.log("⚠️ Component unmounted, error suppressed")
          return
        }

        // If resident not found (404), redirect to dashboard
        if (error.response?.status === 404) {
          console.log("🔙 Resident not found, redirecting to dashboard")
          toast.error("Resident not found. It may have been deleted.")
          setTimeout(() => {
            router.push("/dashboard")
          }, 500)
        } else {
          console.error("❌ Failed to fetch resident:", error.message)
          toast.error("Failed to load resident details")
        }
      } finally {
        // Always set loading to false when mounted or unmounting
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (residentId) {
      fetchResident()
    }

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [residentId, getResident, router, isDeleting])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-flipkart-gray">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-flipkart-blue" />
          <p className="mt-4 text-sm text-flipkart-text-light">Loading resident details...</p>
        </div>
      </div>
    )
  }

  if (!resident) {
    return (
      <div className="flex min-h-screen flex-col bg-flipkart-gray">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <AlertTriangle className="h-7 w-7 text-flipkart-text-light" />
          </div>
          <h2 className="text-lg font-medium text-flipkart-text">
            Resident Not Found
          </h2>
          <p className="mt-2 text-sm text-flipkart-text-light">
            The resident you are looking for does not exist.
          </p>
          <Button
            className="mt-6 rounded-sm bg-flipkart-blue text-white hover:bg-flipkart-blue-dark"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const handleDownloadReport = () => {
    const doc = new jsPDF()
    let yPosition = 20
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margins = 20
    const maxWidth = pageWidth - 2 * margins

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, fontSize: number = 11, fontStyle: "normal" | "bold" = "normal") => {
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", fontStyle)
      const lines = doc.splitTextToSize(text, maxWidth)
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margins) {
          doc.addPage()
          yPosition = margins
        }
        doc.text(line, margins, yPosition)
        yPosition += fontSize * 0.5
      })
    }

    // Title
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("SEVACARE - RESIDENT HEALTH REPORT", margins, yPosition)
    yPosition += 10

    // Generated date
    addWrappedText(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 10)
    yPosition += 2

    // Divider line
    doc.setDrawColor(100)
    doc.line(margins, yPosition, pageWidth - margins, yPosition)
    yPosition += 8

    // Personal Information Section
    addWrappedText("PERSONAL INFORMATION", 12, "bold")
    yPosition += 3
    addWrappedText(`Name: ${resident.name}`)
    addWrappedText(`Age: ${resident.age} years`)
    addWrappedText(`Gender: ${resident.gender}`)
    addWrappedText(`Emergency Contact: ${resident.emergencyContactName || "N/A"} (${resident.emergencyContactPhone || "N/A"})`)
    addWrappedText(`Date Registered: ${resident.createdAt}`)
    yPosition += 3

    // Health Conditions Section
    addWrappedText("HEALTH CONDITIONS", 12, "bold")
    yPosition += 3
    addWrappedText(`Chronic Illnesses: ${resident.chronicIllnesses.length > 0 ? resident.chronicIllnesses.join(", ") : "None"}`)
    addWrappedText(`Mobility Status: ${resident.mobilityStatus}`)
    addWrappedText(`Memory Loss / Confusion: ${resident.memoryLoss ? "Yes" : "No"}`)
    addWrappedText(`Anxiety / Depression: ${resident.anxietyDepression ? "Yes" : "No"}`)
    addWrappedText(`Allergies: ${resident.allergies || "None reported"}`)
    yPosition += 3

    // Medications Section
    addWrappedText("MEDICATIONS", 12, "bold")
    yPosition += 3

    if (resident.medications.length > 0) {
      resident.medications.forEach((med, i) => {
        addWrappedText(`${i + 1}. ${med.name}`, 11)
        addWrappedText(`   Dose: ${med.dose}`, 10)
        addWrappedText(`   Frequency: ${med.frequency}`, 10)
        addWrappedText(`   Time: ${med.time}`, 10)
        yPosition += 1
      })
    } else {
      addWrappedText("No medications recorded.")
    }

    // Save PDF
    doc.save(`${resident.name.replace(/\s+/g, "_")}_Health_Report.pdf`)
    toast.success("Health report downloaded as PDF")
  }

  const handleScanMedicine = () => {
    router.push(`/dashboard/scan?residentId=${residentId}`)
  }

  const handleDelete = async () => {
    if (!resident) return

    setIsDeleting(true)
    try {
      console.log("🗑️ Deleting resident:", resident.id)
      await deleteResident(resident.id)
      console.log("✅ Resident deleted successfully")
      toast.success(`${resident.name} deleted successfully`)
      setShowDeleteConfirm(false)

      // Navigate immediately to avoid 404 error
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error) {
      console.error("❌ Failed to delete resident:", error)
      // Error is already handled and shown as toast in the context
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-flipkart-gray">
      <Navbar />

      <main className="mx-auto w-full max-w-full flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:max-w-2xl">
        {/* Back button - Responsive */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-3 flex items-center gap-2 text-xs text-flipkart-blue transition-colors hover:text-flipkart-blue-dark sm:mb-4 sm:text-sm"
          aria-label="Go back to residents"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Back to Residents
        </button>

        {/* Profile Header Card - Responsive */}
        <div className="mb-3 rounded-sm bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:mb-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-flipkart-blue/10 text-base font-bold text-flipkart-blue sm:h-16 sm:w-16 sm:text-lg">
              {getInitials(resident.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-medium text-flipkart-text sm:text-xl">
                {resident.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-flipkart-text-light sm:text-sm">
                  {resident.age} years
                </span>
                <span className="text-flipkart-text-light/40">|</span>
                <Badge variant="secondary" className="rounded-sm bg-flipkart-gray text-xs font-medium text-flipkart-text">
                  {resident.gender}
                </Badge>
              </div>
              {resident.chronicIllnesses.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {resident.chronicIllnesses.map((illness) => (
                    <span
                      key={illness}
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium sm:text-[11px] ${getConditionStyle(illness)}`}
                    >
                      {illness}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Health Info Card - Responsive Grid */}
        <section className="mb-3 rounded-sm bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:mb-4 sm:p-5">
          <h2 className="mb-3 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-flipkart-text-light sm:mb-4 sm:pb-3 sm:text-sm">
            Health Information
          </h2>

          {/* Info Grid - 1 col mobile, 2 col tablet, adjust for desktop */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-1">
            {/* Mobility */}
            <div className="flex items-center gap-3 rounded-sm bg-flipkart-gray/60 p-2.5 sm:p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white shadow-sm sm:h-9 sm:w-9">
                <Footprints className="h-3.5 w-3.5 text-flipkart-blue sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-flipkart-text-light sm:text-[11px]">Mobility</p>
                <p className="truncate text-xs font-medium text-flipkart-text sm:text-sm">{resident.mobilityStatus}</p>
              </div>
            </div>

            {/* Memory Loss */}
            <div className="flex items-center gap-3 rounded-sm bg-flipkart-gray/60 p-2.5 sm:p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white shadow-sm sm:h-9 sm:w-9">
                <Brain className="h-3.5 w-3.5 text-flipkart-blue sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-flipkart-text-light sm:text-[11px]">Memory Loss</p>
                <p className={`text-xs font-medium sm:text-sm ${resident.memoryLoss ? "text-[#ff6161]" : "text-flipkart-green"}`}>
                  {resident.memoryLoss ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Anxiety */}
            <div className="flex items-center gap-3 rounded-sm bg-flipkart-gray/60 p-2.5 sm:p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white shadow-sm sm:h-9 sm:w-9">
                <Activity className="h-3.5 w-3.5 text-flipkart-blue sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-flipkart-text-light sm:text-[11px]">Anxiety</p>
                <p className={`text-xs font-medium sm:text-sm ${resident.anxietyDepression ? "text-[#ff6161]" : "text-flipkart-green"}`}>
                  {resident.anxietyDepression ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Allergies */}
            {resident.allergies && (
              <div className="flex items-center gap-3 rounded-sm bg-flipkart-gray/60 p-2.5 sm:p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white shadow-sm sm:h-9 sm:w-9">
                  <AlertTriangle className="h-3.5 w-3.5 text-flipkart-orange sm:h-4 sm:w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-flipkart-text-light sm:text-[11px]">Allergies</p>
                  <p className="truncate text-xs font-medium text-flipkart-text sm:text-sm">{resident.allergies}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Medications Card - Responsive */}
        <section className="mb-3 rounded-sm bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:mb-4 sm:p-5">
          <h2 className="mb-3 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-flipkart-text-light sm:mb-4 sm:pb-3 sm:text-sm">
            Medications ({resident.medications?.length || 0})
          </h2>

          {resident.medications && resident.medications.length > 0 ? (
            <div className="flex flex-col gap-2 sm:gap-2.5">
              {resident.medications.map((med, index) => (
                <div key={med.id || index} className="flex items-start gap-2 rounded-sm bg-flipkart-gray/60 p-2.5 sm:gap-3 sm:p-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white shadow-sm sm:h-9 sm:w-9">
                    <Pill className="h-3.5 w-3.5 text-flipkart-blue sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-flipkart-text sm:text-sm">{med.name}</p>
                    <p className="truncate text-[11px] text-flipkart-text-light sm:text-xs">
                      {med.dose} &middot; {med.frequency} &middot; {med.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 sm:py-6 text-center">
              <Pill className="mb-2 h-6 w-6 text-flipkart-text-light/40 sm:h-7 sm:w-7" />
              <p className="text-xs text-flipkart-text-light sm:text-sm">No medications recorded</p>
            </div>
          )}
        </section>

        {/* Emergency Contact Card - Responsive */}
        <section className="mb-4 rounded-sm bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:mb-5 sm:p-5">
          <h2 className="mb-3 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-flipkart-text-light sm:mb-4 sm:pb-3 sm:text-sm">
            Emergency Contact
          </h2>
          <div className="flex flex-col gap-3 rounded-sm bg-flipkart-gray/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-flipkart-text sm:text-sm">
                {resident.emergencyContactName || "Not provided"}
              </p>
              <p className="text-[11px] text-flipkart-text-light sm:text-xs">
                {resident.emergencyContactPhone || "No phone number"}
              </p>
            </div>
            {resident.emergencyContactPhone && (
              <a
                href={`tel:${resident.emergencyContactPhone}`}
                className="flex h-9 w-9 items-center justify-center rounded-sm bg-flipkart-green/10 text-flipkart-green transition-colors hover:bg-flipkart-green/20 min-h-[2.75rem] min-w-[2.75rem] sm:h-10 sm:w-10"
                aria-label={`Call ${resident.emergencyContactName}`}
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        </section>

        {/* Action Buttons - Responsive */}
        <div className="flex flex-col gap-2 pb-6 sm:gap-2.5 sm:pb-8">
          <Button
            onClick={handleDownloadReport}
            className="h-10 min-h-[2.75rem] w-full rounded-sm bg-flipkart-orange text-xs font-semibold text-white shadow-sm hover:bg-flipkart-orange/90 sm:h-12 sm:text-sm"
          >
            <Download className="h-3.5 w-3.5 mr-2 sm:h-4.5 sm:w-4.5" />
            Download Health Report
          </Button>
          <Button
            onClick={handleScanMedicine}
            className="h-10 min-h-[2.75rem] w-full rounded-sm bg-flipkart-blue text-xs font-semibold text-white shadow-sm hover:bg-flipkart-blue-dark sm:h-12 sm:text-sm"
          >
            <Camera className="h-3.5 w-3.5 mr-2 sm:h-4.5 sm:w-4.5" />
            Scan Medicine Strip
          </Button>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            className="h-10 min-h-[2.75rem] w-full rounded-sm border-[#ff6161]/30 text-xs font-semibold text-[#ff6161] hover:bg-[#ff6161]/5 hover:text-[#ff6161] sm:h-12 sm:text-sm"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2 sm:h-4.5 sm:w-4.5" />
            Delete Resident
          </Button>
        </div>
      </main>

      {/* Delete Confirmation Modal - Responsive */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-sm bg-card p-4 shadow-lg sm:p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 sm:mb-4 sm:h-12 sm:w-12">
              <Trash2 className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
            </div>
            <h2 className="mb-2 text-base font-semibold text-flipkart-text sm:text-lg">
              Delete {resident?.name}?
            </h2>
            <p className="mb-4 text-xs text-flipkart-text-light sm:mb-6 sm:text-sm">
              This will permanently delete {resident?.name} and all their associated data. This action cannot be undone.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                variant="outline"
                className="flex-1 h-10 min-h-[2.75rem] text-xs sm:h-11 sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-10 min-h-[2.75rem] bg-red-600 hover:bg-red-700 text-xs sm:h-11 sm:text-sm"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
