import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Upload, ArrowLeft, FileText, Download, RefreshCw } from 'lucide-react'
import UploadForm from './upload-form'
import ReuploadForm from './reupload-form'
import ApprovalForm from './approval-form'

export default async function ProgressDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: item } = await supabase
    .from('progress_items')
    .select('*, profiles!progress_items_member_id_fkey(full_name,position)')
    .eq('id', id)
    .single()

  if (!item) notFound()

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const isOwner = item.member_id === user.id
  const isExec = !!profile?.position // 所有執委會成員
  const isChair = profile?.position === '主席' || profile?.position === '副主席'
  const canSelfApprove = (isChair || profile?.role === 'leader') && isOwner
  const isPending = item.document_status === 'pending'
  const isRejected = item.document_status === 'rejected'
  const isApproved = item.document_status === 'approved'
  const isCompleted = item.status === 'completed'
  const isInProgress = item.status === 'in_progress' && !isPending && !isRejected

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const docDownloadUrl = item.document_path
    ? `${supabaseUrl}/storage/v1/object/public/documents/${item.document_path}`
    : null

  return (
    <div className="max-w-2xl mx-auto">
      {/* 返回 */}
      <a href="/dashboard/progress" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回進度列表
      </a>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* 標題 */}
        <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
          <span>分類：{item.category}</span>
          <span>·</span>
          <span>{item.profiles?.full_name}{item.profiles?.position ? `（${item.profiles.position}）` : ''}</span>
        </div>

        {/* 狀態徽章 */}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {/* 已完成 */}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
              <CheckCircle className="w-4 h-4" /> 已完成
            </span>
          )}
          {/* 等待審批 */}
          {isPending && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" /> 等待審批
            </span>
          )}
          {/* 已批核/已退回顯示 */}
          {isApproved && !isCompleted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
              <CheckCircle className="w-4 h-4" /> 已批核
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
              <XCircle className="w-4 h-4" /> 不批准
            </span>
          )}
          {/* 進行中（未提交審批） */}
          {isInProgress && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
              <Upload className="w-4 h-4" /> 進行中
            </span>
          )}
        </div>

        {/* 審批意見 */}
        {item.reviewer_comment && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            💬 審批意見：{item.reviewer_comment}
          </div>
        )}

        {/* 已上載文件資訊 */}
        {item.document_name && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            isApproved ? 'bg-green-50 text-green-700' :
            isRejected ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-600'
          }`}>
            <FileText className="w-4 h-4" />
            {docDownloadUrl ? (
              <a href={docDownloadUrl} target="_blank" className="flex items-center gap-1 hover:underline">
                {item.document_name} <Download className="w-3 h-3" />
              </a>
            ) : (
              <span>{item.document_name}</span>
            )}
            {isPending && '（等待審批）'}
            {isApproved && '（已批核）'}
            {isRejected && '（不批准）'}
          </div>
        )}

        {/* 上載/重新上載/更改已完成文件 */}
        {isOwner && (
          <ReuploadForm
            progressId={id}
            documentName={item.document_name}
            documentStatus={item.document_status}
            itemStatus={item.status}
          />
        )}

        {/* 審批區（執委會成員專用） */}
        {isPending && isChair && (
          <ApprovalForm
            progressId={id}
            canSelfApprove={canSelfApprove}
          />
        )}

        {/* 描述 */}
        {item.description && (
          <p className="mt-4 text-sm text-gray-600">{item.description}</p>
        )}

        {/* 完成時間 */}
        {item.completed_date && (
          <p className="mt-3 text-xs text-gray-400">
            完成於 {new Date(item.completed_date).toLocaleString('zh-HK')}
          </p>
        )}
      </div>
    </div>
  )
}
