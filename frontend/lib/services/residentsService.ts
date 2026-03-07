import apiClient from './api'
import { CreateResidentDto, UpdateResidentDto, ResidentResponseDto } from 'sevacare-shared'
import { Resident } from '@/lib/residents-context'

export interface CreateResidentData {
  name: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  chronicIllnesses: string[]
  mobilityStatus: string
  memoryLoss: boolean
  anxietyDepression: boolean
  allergies: string
  emergencyContactName: string
  emergencyContactPhone: string
}

export const residentsService = {
  async getAll(): Promise<Resident[]> {
    const response = await apiClient.get('/residents')
    return response.data
  },

  async getOne(id: string): Promise<Resident> {
    try {
      const response = await apiClient.get(`/residents/${id}`)
      return response.data
    } catch (error: any) {
      // Re-throw the error so the component can handle it
      // but log it more gracefully
      if (error.response?.status === 404) {
        console.warn(`⚠️ Resident ${id} not found (404)`)
      } else {
        console.error("❌ Error fetching resident:", error.message)
      }
      throw error
    }
  },

  async create(resident: CreateResidentData): Promise<Resident> {
    const response = await apiClient.post('/residents', resident)
    return response.data
  },

  async update(id: string, resident: Partial<CreateResidentData>): Promise<Resident> {
    const response = await apiClient.patch(`/residents/${id}`, resident)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/residents/${id}`)
  },

  async search(query: string): Promise<Resident[]> {
    const response = await apiClient.get('/residents/search', {
      params: { q: query },
    })
    return response.data
  },
}
