import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FileText, CheckCircle, XCircle, Clock, TrendingUp, ArrowRight, Play } from 'lucide-react'

export default async function LeaderDocumentsPage() {
  const supabase = await createServerSupabaseClient()

  // 文檔
  const { data: documents } = await supabase
    .from('documents')
    .select('*, profiles!documents_member_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  // 進度審批
  const { data: progressItems } = await supabase
    .from('progress_items')
    .select('*, profiles!progress_items_member_id_fkey(full_name)')
    .in('document_status', ['pending', 'approved', 'rejected'])
    .order('updated_at', { ascending: false })
    .limit(50)

  // 活動開始審批（3 步審批：vp_pending = 待副主席批示）
  const { data: eventApprovals } = await supabase
    .from('events')
    .select('id,title,status,approval_state,approval_rejected_comment,plan_doc_path,plan_doc_name,created_by,created_at,updated_at')
    .in('approval_state', ['vp_pending', 'vp_approved', 'chair_approved', 'leader_approved', 'rejected'])
    .order('updated_at', { ascending: false })
    .limit(50)

  // 合併待審批（vp_pending 先係需要處理嘅狀態）
  const docPending = documents?.filter(d => d.status === 'pending') || []
  const progPending = progressItems?.filter(p => p.document_status === 'pending') || []
  const eventPending = eventApprovals?.filter(e => e.approval_state === 'vp_approved') || []
  const pendingAll = [...docPending, ...progPending, ...eventPending]

  // 合併已處理
  const docReviewed = documents?.filter(d => d.status !== 'pending') || []
  const progReviewed = progressItems?.filter(p => p.document_status !== 'pending') || []
  const eventReviewed = eventApprovals?.filter(e => e.approval_state !== 'vp_pending') || []
  const reviewedAll = [...docReviewed, ...progReviewed, ...eventReviewed].sort((a, b) => 
    new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">文檔審批</h1>
          <p className="text-gray-500 mt-1">
            {pendingAll.length > 0
              ? `${pendingAll.length} 份待審批（文檔 ${docPending.length} + 進度 ${progPending.length} + 活動 ${eventPending.length}）`
              : '所有文檔已處理'}
          </p>
        </div>
      </div>

      {/* Tab 提示 */}
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        <FileText className="w-3.5 h-3.5" /> 文檔
        <ArrowRight className="w-3 h-3" />
        <TrendingUp className="w-3.5 h-3.5" /> 進度
        <ArrowRight className="w-3 h-3" />
        <Play className="w-3.5 h-3.5" /> 活動審批
        <ArrowRight className="w-3 h-3" />
        <span>3 步審批：副主席→主席→領袖</span>
      </div>

      {/* 待审批 */}
      {pendingAll.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            待審批
          </h2>
          <div className="space-y-3">
            {pendingAll.map(item => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* 已处理 */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">已處理</h2>
        {reviewedAll.length > 0 ? (
          <div className="space-y-2">
            {reviewedAll.map(item => (
              <ReviewCard key={item.id} item={item} />
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

function ReviewCard({ item }: { item: any }) {
  const isProgress = 'document_status' in item
  const isEvent = 'approval_state' in item
  const state = isEvent ? (item.approval_state || 'vp_pending') : ''
  const status = isEvent
    ? (state === 'vp_pending' ? 'pending' : state === 'rejected' ? 'rejected' : 'approved')
    : isProgress ? (item.document_status || 'pending') : (item.status || 'pending')
  const stepLabel = isEvent
    ? (state === 'vp_pending' ? '待副主席審批 (1/3)' : state === 'vp_approved' ? '副主席已批 (1/3)' : state === 'chair_approved' ? '主席已批 (2/3)' : state === 'leader_approved' ? '已全部審批 (3/3)' : '已退回')
    : ''
  const title = isEvent ? `活動開始審批：${item.title}${stepLabel ? ` · ${stepLabel}` : ''}` : isProgress ? item.title : (item.title || '未命名')
  const fileName = isEvent ? item.plan_doc_name : isProgress ? item.document_name : item.file_name
  const memberName = isEvent ? '(執委會活動)' : (item.profiles?.full_name || '(未知)')
  const createdAt = new Date(item.created_at || item.updated_at).toLocaleDateString('zh-HK')
  const reviewComment = isEvent ? item.approval_rejected_comment : isProgress ? item.reviewer_comment : item.review_comment
  const reviewLink = isEvent ? '/dashboard/leader/event-prep' : isProgress ? `/dashboard/progress/${item.id}` : `/dashboard/leader/documents/${item.id}`

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: 'bg-amber-50 text-amber-700', label: '待審批' },
    approved: { icon: CheckCircle, color: 'bg-green-50 text-green-700', label: '已批核' },
    rejected: { icon: XCircle, color: 'bg-red-50 text-red-700', label: '已退回' },
  }
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isEvent ? 'bg-amber-50' : isProgress ? 'bg-purple-50' : 'bg-blue-50'
          }`}>
            {isEvent ? (
              <Play className="w-5 h-5 text-amber-600" />
            ) : isProgress ? (
              <TrendingUp className="w-5 h-5 text-purple-600" />
            ) : (
              <FileText className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{title}</h3>
              {isEvent && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600">活動審批</span>
              )}
              {isProgress && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600">進度</span>
              )}
            </div>
            {fileName && <p className="text-sm text-gray-500 truncate">{fileName}</p>}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>上載者: {memberName}</span>
              <span>{createdAt}</span>
            </div>
            {reviewComment && (
              <div className="mt-2 text-sm bg-gray-50 rounded-lg px-3 py-2 text-gray-600">
                💬 審批意見: {reviewComment}
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2 flex-shrink-0">
          {status === 'pending' ? (
            <a
              href={reviewLink}
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
