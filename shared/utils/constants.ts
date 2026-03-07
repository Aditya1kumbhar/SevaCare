export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    SIGNIN: '/auth/signin'
  },
  RESIDENTS: '/residents',
  MEDICATIONS: '/medications',
  HEALTH_RECORDS: '/health-records',
  ACTIVITY_LOGS: '/activity-logs'
}

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  CARETAKER: 'CARETAKER',
  SUPERVISOR: 'SUPERVISOR'
} as const

export const MOBILITY_STATUS = {
  USES_WALKER: 'Uses Walker',
  WHEELCHAIR: 'Wheelchair',
  INDEPENDENT: 'Independent',
  BEDRIDDEN: 'Bedridden'
} as const

export const MEDICATION_FREQUENCY = {
  ONCE_DAILY: 'Once daily',
  TWICE_DAILY: 'Twice daily',
  THREE_TIMES_DAILY: 'Three times daily',
  AS_NEEDED: 'As needed'
} as const
