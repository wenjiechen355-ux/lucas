import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

export default async function LeaderDocumentsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, profiles!documents_member_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const pendingDocs = documents?.filter(d => d.status === 'pending') || []
  const reviewedDocs = documents?.filter(d => d.status !== 'pending') || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">文檔審批</h1>
          <p className="text-gray-500 mt-1">
            {pendingDocs.length > 0
              ? `${pendingDocs.length} 份文檔待審批`
              : '所有文檔已處理'}
          </p>
        </div>
      </div>

      {/* 待审批 */}
      {pendingDocs.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            待審批
          </h2>
          <div className="space-y-3">
            {pendingDocs.map(doc => (
              <DocumentReviewCard key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      )}

      {/* 已处理 */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">已處理</h2>
        {reviewedDocs.length > 0 ? (
          <div className="space-y-2">
            {reviewedDocs.map(doc => (
              <DocumentReviewCard key={doc.id} doc={doc} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暫無已處理文檔</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DocumentReviewCard({ doc }: { doc: any }) {
  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: 'bg-amber-50 text-amber-700', label: '待審批' },
    approved: { icon: CheckCircle, color: 'bg-green-50 text-green-700', label: '已批核' },
    rejected: { icon: XCircle, color: 'bg-red-50 text-red-700', label: '已退回' },
  }
  const config = statusConfig[doc.status] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900">{doc.title}</h3>
            <p className="text-sm text-gray-500 truncate">{doc.file_name}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>上載者: {doc.profiles?.full_name}</span>
              <span>{new Date(doc.created_at).toLocaleDateString('zh-HK')}</span>
            </div>
            {doc.description && (
              <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
            )}
            {doc.review_comment && (
              <div className="mt-2 text-sm bg-gray-50 rounded-lg px-3 py-2 text-gray-600">
                💬 審批意見: {doc.review_comment}
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2 flex-shrink-0">
          {doc.status === 'pending' ? (
            <a
              href={`/dashboard/leader/documents/${doc.id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              審批
            </a>
          ) : (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
