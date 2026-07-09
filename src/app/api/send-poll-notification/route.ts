import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as nodemailer from 'nodemailer'

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

  // Get all exec members (those with a position)
  const { data: execMembers, error: execError } = await supabase
    .from('profiles')
    .select('email, full_name')
    .not('position', 'is', null)
    .not('email', 'is', null)

  if (execError || !execMembers?.length) {
    return NextResponse.json({ error: execError?.message || '找不到執委會成員' }, { status: 404 })
  }

  const emails = execMembers.map(m => m.email).filter(Boolean)
  const pollUrl = `https://scout1venture.vercel.app/dashboard/event-polls`

  const transporter = nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: { user: 'wenjiechen355@163.com', pass: 'VMp2hmkjuArFwcAn' },
  })

  try {
    await transporter.sendMail({
      from: '"澳門童軍管理系統" <wenjiechen355@163.com>',
      to: emails.join(','),
      subject: `【活動時間徵集】${pollTitle}`,
      html: `
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
      `,
    })
    return NextResponse.json({ success: true, count: emails.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
