import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const id = formData.get('id') as string
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id)

  return NextResponse.redirect(new URL('/dashboard/notifications', req.url))
}
