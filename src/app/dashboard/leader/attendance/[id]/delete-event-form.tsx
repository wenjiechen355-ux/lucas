'use client'

import { Trash2 } from 'lucide-react'

interface DeleteEventFormProps {
  eventId: string
}

export default function DeleteEventForm({ eventId }: DeleteEventFormProps) {
  return (
    <form
      action={`/api/events/delete/${eventId}`}
      method="POST"
      onSubmit={e => {
        if (!confirm('確定刪除此活動？所有出席記錄將一併清除。')) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
      >
        <Trash2 className="w-4 h-4" /> 刪除
      </button>
    </form>
  )
}
