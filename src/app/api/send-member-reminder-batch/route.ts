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

  const { memberIds, type, targetTitle, link } = await request.json()
  if (!memberIds?.length || !type || !targetTitle) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  const { data: members } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', memberIds)

  if (!members?.length) {
    return NextResponse.json({ error: '找不到成員' }, { status: 404 })
  }

  const typeLabel = type === 'poll' ? '活動時間徵集' : '活動出席'
  const actionText = type === 'poll'
    ? '請盡快登入系統進行投票，以便確定活動安排。'
    : '請登入系統檢查活動詳情並確認出席狀態。'

  let sent = 0
  let failed = 0

  const results = await Promise.allSettled(
    members
      .filter(m => m.email)
      .map(member => {
        const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:12px">
          <h2 style="color:#16a34a">澳門童軍管理系統</h2>
          <p>👋 ${member.full_name || '成員'}，你好！</p>
          <p>溫馨提醒，以下${typeLabel}需要你嘅參與：</p>
          <div style="background:#f0fdf4;padding:12px;border-radius:8px;margin:12px 0"><b>${targetTitle}</b></div>
          <p>${actionText}</p>
          ${link ? `<a href="${link}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:8px">前往查看</a>` : ''}
          <p style="color:#888;font-size:12px;margin-top:16px">此郵件由系統自動發送，請勿回覆。</p>
        </div>`
        const text = `澳門童軍管理系統\n\n${member.full_name || '成員'}，你好！\n\n溫馨提醒，以下${typeLabel}需要你嘅參與：\n\n${targetTitle}\n\n${actionText}${link ? '\n\n前往查看: ' + link : ''}\n\n此郵件由系統自動發送，請勿回覆。`
        return sendEmail({ to: member.email, subject: `【${typeLabel}提醒】${targetTitle}`, html, text })
      })
  )

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.success) sent++
    else failed++
  }

  return NextResponse.json({ success: true, sent, failed, total: members.length })
}
