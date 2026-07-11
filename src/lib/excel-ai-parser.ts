/**
 * AI-powered Excel financial data parser.
 * Sends raw row data to DeepSeek (OpenAI-compatible) for intelligent parsing.
 * Falls back to keyword-based parser on failure.
 */
import { parseExcelTransactions } from './excel-parser'
import * as XLSX from 'xlsx'

export async function aiParseExcel(buffer: Buffer): Promise<{ transactions: any[]; usedAI: boolean }> {
  const apiKey = process.env.AGENDA_AI_API_KEY
  if (!apiKey) {
    // No AI key — use keyword parser
    return { transactions: parseExcelTransactions(buffer), usedAI: false }
  }

  // Extract raw rows as text for AI
  const rows: string[][] = []
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })
      for (const row of data) {
        if (row && !row.every((c: any) => c === undefined || c === null || c === '')) {
          rows.push(row.map((c: any) => String(c ?? '').trim()))
        }
      }
    }
  } catch {
    return { transactions: parseExcelTransactions(buffer), usedAI: false }
  }

  if (rows.length === 0) {
    return { transactions: [], usedAI: false }
  }

  // Build text representation
  const rowTexts = rows.map((r, i) => `Row${i}: ${r.join(' | ')}`).join('\n')

  const apiUrl = process.env.AGENDA_AI_API_URL || 'https://api.deepseek.com/chat/completions'
  const model = process.env.AGENDA_AI_MODEL || 'deepseek-chat'

  const systemPrompt = `你係一個財政數據分析助手。請根據以下 Excel 表格嘅原始數據，逐行分析並提取收支記錄。

## 分析規則：
1. 掃描每一行，判斷係「收入」(income) 定「支出」(expense)
2. 提取每行嘅金額（取絕對值）
3. 提取類別（category）：場地、交通、物資、餐飲、獎品、印刷、團費、贊助、住宿、保險、醫藥、租金、裝修、文具、郵費、其他 等等
4. 提取說明（description）：該行嘅文字描述
5. **忽略**合計行、標題行、空白行
6. 金額單位假設為澳門元(MOP)

## 輸出格式（JSON array）：
\`\`\`json
[
  {"type": "income", "category": "團費", "amount": 500, "description": "張三"},
  {"type": "expense", "category": "場地", "amount": 200, "description": "租用禮堂"}
]
\`\`\`

請**只輸出 JSON array**，唔好加任何解釋或 Markdown 標記。`

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
          { role: 'user', content: `請分析以下 Excel 數據，提取所有收支記錄：\n\n${rowTexts}` },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    })

    if (!res.ok) {
      return { transactions: parseExcelTransactions(buffer), usedAI: false }
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Parse JSON from AI response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return { transactions: parseExcelTransactions(buffer), usedAI: false }
    }

    const aiTransactions = JSON.parse(jsonMatch[0])
    if (!Array.isArray(aiTransactions) || aiTransactions.length === 0) {
      return { transactions: parseExcelTransactions(buffer), usedAI: false }
    }

    // Validate and clean each transaction
    const valid = aiTransactions
      .filter((t: any) => t.amount && !isNaN(t.amount) && (t.type === 'income' || t.type === 'expense'))
      .map((t: any) => ({
        type: t.type,
        category: t.category || '其他',
        amount: Math.abs(Number(t.amount)),
        description: t.description || '',
      }))

    if (valid.length === 0) {
      return { transactions: parseExcelTransactions(buffer), usedAI: false }
    }

    return { transactions: valid, usedAI: true }
  } catch {
    return { transactions: parseExcelTransactions(buffer), usedAI: false }
  }
}
