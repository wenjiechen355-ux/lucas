import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notifyAll } from '@/lib/notifications'

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
  const eventType = (formData.get('event_type') as string) || 'unit'
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const eventDate = formData.get('event_date') as string
  const location = formData.get('location') as string
  const isExecOnly = formData.get('is_exec_only') === 'true'
  const isExecMeeting = formData.get('is_exec_meeting') === 'true'
  const requiresMinutes = formData.get('requires_minutes') === 'true'
  const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
  const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null
  const isOnline = formData.get('is_online') === 'true'

  if (!title) {
    return NextResponse.json({ error: '请填写活动标题' }, { status: 400 })
  }

  // 验证：仅 unit 类型才能设例会/会议记录
  const finalIsExecMeeting = eventType === 'unit' ? isExecMeeting : false
  const finalRequiresMinutes = eventType === 'unit' ? requiresMinutes : false
  const finalIsExecOnly = eventType === 'unit' ? isExecMeeting : false

  const { error } = await supabase.from('events').insert({
    title,
    description: description || '',
    event_date: eventDate || null,
    location: location || '',
    created_by: user.id,
    attendance_open: false, // 預設唔開放出席
    event_type: eventType,
    is_exec_only: finalIsExecOnly,
    is_exec_meeting: finalIsExecMeeting,
    requires_minutes: finalRequiresMinutes,
    is_meeting: finalRequiresMinutes, // 保留兼容旧 UI
    latitude: latitude,
    longitude: longitude,
    is_online: isOnline,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify all users about the new activity
  await notifyAll({
    type: 'activity',
    title: `新活動：${title}`,
    message: description || `日期：${eventDate ? new Date(eventDate).toLocaleDateString('zh-HK') : '待定'}，地點：${isOnline ? '線上' : (location || '未指定')}`,
    link: '/dashboard/attendance',
  })

  return NextResponse.redirect(new URL('/dashboard/leader/attendance', request.url))
}
