import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Exec-allowed leader paths (pages that exec members can access)
const EXEC_ALLOWED = [
  '/dashboard/leader/event-prep',
  '/dashboard/leader/event-archive',
  '/dashboard/leader/event-polls',
  '/dashboard/leader/announcements',
  '/dashboard/leader/finance',
  '/dashboard/leader/attendance-analytics',
  '/dashboard/leader/attendance',
]

// Chair-only extra pages
const CHAIR_ONLY = [
  '/dashboard/leader/approvals',
  '/dashboard/leader/members',
  '/dashboard/leader/documents',
]

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request)

  // Only check dashboard pages
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/dashboard')) {
    return supabaseResponse
  }

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Skip access control for common non-role-specific pages
  const commonPages = ['/dashboard', '/dashboard/profile', '/dashboard/change-password', '/dashboard/notifications']
  if (commonPages.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return supabaseResponse
  }

  // Fetch profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, position')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return supabaseResponse
  }

  const isLeader = profile.role === 'leader'
  const isExec = !!profile.position
  const isChair = profile.position === '主席' || profile.position === '副主席'

  // Leader: access everything
  if (isLeader) return supabaseResponse

  const isLeaderPath = pathname.startsWith('/dashboard/leader')

  if (isExec) {
    // Exec (not leader): can only access exec-allowed paths
    const allowed = EXEC_ALLOWED.some(p => pathname === p || pathname.startsWith(p + '/'))
    const chairAllowed = isChair && CHAIR_ONLY.some(p => pathname === p || pathname.startsWith(p + '/'))
    if (allowed || chairAllowed) return supabaseResponse
    // Not allowed → redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Regular member: cannot access any /dashboard/leader/* pages
  if (isLeaderPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
