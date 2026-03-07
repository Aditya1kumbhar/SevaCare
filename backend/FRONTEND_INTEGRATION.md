# SevaCare Frontend-Backend Integration Guide

Complete guide to integrate the React frontend with the NestJS backend API.

## 🔗 Quick Links
- **Backend Base URL**: `http://localhost:3001/api/v1`
- **Backend Repo**: `../oldagehome-backend`
- **Frontend Repo**: Current directory

## 📡 API Service Setup

### 1. Create API Configuration File

**Location**: `src/services/api.ts`

```typescript
import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### 2. Create Auth Service

**Location**: `src/services/authService.ts`

```typescript
import apiClient from './api'

export const authService = {
  async signUp(data: {
    name: string
    email: string
    phone: string
    password: string
  }) {
    const response = await apiClient.post('/auth/signup', data)
    const { token } = response.data
    localStorage.setItem('authToken', token)
    return response.data
  },

  async signIn(email: string, password: string) {
    const response = await apiClient.post('/auth/signin', {
      email,
      password,
    })
    const { token } = response.data
    localStorage.setItem('authToken', token)
    return response.data
  },

  logout() {
    localStorage.removeItem('authToken')
  },

  getToken() {
    return localStorage.getItem('authToken')
  },

  isAuthenticated() {
    return !!this.getToken()
  },
}
```

### 3. Create Residents Service

**Location**: `src/services/residentsService.ts`

```typescript
import apiClient from './api'

export const residentsService = {
  async getAll() {
    const response = await apiClient.get('/residents')
    return response.data
  },

  async getOne(id: string) {
    const response = await apiClient.get(`/residents/${id}`)
    return response.data
  },

  async create(resident: any) {
    const response = await apiClient.post('/residents', resident)
    return response.data
  },

  async update(id: string, resident: any) {
    const response = await apiClient.patch(`/residents/${id}`, resident)
    return response.data
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/residents/${id}`)
    return response.data
  },

  async search(query: string) {
    const response = await apiClient.get('/residents/search', {
      params: { q: query },
    })
    return response.data
  },
}
```

### 4. Create Medications Service

**Location**: `src/services/medicationsService.ts`

```typescript
import apiClient from './api'

export const medicationsService = {
  async getByResident(residentId: string) {
    const response = await apiClient.get(
      `/residents/${residentId}/medications`
    )
    return response.data
  },

  async create(residentId: string, medication: any) {
    const response = await apiClient.post(
      `/residents/${residentId}/medications`,
      medication
    )
    return response.data
  },

  async update(residentId: string, medicationId: string, medication: any) {
    const response = await apiClient.patch(
      `/residents/${residentId}/medications/${medicationId}`,
      medication
    )
    return response.data
  },

  async delete(residentId: string, medicationId: string) {
    const response = await apiClient.delete(
      `/residents/${residentId}/medications/${medicationId}`
    )
    return response.data
  },
}
```

## 🔄 Update Existing Components

### Update Login Page

**File**: `src/app/page.tsx`

```typescript
import { authService } from '@/services/authService'

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!email || !password) {
    toast.error("Please fill in all fields")
    return
  }

  try {
    setIsLoading(true)
    await authService.signIn(email, password)
    toast.success("Welcome to SevaCare!")
    router.push("/dashboard")
  } catch (error: any) {
    const message = error.response?.data?.message || "Login failed"
    toast.error(message)
  } finally {
    setIsLoading(false)
  }
}

const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!name || !email || !password || !phone) {
    toast.error("Please fill in all fields")
    return
  }

  try {
    setIsLoading(true)
    await authService.signUp({ name, email, phone, password })
    toast.success("Account created successfully! Please login.")
    setIsSignUp(false)
    // Clear form
  } catch (error: any) {
    const message = error.response?.data?.message || "Sign up failed"
    toast.error(message)
  } finally {
    setIsLoading(false)
  }
}
```

### Update Dashboard Page

**File**: `src/app/dashboard/page.tsx`

```typescript
import { residentsService } from '@/services/residentsService'
import { useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const { residents, setResidents } = useResidents()
  const { searchQuery } = useSearch()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setIsLoading(true)
        const data = await residentsService.getAll()
        // Update your residents context with data from backend
        setResidents(data)
      } catch (error) {
        toast.error("Failed to fetch residents")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResidents()
  }, [])

  // ... rest of component
}
```

### Update Add Resident Page

**File**: `src/app/dashboard/add-resident/page.tsx`

```typescript
import { residentsService } from '@/services/residentsService'

const handleAddResident = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    setIsLoading(true)
    const residentData = {
      name,
      age: parseInt(age),
      gender,
      chronicIllnesses,
      mobilityStatus,
      memoryLoss,
      anxietyDepression,
      allergies,
      emergencyContactName,
      emergencyContactPhone,
    }

    await residentsService.create(residentData)
    toast.success("Resident added successfully!")
    router.push("/dashboard")
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to add resident"
    toast.error(message)
  } finally {
    setIsLoading(false)
  }
}
```

### Update Resident Profile Page

**File**: `src/components/resident-profile.tsx`

```typescript
import { residentsService } from '@/services/residentsService'
import { medicationsService } from '@/services/medicationsService'
import { useEffect } from 'react'

export function ResidentProfile({ residentId }: ResidentProfileProps) {
  const [resident, setResident] = useState<Resident | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResident = async () => {
      try {
        const data = await residentsService.getOne(residentId)
        setResident(data)
      } catch (error) {
        toast.error("Failed to fetch resident details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResident()
  }, [residentId])

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${resident?.name}?`)) {
      try {
        await residentsService.delete(residentId)
        toast.success(`${resident?.name} has been removed`)
        router.push("/dashboard")
      } catch (error) {
        toast.error("Failed to delete resident")
      }
    }
  }

  // ... rest of component
}
```

## 📋 Environment Setup

**Add to your frontend `.env`:**

```env
REACT_APP_API_URL=http://localhost:3001/api/v1
```

## 🚀 Testing the Integration

### 1. Start Backend
```bash
cd ../oldagehome-backend
npm install
npx prisma migrate dev --name init
npm run start:dev
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Flow
1. Go to `http://localhost:3000`
2. Sign up with new account
3. Create a resident
4. Verify data appears in frontend
5. Check database with `npx prisma studio`

## 🔐 Authentication Flow

```
User fills form
    ↓
Frontend sends to /auth/signup or /auth/signin
    ↓
Backend validates and hashes password (bcrypt)
    ↓
Backend returns JWT token
    ↓
Frontend stores in localStorage
    ↓
Frontend includes token in all requests
    ↓
Backend validates token with JwtAuthGuard
    ↓
Request authorized - returns data filtered by userId
```

## 📊 Data Flow Example: Add Resident

```
Frontend Form
    ↓
POST /api/v1/residents {name, age, gender, ...}
    ↓
Backend receives request
    ↓
JwtAuthGuard extracts userId from token
    ↓
ResidentsService.create(userId, data)
    ↓
Prisma creates resident with userId
    ↓
Returns created resident object
    ↓
Frontend updates local state
    ↓
Toast success message
```

## 🐛 Common Issues & Solutions

### Token Not Sent
```typescript
// Make sure interceptor is set up
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### CORS Error
- Ensure frontend URL matches `FRONTEND_URL` in backend `.env`
- Backend must have CORS enabled (already done in main.ts)

### 401 Unauthorized
- Token might be expired (24 hour expiration)
- Token might be invalid - re-login
- Token not being sent - check localStorage

### 500 Server Error
- Check backend console for error messages
- Ensure database is connected
- Check `.env` DATABASE_URL is correct

## 📈 What's Next

1. **Replace local data** with real API data
2. **Add error handling** for network failures
3. **Implement loading states** properly
4. **Add pagination** for large datasets
5. **Add real health record tracking**
6. **Connect medicine scan to save to backend**

## 📞 Need Help?

- Check backend logs: `npm run start:dev`
- View database: `npx prisma studio`
- Test API directly: Use Postman or cURL
- Check network tab in browser DevTools
