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
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 检查是否是领袖
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: '仅限领袖操作' }, { status: 403 })
  }

  const formData = await request.formData()
  const docId = formData.get('docId') as string
  const status = formData.get('status') as string
  const comment = formData.get('review_comment') as string

  if (!docId || !status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  const { error } = await supabase
    .from('documents')
    .update({
      status,
      review_comment: comment || '',
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', docId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/dashboard/leader/documents', request.url))
}
