import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Extract text from PDF buffer
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse is CJS, use require
    const { PDFParse } = require('pdf-parse')
    const data = await PDFParse(buffer)
    return data.text || ''
  } catch {
    throw new Error('無法解析 PDF 文件，請確認文件未加密且可讀取')
  }
}

// Extract text from DOCX buffer
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    // mammoth is CJS, use require
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch {
    throw new Error('無法解析 DOCX 文件')
  }
}

// AI analysis via OpenAI-compatible API (DeepSeek default)
async function analyzeAgenda(text: string): Promise<string | null> {
  const apiKey = process.env.AGENDA_AI_API_KEY
  if (!apiKey) return null

  const apiUrl = process.env.AGENDA_AI_API_URL || 'https://api.silra.cn/v1/chat/completions'
  const model = 'deepseek-chat'

  const systemPrompt = `你係一個會議議程分析助手。請根據以下議程內容，提取並整理所有關鍵資訊。

## 分析規則（非常重要）：
1. **唔可以用固定格式** — 每份議程格式都可能唔同，你要靈活理解內容結構
2. 提取所有可以識別到嘅資訊：會議日期、時間、地點、出席人員、議程項目、討論事項、報告事項、動議、下次會議日期 等等
3. 用**繁體中文**輸出，保持專業會議用語
4. 如果某項資訊喺議程中搵唔到，唔好作，標示「（未註明）」
5. 保持原始事項嘅編號或排序

## 輸出格式指引：
用 Markdown 格式輸出，結構清晰易讀。建議結構（但可按內容靈活調整）：
- 會議基本資訊（標題、日期、時間、地點）
- 出席者 / 列席者
- 議程項目（逐項列出，保留原有編號）
- 討論/報告事項
- 其他事項
- 下次會議（如有註明）

請直接輸出分析結果，唔需要前言或解釋。`

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
          { role: 'user', content: `請分析以下會議議程：\n\n${text}` },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    })

    if (!res.ok) {
      console.error('AI API error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (e) {
    console.error('AI analysis failed:', e)
    return null
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) {
          try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {}
        },
      },
    }
  )

  // Auth check
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

  // Fetch event with agenda path
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('agenda_doc_path, agenda_doc_name')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: '活動不存在' }, { status: 404 })
  }

  if (!event.agenda_doc_path) {
    return NextResponse.json({ error: '尚未上載議程文件' }, { status: 400 })
  }

  // Download file from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase
    .storage
    .from('documents')
    .download(event.agenda_doc_path)

  if (downloadError || !fileData) {
    return NextResponse.json({ error: '無法讀取議程文件: ' + downloadError?.message }, { status: 500 })
  }

  // Extract text based on file extension
  const fileName = event.agenda_doc_name || ''
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
      return NextResponse.json({
        error: `不支援嘅文件格式: .${ext}。支援格式：PDF、DOCX、TXT`,
      }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '文字提取失敗' }, { status: 500 })
  }

  if (!extractedText.trim()) {
    return NextResponse.json({ error: '無法從文件中提取文字，文件可能為空白或僅含圖片' }, { status: 400 })
  }

  // Store raw text
  const updateData: Record<string, any> = {
    agenda_raw_text: extractedText,
    agenda_analysis_status: 'text_extracted',
  }

  // Try AI analysis
  const analysis = await analyzeAgenda(extractedText)
  if (analysis) {
    updateData.agenda_analysis = analysis
    updateData.agenda_analysis_status = 'analyzed'
    updateData.agenda_analyzed_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    status: updateData.agenda_analysis_status,
    rawTextLength: extractedText.length,
    hasAnalysis: !!analysis,
  })
}
