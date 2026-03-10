import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth-middleware'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/v1/residents/[id]/medications — Get medications for resident
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = verifyAuth(request)
    const { id: residentId } = await params

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    })

    if (!resident || resident.userId !== user.userId) {
      return NextResponse.json({ message: 'Resident not found' }, { status: 404 })
    }

    const medications = await prisma.medication.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(medications)
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get medications error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/residents/[id]/medications — Create medication
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = verifyAuth(request)
    const { id: residentId } = await params
    const body = await request.json()

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    })

    if (!resident || resident.userId !== user.userId) {
      return NextResponse.json({ message: 'Resident not found' }, { status: 404 })
    }

    const medication = await prisma.medication.create({
      data: {
        ...body,
        residentId,
      },
    })

    return NextResponse.json(medication, { status: 201 })
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create medication error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
