import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email'

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

  const { data: member, error: memberError } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', memberId)
    .single()

  if (memberError || !member?.email) {
    return NextResponse.json({ error: '找不到該成員或缺少電郵' }, { status: 404 })
  }

  const typeLabel = type === 'poll' ? '活動時間徵集' : '活動出席'

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:12px">
      <h2 style="color:#16a34a">澳門童軍管理系統</h2>
      <p>👋 ${member.full_name || '成員'}，你好！</p>
      <p>溫馨提醒，以下${type === 'poll' ? '活動時間徵集' : '活動'}需要你嘅參與：</p>
      <div style="background:#f0fdf4;padding:12px;border-radius:8px;margin:12px 0">
        <b>${targetTitle}</b>
      </div>
      ${type === 'poll'
        ? '<p>請盡快登入系統進行投票，以便確定活動安排。</p>'
        : '<p>請登入系統檢查活動詳情並確認出席狀態。</p>'
      }
      ${link ? `<a href="${link}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:8px">前往查看</a>` : ''}
      <p style="color:#888;font-size:12px;margin-top:16px">此郵件由系統自動發送，請勿回覆。</p>
    </div>
  `

  const text = `澳門童軍管理系統\n\n${member.full_name || '成員'}，你好！\n\n溫馨提醒，以下${type === 'poll' ? '活動時間徵集' : '活動'}需要你嘅參與：\n\n${targetTitle}\n\n${type === 'poll' ? '請盡快登入系統進行投票，以便確定活動安排。' : '請登入系統檢查活動詳情並確認出席狀態。'}${link ? '\n\n前往查看: ' + link : ''}\n\n此郵件由系統自動發送，請勿回覆。`

  const result = await sendEmail({ to: member.email, subject: `【${typeLabel}提醒】${targetTitle}`, html, text })
  if (result.success) {
    return NextResponse.json({ success: true, memberName: member.full_name })
  }
  return NextResponse.json({ error: result.error }, { status: 500 })
}
