import { MedicationResponseInterface } from './medication.types'

export interface ResidentInterface {
  id: string
  name: string
  age: number
  gender: string
  chronicIllnesses: string[]
  mobilityStatus: string
  memoryLoss: boolean
  anxietyDepression: boolean
  allergies: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  medications?: MedicationResponseInterface[]
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface CreateResidentInterface {
  name: string
  age: number
  gender: string
  chronicIllnesses: string[]
  mobilityStatus: string
  memoryLoss: boolean
  anxietyDepression: boolean
  allergies?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export interface UpdateResidentInterface {
  name?: string
  age?: number
  gender?: string
  chronicIllnesses?: string[]
  mobilityStatus?: string
  memoryLoss?: boolean
  anxietyDepression?: boolean
  allergies?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}
