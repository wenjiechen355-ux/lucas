import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = require('pdf-parse')
    const data = await PDFParse(buffer)
    return data.text || ''
  } catch {
    throw new Error('無法解析 PDF 文件，請確認文件未加密且可讀取')
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch {
    throw new Error('無法解析 DOCX 文件')
  }
}

async function formatPlan(text: string): Promise<string | null> {
  // Fallback to hard-coded env (in case Vercel env not set)
  const apiKey = process.env.AGENDA_AI_API_KEY || 'sk-Oj0ejQ8e5akstfXY1jOql6dBxy5bKSVPID6UeK7fL1C523ay'
  if (!apiKey) return null

  const apiUrl = process.env.AGENDA_AI_API_URL || 'https://api.silra.cn/v1/chat/completions'
  const model = 'deepseek-chat'

  const systemPrompt = `你係一個活動計劃書格式調整專家。請根據以下計劃書內容，重新整理格式，輸出一份結構清晰、格式統一嘅計劃書。

## 格式調整規則（非常重要）：
1. **保留所有原始資訊** — 唔可以刪除或編造任何內容，淨係重新組織排版
2. **統一格式結構** — 將內容整理成以下標準章節：
   - 📋 **活動基本資訊** — 名稱、日期、時間、地點、對象
   - 🎯 **活動目的／目標**
   - 👥 **負責人員及分工** — 活動負責人、各組別分工
   - ⏱ **活動流程／時間表** — 逐項列出時間、內容、負責人
   - 💰 **財務預算** — 收入/支出項目、金額
   - 📦 **物資清單**
   - ⚠️ **注意事項／風險評估**
3. 用**繁體中文**、**正式書面語**
4. 如果原計劃書有嘅資料但唔屬於以上章節，放喺「其他事項」
5. 數字、日期、金額要保留原樣
6. **唔可以加新內容**，只係重新組織排版

## 輸出格式：
用 Markdown 格式輸出，章節標題用 ##，子項用 - 或 1. 2. 3.`

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `請重新整理格式以下計劃書：\n\n${text}` },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    })

    if (!res.ok) {
      console.error('AI format error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (e) {
    console.error('AI format failed:', e)
    return null
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) {
          try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登錄' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('position').eq('id', user.id).single()
  if (!profile?.position) {
    return NextResponse.json({ error: '僅限執委會成員操作' }, { status: 403 })
  }

  const { eventId } = await request.json()
  if (!eventId) {
    return NextResponse.json({ error: '缺少 eventId' }, { status: 400 })
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('plan_doc_path, plan_doc_name')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: '活動不存在' }, { status: 404 })
  }

  if (!event.plan_doc_path) {
    return NextResponse.json({ error: '尚未上載計劃書' }, { status: 400 })
  }

  // Download file
  const { data: fileData, error: downloadError } = await supabase
    .storage
    .from('documents')
    .download(event.plan_doc_path)

  if (downloadError || !fileData) {
    return NextResponse.json({ error: '無法讀取計劃書' }, { status: 500 })
  }

  const fileName = event.plan_doc_name || ''
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const buffer = Buffer.from(await fileData.arrayBuffer())

  let extractedText = ''
  try {
    if (ext === 'pdf') {
      extractedText = await extractPdfText(buffer)
    } else if (ext === 'docx' || ext === 'doc') {
      extractedText = await extractDocxText(buffer)
    } else if (ext === 'txt') {
      extractedText = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: `不支援嘅格式: .${ext}` }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '文字提取失敗' }, { status: 500 })
  }

  if (!extractedText.trim()) {
    return NextResponse.json({ error: '無法從文件中提取文字' }, { status: 400 })
  }

  // Store raw text if not already
  await supabase.from('events').update({
    plan_raw_text: extractedText,
    plan_analysis_status: 'text_extracted',
  }).eq('id', eventId)

  // AI format
  const formatted = await formatPlan(extractedText)
  if (!formatted) {
    return NextResponse.json({ error: 'AI 格式調整失敗' }, { status: 500 })
  }

  // Store formatted content
  await supabase.from('events').update({ plan_formatted: formatted }).eq('id', eventId)

  return NextResponse.json({
    success: true,
    formatted,
  })
}
