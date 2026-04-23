import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/dev', '/forgot-password', '/reset-password']
// PUBLIC_PREFIXES lets unauthenticated users through BUT, unlike PUBLIC_ROUTES,
// does not bounce logged-in users off to their dashboard — an authenticated
// user visiting an invite URL needs to see the accept page, not their home.
const PUBLIC_PREFIXES = ['/invite/']

function getPrimaryHome(meta: Record<string, unknown>): string {
  if (meta.is_admin) return '/admin/dashboard'
  if (meta.is_instructor) return '/instructor/dashboard'
  return '/student/dashboard'
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
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isPublicPrefix = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  const isRoot = pathname === '/'
  // API routes handle their own auth — don't redirect to login
  const isApiRoute = pathname.startsWith('/api/')

  // Not logged in — send to login (except public routes and API routes)
  if (!user && !isPublicRoute && !isPublicPrefix && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in on a public route or root — send to role dashboard
  // /dev, /reset-password, and /invite/* are always accessible regardless of auth state
  if (user && (isPublicRoute || isRoot) && pathname !== '/dev' && pathname !== '/reset-password') {
    return NextResponse.redirect(new URL(getPrimaryHome(meta), request.url))
  }

  // Role-based route guard
  if (user) {
    if (pathname.startsWith('/admin') && !meta.is_admin) {
      return NextResponse.redirect(new URL(getPrimaryHome(meta), request.url))
    }
    if (pathname.startsWith('/instructor') && !meta.is_instructor) {
      return NextResponse.redirect(new URL(getPrimaryHome(meta), request.url))
    }
    if (pathname.startsWith('/student') && !meta.is_student) {
      return NextResponse.redirect(new URL(getPrimaryHome(meta), request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
