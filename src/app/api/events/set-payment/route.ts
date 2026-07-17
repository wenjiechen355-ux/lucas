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
        setAll(c) { try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {} },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role,position').eq('id', user.id).single()
  const canManage = profile?.role === 'leader' || ['主席','副主席'].includes(profile?.position || '')
  if (!canManage) return NextResponse.json({ error: '僅限領隊/執委操作' }, { status: 403 })

  const { eventId, paymentType, memberIds } = await request.json()
  if (!eventId) return NextResponse.json({ error: '缺少活動 ID' }, { status: 400 })

  // Validate payment_type
  if (paymentType && !['pre', 'post'].includes(paymentType)) {
    return NextResponse.json({ error: '無效嘅付款類型' }, { status: 400 })
  }

  // Update event payment_type
  const { error: eventError } = await supabase
    .from('events').update({ payment_type: paymentType || null }).eq('id', eventId)
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 })

  if (paymentType && memberIds && memberIds.length > 0) {
    // Remove old assignments for this event
    await supabase.from('event_payments').delete().eq('event_id', eventId)

    // Insert new assignments
    const inserts = memberIds.map((memberId: string) => ({
      event_id: eventId,
      member_id: memberId,
      status: 'pending',
    }))
    const { error: insertError } = await supabase.from('event_payments').insert(inserts)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  } else if (!paymentType) {
    // Remove all payment assignments if turning off payment
    await supabase.from('event_payments').delete().eq('event_id', eventId)
  }

  return NextResponse.json({ success: true })
}
