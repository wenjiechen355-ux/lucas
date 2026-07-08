'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Upload, Download, Loader2, Trash2 } from 'lucide-react'

interface Props {
  eventId: string
  agendaPath?: string | null
  agendaName?: string | null
}

export default function AgendaUpload({ eventId, agendaPath, agendaName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const formData = new FormData()
    formData.append('eventId', eventId)
    formData.append('docType', 'agenda')
    formData.append('file', file)

    const res = await fetch('/api/events/upload-event-doc', { method: 'POST', body: formData })
    if (res.ok) router.refresh()
    else { const d = await res.json(); alert(d.error || '上載失敗') }
    setUploading(false)
  }

  const publicUrl = agendaPath
    ? supabase.storage.from('documents').getPublicUrl(agendaPath).data.publicUrl
    : null

  return (
    <div className="flex items-center gap-3">
      <FileText className="w-4 h-4 text-purple-600" />
      <span className="text-sm font-medium text-gray-700">議程</span>

      {agendaName && publicUrl && (
        <a href={publicUrl} target="_blank"
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 ml-1">
          <Download className="w-3.5 h-3.5" /> {agendaName}
        </a>
      )}

      <label className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        uploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
      }`}>
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {uploading ? '上載中...' : agendaPath ? '更換議程' : '上載議程'}
        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.jpg,.png" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  )
}
