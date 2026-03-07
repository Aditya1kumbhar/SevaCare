-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CARETAKER', 'SUPERVISOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CARETAKER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "chronicIllnesses" TEXT[],
    "mobilityStatus" TEXT NOT NULL,
    "memoryLoss" BOOLEAN NOT NULL DEFAULT false,
    "anxietyDepression" BOOLEAN NOT NULL DEFAULT false,
    "allergies" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_records" (
    "id" TEXT NOT NULL,
    "dateRecorded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloodPressure" TEXT,
    "heartRate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_scans" (
    "id" TEXT NOT NULL,
    "medicineNameEn" TEXT NOT NULL,
    "medicineNameMr" TEXT NOT NULL,
    "usageEn" TEXT NOT NULL,
    "usageMr" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,

    CONSTRAINT "medicine_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" TEXT NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "residents_userId_idx" ON "residents"("userId");

-- CreateIndex
CREATE INDEX "medications_residentId_idx" ON "medications"("residentId");

-- CreateIndex
CREATE INDEX "health_records_residentId_idx" ON "health_records"("residentId");

-- CreateIndex
CREATE INDEX "medicine_scans_residentId_idx" ON "medicine_scans"("residentId");

-- CreateIndex
CREATE INDEX "activity_logs_residentId_idx" ON "activity_logs"("residentId");

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_scans" ADD CONSTRAINT "medicine_scans_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
