import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

  const { data: profile } = await supabase
    .from('profiles').select('role,position').eq('id', user.id).single()
  
  const canCreate = profile?.role === 'leader' || ['主席','副主席'].includes(profile?.position || '')
  if (!canCreate) {
    return NextResponse.json({ error: '仅限主席或副主席操作' }, { status: 403 })
  }

  const formData = await request.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const eventDate = formData.get('event_date') as string
  const location = formData.get('location') as string
  const isExecOnly = formData.get('is_exec_only') === 'true'
  const isMeeting = formData.get('is_meeting') === 'true'
  const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
  const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null

  if (!title || !eventDate) {
    return NextResponse.json({ error: '请填写活动标题和日期' }, { status: 400 })
  }

  const { error } = await supabase.from('events').insert({
    title,
    description: description || '',
    event_date: eventDate,
    location: location || '',
    created_by: user.id,
    attendance_open: false, // 預設唔開放出席
    is_exec_only: isExecOnly,
    is_meeting: isMeeting,
    latitude: latitude,
    longitude: longitude,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/dashboard/leader/attendance', request.url))
}
