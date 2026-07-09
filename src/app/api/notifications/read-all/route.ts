import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)

  return NextResponse.redirect(new URL('/dashboard/notifications', req.url))
}
