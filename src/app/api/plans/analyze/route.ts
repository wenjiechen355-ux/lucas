import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Extract text from PDF buffer
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
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
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch {
    throw new Error('無法解析 DOCX 文件')
  }
}

// AI analysis via DeepSeek API
async function analyzePlan(text: string): Promise<string | null> {
  const apiKey = process.env.AGENDA_AI_API_KEY
  if (!apiKey) return null

  const apiUrl = process.env.AGENDA_AI_API_URL || 'https://api.silra.cn/v1/chat/completions'
  const model = 'deepseek-chat'

  const systemPrompt = `你係一個活動計劃書分析及評審助手。請根據以下計劃書內容，先作出整體評價，再提取詳細資訊。

## 輸出格式（非常重要）：
**第一部份 — 整體評價**
用以下格式輸出：
---
## ✅ 整體評價
**評分：** [0-100]
**結果：** ✅ 合格 / ❌ 需要修改
**簡評：** [一句總結計劃書質量]
**改進建議：**
- [建議1]
- [建議2]
- [建議3]
---

**第二部份 — 詳細分析**
然後按以下結構輸出詳細分析：
- 📋 **活動基本資訊**（名稱、日期、時間、地點）
- 👥 **負責人員**（活動負責人、各組別/環節負責人）
- ⏱ **活動流程**（逐項列出時間 + 內容 + 負責人）
- 💰 **財務預算**（收入/支出項目、金額、合計）
- 📦 **物資清單**（如有列出）
- ⚠️ **風險/備註**（如有列出）

## 分析規則：
1. 用**繁體中文**輸出
2. 如果某項資訊搵唔到，標示「（未註明）」，唔好作
3. 數字（金額、日期、時間、人數）要準確提取
4. 保持原始事項嘅編號或排序
5. 唔可以刪除或編造任何內容`

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
          { role: 'user', content: `請分析以下活動計劃書：\n\n${text}` },
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

// Completeness check — returns JSON: { is_complete, missing[], score }
async function checkCompleteness(text: string): Promise<string | null> {
  const apiKey = process.env.AGENDA_AI_API_KEY
  if (!apiKey) return null

  const apiUrl = process.env.AGENDA_AI_API_URL || 'https://api.silra.cn/v1/chat/completions'
  const model = 'deepseek-chat'

  const systemPrompt = `你係一個計劃書完整性檢查專家。請根據以下計劃書內容，逐一檢查以下項目係咪有提及。

## 檢查項目：
1. **基本資訊** — 活動名稱、日期、時間、地點
2. **活動流程** — 逐項時間表 / 活動環節
3. **負責人員** — 每個環節嘅負責人 / 組別分工
4. **財務預算** — 收入 / 支出項目、預算金額
5. **物資清單** — 需要嘅物資 / 器材

## 輸出格式：
只輸出以下 JSON，唔可以有其他文字：
{
  "is_complete": true/false,
  "score": 0-100,
  "items": {
    "基本資訊": true/false,
    "活動流程": true/false,
    "負責人員": true/false,
    "財務預算": true/false,
    "物資清單": true/false
  },
  "missing": ["缺少嘅項目1", "缺少嘅項目2"],
  "detail": "簡短說明邊啲唔夠完整"
}`

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
          { role: 'user', content: `請檢查以下計劃書嘅完整性：\n\n${text}` },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    })

    if (!res.ok) {
      console.error('Completeness API error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || null
    if (!content) return null

    // Try to extract JSON from response (in case it's wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    return jsonMatch ? jsonMatch[0] : content
  } catch (e) {
    console.error('Completeness check failed:', e)
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

  // Fetch event with plan path
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

  // Download file from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase
    .storage
    .from('documents')
    .download(event.plan_doc_path)

  if (downloadError || !fileData) {
    return NextResponse.json({ error: '無法讀取計劃書: ' + downloadError?.message }, { status: 500 })
  }

  // Extract text based on file extension
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

  // Store raw text status
  const updateData: Record<string, any> = {
    plan_raw_text: extractedText,
    plan_analysis_status: 'text_extracted',
  }

  // Try AI analysis
  const analysis = await analyzePlan(extractedText)
  if (analysis) {
    updateData.plan_analysis = analysis
    updateData.plan_analysis_status = 'analyzed'
    updateData.plan_analyzed_at = new Date().toISOString()
  }

  // Try completeness check
  const completeness = await checkCompleteness(extractedText)
  if (completeness) {
    updateData.plan_completeness = completeness
  }

  const { error: updateError } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Parse completeness for response
  let completenessData = null
  if (completeness) {
    try {
      completenessData = JSON.parse(completeness)
    } catch {}
  }

  return NextResponse.json({
    success: true,
    status: updateData.plan_analysis_status,
    rawTextLength: extractedText.length,
    hasAnalysis: !!analysis,
    completeness: completenessData,
  })
}
