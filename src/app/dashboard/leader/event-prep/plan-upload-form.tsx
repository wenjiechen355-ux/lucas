'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Download, Loader2 } from 'lucide-react'

export default function PlanUploadForm({
  eventId,
  currentPath,
  currentName,
}: {
  eventId: string
  currentPath?: string | null
  currentName?: string | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('eventId', eventId)
    formData.append('file', file)

    try {
      const res = await fetch('/api/events/upload-plan', { method: 'POST', body: formData })
      if (res.ok) {
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

  // Get public URL for download
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
      <label className={`cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
        uploading ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}>
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {uploading ? '上載中...' : currentPath ? '更換' : '上載'}
        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.ppt,.pptx,.txt,.jpg,.png" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  )
}
