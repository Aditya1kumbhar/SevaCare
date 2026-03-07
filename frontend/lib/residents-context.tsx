"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { residentsService, CreateResidentData } from "@/lib/services/residentsService"
import { toast } from "sonner"

export interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  time: string
  createdAt: string
  updatedAt: string
}

export interface Resident {
  id: string
  name: string
  age: number
  gender: "Male" | "Female" | "Other"
  chronicIllnesses: string[]
  mobilityStatus: string
  memoryLoss: boolean
  anxietyDepression: boolean
  allergies: string
  emergencyContactName: string
  emergencyContactPhone: string
  medications: Medication[]
  createdAt: string
}

interface ResidentsContextType {
  residents: Resident[]
  setResidents: (residents: Resident[]) => void
  addResident: (resident: CreateResidentData) => Promise<Resident>
  getResident: (id: string) => Promise<Resident>
  deleteResident: (id: string) => Promise<void>
  updateResident: (id: string, resident: Partial<CreateResidentData>) => Promise<Resident>
  isLoading: boolean
}

const ResidentsContext = createContext<ResidentsContextType | undefined>(undefined)

export function ResidentsProvider({ children }: { children: ReactNode }) {
  const [residents, setResidents] = useState<Resident[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch residents on mount
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setIsLoading(true)
        const data = await residentsService.getAll()
        setResidents(data)
      } catch (error: any) {
        console.error("Failed to fetch residents:", error)
        // Don't show toast on mount to avoid spam
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if authenticated
    if (typeof window !== 'undefined' && localStorage.getItem('authToken')) {
      fetchResidents()
    }
  }, [])

  const addResident = async (resident: CreateResidentData): Promise<Resident> => {
    try {
      const newResident = await residentsService.create(resident)
      setResidents((prev) => [...prev, newResident])
      toast.success("Resident added successfully!")
      return newResident
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to add resident"
      toast.error(message)
      throw error
    }
  }

  const getResident = async (id: string): Promise<Resident> => {
    try {
      const resident = await residentsService.getOne(id)
      return resident
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch resident"
      toast.error(message)
      throw error
    }
  }

  const updateResident = async (id: string, resident: Partial<CreateResidentData>): Promise<Resident> => {
    try {
      const updated = await residentsService.update(id, resident)
      setResidents((prev) => prev.map((r) => (r.id === id ? updated : r)))
      toast.success("Resident updated successfully!")
      return updated
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update resident"
      toast.error(message)
      throw error
    }
  }

  const deleteResident = async (id: string): Promise<void> => {
    try {
      await residentsService.delete(id)
      setResidents((prev) => prev.filter((r) => r.id !== id))
      toast.success("Resident deleted successfully!")
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete resident"
      toast.error(message)
      throw error
    }
  }

  return (
    <ResidentsContext.Provider
      value={{
        residents,
        setResidents,
        addResident,
        getResident,
        deleteResident,
        updateResident,
        isLoading,
      }}
    >
      {children}
    </ResidentsContext.Provider>
  )
}

export function useResidents() {
  const context = useContext(ResidentsContext)
  if (!context) {
    throw new Error("useResidents must be used within a ResidentsProvider")
  }
  return context
}
