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

  const formData = await request.formData()
  const paymentId = formData.get('paymentId') as string
  const file = formData.get('file') as File

  if (!paymentId || !file) {
    return NextResponse.json({ error: '缺少參數' }, { status: 400 })
  }

  // Verify the payment belongs to this member or user is leader
  const { data: payment } = await supabase
    .from('event_payments').select('*, events(title)').eq('id', paymentId).single()
  if (!payment) return NextResponse.json({ error: '付款記錄不存在' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles').select('role,position').eq('id', user.id).single()
  const isLeader = profile?.role === 'leader' || ['主席','副主席'].includes(profile?.position || '')
  if (payment.member_id !== user.id && !isLeader) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  // Upload file to storage
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `receipts/${payment.event_id}/${payment.member_id}_${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, { contentType: file.type, upsert: true })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Update payment record
  const { error: updateError } = await supabase
    .from('event_payments')
    .update({ receipt_path: fileName, receipt_name: file.name, updated_at: new Date().toISOString() })
    .eq('id', paymentId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, receipt_path: fileName })
}
