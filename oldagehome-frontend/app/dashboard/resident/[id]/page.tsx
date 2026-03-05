"use client"

import { use } from "react"
import { ResidentProfile } from "@/components/resident-profile"

export default function ResidentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <ResidentProfile residentId={id} />
}
