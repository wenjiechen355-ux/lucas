'use client'

import { useState } from 'react'
import ReviewerSelector from '@/components/reviewer-selector'

export default function DocumentReviewerCell({ docId, title, status }: { docId: string; title: string; status: string }) {
  const [reviewerId, setReviewerId] = useState<string | null>(null)
  
  if (status !== 'pending') return null

  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <ReviewerSelector type="document" title={title}
        selectedId={reviewerId}
        onSelectReviewer={setReviewerId}
        link="/dashboard/leader/documents" />
    </div>
  )
}
