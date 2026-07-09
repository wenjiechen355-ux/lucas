import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'

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

  // Send notification to the member
  const { data: progressItem } = await supabase
    .from('progress_items').select('member_id, title').eq('id', progressId).single()
  if (progressItem) {
    await createNotification({
      user_id: progressItem.member_id,
      type: 'approval_progress',
      title: action === 'approve' ? `進度「${progressItem.title}」已通過審批` : `進度「${progressItem.title}」已被退回`,
      message: comment || (action === 'approve' ? '你的進度項目已獲審批通過' : '請查看評語並重新上傳'),
      link: `/dashboard/progress/${progressId}`,
    })
  }

  return NextResponse.redirect(new URL('/dashboard/progress', request.url))
}
