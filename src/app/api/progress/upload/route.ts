import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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

  // Upload file to storage with ASCII-safe path
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
  const safeFileName = `${progressId}_${Date.now()}.${ext}`
  const filePath = `progress/${user.id}/${safeFileName}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Update progress item (keep original name for display)
  const { error: updateError } = await supabase
    .from('progress_items')
    .update({
      document_path: filePath,
      document_name: file.name,
      document_status: 'pending',
      status: 'in_progress',
      completed_date: null,
      reviewer_comment: null,
    })
    .eq('id', progressId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  revalidatePath('/dashboard/progress')
  return NextResponse.json({ success: true, id: progressId })
}
