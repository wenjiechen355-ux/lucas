import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Plus, CheckCircle2, Circle, Loader2, Upload, Clock, FileText, ArrowRight } from 'lucide-react'

export default async function ProgressPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user?.id).single()

  let progressItems: any[] = []

  // 所有人都只睇到自己嘅進度
  const { data } = await supabase
    .from('progress_items')
    .select('*')
    .eq('member_id', profile?.id)
    .order('created_at', { ascending: false })
  progressItems = data || []

  const categories = [...new Set(progressItems.map(p => p.category || '未分類'))]

  function statusConfig(status: string, docStatus?: string) {
    if (status === 'completed') return { icon: CheckCircle2, color: 'text-green-500', label: '已完成', bg: 'bg-green-50 text-green-700' }
    if (docStatus === 'pending') return { icon: Clock, color: 'text-amber-500', label: '待審批', bg: 'bg-amber-50 text-amber-700' }
    if (docStatus === 'rejected') return { icon: Loader2, color: 'text-red-500', label: '已退回', bg: 'bg-red-50 text-red-700' }
    return { icon: Loader2, color: 'text-blue-500', label: '進行中', bg: 'bg-blue-50 text-blue-700' }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">進度記錄</h1>
          <p className="text-gray-500 mt-1">追蹤各項任務與技能進展</p>
        </div>
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{progressItems.length}</p>
          <p className="text-sm text-gray-500 mt-1">總項目</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {progressItems.filter(p => p.status === 'completed').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">已完成</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {progressItems.filter(p => p.status === 'in_progress').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">進行中</p>
        </div>
      </div>

      {/* 按分类显示 */}
      {categories.map(cat => {
        const items = progressItems.filter(p => (p.category || '未分類') === cat)
        return (
          <div key={cat} className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">{cat}</h3>
            <div className="space-y-2">
              {items.map(item => {
                const config = statusConfig(item.status, item.document_status)
                const Icon = config.icon
                return (
                  <a key={item.id} href={`/dashboard/progress/${item.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color} ${item.status === 'in_progress' && item.document_status !== 'pending' ? 'animate-spin' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
                              {config.label}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-300" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {item.completed_date && <span>完成於 {new Date(item.completed_date).toLocaleDateString('zh-HK')}</span>}
                          {item.completed_date && <span>完成於 {new Date(item.completed_date).toLocaleDateString('zh-HK')}</span>}
                          {item.document_name && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{item.document_name}</span>}
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })}

      {progressItems.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Circle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">暫無進度記錄</h3>
          <p className="text-sm text-gray-500">尚未有任何進度項目</p>
        </div>
      )}
    </div>
  )
}
