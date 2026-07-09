import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(cs => cookieStore.set(cs.name, cs.value, cs.options)) } catch {} } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('position').eq('id', user.id).single()
  if (!profile?.position) {
    return NextResponse.json({ error: '僅限執委會成員操作' }, { status: 403 })
  }

  const formData = await request.formData()
  const eventId = formData.get('eventId') as string
  const docType = formData.get('docType') as string // 'finance' or 'photo'
  const file = formData.get('file') as File

  if (!eventId || !docType || !file) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  const filePath = `events/${eventId}/${docType}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const updateData: Record<string, string> = {}
  if (docType === 'finance') {
    updateData.finance_doc_path = filePath
    updateData.finance_doc_name = file.name
  } else if (docType === 'minutes') {
    updateData.minutes_doc_path = filePath
    updateData.minutes_doc_name = file.name
  } else if (docType === 'agenda') {
    updateData.agenda_doc_path = filePath
    updateData.agenda_doc_name = file.name
  } else {
    updateData.photo_doc_path = filePath
    updateData.photo_doc_name = file.name
  }

  const { error: updateError } = await supabase.from('events').update(updateData).eq('id', eventId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Auto-parse Excel finance report
  let parsedCount = 0
  if (docType === 'finance' && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })

      if (rows.length >= 2) {
        const header = rows[0] as string[]
        const findCol = (names: string[]) => {
          for (const n of names) {
            const idx = header.findIndex(h => h && h.toString().trim() === n)
            if (idx >= 0) return idx
          }
          return -1
        }
        const typeCol = findCol(['類型', '类型', '收支', 'type'])
        const catCol = findCol(['項目', '项目', '类别', '分類', 'category'])
        const amountCol = findCol(['金額', '金额', 'amount', '費用', '费用'])
        const descCol = findCol(['備註', '备注', '说明', 'description', '摘要'])

        const transactions: any[] = []
        for (const row of rows.slice(1)) {
          if (!row || row.every((c: any) => !c)) continue
          const type = typeCol >= 0 ? String(row[typeCol] || '').trim() : ''
          const category = catCol >= 0 ? String(row[catCol] || '').trim() : '其他'
          const amount = amountCol >= 0 ? parseFloat(String(row[amountCol] || '0')) : 0
          const description = descCol >= 0 ? String(row[descCol] || '').trim() : ''

          if (!amount || isNaN(amount)) continue

          let finalType: 'income' | 'expense' = 'expense'
          const t = type.toLowerCase()
          if (t.includes('收') || t === 'income' || t.includes('入')) finalType = 'income'
          else if (category.includes('收入') || category.includes('團費') || category.includes('赞助') || category.includes('贊助')) finalType = 'income'

          transactions.push({
            event_id: eventId,
            type: finalType,
            category: category || '其他',
            amount: Math.abs(amount),
            description,
            created_by: user.id,
          })
        }

        if (transactions.length > 0) {
          await supabase.from('event_transactions').insert(transactions)
          parsedCount = transactions.length
        }
      }
    } catch {
      // Silently ignore parse errors — file still uploaded successfully
    }
  }

  return NextResponse.json({ success: true, parsedCount })
}
