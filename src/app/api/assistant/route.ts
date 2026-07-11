import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as nodemailer from 'nodemailer'

// ── Tool definitions for AI function calling ──
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_event',
      description: '创建一个新的活动',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '活动名称' },
          description: { type: 'string', description: '活动描述（可选）' },
          event_date: { type: 'string', description: '活动日期 YYYY-MM-DD' },
          location: { type: 'string', description: '活动地点（可选）' },
          is_online: { type: 'boolean', description: '是否线上活动' },
          event_type: { type: 'string', enum: ['unit', 'joint', 'exchange'], description: '活动类型' },
          is_exec_meeting: { type: 'boolean', description: '是否执委会例会' },
        },
        required: ['title', 'event_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_notification',
      description: '发送邮件通知给成员',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['poll', 'attendance'], description: '通知类型' },
          targetTitle: { type: 'string', description: '活动/投票标题' },
          message: { type: 'string', description: '通知内容' },
        },
        required: ['type', 'targetTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_count',
      description: '查询系统中各类数据的数量统计',
      parameters: {
        type: 'object',
        properties: {
          entity: { type: 'string', enum: ['events', 'members', 'polls', 'transactions'], description: '要查询的实体' },
        },
        required: ['entity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: '查询近期活动列表',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: '未来天数，默认30' },
        },
      },
    },
  },
]

// ── Tool executor ──
async function executeTool(name: string, args: any, supabase: any, userId: string, userEmail: string) {
  switch (name) {
    case 'create_event': {
      const { error } = await supabase.from('events').insert({
        title: args.title,
        description: args.description || '',
        event_date: args.event_date,
        location: args.location || (args.is_online ? '線上' : ''),
        is_online: args.is_online || false,
        event_type: args.event_type || 'unit',
        is_exec_meeting: args.is_exec_meeting || false,
        is_exec_only: args.is_exec_meeting || false,
        created_by: userId,
        attendance_open: false,
      })
      if (error) return { success: false, error: error.message }
      return { success: true, message: `活动「${args.title}」已创建` }
    }

    case 'send_notification': {
      const { data: execMembers } = await supabase
        .from('profiles').select('email').not('position', 'is', null).not('email', 'is', null)
      if (!execMembers?.length) return { success: false, error: '找不到执委成员' }
      const transporter = nodemailer.createTransport({
        host: 'smtp.163.com', port: 465, secure: true,
        auth: { user: 'wenjiechen355@163.com', pass: 'VMp2hmkjuArFwcAn' },
      })
      try {
        await transporter.sendMail({
          from: '"澳門童軍管理系統" <wenjiechen355@163.com>',
          to: execMembers.map((m: { email: string }) => m.email).join(','),
          subject: `【${args.type === 'poll' ? '投票' : '活動'}通知】${args.targetTitle}`,
          html: `<div style="font-family:Arial;max-width:500px;margin:0 auto;padding:20px"><h2 style="color:#16a34a">澳門童軍管理系統</h2><p>${args.message || '有新通知，請登入系統查看。'}</p></div>`,
        })
        return { success: true, message: `已通知 ${execMembers.length} 位执委成员` }
      } catch (e: any) {
        return { success: false, error: e.message }
      }
    }

    case 'query_count': {
      let count = 0
      const entity = args.entity
      if (entity === 'events') {
        const { count: c } = await supabase.from('events').select('*', { count: 'exact', head: true })
        count = c || 0
      } else if (entity === 'members') {
        const { count: c } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        count = c || 0
      } else if (entity === 'polls') {
        const { count: c } = await supabase.from('event_polls').select('*', { count: 'exact', head: true })
        count = c || 0
      } else if (entity === 'transactions') {
        const { count: c } = await supabase.from('event_transactions').select('*', { count: 'exact', head: true })
        count = c || 0
      }
      return { success: true, count, message: `系统中有 ${count} 条${args.entity === 'members' ? '成员' : args.entity === 'events' ? '活动' : args.entity === 'polls' ? '投票' : '交易'}记录` }
    }

    case 'list_events': {
      const days = args.days || 30
      const today = new Date()
      const end = new Date(today.getTime() + days * 86400000)
      const { data } = await supabase.from('events')
        .select('title,event_date,location,is_online')
        .gte('event_date', today.toISOString().split('T')[0])
        .lte('event_date', end.toISOString().split('T')[0])
        .order('event_date')
        .limit(10)
      if (!data?.length) return { success: true, message: '最近没有活动' }
      const list = data.map((e: any) => `• ${e.title}（${e.event_date}，${e.is_online ? '線上' : e.location || '未指定'}）`).join('\n')
      return { success: true, message: `未来${days}天有 ${data.length} 个活动：\n${list}` }
    }

    default:
      return { success: false, error: '未知工具' }
  }
}

// ── Main handler ──
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {} } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { messages, authorized } = await request.json()
  if (!messages?.length) return NextResponse.json({ error: '缺少消息' }, { status: 400 })

  const apiKey = process.env.AGENDA_AI_API_KEY || 'sk-Oj0ejQ8e5akstfXY1jOql6dBxy5bKSVPID6UeK7fL1C523ay'
  if (!apiKey) {
    return NextResponse.json({ reply: '❌ AI 助手未配置 API Key，請在 Vercel 環境變數中設定 AGENDA_AI_API_KEY。' })
  }

  const apiUrl = process.env.AGENDA_AI_API_URL || 'https://api.silra.cn/v1/chat/completions'
  const model = 'deepseek-chat'

  const systemPrompt = `你係「澳門童軍第一旅執委會」嘅 AI 助手。

## 身份背景
- 你協助執委會成員管理活動、投票、成員通知等日常工作
- 你了解澳門童軍管理系統嘅所有功能：活動管理、出席打卡、投票系統、財政管理、成員提醒、公告管理 等

## 規則
1. 用繁體中文回答，語氣親切專業
2. 如果用戶要求執行操作（創建活動、發通知、查詢數據），${authorized ? '直接調用對應嘅工具函數' : '提示用戶需要先「授權AI助手」才能執行操作'}
3. 保持回答簡潔，唔需要過長解釋
4. 如果用戶嘅問題唔清楚，友善地問清楚`

  try {
    const body: any = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10),
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }

    // Only include tools if authorized
    if (authorized) {
      body.tools = TOOLS
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ reply: `AI 服務暫時不可用：${err.slice(0, 200)}` })
    }

    const data = await res.json()
    const message = data.choices?.[0]?.message

    if (!message) {
      return NextResponse.json({ reply: 'AI 沒有回應，請重試。' })
    }

    // Handle function calls
    if (message.tool_calls?.length) {
      const results: { name: string; result: any }[] = []

      for (const tc of message.tool_calls) {
        const args = JSON.parse(tc.function.arguments)
        const result = await executeTool(tc.function.name, args, supabase, user.id, user.email || '')
        results.push({ name: tc.function.name, result })
      }

      // Send tool results back to AI for natural language response
      const toolMessages = results.map(r => ({
        role: 'tool' as const,
        tool_call_id: message.tool_calls[results.indexOf(r)].id,
        content: JSON.stringify(r.result),
      }))

      const followUp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-10),
            message,
            ...toolMessages,
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      const followData = await followUp.json()
      const followMsg = followData.choices?.[0]?.message?.content || '操作已完成。'
      return NextResponse.json({ reply: followMsg, toolsUsed: results.map(r => r.name) })
    }

    return NextResponse.json({ reply: message.content || 'AI 沒有回應。' })
  } catch (e: any) {
    return NextResponse.json({ reply: `系統錯誤：${e.message}` })
  }
}
