import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth-middleware'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email or phone number already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        role: 'CARETAKER',
      },
    })

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
