# SevaCare Backend API Documentation

Professional backend API built with **NestJS**, **Prisma ORM**, and **PostgreSQL**.

## 🏗️ Architecture Overview

```
oldagehome-backend/
├── src/
│   ├── auth/                 # Authentication (JWT, Sign Up, Sign In)
│   ├── residents/            # Resident management
│   ├── medications/          # Medication management
│   ├── health-records/       # Health tracking (expandable)
│   ├── prisma/              # Database layer
│   └── main.ts              # Application entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── .env                     # Environment configuration
└── package.json
```

## 📦 Technology Stack

| Technology      | Version | Purpose                          |
|-----------------|---------|----------------------------------|
| **NestJS**      | Latest  | Backend framework (TypeScript)   |
| **Prisma**      | Latest  | ORM & Database management        |
| **PostgreSQL**  | 12+     | Production database              |
| **JWT**         | Latest  | Authentication & Authorization   |
| **Bcrypt**      | Latest  | Password hashing                 |

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

### 2. Installation

```bash
# Navigate to backend directory
cd oldagehome-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Database Configuration

Update `.env` file with your PostgreSQL connection:

```env
# PostgreSQL running locally
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sevacare_db"

# Or use Prisma Postgres Cloud (free tier available)
DATABASE_URL="your_prisma_database_url"

# JWT Secret - Change in production!
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Server port
PORT=3001
```

### 4. Database Setup

```bash
# Create database and run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed

# View database GUI
npx prisma studio
```

### 5. Start Development Server

```bash
# Development mode with auto-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Server runs on `http://localhost:3001/api/v1`

## 📚 API Endpoints

### Authentication

#### Sign Up
```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "name": "Rajesh Sharma",
  "email": "rajesh@sevacare.in",
  "phone": "+919876543210",
  "password": "SecurePass123"
}

Response:
{
  "id": "clm5k9r5a0000f8jz9d0l5g7b",
  "email": "rajesh@sevacare.in",
  "name": "Rajesh Sharma",
  "phone": "+919876543210",
  "role": "CARETAKER",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Sign In
```bash
POST /api/v1/auth/signin
Content-Type: application/json

{
  "email": "rajesh@sevacare.in",
  "password": "SecurePass123"
}

Response: (same as Sign Up)
```

### Residents Management

All resident endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

#### Create Resident
```bash
POST /api/v1/residents
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Kamala Devi",
  "age": 76,
  "gender": "Female",
  "chronicIllnesses": ["Diabetes", "BP"],
  "mobilityStatus": "Uses Walker",
  "memoryLoss": true,
  "anxietyDepression": false,
  "allergies": "Sulfa drugs",
  "emergencyContactName": "Rajesh Sharma",
  "emergencyContactPhone": "+91 98765 43210"
}

Response:
{
  "id": "clm5kabc1000008jz9d0l5g7z",
  "name": "Kamala Devi",
  "age": 76,
  "gender": "Female",
  "chronicIllnesses": ["Diabetes", "BP"],
  "mobilityStatus": "Uses Walker",
  "memoryLoss": true,
  "anxietyDepression": false,
  "allergies": "Sulfa drugs",
  "emergencyContactName": "Rajesh Sharma",
  "emergencyContactPhone": "+91 98765 43210",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Get All Residents
```bash
GET /api/v1/residents
Authorization: Bearer <token>

Response: Array of resident objects
```

#### Get Single Resident
```bash
GET /api/v1/residents/:id
Authorization: Bearer <token>
```

#### Update Resident
```bash
PATCH /api/v1/residents/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "age": 77,
  "chronicles_illnesses": ["Diabetes", "BP", "Asthma"]
}
```

#### Delete Resident
```bash
DELETE /api/v1/residents/:id
Authorization: Bearer <token>
```

#### Search Residents
```bash
GET /api/v1/residents/search?q=Kamala
Authorization: Bearer <token>

Searches by:
- Resident name (case-insensitive)
- Chronic illnesses
```

### Medications Management

#### Add Medication to Resident
```bash
POST /api/v1/residents/:residentId/medications
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Metformin",
  "dose": "500mg",
  "frequency": "Twice daily",
  "time": "08:00 AM"
}
```

#### Get Resident's Medications
```bash
GET /api/v1/residents/:residentId/medications
Authorization: Bearer <token>
```

#### Update Medication
```bash
PATCH /api/v1/residents/:residentId/medications/:medicationId
Content-Type: application/json
Authorization: Bearer <token>

{
  "dose": "1000mg",
  "frequency": "Once daily"
}
```

#### Delete Medication
```bash
DELETE /api/v1/residents/:residentId/medications/:medicationId
Authorization: Bearer <token>
```

## 🔒 Security Features

✅ **JWT Authentication**: Secure token-based auth
✅ **Password Hashing**: Bcrypt (10 salt rounds)
✅ **Input Validation**: Class-validator + class-transformer
✅ **CORS Protection**: Configurable origin whitelist
✅ **Request Validation**: Global validation pipe
✅ **Authorization Guards**: Role-based access control
✅ **SQL Injection Prevention**: Prisma parameterized queries
✅ **Data Sanitization**: Automatic whitelist filtering

## 📊 Database Schema

### Users Table
- `id`: Unique identifier (CUID)
- `email`: Unique email address
- `name`: User full name
- `phone`: Unique phone number
- `password`: Hashed password
- `role`: USER_ROLE enum (ADMIN, CARETAKER, SUPERVISOR)
- `createdAt`, `updatedAt`: Timestamps

### Residents Table
- Connected to Users (one-to-many)
- All health information
- Relationships to Medications, HealthRecords, ActivityLogs

### Medications Table
- Connected to Residents (one-to-many)
- Drug details and schedule

### Activity Logs Table
- Tracks all changes
- Useful for audit trails

### Additional Tables (Expandable)
- `health_records`: Blood pressure, heart rate, temperature, weight
- `medicine_scans`: Medicine strip scan history

## 🔄 Integration with Frontend

### Frontend to Backend Flow

1. **User Signs Up/In** → Auth endpoint returns JWT token
2. Frontend stores token in localStorage
3. Frontend includes token in all requests:
   ```javascript
   const headers = {
     'Authorization': `Bearer ${token}`
   }
   ```
4. Backend validates JWT, extracts user ID
5. All resident data auto-filtered by user ID

### Update Frontend API Base URL

In React frontend (`.env`):
```env
REACT_APP_API_URL=http://localhost:3001/api/v1
```

## 📝 Environment Variables

| Variable        | Default                | Description         |
|-----------------|------------------------|---------------------|
| `DATABASE_URL`  | Required               | PostgreSQL connection |
| `NODE_ENV`      | `development`          | Environment mode  |
| `PORT`          | `3001`                 | Server port       |
| `JWT_SECRET`    | Required (change!)     | JWT signing key   |
| `JWT_EXPIRATION`| `24h`                  | Token lifetime    |
| `FRONTEND_URL`  | `http://localhost:3000`| CORS origin       |

## 🧪 Testing the API

### Using cURL

```bash
# Sign Up
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@sevacare.in","phone":"+919876543210","password":"Pass123"}'

# Sign In
curl -X POST http://localhost:3001/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"john@sevacare.in","password":"Pass123"}'

# Get all residents (with token)
curl http://localhost:3001/api/v1/residents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Create a new Collection
2. Add Authorization tab → Bearer Token → Paste your JWT
3. Test each endpoint

## 📦 Project Commands

```bash
# Development with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# View database GUI
npx prisma studio

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Format code
npm run format

# Run linter
npm run lint
```

## 🐛 Troubleshooting

### Database Connection Error
```
Error: getaddrinfo ENOTFOUND localhost
```
✅ Ensure PostgreSQL is running
✅ Check DATABASE_URL in .env
✅ Verify port 5432 is accessible

### JWT Token Issues
```
Unauthorized: Invalid token
```
✅ Ensure token is in Authorization header
✅ Check token hasn't expired
✅ Verify JWT_SECRET matches

### Migration Failed
```bash
# Reset database and restart
npx prisma migrate reset
npx prisma migrate dev --name init
```

## 📈 Performance Optimization

- ✅ Database indexing on frequently queried fields (userId, residentId)
- ✅ Eager loading to prevent N+1 queries
- ✅ Connection pooling with Prisma
- ✅ Request validation before database queries
- ✅ JWT stateless authentication (no session lookups)

## 🚀 Deployment

### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create sevacare-backend

# Set environment variables
heroku config:set JWT_SECRET=<strong-secret>
heroku config:set DATABASE_URL=<heroku-postgres-url>

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## 📞 Support & Next Steps

1. **Add Health Records API** - Track vitals
2. **Add Medicine Scan Integration** - Real OCR processing
3. **Add Admin Dashboard** - User management
4. **Add Email Notifications** - Medication reminders
5. **Add File Upload** - Document storage (S3/Cloudinary)

## 📄 License

This project is part of SevaCare Elder Care Management System.
