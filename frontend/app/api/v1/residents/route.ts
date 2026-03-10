import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth-middleware'

// GET /api/v1/residents — Get all residents for authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request)

    const residents = await prisma.resident.findMany({
      where: { userId: user.userId },
      include: {
        medications: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(residents)
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get residents error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/residents — Create a new resident
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request)
    const body = await request.json()

    const resident = await prisma.resident.create({
      data: {
        ...body,
        userId: user.userId,
      },
      include: {
        medications: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        residentId: resident.id,
        action: 'added_resident',
        details: `Resident ${resident.name} was added`,
      },
    })

    return NextResponse.json(resident, { status: 201 })
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create resident error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
