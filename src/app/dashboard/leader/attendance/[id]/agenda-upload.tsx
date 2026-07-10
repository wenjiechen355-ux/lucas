'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Upload, Download, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  eventId: string
  agendaPath?: string | null
  agendaName?: string | null
  agendaRawText?: string | null
  agendaAnalysis?: string | null
  agendaAnalysisStatus?: string | null
}

export default function AgendaUpload({
  eventId, agendaPath, agendaName,
  agendaRawText, agendaAnalysis, agendaAnalysisStatus,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [showRawText, setShowRawText] = useState(false)

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

  async function handleAnalyze() {
    setAnalyzing(true)
    setAnalysisError('')
    try {
      const res = await fetch('/api/agenda/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const data = await res.json()
      if (res.ok) {
        router.refresh()
      } else {
        setAnalysisError(data.error || '分析失敗')
      }
    } catch {
      setAnalysisError('網絡錯誤，請重試')
    }
    setAnalyzing(false)
  }

  const publicUrl = agendaPath
    ? supabase.storage.from('documents').getPublicUrl(agendaPath).data.publicUrl
    : null

  const hasFile = !!(agendaPath && agendaName)
  const isAnalyzed = agendaAnalysisStatus === 'analyzed'
  const hasRawText = agendaAnalysisStatus === 'text_extracted'
  const canAnalyze = hasFile && agendaAnalysisStatus !== 'analyzed' && !analyzing

  return (
    <div>
      {/* Upload Row */}
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">議程</span>

        {agendaName && publicUrl && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
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

        {/* Analyze Button */}
        {canAnalyze && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 disabled:opacity-50"
          >
            {analyzing ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> 分析中...</>
            ) : (
              <><Sparkles className="w-3 h-3" /> AI 分析議程</>
            )}
          </button>
        )}

        {analyzing && (
          <span className="text-xs text-amber-600 animate-pulse">正在讀取文件內容並分析...</span>
        )}
      </div>

      {/* Analysis Error */}
      {analysisError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {analysisError}
        </div>
      )}

      {/* Analysis Result */}
      {isAnalyzed && agendaAnalysis && (
        <div className="mt-4 bg-white rounded-lg border border-purple-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">AI 議程分析結果</span>
          </div>
          <div className="p-4 prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {agendaAnalysis}
          </div>
        </div>
      )}

      {/* Text Extracted (no AI analysis yet) */}
      {hasRawText && !isAnalyzed && agendaRawText && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">已提取文字內容（{agendaRawText.length} 字）</span>
            </div>
            {showRawText ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showRawText && (
            <div className="p-4 text-sm text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {agendaRawText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
