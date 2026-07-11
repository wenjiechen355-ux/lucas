import { NextRequest, NextResponse } from 'next/server'
import { parseExcelTransactions } from '@/lib/excel-parser'
import { aiParseExcel } from '@/lib/excel-ai-parser'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  // Try AI parser first, fall back to keyword parser
  const { transactions, usedAI } = await aiParseExcel(buffer)

  if (transactions.length === 0) {
    // Final fallback — keyword parser
    const fallback = parseExcelTransactions(buffer)
    if (fallback.length === 0) {
      return NextResponse.json({ error: '無法識別任何收支數據，請確認 Excel 包含數字金額欄位' }, { status: 400 })
    }
    return NextResponse.json({ transactions: fallback, usedAI: false })
  }

  return NextResponse.json({ transactions, usedAI })
}
