'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Download, Loader2, DollarSign, Camera, Edit3, FileText } from 'lucide-react'

interface Props {
  eventId: string
  docType: 'finance' | 'photo' | 'minutes' | 'agenda'
  currentPath?: string | null
  currentName?: string | null
}

const labels = {
  finance: { icon: DollarSign, label: '財務報告', accept: '.pdf,.doc,.docx,.xlsx,.xls,.jpg,.png' },
  photo: { icon: Camera, label: '活動相片', accept: '.jpg,.jpeg,.png,.gif,.zip,.pdf' },
  minutes: { icon: Edit3, label: '會議記錄', accept: '.pdf,.doc,.docx,.txt,.jpg,.png' },
  agenda: { icon: FileText, label: '議程', accept: '.pdf,.doc,.docx,.txt,.jpg,.png' },
}

export default function EventDocUpload({ eventId, docType, currentPath, currentName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const info = labels[docType]
  const Icon = info.icon

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('eventId', eventId)
    formData.append('docType', docType)
    formData.append('file', file)

    try {
      const res = await fetch('/api/events/upload-event-doc', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        if (data.parsedCount > 0) {
          alert(`✅ 財務報告已上載，自動匯入 ${data.parsedCount} 筆收支記錄！`)
        }
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '上載失敗')
      }
    } catch {
      alert('網絡錯誤')
    } finally {
      setUploading(false)
    }
  }

  const publicUrl = currentPath
    ? supabase.storage.from('documents').getPublicUrl(currentPath).data.publicUrl
    : null

  return (
    <div className="flex items-center gap-2">
      {currentName && publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          {currentName}
        </a>
      )}
      <label className={`cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
        uploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }`}>
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {uploading ? '上載中...' : currentPath ? '更換' : '上載'}
        <input type="file" className="hidden" accept={info.accept} onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  )
}
