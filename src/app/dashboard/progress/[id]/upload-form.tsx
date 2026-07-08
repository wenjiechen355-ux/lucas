'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Loader2 } from 'lucide-react'

interface UploadFormProps {
  progressId: string
  documentName?: string | null
  documentStatus?: string | null
}

export default function UploadForm({ progressId, documentName, documentStatus }: UploadFormProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploading(true)
    setError('')

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch('/api/progress/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({ error: '上載失敗' }))
        setError(data.error || '上載失敗')
      }
    } catch (err) {
      setError('網絡錯誤，請重試')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-6 p-4 border-2 border-dashed border-gray-200 rounded-xl">
      <h3 className="font-medium text-gray-700 mb-3">上載證明文件</h3>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="progressId" value={progressId} />
        <div className="flex items-center gap-3">
          <input
            type="file"
            name="file"
            required
            className="flex-1 text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? '上載中...' : '上載'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </form>
      {documentName && (
        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <FileText className="w-3 h-3" /> 已上載：{documentName}
          {documentStatus === 'pending' && '（等待審批）'}
          {documentStatus === 'approved' && '（已批核）'}
          {documentStatus === 'rejected' && '（已退回）'}
        </p>
      )}
    </div>
  )
}
