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

  const { data: profile } = await supabase
    .from('profiles').select('position').eq('id', user.id).single()
  if (!profile?.position) {
    return NextResponse.json({ error: '僅限執委會成員操作' }, { status: 403 })
  }

  const formData = await request.formData()
  const eventId = formData.get('eventId') as string
  const docType = formData.get('docType') as string // 'finance' or 'photo'
  const file = formData.get('file') as File

  if (!eventId || !docType || !file) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  const filePath = `events/${eventId}/${docType}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const updateData: Record<string, string> = {}
  if (docType === 'finance') {
    updateData.finance_doc_path = filePath
    updateData.finance_doc_name = file.name
  } else if (docType === 'minutes') {
    updateData.minutes_doc_path = filePath
    updateData.minutes_doc_name = file.name
  } else if (docType === 'agenda') {
    updateData.agenda_doc_path = filePath
    updateData.agenda_doc_name = file.name
  } else {
    updateData.photo_doc_path = filePath
    updateData.photo_doc_name = file.name
  }

  const { error: updateError } = await supabase.from('events').update(updateData).eq('id', eventId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
