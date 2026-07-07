import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {} } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  // Only chair/vice-chair can toggle
  const { data: profile } = await supabase
    .from('profiles').select('position').eq('id', user.id).single()
  if (!['主席','副主席'].includes(profile?.position || '')) {
    return NextResponse.json({ error: '僅限主席或副主席操作' }, { status: 403 })
  }

  const formData = await request.formData()
  const open = formData.get('open') === 'true'

  const { error } = await supabase
    .from('events')
    .update({ attendance_open: open })
    .eq('id', eventId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
