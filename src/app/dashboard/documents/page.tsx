import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Upload, FileText, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import DocumentReviewerCell from '@/components/document-reviewer-cell'

export default async function DocumentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user?.id).single()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, profiles!documents_member_id_fkey(full_name)')
    .eq('member_id', profile?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的文檔</h1>
          <p className="text-gray-500 mt-1">上載文檔、檢視審批狀態</p>
        </div>
        <a
          href="/dashboard/documents/upload"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          上載文檔
        </a>
      </div>

      {(!documents || documents.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">暫無文檔</h3>
          <p className="text-sm text-gray-500 mb-4">尚未上載任何文檔</p>
          <a
            href="/dashboard/documents/upload"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            立即上載
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => {
            const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
              pending: { icon: Clock, color: 'bg-amber-50 text-amber-700', label: '待審批' },
              approved: { icon: CheckCircle, color: 'bg-green-50 text-green-700', label: '已批核' },
              rejected: { icon: XCircle, color: 'bg-red-50 text-red-700', label: '已退回' },
            }
            const config = statusConfig[doc.status] || statusConfig.pending
            const Icon = config.icon

            return (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      <p className="text-sm text-gray-500 truncate mt-0.5">{doc.file_name}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>上載於 {new Date(doc.created_at).toLocaleDateString('zh-HK')}</span>
                        {doc.file_size > 0 && (
                          <span>{Math.round(doc.file_size / 1024)} KB</span>
                        )}
                      </div>
                      {doc.review_comment && (
                        <div className="mt-2 text-sm bg-gray-50 rounded-lg px-3 py-2 text-gray-600">
                          💬 {doc.review_comment}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                  </div>
                </div>
                <DocumentReviewerCell docId={doc.id} title={doc.title} status={doc.status} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
