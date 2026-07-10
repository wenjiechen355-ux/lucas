import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendSms } from '@/lib/sms'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {} } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { memberId, type, targetTitle, link } = await request.json()
  if (!memberId || !type || !targetTitle) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  // Check Twilio config
  if (!process.env.TWILIO_ACCOUNT_SID) {
    return NextResponse.json({ error: '尚未配置 SMS 服務 (Twilio)' }, { status: 400 })
  }

  // Get member info
  const { data: member, error: memberError } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', memberId)
    .single()

  if (memberError || !member?.phone) {
    return NextResponse.json({ error: '找不到該成員或缺少電話號碼' }, { status: 404 })
  }

  const typeLabel = type === 'poll' ? '活動時間徵集' : '活動出席'
  const body = [
    `【澳門童軍】${typeLabel}提醒`,
    `活動：${targetTitle}`,
    type === 'poll' ? '請登入系統進行投票。' : '請登入系統確認出席狀態。',
    link || '',
  ].filter(Boolean).join('\n')

  const sent = await sendSms(member.phone, body)

  if (!sent) {
    return NextResponse.json({ error: 'SMS 發送失敗' }, { status: 500 })
  }

  return NextResponse.json({ success: true, memberName: member.full_name })
}
