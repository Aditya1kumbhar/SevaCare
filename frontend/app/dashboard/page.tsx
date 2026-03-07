"use client"

import { useRouter } from "next/navigation"
import { Plus, Users, Pill } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { ResidentCard } from "@/components/resident-card"
import { useResidents } from "@/lib/residents-context"
import { useSearch } from "@/lib/search-context"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const { residents } = useResidents()
  const { searchQuery } = useSearch()

  const filtered = residents.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen flex-col bg-flipkart-gray">
      <Navbar />

      <main className="mx-auto w-full max-w-full flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:max-w-5xl">
        {/* Top bar info - Responsive */}
        <div className="mb-3 flex flex-col gap-2 rounded-sm bg-card px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
          <div>
            <h1 className="text-sm font-medium text-flipkart-text sm:text-base">
              {"Namaste, Caretaker"}
            </h1>
            <p className="text-xs text-flipkart-text-light">
              {getGreeting()} &middot; {getFormattedDate()}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-sm bg-flipkart-blue/5 px-3 py-1.5">
            <Users className="h-4 w-4 text-flipkart-blue" />
            <span className="text-xs font-medium text-flipkart-blue sm:text-sm">
              {residents.length} Residents
            </span>
          </div>
        </div>

        {/* Section header - Responsive */}
        <div className="mb-2 flex items-center justify-between sm:mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-flipkart-text-light">
            All Residents ({filtered.length})
          </h2>
        </div>

        {/* Resident List - Responsive Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 pb-24 sm:gap-2.5 md:grid-cols-2 lg:grid-cols-3 lg:pb-28">
            {filtered.map((resident) => (
              <ResidentCard key={resident.id} resident={resident} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-sm bg-card py-16 sm:py-20 text-center shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-flipkart-gray sm:h-16 sm:w-16">
              <Users className="h-6 w-6 text-flipkart-text-light sm:h-7 sm:w-7" />
            </div>
            <h3 className="text-sm font-medium text-flipkart-text sm:text-base">
              {searchQuery ? "No residents found" : "No residents yet"}
            </h3>
            <p className="mt-1 text-xs text-flipkart-text-light sm:text-sm">
              {searchQuery
                ? "Try adjusting your search"
                : "Tap + to add your first resident"}
            </p>
          </div>
        )}
      </main>

      {/* Floating Action Buttons - Mobile optimized positioning */}
      <div className="fixed bottom-4 right-3 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-5 sm:gap-3 safe-area-inset-bottom">
        {/* Scan Medicine Button */}
        <button
          onClick={() => router.push("/dashboard/scan")}
          className="flex h-10 w-10 items-center justify-center rounded-sm bg-flipkart-green text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-flipkart-green focus:ring-offset-2 sm:h-11 sm:w-11 min-h-[2.75rem] min-w-[2.75rem]"
          aria-label="Scan medicine"
        >
          <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Add Resident Button */}
        <button
          onClick={() => router.push("/dashboard/add-resident")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-flipkart-blue text-white shadow-lg transition-all hover:scale-105 hover:bg-flipkart-blue-dark hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-flipkart-blue focus:ring-offset-2 sm:h-14 sm:w-14 min-h-[2.75rem] min-w-[2.75rem]"
          aria-label="Add new resident"
        >
          <Plus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
