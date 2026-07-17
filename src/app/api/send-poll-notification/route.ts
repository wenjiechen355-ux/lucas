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

  const { pollTitle, pollId, pollDesc } = await request.json()
  if (!pollTitle || !pollId) return NextResponse.json({ error: '參數不完整' }, { status: 400 })

  const { data: execMembers, error: execError } = await supabase
    .from('profiles')
    .select('email, full_name')
    .not('position', 'is', null)
    .not('email', 'is', null)

  if (execError || !execMembers?.length) {
    return NextResponse.json({ error: execError?.message || '找不到執委會成員' }, { status: 404 })
  }

  const pollUrl = `https://scout1venture.vercel.app/dashboard/event-polls`
  const subject = `【活動時間徵集】${pollTitle}`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:12px">
      <h2 style="color:#16a34a">澳門童軍管理系統</h2>
      <p>👋 各位執委會成員，你好！</p>
      <p>有新嘅<b>活動時間徵集</b>需要你投票：</p>
      <div style="background:#f0fdf4;padding:12px;border-radius:8px;margin:12px 0">
        <b>${pollTitle}</b>
        ${pollDesc ? `<p style="color:#666;margin:4px 0 0">${pollDesc}</p>` : ''}
      </div>
      <a href="${pollUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:8px">前往投票</a>
      <p style="color:#888;font-size:12px;margin-top:16px">此郵件由系統自動發送，請勿回覆。</p>
    </div>
  `

  const text = `澳門童軍管理系統\n\n各位執委會成員，你好！\n\n有新嘅活動時間徵集需要你投票：\n\n${pollTitle}${pollDesc ? '\n' + pollDesc : ''}\n\n前往投票: ${pollUrl}\n\n此郵件由系統自動發送，請勿回覆。`

  let sent = 0
  let failed = 0
  const results = await Promise.allSettled(
    execMembers.map(m => sendEmail({ to: m.email, subject, html, text }))
  )
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.success) sent++
    else failed++
  }

  return NextResponse.json({ success: true, sent, failed, count: execMembers.length })
}
