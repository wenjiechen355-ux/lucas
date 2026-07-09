'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCheck, Mail, Loader2 } from 'lucide-react'

interface Props {
  onSelectReviewer: (reviewerId: string | null) => void
  selectedId?: string | null
  type: 'progress' | 'document' | 'event'
  title: string
  link?: string
  submitterName?: string
}

export default function ReviewerSelector({ onSelectReviewer, selectedId, type, title, link, submitterName }: Props) {
  const supabase = createClient()
  const [reviewers, setReviewers] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('id,full_name,position').in('position', ['主席', '副主席']).order('position')
      setReviewers(data || [])
    }
    load()
  }, [])

  async function handleSendEmail() {
    if (!selectedId) return
    setSending(true)
    const res = await fetch('/api/send-review-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, reviewerId: selectedId, link, submitterName })
    })
    if (res.ok) setSent(true)
    else alert('發送失敗，請重試')
    setSending(false)
  }

  if (reviewers.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
        <select
          value={selectedId || ''}
          onChange={e => { onSelectReviewer(e.target.value || null); setSent(false) }}
          className="bg-transparent text-xs text-gray-600 outline-none"
        >
          <option value="">選擇審核人...</option>
          {reviewers.map(r => (
            <option key={r.id} value={r.id}>{r.full_name}（{r.position}）</option>
          ))}
        </select>
      </div>
      {selectedId && (
        <button
          onClick={handleSendEmail}
          disabled={sending}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
          {sent ? '已發送' : sending ? '發送中...' : '提醒審核'}
        </button>
      )}
    </div>
  )
}
