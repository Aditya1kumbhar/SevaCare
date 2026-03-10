import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth-middleware'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/v1/residents/[id] — Get single resident
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = verifyAuth(request)
    const { id } = await params

    const resident = await prisma.resident.findUnique({
      where: { id },
      include: {
        medications: true,
        healthRecords: {
          orderBy: { dateRecorded: 'desc' },
          take: 10,
        },
      },
    })

    if (!resident || resident.userId !== user.userId) {
      return NextResponse.json({ message: 'Resident not found' }, { status: 404 })
    }

    return NextResponse.json(resident)
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get resident error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/residents/[id] — Update resident
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = verifyAuth(request)
    const { id } = await params
    const body = await request.json()

    const resident = await prisma.resident.findUnique({
      where: { id },
    })

    if (!resident || resident.userId !== user.userId) {
      return NextResponse.json({ message: 'Resident not found' }, { status: 404 })
    }

    const updated = await prisma.resident.update({
      where: { id },
      data: body,
      include: { medications: true },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        residentId: id,
        action: 'updated_resident',
        details: `Resident ${resident.name} was updated`,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update resident error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/residents/[id] — Delete resident
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = verifyAuth(request)
    const { id } = await params

    const resident = await prisma.resident.findUnique({
      where: { id },
    })

    if (!resident || resident.userId !== user.userId) {
      return NextResponse.json({ message: 'Resident not found' }, { status: 404 })
    }

    await prisma.resident.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete resident error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
