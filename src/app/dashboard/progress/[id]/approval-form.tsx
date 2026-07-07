'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ApprovalFormProps {
  progressId: string
  canSelfApprove: boolean
}

export default function ApprovalForm({ progressId, canSelfApprove }: ApprovalFormProps) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleReview(action: 'approve' | 'reject') {
    setProcessing(true)
    const formData = new FormData()
    formData.append('progressId', progressId)
    formData.append('action', action)
    formData.append('comment', comment)

    try {
      const res = await fetch('/api/progress/review', {
        method: 'POST',
        body: formData,
      })

      if (res.redirected) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '操作失敗')
      }
    } catch {
      alert('網絡錯誤')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="mt-6 p-4 border border-amber-200 bg-amber-50 rounded-xl">
      <h3 className="font-medium text-amber-800 mb-3">
        {canSelfApprove ? '自行批核（主席/副主席可自行批核）' : '審批此進度'}
      </h3>
      <div className="space-y-3">
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm outline-none resize-none"
          placeholder="審批意見（可選）"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleReview('approve')}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            批核通過
          </button>
          <button
            onClick={() => handleReview('reject')}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            退回修改
          </button>
        </div>
      </div>
    </div>
  )
}
