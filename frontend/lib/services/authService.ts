import apiClient from './api'

export interface SignUpData {
  name: string
  email: string
  phone: string
  password: string
}

export interface AuthResponse {
  id: string
  email: string
  name: string
  phone: string
  role: string
  token: string
}

export const authService = {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/signup', data)
    const { token } = response.data
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
    return response.data
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/signin', {
      email,
      password,
    })
    const { token } = response.data
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
    return response.data
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
  },

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken')
    }
    return null
  },

  isAuthenticated() {
    return !!this.getToken()
  },
}
