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
  const transactionId = formData.get('transaction_id') as string
  const eventId = formData.get('event_id') as string
  const file = formData.get('file') as File

  if (!transactionId || !eventId || !file) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  // ASCII-safe path
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
  const safeName = `${Date.now()}.${ext}`
  const filePath = `receipts/${eventId}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { error: dbError } = await supabase.from('event_receipts').insert({
    transaction_id: transactionId,
    event_id: eventId,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    uploaded_by: user.id,
  })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true, filePath })
}
