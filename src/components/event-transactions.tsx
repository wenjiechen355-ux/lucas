'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react'

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

  useEffect(() => { loadTxns() }, [])

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

  async function handleDelete(id: string) {
    if (!confirm('確定刪除此記錄？')) return
    await supabase.from('event_transactions').delete().eq('id', id)
    loadTxns()
  }

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
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
            {showAdd ? '取消' : <><Plus className="w-3.5 h-3.5" /> 新增記錄</>}
          </button>
        )}
      </div>

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
          {txns.map(t => (
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
          ))}
        </div>
      )}
    </div>
  )
}
