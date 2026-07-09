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
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const formData = await request.formData()
  const eventId = formData.get('event_id') as string
  const caption = formData.get('caption') as string
  const files = formData.getAll('photos') as File[]

  if (!eventId || files.length === 0) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 })
  }

  const results = []
  for (const file of files) {
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `events/${eventId}/${timestamp}_${safeName}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      results.push({ file: file.name, error: uploadError.message })
      continue
    }

    const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(path)

    const { error: dbError } = await supabase.from('event_photos').insert({
      event_id: eventId,
      file_path: publicUrl.publicUrl,
      file_name: file.name,
      file_size: file.size,
      caption: caption || '',
      uploaded_by: user.id,
    })

    if (dbError) {
      results.push({ file: file.name, error: dbError.message })
    } else {
      results.push({ file: file.name, url: publicUrl.publicUrl, ok: true })
    }
  }

  return NextResponse.json({ results })
}
