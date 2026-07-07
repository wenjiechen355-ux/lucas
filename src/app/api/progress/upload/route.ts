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

  const formData = await request.formData()
  const progressId = formData.get('progressId') as string
  const file = formData.get('file') as File
  
  if (!progressId || !file) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  // Upload file to storage
  const filePath = `progress/${user.id}/${progressId}_${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Update progress item
  const { error: updateError } = await supabase
    .from('progress_items')
    .update({
      document_path: filePath,
      document_name: file.name,
      document_status: 'pending',
      status: 'in_progress',
    })
    .eq('id', progressId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.redirect(new URL(`/dashboard/progress/${progressId}`, request.url))
}
