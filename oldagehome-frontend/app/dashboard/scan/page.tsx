"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { medicationsService } from "@/lib/services/medicationsService"
import { useResidents } from "@/lib/residents-context"

interface ScanResult {
  nameEn: string
  nameMarathi: string
  usageEn: string
  usageMarathi: string
}

const mockScanResults: ScanResult[] = [
  {
    nameEn: "Metformin 500mg",
    nameMarathi: "मेटफॉर्मिन ५०० मिग्रॅ",
    usageEn: "Take 1 tablet twice daily after meals for blood sugar control.",
    usageMarathi: "रक्तातील साखर नियंत्रणासाठी जेवणानंतर दिवसातून दोनदा १ गोळी घ्या.",
  },
  {
    nameEn: "Amlodipine 5mg",
    nameMarathi: "अम्लोडिपिन ५ मिग्रॅ",
    usageEn: "Take 1 tablet once daily in the morning for blood pressure.",
    usageMarathi: "रक्तदाबासाठी सकाळी दिवसातून एकदा १ गोळी घ्या.",
  },
  {
    nameEn: "Aspirin 75mg",
    nameMarathi: "अ\u200dॅस्पिरिन ७५ मिग्रॅ",
    usageEn: "Take 1 tablet once daily after breakfast to prevent blood clots.",
    usageMarathi: "रक्ताच्या गुठळ्या रोखण्यासाठी न्याहारीनंतर दिवसातून एकदा १ गोळी घ्या.",
  },
]

function CameraViewfinder({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-xs rounded-sm bg-[#1a1a2e] overflow-hidden shadow-lg">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-7 h-7 border-flipkart-blue border-t-4 border-l-4 rounded-tl-sm" />
      <div className="absolute top-0 right-0 w-7 h-7 border-flipkart-blue border-t-4 border-r-4 rounded-tr-sm" />
      <div className="absolute bottom-0 left-0 w-7 h-7 border-flipkart-blue border-b-4 border-l-4 rounded-bl-sm" />
      <div className="absolute bottom-0 right-0 w-7 h-7 border-flipkart-blue border-b-4 border-r-4 rounded-br-sm" />

      {/* Scan line animation */}
      <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-flipkart-blue/50 animate-pulse rounded-full z-10" />

      {/* Video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

      {/* Loading/no stream message */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-flipkart-blue border-t-transparent mx-auto mb-2" />
          <p className="text-white text-sm">Loading camera...</p>
        </div>
      </div>
    </div>
  )
}

export default function ScanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [langToggle, setLangToggle] = useState<"marathi" | "hindi">("marathi")
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [streamActive, setStreamActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const residentId = searchParams.get("residentId")

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      setCameraPermission(true)
      setPermissionDenied(false)

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreamActive(true)
      }

      toast.success("Camera access granted!")
    } catch (error: any) {
      if (error.name === "NotAllowedError" || error.message?.includes("Permission denied")) {
        setPermissionDenied(true)
        toast.error("Camera permission was denied. Please enable it in your browser settings.")
      } else {
        toast.error("Unable to access camera. Please try again.")
      }
      setCameraPermission(false)
    }
  }

  useEffect(() => {
    return () => {
      // Clean up: stop all video tracks when component unmounts
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  const stopCameraStream = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setStreamActive(false)
  }

  const handleBackNavigation = () => {
    stopCameraStream()
    router.back()
  }

  const handleCapture = async () => {
    if (!cameraPermission) {
      await requestCameraPermission()
      return
    }

    if (!streamActive) {
      toast.error("Camera stream is not ready. Please wait a moment.")
      return
    }

    setIsScanning(true)
    setScanResult(null)

    // Capture frame from video
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        // In a real app, you would send canvas.toDataURL() to a backend for processing
        console.log("Captured frame from camera")
      }
    }

    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const randomResult = mockScanResults[Math.floor(Math.random() * mockScanResults.length)]
    setScanResult(randomResult)
    setIsScanning(false)
    toast.success("Medicine detected!")
  }

  const handleAddToProfile = async () => {
    if (!scanResult || !residentId) {
      toast.error("Unable to save medicine. Please try again.")
      console.error("❌ Save failed - Missing data:", { scanResult, residentId })
      return
    }

    setIsSaving(true)
    try {
      const medicationData = {
        name: scanResult.nameEn,
        dose: "As per prescription",
        frequency: "Twice daily",
        time: "Morning and Evening"
      }

      console.log("💊 Saving medication:", medicationData, "to resident:", residentId)
      const response = await medicationsService.create(residentId, medicationData)
      console.log("✅ Medication saved successfully:", response)
      toast.success(`${scanResult.nameEn} added to resident profile`)
      setScanResult(null)

      // Navigate back after a brief delay to show the toast
      setTimeout(() => {
        console.log("🔙 Navigating back to resident profile")
        handleBackNavigation()
      }, 1000)
    } catch (error: any) {
      console.error("❌ Error adding medicine:", error)
      console.error("Response:", error.response?.data)
      toast.error("Failed to add medicine. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1a1a2e]">
      {/* Top bar - Flipkart blue style */}
      <header className="flex items-center justify-between bg-flipkart-blue px-4 py-3 shadow-md">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Scan Medicine Strip</span>
        </button>

        <button
          onClick={() => setLangToggle((prev) => (prev === "marathi" ? "hindi" : "marathi"))}
          className="rounded-sm bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25"
        >
          {langToggle === "marathi" ? "मराठी" : "हिंदी"} / Eng
        </button>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center px-4 pb-8">
        {/* Viewfinder */}
        <div className="mt-8 w-full max-w-sm">
          <CameraViewfinder videoRef={videoRef} />
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-white">
            Point camera at medicine strip
          </p>
          <p className="mt-1 text-xs text-white/50">
            {"औषधाच्या पट्टीवर कॅमेरा धरा"}
          </p>
        </div>

        {/* Camera Permission Status */}
        {permissionDenied && (
          <div className="mt-6 w-full max-w-sm rounded-sm bg-red-500/10 border border-red-500/30 p-4">
            <p className="text-sm text-red-400">
              Camera access is required to scan medicine strips. Please enable camera permissions in your browser settings.
            </p>
          </div>
        )}

        {cameraPermission === true && (
          <div className="mt-6 w-full max-w-sm rounded-sm bg-flipkart-green/10 border border-flipkart-green/30 p-4">
            <p className="text-sm text-flipkart-green">
              ✓ Camera access granted. You can start scanning.
            </p>
          </div>
        )}

        {/* Capture Button */}
        <div className="mt-8">
          <button
            onClick={handleCapture}
            disabled={isScanning || permissionDenied}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/20 bg-flipkart-blue shadow-lg transition-all hover:scale-105 hover:bg-flipkart-blue-dark disabled:opacity-60"
            aria-label={cameraPermission === null ? "Request camera permission" : "Capture medicine strip"}
            title={
              cameraPermission === null
                ? "Click to enable camera access"
                : permissionDenied
                  ? "Camera access denied"
                  : streamActive
                    ? "Take medicine scan"
                    : "Camera loading..."
            }
          >
            {isScanning ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/20" />
            )}
          </button>
          {cameraPermission === null && (
            <p className="mt-4 text-center text-sm text-white">
              Click the button to enable camera access
            </p>
          )}
          {cameraPermission === true && !streamActive && (
            <p className="mt-4 text-center text-sm text-white">
              Camera is loading... Please wait
            </p>
          )}
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="mt-8 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-sm bg-card p-5 shadow-lg">
              {/* Medicine name */}
              <h3 className="text-base font-medium text-flipkart-text">
                {scanResult.nameEn}
              </h3>
              <p className="mt-0.5 text-sm text-flipkart-text-light">
                {scanResult.nameMarathi}
              </p>

              {/* Divider */}
              <div className="my-3 h-px bg-border" />

              {/* Usage in English */}
              <p className="text-sm leading-relaxed text-flipkart-text">
                {scanResult.usageEn}
              </p>

              {/* Usage in Marathi - highlighted */}
              <div className="mt-3 rounded-sm bg-flipkart-green/10 p-3">
                <p className="text-sm leading-relaxed text-flipkart-green">
                  {scanResult.usageMarathi}
                </p>
              </div>

              {/* Add to Profile Button */}
              <Button
                onClick={handleAddToProfile}
                disabled={isSaving || !residentId}
                className="mt-4 h-11 w-full rounded-sm bg-flipkart-orange text-sm font-semibold text-white shadow-sm hover:bg-flipkart-orange/90 disabled:opacity-60"
              >
                {isSaving ? "Adding..." : "Add to Resident's Profile"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
