export interface MedicationInterface {
  id: string
  name: string
  dose: string
  frequency: string
  time: string
  residentId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMedicationInterface {
  name: string
  dose: string
  frequency: string
  time: string
}

export interface UpdateMedicationInterface {
  name?: string
  dose?: string
  frequency?: string
  time?: string
}

export interface MedicationResponseInterface {
  id: string
  name: string
  dose: string
  frequency: string
  time: string
  createdAt: Date
  updatedAt: Date
}
