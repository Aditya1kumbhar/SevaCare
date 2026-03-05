"use client"

import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import type { Resident } from "@/lib/residents-context"

interface ResidentCardProps {
  resident: Resident
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  "bg-flipkart-blue/10 text-flipkart-blue",
  "bg-flipkart-orange/10 text-flipkart-orange",
  "bg-flipkart-green/10 text-flipkart-green",
  "bg-[#ff6161]/10 text-[#ff6161]",
  "bg-[#9c27b0]/10 text-[#9c27b0]",
]

function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length]
}

function getConditionBadge(condition: string) {
  switch (condition) {
    case "Diabetes":
      return { bg: "bg-red-50 text-red-600 border border-red-100", label: "Diabetes" }
    case "BP":
      return { bg: "bg-orange-50 text-orange-600 border border-orange-100", label: "BP" }
    case "Heart Disease":
      return { bg: "bg-rose-50 text-rose-600 border border-rose-100", label: "Heart" }
    case "Asthma":
      return { bg: "bg-sky-50 text-sky-600 border border-sky-100", label: "Asthma" }
    default:
      return { bg: "bg-gray-50 text-gray-600 border border-gray-100", label: condition }
  }
}

export function ResidentCard({ resident }: ResidentCardProps) {
  const router = useRouter()

  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-sm bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all hover:shadow-md active:bg-flipkart-gray/50"
      onClick={() => router.push(`/dashboard/resident/${resident.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`View profile for ${resident.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push(`/dashboard/resident/${resident.id}`)
        }
      }}
    >
      {/* Avatar */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getAvatarColor(resident.name)}`}
      >
        {getInitials(resident.name)}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-sm font-medium text-flipkart-text">
          {resident.name}
        </h3>
        <p className="text-xs text-flipkart-text-light">
          {resident.age} yrs &middot; {resident.gender}
        </p>
        {/* Condition Badges */}
        {resident.chronicIllnesses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {resident.chronicIllnesses.map((illness) => {
              const badge = getConditionBadge(illness)
              return (
                <span
                  key={illness}
                  className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${badge.bg}`}
                >
                  {badge.label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 shrink-0 text-flipkart-text-light/50 transition-transform group-hover:translate-x-0.5 group-hover:text-flipkart-blue" />
    </div>
  )
}
