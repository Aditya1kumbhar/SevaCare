import apiClient from './api'
import { Medication } from '@/lib/residents-context'

export interface CreateMedicationData {
  name: string
  dose: string
  frequency: string
  time: string
}

export const medicationsService = {
  async getByResident(residentId: string): Promise<Medication[]> {
    const response = await apiClient.get(`/residents/${residentId}/medications`)
    return response.data
  },

  async create(residentId: string, medication: CreateMedicationData): Promise<Medication> {
    const response = await apiClient.post(`/residents/${residentId}/medications`, medication)
    return response.data
  },

  async update(
    residentId: string,
    medicationId: string,
    medication: Partial<CreateMedicationData>
  ): Promise<Medication> {
    const response = await apiClient.patch(
      `/residents/${residentId}/medications/${medicationId}`,
      medication
    )
    return response.data
  },

  async delete(residentId: string, medicationId: string): Promise<void> {
    await apiClient.delete(`/residents/${residentId}/medications/${medicationId}`)
  },
}
