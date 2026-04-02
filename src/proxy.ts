import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']
const ROLE_HOME: Record<string, string> = {
  admin: '/admin/dashboard',
  instructor: '/instructor/dashboard',
  student: '/student/dashboard',
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must be called before any auth checks
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role as string | undefined

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isRoot = pathname === '/'

  // Not logged in — send to login (except public routes)
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in on a public route or root — send to role dashboard
  if (user && (isPublicRoute || isRoot)) {
    const home = role ? ROLE_HOME[role] : '/student/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  // Role-based route guard
  if (user && role) {
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/login', request.url))
    }
    if (pathname.startsWith('/instructor') && role !== 'instructor') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/login', request.url))
    }
    if (pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
