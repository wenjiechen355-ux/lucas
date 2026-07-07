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
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 检查是否已经签到
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('event_id', eventId)
    .eq('member_id', user.id)
    .single()

  if (!existing) {
    const formData = await request.formData()
    const status = formData.get('status') as string || 'present'

    await supabase.from('attendance').insert({
      event_id: eventId,
      member_id: user.id,
      status,
      checkin_time: status === 'present' ? new Date().toISOString() : null,
    })
  }

  return NextResponse.redirect(new URL('/dashboard/attendance', request.url))
}
