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

  const { paymentId } = await request.json()
  if (!paymentId) return NextResponse.json({ error: '缺少付款 ID' }, { status: 400 })

  // Verify the payment belongs to this member
  const { data: payment } = await supabase
    .from('event_payments').select('*').eq('id', paymentId).single()
  if (!payment) return NextResponse.json({ error: '付款記錄不存在' }, { status: 404 })

  if (payment.member_id !== user.id) {
    return NextResponse.json({ error: '只能標記自己嘅付款' }, { status: 403 })
  }

  if (payment.status === 'paid') {
    return NextResponse.json({ error: '已經付款' }, { status: 400 })
  }

  const { error } = await supabase
    .from('event_payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
