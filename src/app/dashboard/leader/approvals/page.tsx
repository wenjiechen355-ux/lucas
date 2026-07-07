import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Clock, CheckCircle, XCircle, FileText, ArrowRight } from 'lucide-react'

export default async function ApprovalsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('position').eq('id', user?.id).single()
  
  const isChair = profile?.position === '主席' || profile?.position === '副主席'
  if (!isChair) return <div className="text-center py-12 text-gray-500">無權限訪問</div>

  // 只取 document_status = 'pending' 的項目（待審批）
  const { data: pendingItems } = await supabase
    .from('progress_items')
    .select('*, profiles!progress_items_member_id_fkey(full_name,position)')
    .eq('document_status', 'pending')
    .order('updated_at', { ascending: false })
    .limit(50)

  // 取最近10個已審批的
  const { data: reviewedItems } = await supabase
    .from('progress_items')
    .select('*, profiles!progress_items_member_id_fkey(full_name,position)')
    .in('document_status', ['approved', 'rejected'])
    .order('updated_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">審批項目</h1>
        <p className="text-gray-500 mt-1">批核成員提交的進度證明</p>
      </div>

      {/* 待審批 */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          待審批（{pendingItems?.length || 0}）
        </h2>

        {(!pendingItems || pendingItems.length === 0) ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">全部已處理</h3>
            <p className="text-sm text-gray-500">暫無待審批項目</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingItems.map(item => (
              <a key={item.id} href={`/dashboard/progress/${item.id}`}
                className="block bg-white rounded-xl border border-amber-200 p-5 hover:shadow-md hover:border-amber-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.profiles?.full_name}{item.profiles?.position ? `（${item.profiles.position}）` : ''}
                        {' · '}{item.category}
                      </p>
                      {item.document_name && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {item.document_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 待審批
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 已處理 */}
      {reviewedItems && reviewedItems.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">最近處理</h2>
          <div className="space-y-2">
            {reviewedItems.map(item => (
              <a key={item.id} href={`/dashboard/progress/${item.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.document_status === 'approved' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {item.profiles?.full_name} · {item.document_status === 'approved' ? '已批核' : '已退回'}
                      </p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.document_status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {item.document_status === 'approved' ? '通過' : '退回'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
