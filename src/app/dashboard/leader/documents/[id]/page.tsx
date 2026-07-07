'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, FileText } from 'lucide-react'

export default function ReviewDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: docId } = use(params)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleReview(status: 'approved' | 'rejected') {
    if (submitting) return
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('docId', docId)
      formData.append('status', status)
      formData.append('review_comment', comment)

      const res = await fetch('/api/documents/review', { method: 'POST', body: formData })
      if (res.redirected) {
        router.push(res.url)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '操作失败')
      }
    } catch (err) {
      alert('网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">文檔審批</h1>
        <p className="text-gray-500 mt-1">審閱並批核成員提交的文檔</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-900">文檔 ID: {docId.slice(0, 8)}...</p>
            <p className="text-sm text-gray-500">請仔細審閱後作出決定</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">審批意見（可選）</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
            rows={4}
            placeholder="輸入審批意見或修改建議..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleReview('approved')}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            批核通過
          </button>
          <button
            onClick={() => handleReview('rejected')}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            退回修改
          </button>
        </div>
      </div>
    </div>
  )
}
