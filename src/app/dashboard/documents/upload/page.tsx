'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, File, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ReviewerSelector from '@/components/reviewer-selector'

export default function UploadDocumentPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [reviewerId, setReviewerId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title) {
      setError('請填寫標題並選擇文件')
      return
    }
    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登入')

      // 上传到 Storage with ASCII-safe path
      const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
      const safeFileName = `${Date.now()}.${ext}`
      const filePath = `${user.id}/${safeFileName}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      // 创建记录 (keep original name for display)
      const { error: dbError } = await supabase.from('documents').insert({
        member_id: user.id,
        title,
        description,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        status: 'pending',
      })
      if (dbError) throw dbError

      router.push('/dashboard/documents')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '上載失敗，請重試')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">上載文檔</h1>
        <p className="text-gray-500 mt-1">提交文檔俾領袖審批</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">文檔標題 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="例如：技能考核報告"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">說明（可選）</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
            rows={3}
            placeholder="簡要說明文檔內容..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">選擇文件 *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <File className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  點擊上載或拖放文件至此
                </p>
                <p className="text-xs text-gray-400 mt-1">支援 PDF、圖片、Word 文檔</p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* 審核人選擇 + 提醒 */}
        <div className="pt-2 border-t border-gray-100">
          <ReviewerSelector type="document" title={title || '文檔'}
            selectedId={reviewerId}
            onSelectReviewer={setReviewerId}
            link="/dashboard/leader/documents" />
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !title || !reviewerId}
          title={!reviewerId ? '請先選擇審核人' : ''}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? '上載中...' : '提交審批'}
        </button>
      </form>
    </div>
  )
}
