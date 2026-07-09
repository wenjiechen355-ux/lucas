import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })

  if (rows.length < 2) return NextResponse.json({ error: 'Empty sheet' }, { status: 400 })

  // Try to identify columns by header
  const header = rows[0] as string[]
  const dataRows = rows.slice(1)

  // Map common Chinese/English column names
  const findCol = (names: string[]) => {
    for (const n of names) {
      const idx = header.findIndex(h => h && h.toString().trim() === n)
      if (idx >= 0) return idx
    }
    return -1
  }

  const typeCol = findCol(['類型', '类型', '收支', '類別', 'type', '收入/支出'])
  const catCol = findCol(['項目', '项目', '类别', '類別', 'category', '分類', '分类'])
  const amountCol = findCol(['金額', '金额', 'amount', '費用', '费用', '总额', '總額'])
  const descCol = findCol(['備註', '备注', '说明', '說明', 'description', '摘要', '详情', '詳情'])

  // If no header match, try position-based
  const transactions: any[] = []
  for (const row of dataRows) {
    if (!row || row.every((c: any) => !c)) continue // skip empty rows

    const type = typeCol >= 0 ? String(row[typeCol] || '').trim() : ''
    const category = catCol >= 0 ? String(row[catCol] || '').trim() : ''
    const amount = amountCol >= 0 ? parseFloat(String(row[amountCol] || '0')) : 0
    const description = descCol >= 0 ? String(row[descCol] || '').trim() : ''

    // Try position-based if no headers matched
    if (typeCol < 0 && amountCol < 0) {
      // Guess: col 0 = category, col 1 = amount/type
      const col0 = String(row[0] || '').trim()
      const col1 = String(row[1] || '').trim()
      const col2 = String(row[2] || '').trim()

      let amt = parseFloat(col1)
      let tp = 'expense'
      if (isNaN(amt)) {
        amt = parseFloat(col2)
        if (isNaN(amt)) continue
        tp = col1.includes('收') ? 'income' : 'expense'
      }

      transactions.push({
        type: tp,
        category: col0 || '其他',
        amount: Math.abs(amt),
        description: col2 || '',
      })
      continue
    }

    // Determine type
    let finalType: 'income' | 'expense' = 'expense'
    const typeLower = type.toLowerCase()
    if (typeLower.includes('收') || typeLower === 'income' || typeLower.includes('入')) finalType = 'income'
    else if (category.includes('收入') || category.includes('收') || category.includes('團費') || category.includes('赞助') || category.includes('贊助')) finalType = 'income'
    else if (typeLower.includes('支') || typeLower === 'expense' || typeLower.includes('出')) finalType = 'expense'

    if (!amount || isNaN(amount)) continue

    transactions.push({
      type: finalType,
      category: category || '其他',
      amount: Math.abs(amount),
      description,
    })
  }

  return NextResponse.json({ transactions, header, dataRows: dataRows.slice(0, 5) })
}
