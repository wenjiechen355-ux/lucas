import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Pages accessible by role (each role ONLY sees its own list)
const LEADER_PAGES = [
  '/dashboard/leader/members',
  '/dashboard/leader/attendance',
  '/dashboard/leader/finance',
  '/dashboard/leader/attendance-analytics',
  '/dashboard/leader/documents',
  '/dashboard/leader/event-polls',
]

const EXEC_PAGES = [
  '/dashboard/leader/event-prep',
  '/dashboard/leader/event-archive',
  '/dashboard/leader/event-polls',
  '/dashboard/leader/announcements',
  '/dashboard/leader/finance',
  '/dashboard/leader/attendance-analytics',
  '/dashboard/leader/attendance',
  '/dashboard/leader/attendance/new',
]

const MEMBER_PAGES = [
  '/dashboard/attendance',
  '/dashboard/progress',
  '/dashboard/documents',
  '/dashboard/event-polls',
  '/dashboard/payments',
]

// Common pages everyone can access
const COMMON_PAGES = [
  '/dashboard',        // home
  '/dashboard/calendar',
  '/dashboard/profile',
  '/dashboard/change-password',
  '/dashboard/notifications',
  '/dashboard/payments',
]

// Chair bonus
const CHAIR_PAGES = [
  '/dashboard/leader/approvals',
]

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/dashboard')) {
    return supabaseResponse
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Common pages → allow all authenticated users
  if (COMMON_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return supabaseResponse
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, position')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return supabaseResponse

  const isLeader = profile.role === 'leader'
  const isExec = !!profile.position
  const isChair = profile.position === '主席' || profile.position === '副主席'

  // Chair pages
  if (CHAIR_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (isChair) return supabaseResponse
  }

  // Determine which page list to use based on role
  let allowedPages: string[] = []
  if (isLeader) {
    allowedPages = [...LEADER_PAGES, ...MEMBER_PAGES]
    if (isChair) allowedPages.push(...CHAIR_PAGES)
  } else if (isExec) {
    allowedPages = [...EXEC_PAGES, ...MEMBER_PAGES]
    if (isChair) allowedPages.push(...CHAIR_PAGES)
  } else {
    allowedPages = [...MEMBER_PAGES]
  }

  // Check if current path is allowed
  const allowed = allowedPages.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!allowed) {
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
