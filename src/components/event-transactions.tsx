'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2, FileSpreadsheet, Check, ReceiptText, Paperclip, Upload } from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  created_at: string
}

const categories = ['團費', '贊助', '場地費', '物資', '交通', '餐飲', '獎品', '印刷', '其他']

export default function EventTransactions({ eventId, isExec }: { eventId: string; isExec: boolean }) {
  const supabase = createClient()
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{ type: 'income' | 'expense'; category: string; amount: string; description: string }>({ type: 'expense', category: '其他', amount: '', description: '' })

  // Excel upload state
  const [showExcelUpload, setShowExcelUpload] = useState(false)
  const [excelPreview, setExcelPreview] = useState<any[] | null>(null)
  const [parsing, setParsing] = useState(false)

  // Receipts
  const [receipts, setReceipts] = useState<Record<string, { id: string; file_name: string; file_path: string }>>({})
  const [uploadingReceipt, setUploadingReceipt] = useState<string | null>(null)
  const [showBatchReceipts, setShowBatchReceipts] = useState(false)

  useEffect(() => { loadTxns(); loadReceipts() }, [])

  async function loadTxns() {
    setLoading(true)
    const { data } = await supabase
      .from('event_transactions')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    setTxns(data || [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) return
    setSaving(true)
    const { error } = await supabase.from('event_transactions').insert({
      event_id: eventId,
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
    })
    if (!error) {
      setForm({ type: 'expense', category: '其他', amount: '', description: '' })
      setShowAdd(false)
      loadTxns()
    } else {
      alert('儲存失敗：' + error.message)
    }
    setSaving(false)
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/finance/parse-excel', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.transactions?.length) {
      setExcelPreview(data.transactions)
    } else {
      alert(data.error || '無法解析 Excel 檔案，請確認格式')
    }
    setParsing(false)
    e.target.value = ''
  }

  async function batchSave() {
    if (!excelPreview || excelPreview.length === 0) return
    setSaving(true)
    const inserts = excelPreview.map(t => ({
      event_id: eventId,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description || '',
    }))
    const { error } = await supabase.from('event_transactions').insert(inserts)
    if (!error) {
      setExcelPreview(null)
      setShowExcelUpload(false)
      loadTxns()
    } else {
      alert('批次儲存失敗：' + error.message)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('確定刪除此記錄？')) return
    await supabase.from('event_transactions').delete().eq('id', id)
    loadTxns()
  }

  async function loadReceipts() {
    const { data } = await supabase
      .from('event_receipts')
      .select('id, transaction_id, file_name, file_path')
      .eq('event_id', eventId)
    if (data) {
      const map: Record<string, any> = {}
      data.forEach(r => { map[r.transaction_id] = r })
      setReceipts(map)
    }
  }

  async function handleReceiptUpload(txnId: string, file: File) {
    setUploadingReceipt(txnId)
    const fd = new FormData()
    fd.append('transaction_id', txnId)
    fd.append('event_id', eventId)
    fd.append('file', file)
    const res = await fetch('/api/events/upload-receipt', { method: 'POST', body: fd })
    if (res.ok) {
      loadReceipts()
    } else {
      const data = await res.json()
      alert(data.error || '上載失敗')
    }
    setUploadingReceipt(null)
  }

  // Bulk receipt upload: suggest best match
  function autoMatch(category: string): string | null {
    // Find an unmatched transaction with the same category
    const match = txns.find(t =>
      t.category === category && !receipts[t.id] && t.type === 'expense'
    )
    return match?.id || null
  }

  const unreceiptedExpenses = txns.filter(t => t.type === 'expense' && !receipts[t.id])

  const totalIncome = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-600" /> 活動收支
          <span className="text-xs text-gray-400 font-normal">({txns.length})</span>
        </h3>
        {isExec && (
          <button onClick={() => { setShowAdd(!showAdd); setShowExcelUpload(false) }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
            {showAdd ? '取消' : <><Plus className="w-3.5 h-3.5" /> 新增記錄</>}
          </button>
        )}
      </div>

      {/* Bulk receipt upload */}
      {isExec && unreceiptedExpenses.length > 0 && (
        <div className="mb-3">
          {!showBatchReceipts ? (
            <button onClick={() => setShowBatchReceipts(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-600 transition-colors">
              <ReceiptText className="w-3.5 h-3.5" /> 上載單據（{unreceiptedExpenses.length} 筆支出未有單據）
            </button>
          ) : (
            <div className="p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-400 flex items-center gap-1">
                  <ReceiptText className="w-3.5 h-3.5" /> 上載單據 — 自動匹配
                </span>
                <button onClick={() => setShowBatchReceipts(false)}
                  className="text-xs text-gray-400 hover:text-gray-600">取消</button>
              </div>
              <p className="text-xs text-gray-500">選擇單據圖片/PDF，系統自動匹配對應支出項目</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {unreceiptedExpenses.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded px-2 py-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-600 font-medium">-MOP {t.amount.toFixed(2)}</span>
                      <span className="text-gray-600 dark:text-gray-400">{t.category}</span>
                      {t.description && <span className="text-gray-400 truncate max-w-[100px]">{t.description}</span>}
                    </div>
                    <label className={`cursor-pointer flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      uploadingReceipt === t.id ? 'bg-gray-100 text-gray-400' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {uploadingReceipt === t.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> 上載中</>
                      ) : (
                        <><Upload className="w-3 h-3" /> 上載</>
                      )}
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" className="hidden"
                        disabled={uploadingReceipt === t.id}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(t.id, f) }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Excel upload for exec */}
      {isExec && !showAdd && (
        <div className="mb-3">
          {!showExcelUpload ? (
            <button onClick={() => setShowExcelUpload(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5" /> 上載 Excel 財務報告自動匯入
            </button>
          ) : (
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> 匯入 Excel 財務報告
                </span>
                <button onClick={() => { setShowExcelUpload(false); setExcelPreview(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600">取消</button>
              </div>
              <p className="text-xs text-gray-500">支援 .xlsx 格式，欄位：類型/項目/金額/備註</p>
              <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload}
                className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100" />

              {parsing && <p className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 解析中...</p>}

              {excelPreview && excelPreview.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">已識別 {excelPreview.length} 筆記錄：</p>
                  <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                    {excelPreview.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-white dark:bg-slate-800 rounded px-2 py-1">
                        <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {t.type === 'income' ? '+' : '-'}MOP {Number(t.amount).toFixed(2)}
                        </span>
                        <span className="text-gray-500">{t.category}</span>
                        {t.description && <span className="text-gray-400 truncate">{t.description}</span>}
                      </div>
                    ))}
                  </div>
                  <button onClick={batchSave} disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-600 disabled:opacity-50">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {saving ? '儲存中...' : `確認匯入 ${excelPreview.length} 筆`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="glass-card rounded-lg p-3 text-center">
          <ArrowUpCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-600">MOP {totalIncome.toFixed(0)}</p>
          <p className="text-xs text-gray-400">收入</p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <ArrowDownCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-600">MOP {totalExpense.toFixed(0)}</p>
          <p className="text-xs text-gray-400">支出</p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <Wallet className={`w-4 h-4 mx-auto mb-1 ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            MOP {balance.toFixed(0)}
          </p>
          <p className="text-xs text-gray-400">結餘</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, type: 'income' })}
              className={`flex-1 py-1.5 rounded text-sm font-medium ${form.type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
              💰 收入
            </button>
            <button type="button" onClick={() => setForm({ ...form, type: 'expense' })}
              className={`flex-1 py-1.5 rounded text-sm font-medium ${form.type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
              💸 支出
            </button>
          </div>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded text-sm">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="金額" className="w-24 px-3 py-1.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded text-sm" required />
          </div>
          <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="備註（可選）" className="w-full px-3 py-1.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded text-sm" />
          <button type="submit" disabled={saving}
            className="w-full bg-emerald-500 text-white py-2 rounded text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> 儲存中...</> : '儲存'}
          </button>
        </form>
      )}

      {/* Transaction list */}
      {loading ? (
        <div className="text-center py-6 text-sm text-gray-400">載入中...</div>
      ) : txns.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">未有收支記錄</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {txns.map(t => {
            const receipt = receipts[t.id]
            return (
            <div key={t.id} className="glass-card rounded-lg p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.category}</span>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}MOP {t.amount.toFixed(2)}
                  </span>
                  {/* Receipt badge */}
                  {t.type === 'expense' && (
                    receipt ? (
                      <a href={supabase.storage.from('documents').getPublicUrl(receipt.file_path).data.publicUrl}
                        target="_blank" title={receipt.file_name}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Paperclip className="w-3 h-3" /> 單據
                      </a>
                    ) : isExec ? (
                      <label className="cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-700 text-gray-400 hover:text-purple-600">
                        <Upload className="w-3 h-3" /> 單據
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" className="hidden"
                          disabled={uploadingReceipt === t.id}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(t.id, f) }} />
                      </label>
                    ) : null
                  )}
                </div>
                {t.description && <p className="text-xs text-gray-500 truncate">{t.description}</p>}
                <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('zh-HK')}</p>
              </div>
              {isExec && (
                <button onClick={() => handleDelete(t.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
