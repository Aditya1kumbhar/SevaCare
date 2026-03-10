import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

/**
 * Verify JWT token from Authorization header and return the payload.
 * Throws an error if the token is invalid or missing.
 */
export function verifyAuth(request: NextRequest): JwtPayload {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Sign a JWT token with the given payload.
 */
export function signToken(payload: { userId: string; email: string; role: string }): string {
  const expiration = process.env.JWT_EXPIRATION || '24h'
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiration as any })
}
