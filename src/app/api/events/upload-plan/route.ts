import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {} } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  // Check exec permission
  const { data: profile } = await supabase
    .from('profiles').select('position').eq('id', user.id).single()
  if (!profile?.position) {
    return NextResponse.json({ error: '僅限執委會成員操作' }, { status: 403 })
  }

  const formData = await request.formData()
  const eventId = formData.get('eventId') as string
  const file = formData.get('file') as File

  if (!eventId || !file) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  // Upload to storage with ASCII-safe path
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
  const safeFileName = `${Date.now()}.${ext}`
  const filePath = `plans/${eventId}/${safeFileName}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Update event record (keep original name for display)
  const { error: updateError } = await supabase
    .from('events')
    .update({ plan_doc_path: filePath, plan_doc_name: file.name })
    .eq('id', eventId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
