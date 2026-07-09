'use client'

import { useState } from 'react'
import { Camera, Upload, X, Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  file_path: string
  file_name: string
  caption: string
  uploaded_by: string
  created_at: string
}

export default function EventPhotos({ eventId }: { eventId: string }) {
  const supabase = createClient()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [caption, setCaption] = useState('')

  // Load photos
  useState(() => {
    setLoading(true)
    supabase.from('event_photos').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setPhotos(data); setLoading(false) })
  })

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const input = document.getElementById('photoInput') as HTMLInputElement
    if (!input?.files?.length) return

    setUploading(true)
    const formData = new FormData()
    formData.append('event_id', eventId)
    formData.append('caption', caption)
    for (const f of Array.from(input.files)) {
      formData.append('photos', f)
    }

    const res = await fetch('/api/events/upload-photos', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.results) {
      alert(`上載完成：${data.results.filter((r: any) => r.ok).length} / ${data.results.length} 張`)
      // Reload
      const { data: fresh } = await supabase.from('event_photos').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
      if (fresh) setPhotos(fresh)
      input.value = ''
      setCaption('')
      setShowUpload(false)
    } else {
      alert(data.error || '上載失敗')
    }
    setUploading(false)
  }

  async function deletePhoto(id: string) {
    if (!confirm('刪除此相片？')) return
    await supabase.from('event_photos').delete().eq('id', id)
    setPhotos(photos.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-pink-600" /> 活動相冊
          <span className="text-xs text-gray-400 font-normal">({photos.length})</span>
        </h3>
        <button onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100">
          {showUpload ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
          {showUpload ? '取消' : '上載相片'}
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <input type="file" id="photoInput" accept="image/*" multiple
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100" />
          <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="相片說明（可選）" className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm" />
          <button type="submit" disabled={uploading}
            className="w-full bg-pink-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> 上載中...</> : '上載'}
          </button>
        </form>
      )}

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Camera className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">未有活動相片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100">
              <img src={photo.file_path} alt={photo.caption || photo.file_name}
                className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                {photo.caption && <span className="text-white text-xs truncate">{photo.caption}</span>}
                <button onClick={() => deletePhoto(photo.id)}
                  className="ml-auto p-1 rounded bg-red-500/80 text-white hover:bg-red-600">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
