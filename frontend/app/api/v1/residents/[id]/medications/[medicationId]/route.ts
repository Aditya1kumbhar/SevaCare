import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth-middleware'

type RouteParams = { params: Promise<{ id: string; medicationId: string }> }

// PATCH /api/v1/residents/[id]/medications/[medicationId] — Update medication
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = verifyAuth(request)
    const { id: residentId, medicationId } = await params
    const body = await request.json()

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    })

    if (!resident || resident.userId !== user.userId) {
      return NextResponse.json({ message: 'Resident not found' }, { status: 404 })
    }

    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    })

    if (!medication || medication.residentId !== residentId) {
      return NextResponse.json({ message: 'Medication not found' }, { status: 404 })
    }

    const updated = await prisma.medication.update({
      where: { id: medicationId },
      data: body,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update medication error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/residents/[id]/medications/[medicationId] — Delete medication
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = verifyAuth(request)
    const { id: residentId, medicationId } = await params

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    })

    if (!resident || resident.userId !== user.userId) {
      return NextResponse.json({ message: 'Resident not found' }, { status: 404 })
    }

    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    })

    if (!medication || medication.residentId !== residentId) {
      return NextResponse.json({ message: 'Medication not found' }, { status: 404 })
    }

    await prisma.medication.delete({
      where: { id: medicationId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete medication error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
