import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/residents',
  '/voice-assistant',
  '/telemedicine',
  '/reminders',
  '/settings',
  '/emergency',
  '/log',
  '/batch-log'
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pdzwxijuktpmcvnodnzn.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkend4aWp1a3RwbWN2bm9kbnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTI4ODAsImV4cCI6MjA2Nzk4ODg4MH0.1eGKLjhz5MKJm_2ClBsCreYxFFzFP2F55We3TVwLqMU',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh auth session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  // 1. Mandatory Login Guard: If user is NOT logged in and trying to access any protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set('error', 'login_required')
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Already Logged In Guard: If user IS logged in and trying to access login page '/' or '/signup'
  if (user && (pathname === '/' || pathname === '/signup')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/residents/:path*',
    '/voice-assistant/:path*',
    '/telemedicine/:path*',
    '/reminders/:path*',
    '/settings/:path*',
    '/emergency/:path*',
    '/log/:path*',
    '/',
    '/signup',
  ],
}
