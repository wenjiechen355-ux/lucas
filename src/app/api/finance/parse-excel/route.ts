import { NextRequest, NextResponse } from 'next/server'
import { parseExcelTransactions } from '@/lib/excel-parser'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const transactions = parseExcelTransactions(buffer)

  if (transactions.length === 0) {
    return NextResponse.json({ error: '無法識別任何收支數據，請確認 Excel 包含數字金額欄位' }, { status: 400 })
  }

  return NextResponse.json({ transactions })
}

