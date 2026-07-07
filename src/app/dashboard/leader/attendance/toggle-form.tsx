'use client'

import { useRouter } from 'next/navigation'
import { Lock, Unlock } from 'lucide-react'

export default function ToggleAttendanceForm({ eventId, open }: { eventId: string; open: boolean }) {
  const router = useRouter()

  async function handleToggle() {
    const formData = new FormData()
    formData.append('open', String(!open))

    const res = await fetch(`/api/events/toggle-attendance/${eventId}`, {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        open
          ? 'bg-green-50 text-green-700 hover:bg-green-100'
          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
      }`}
    >
      {open ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
      {open ? '關閉出席' : '開放出席'}
    </button>
  )
}
