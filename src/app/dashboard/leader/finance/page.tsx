import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react'

export default async function FinancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const isLeaderOrExec = profile?.role === 'leader' || !!profile?.position
  if (!isLeaderOrExec) redirect('/dashboard')

  // Get all transactions with event info
  const { data: transactions } = await supabase
    .from('event_transactions')
    .select('*, events!inner(title, event_date)')
    .order('created_at', { ascending: false })

  if (!transactions) return <div>Loading...</div>

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpense

  // Quarterly grouping
  const quarterly: Record<string, { income: number; expense: number; txns: typeof transactions }> = {}
  transactions.forEach(t => {
    const d = new Date(t.created_at)
    const q = `${d.getFullYear()} Q${Math.ceil((d.getMonth() + 1) / 3)}`
    if (!quarterly[q]) quarterly[q] = { income: 0, expense: 0, txns: [] }
    quarterly[q].txns.push(t)
    if (t.type === 'income') quarterly[q].income += Number(t.amount)
    else quarterly[q].expense += Number(t.amount)
  })

  const sortedQuarters = Object.entries(quarterly).sort((a, b) => b[0].localeCompare(a[0]))

  // Event grouping
  const eventsMap: Record<string, { title: string; date: string | null; income: number; expense: number }> = {}
  transactions.forEach(t => {
    const e = (t as any).events
    if (!e) return
    const key = t.event_id
    if (!eventsMap[key]) eventsMap[key] = { title: e.title, date: e.event_date, income: 0, expense: 0 }
    if (t.type === 'income') eventsMap[key].income += Number(t.amount)
    else eventsMap[key].expense += Number(t.amount)
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-emerald-600" /> 財政管理
      </h1>

      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">總收入</span>
          </div>
          <p className="text-2xl font-bold text-green-600">MOP {totalIncome.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs text-gray-500">總支出</span>
          </div>
          <p className="text-2xl font-bold text-red-600">MOP {totalExpense.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs text-gray-500">總結餘</span>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            MOP {balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Quarterly reports */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> 季度報表
        </h2>
        <div className="space-y-3">
          {sortedQuarters.map(([q, data]) => {
            const divBal = data.income - data.expense
            return (
              <div key={q} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{q}</h3>
                  <span className={`text-sm font-bold ${divBal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {divBal >= 0 ? '+' : ''}MOP {divBal.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-6 text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <ArrowUpCircle className="w-3.5 h-3.5" /> 收入 MOP {data.income.toFixed(2)}
                  </span>
                  <span className="text-red-600 flex items-center gap-1">
                    <ArrowDownCircle className="w-3.5 h-3.5" /> 支出 MOP {data.expense.toFixed(2)}
                  </span>
                  <span className="text-gray-400">{data.txns.length} 筆記錄</span>
                </div>
              </div>
            )
          })}
          {sortedQuarters.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center text-sm text-gray-400">未有季度數據</div>
          )}
        </div>
      </div>

      {/* Per-event breakdown */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">各活動收支</h2>
        <div className="space-y-2">
          {Object.entries(eventsMap).map(([eventId, data]) => (
            <a key={eventId} href={`/dashboard/leader/attendance/${eventId}`}
              className="glass-card rounded-xl p-4 flex items-center justify-between hover:ring-2 hover:ring-emerald-300 dark:hover:ring-emerald-700 transition-all block">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{data.title}</p>
                <p className="text-xs text-gray-400">
                  {data.date ? new Date(data.date).toLocaleDateString('zh-HK') : '日期待定'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${data.income - data.expense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  MOP {(data.income - data.expense).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  收 {data.income.toFixed(0)} / 支 {data.expense.toFixed(0)}
                </p>
              </div>
            </a>
          ))}
          {Object.keys(eventsMap).length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center text-sm text-gray-400">未有活動收支數據</div>
          )}
        </div>
      </div>
    </div>
  )
}
