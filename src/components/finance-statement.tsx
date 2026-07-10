'use client'

import { useState } from 'react'
import { ListFilter, Printer } from 'lucide-react'

interface Txn {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  created_at: string
  events?: { title: string; event_date: string | null }
}

export default function FinanceStatement({ transactions }: { transactions: Txn[] }) {
  const [showStatement, setShowStatement] = useState(false)

  // Sort by date ascending for statement view
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Running balance
  let runningBalance = 0
  const withBalance = sorted.map(t => {
    if (t.type === 'income') runningBalance += Number(t.amount)
    else runningBalance -= Number(t.amount)
    return { ...t, balance: runningBalance }
  })

  const totalIncome = sorted.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = sorted.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  if (!showStatement) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setShowStatement(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ListFilter className="w-4 h-4" /> 顯示詳細收支明細
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatement(false)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ← 返回概覽
          </button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">收支明細表</h2>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> 列印
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="glass-card rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">總收入</p>
          <p className="text-lg font-bold text-green-600">MOP {totalIncome.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">總支出</p>
          <p className="text-lg font-bold text-red-600">MOP {totalExpense.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">結餘</p>
          <p className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            MOP {(totalIncome - totalExpense).toFixed(2)}
          </p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">記錄數</p>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{sorted.length}</p>
        </div>
      </div>

      {/* Detailed table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">日期</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">活動</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">類別</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">說明</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase w-28">收入</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase w-28">支出</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase w-28">結餘</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {withBalance.map((t, i) => (
                <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString('zh-HK')}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {t.events?.title || '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.type === 'income'
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs max-w-[150px] truncate">
                    {t.description || '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-green-600 dark:text-green-400">
                    {t.type === 'income' ? `MOP ${Number(t.amount).toFixed(2)}` : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-red-600 dark:text-red-400">
                    {t.type === 'expense' ? `MOP ${Number(t.amount).toFixed(2)}` : ''}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono text-xs ${
                    t.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    MOP {t.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-800/80 font-bold">
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300" colSpan={4}>合計</td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">MOP {totalIncome.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">MOP {totalExpense.toFixed(2)}</td>
                <td className={`px-4 py-3 text-right text-lg ${
                  totalIncome - totalExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  MOP {(totalIncome - totalExpense).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="p-12 text-center text-sm text-gray-400">未有收支記錄</div>
        )}
      </div>
    </div>
  )
}
