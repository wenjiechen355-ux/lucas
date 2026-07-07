import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {} } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { data: profile } = await supabase
    .from('profiles').select('role,position').eq('id', user.id).single()

  const canDelete = profile?.role === 'leader' || ['主席','副主席'].includes(profile?.position || '')
  if (!canDelete) return NextResponse.json({ error: '無權限' }, { status: 403 })

  await supabase.from('attendance').delete().eq('event_id', eventId)
  await supabase.from('events').delete().eq('id', eventId)

  return NextResponse.redirect(new URL('/dashboard/leader/attendance', request.url))
}
