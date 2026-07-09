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

  const { type, title, reviewerId, link, submitterName } = await request.json()

  if (!reviewerId || !type || !title) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  const { data: reviewer } = await supabase.from('profiles').select('email,full_name').eq('id', reviewerId).single()
  if (!reviewer?.email) return NextResponse.json({ error: '找不到審核人資料' }, { status: 404 })

  const typeLabels: Record<string, string> = {
    progress: '進度審批',
    document: '文檔審批',
    event: '活動開始審批',
  }
  const typeLabel = typeLabels[type] || '審批'

  const transporter = nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: { user: 'wenjiechen355@163.com', pass: 'VMp2hmkjuArFwcAn' },
  })

  try {
    await transporter.sendMail({
      from: '"澳門童軍管理系統" <wenjiechen355@163.com>',
      to: reviewer.email,
      subject: `【${typeLabel}】${title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:12px">
          <h2 style="color:#16a34a">澳門童軍管理系統</h2>
          <p>👋 ${reviewer.full_name}，你好！</p>
          <p>${submitterName || '有成員'} 提交咗一份 <b>${typeLabel}</b>，需要你審核：</p>
          <div style="background:#f0fdf4;padding:12px;border-radius:8px;margin:12px 0">
            <b>${title}</b>
          </div>
          ${link ? `<a href="${link}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:8px">前往審核</a>` : ''}
          <p style="color:#888;font-size:12px;margin-top:16px">此郵件由系統自動發送，請勿回覆。</p>
        </div>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
