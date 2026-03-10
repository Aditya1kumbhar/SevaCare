import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth-middleware'

// GET /api/v1/residents/search?q=query — Search residents
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request)
    const query = request.nextUrl.searchParams.get('q')

    if (!query) {
      const residents = await prisma.resident.findMany({
        where: { userId: user.userId },
        include: { medications: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(residents)
    }

    const residents = await prisma.resident.findMany({
      where: {
        userId: user.userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { chronicIllnesses: { hasSome: [query] } },
        ],
      },
      include: { medications: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(residents)
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Search residents error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
