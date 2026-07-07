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
    .from('profiles').select('role,position').eq('id', user.id).single()
  
  const isChair = profile?.position === '主席' || profile?.position === '副主席'
  if (!isChair) return NextResponse.json({ error: '僅限主席或副主席審批' }, { status: 403 })

  const formData = await request.formData()
  const progressId = formData.get('progressId') as string
  const action = formData.get('action') as string // 'approve' or 'reject'
  const comment = formData.get('comment') as string || ''

  if (!progressId || !action) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  const updateData: any = {
    document_status: action === 'approve' ? 'approved' : 'rejected',
    reviewer_comment: comment,
  }

  if (action === 'approve') {
    updateData.status = 'completed'
    updateData.completed_date = new Date().toISOString()
    updateData.completed_by = user.id
  }

  const { error } = await supabase
    .from('progress_items')
    .update(updateData)
    .eq('id', progressId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.redirect(new URL('/dashboard/progress', request.url))
}
