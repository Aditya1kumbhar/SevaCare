-- ============================================
-- SevaCare Database Schema for Supabase
-- Copy and paste this in Supabase SQL Editor
-- ============================================

-- 1. Create UserRole enum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CARETAKER', 'SUPERVISOR');

-- 2. Users table
CREATE TABLE "users" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'CARETAKER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- 3. Residents table
CREATE TABLE "residents" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "age" INTEGER NOT NULL,
  "gender" TEXT NOT NULL,
  "chronicIllnesses" TEXT[] NOT NULL DEFAULT '{}',
  "mobilityStatus" TEXT NOT NULL,
  "memoryLoss" BOOLEAN NOT NULL DEFAULT false,
  "anxietyDepression" BOOLEAN NOT NULL DEFAULT false,
  "allergies" TEXT,
  "emergencyContactName" TEXT,
  "emergencyContactPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  
  CONSTRAINT "residents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "residents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "residents_userId_idx" ON "residents"("userId");

-- 4. Medications table
CREATE TABLE "medications" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "dose" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "residentId" TEXT NOT NULL,
  
  CONSTRAINT "medications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "medications_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "medications_residentId_idx" ON "medications"("residentId");

-- 5. Health Records table
CREATE TABLE "health_records" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "dateRecorded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "bloodPressure" TEXT,
  "heartRate" INTEGER,
  "temperature" DOUBLE PRECISION,
  "weight" DOUBLE PRECISION,
  "notes" TEXT,
  "recordedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "residentId" TEXT NOT NULL,
  
  CONSTRAINT "health_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "health_records_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "health_records_residentId_idx" ON "health_records"("residentId");

-- 6. Medicine Scans table
CREATE TABLE "medicine_scans" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "medicineNameEn" TEXT NOT NULL,
  "medicineNameMr" TEXT NOT NULL,
  "usageEn" TEXT NOT NULL,
  "usageMr" TEXT NOT NULL,
  "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isAdded" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "residentId" TEXT NOT NULL,
  
  CONSTRAINT "medicine_scans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "medicine_scans_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "medicine_scans_residentId_idx" ON "medicine_scans"("residentId");

-- 7. Activity Logs table
CREATE TABLE "activity_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "action" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "residentId" TEXT NOT NULL,
  
  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "activity_logs_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "activity_logs_residentId_idx" ON "activity_logs"("residentId");

-- 8. Device Tokens table (for FCM push notifications)
CREATE TABLE "device_tokens" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "token" TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  
  CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- ============================================
-- ✅ Schema created successfully!
-- Your tables: users, residents, medications, 
-- health_records, medicine_scans, activity_logs, device_tokens
-- ============================================
