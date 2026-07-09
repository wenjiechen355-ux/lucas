'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Loader2 } from 'lucide-react'

export default function SetDateForm({ eventId }: { eventId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return
    setSaving(true)
    await supabase.from('events').update({ event_date: date }).eq('id', eventId)
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <Calendar className="w-5 h-5 text-amber-600" />
      <span className="text-sm font-medium text-gray-700">設定活動日期</span>
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" required />
      <button type="submit" disabled={saving || !date}
        className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '確定'}
      </button>
    </form>
  )
}
