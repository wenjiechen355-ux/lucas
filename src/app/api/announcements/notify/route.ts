import { NextRequest, NextResponse } from 'next/server'
import { notifyAll } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const { title, message } = await req.json()
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  await notifyAll({
    type: 'announcement',
    title: `新公告：${title}`,
    message: message || '',
    link: '/dashboard',
  })

  return NextResponse.json({ ok: true })
}
