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
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const formData = await request.formData()
  const memberId = formData.get('memberId') as string
  const status = formData.get('status') as string

  if (!memberId || !status) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  // Upsert attendance
  const { error } = await supabase.from('attendance').upsert({
    event_id: eventId,
    member_id: memberId,
    status,
    checkin_time: status === 'present' ? new Date().toISOString() : null,
  }, {
    onConflict: 'event_id,member_id',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL(`/dashboard/leader/attendance/${eventId}`, request.url))
}
