import * as XLSX from 'xlsx'

const INCOME_EXPLICIT = ['收入', '收', 'income', '入']
const INCOME_IMPLICIT = ['團費', '赞助', '贊助', '捐款', '资助', '補助', '会费', '會費', '基金', '獎學金', '奖学金']
const EXPENSE_EXPLICIT = ['支出', '支', 'expense', '出']
const EXPENSE_IMPLICIT = ['购买', '購買', '支付', '付款', '采购', '採購', '租金']
const SUMMARY_KEYWORDS = ['合计', '合計', '總計', '总计', '小计', '小計', 'total', 'sum', '結餘', '结余']
const CATEGORY_KEYWORDS = ['場地', '场地', '交通', '物資', '物资', '餐飲', '餐饮', '獎品', '奖品', '印刷', '團費', '团费', '贊助', '赞助', '住宿', '保險', '保险', '醫藥', '医药', '租金', '裝修', '装修']

export function parseExcelTransactions(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const transactions: any[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })
    if (rows.length < 2) continue

    const firstRowHasNumbers = rows[0].some((c: any) => typeof c === 'number' && !isNaN(c))
    const startRow = firstRowHasNumbers ? 0 : 1

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.every((c: any) => c === undefined || c === null || c === '')) continue

      const texts: string[] = []
      const nums: number[] = []
      let hasSummaryWord = false

      for (let j = 0; j < row.length; j++) {
        const cell = row[j]
        if (cell === undefined || cell === null || cell === '') continue
        const str = String(cell).trim()
        if (SUMMARY_KEYWORDS.some(k => str.includes(k))) { hasSummaryWord = true }
        const num = parseFloat(str)
        if (!isNaN(num)) { nums.push(num) }
        else if (str.length > 0) { texts.push(str) }
      }

      if (hasSummaryWord && texts.length <= 1) continue
      if (nums.length === 0) continue

      // Step 3: Find amount — skip sequence numbers (1-3) and year-like numbers (2000-2099)
      const candidates = nums
        .filter(n => n > 3 || nums.length === 1)           // Don't skip if it's the only number
        .filter(n => n < 1900 || n > 2100 || nums.length === 1) // Don't skip year if it's the only number
      const amount = Math.abs(candidates.length > 0 ? candidates.reduce((a, b) => Math.abs(a) > Math.abs(b) ? a : b) : nums.reduce((a, b) => Math.abs(a) > Math.abs(b) ? a : b))

      // Step 4: Type detection — explicit > implicit > character-based
      const allText = texts.join(' ')
      const hasIncomeExplicit = INCOME_EXPLICIT.some(k => allText.includes(k))
      const hasExpenseExplicit = EXPENSE_EXPLICIT.some(k => allText.includes(k))
      const hasIncomeImplicit = INCOME_IMPLICIT.some(k => allText.includes(k))
      const hasExpenseImplicit = EXPENSE_IMPLICIT.some(k => allText.includes(k))

      let type: 'income' | 'expense' = 'expense'
      if (hasIncomeExplicit) {
        type = 'income'
      } else if (hasExpenseExplicit) {
        type = 'expense'
      } else if (hasIncomeImplicit && !hasExpenseImplicit) {
        type = 'income'
      } else if (hasExpenseImplicit) {
        type = 'expense'
      } else {
        // Fallback: check short text for character hints
        const shortTexts = texts.filter(t => t.length <= 6).join('')
        if (shortTexts.includes('收') || shortTexts.includes('入') || shortTexts.includes('捐')) type = 'income'
        else if (shortTexts.includes('費') || shortTexts.includes('费') || shortTexts.includes('支')) type = 'expense'
      }

      let category = ''
      for (const t of texts) {
        if (t === '收入' || t === '支出' || t === '收' || t === '支' || t === 'income' || t === 'expense') continue
        if (/^\d{1,2}[\/\-]\d{1,2}/.test(t) || /^\d{4}[\/\-]\d{1,2}/.test(t)) continue
        const matchedCat = CATEGORY_KEYWORDS.find(k => t.includes(k))
        if (matchedCat) { category = t; break }
      }
      if (!category) {
        category = texts.find(t => {
          if (t === '收入' || t === '支出' || t === '收' || t === '支') return false
          if (/^\d/.test(t)) return false
          return t.length >= 1
        }) || '其他'
      }
      if (category.length > 20) category = category.slice(0, 20)

      const description = texts
        .filter(t => t !== category && t !== '收入' && t !== '支出' && t !== '收' && t !== '支')
        .sort((a, b) => b.length - a.length)[0] || ''
      const finalDesc = description.includes(category) ? '' : description

      transactions.push({ type, category: category || '其他', amount: Math.abs(amount), description: finalDesc })
    }
  }

  return transactions
}
