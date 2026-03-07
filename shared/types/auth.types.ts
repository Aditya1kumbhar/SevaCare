export interface SignUpDtoInterface {
  name: string
  email: string
  phone: string
  password: string
}

export interface SignInDtoInterface {
  email: string
  password: string
}

export interface AuthResponseInterface {
  id: string
  email: string
  name: string
  phone: string
  role: string
  token: string
}

export type UserRole = 'ADMIN' | 'CARETAKER' | 'SUPERVISOR'
