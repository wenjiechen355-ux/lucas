'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Download, Loader2, DollarSign, Camera, Edit3, FileText, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  eventId: string
  docType: 'finance' | 'photo' | 'minutes' | 'agenda'
  currentPath?: string | null
  currentName?: string | null
  // Agenda analysis props
  agendaRawText?: string | null
  agendaAnalysis?: string | null
  agendaAnalysisStatus?: string | null
}

const labels = {
  finance: { icon: DollarSign, label: '財務報告', accept: '.pdf,.doc,.docx,.xlsx,.xls,.jpg,.png' },
  photo: { icon: Camera, label: '活動相片', accept: '.jpg,.jpeg,.png,.gif,.zip,.pdf' },
  minutes: { icon: Edit3, label: '會議記錄', accept: '.pdf,.doc,.docx,.txt,.jpg,.png' },
  agenda: { icon: FileText, label: '議程', accept: '.pdf,.doc,.docx,.txt,.jpg,.png' },
}

export default function EventDocUpload({
  eventId, docType, currentPath, currentName,
  agendaRawText, agendaAnalysis, agendaAnalysisStatus,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [showRawText, setShowRawText] = useState(false)
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

  const publicUrl = currentPath
    ? supabase.storage.from('documents').getPublicUrl(currentPath).data.publicUrl
    : null

  const isAgenda = docType === 'agenda'
  const hasFile = !!(currentPath && currentName)
  const isAnalyzed = agendaAnalysisStatus === 'analyzed'
  const hasRawText = agendaAnalysisStatus === 'text_extracted'
  const canAnalyze = isAgenda && hasFile && agendaAnalysisStatus !== 'analyzed' && !analyzing

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {currentName && publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
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

        {/* Analyze Button (agenda only) */}
        {canAnalyze && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 disabled:opacity-50"
          >
            {analyzing ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> 分析中...</>
            ) : (
              <><Sparkles className="w-3 h-3" /> AI 分析</>
            )}
          </button>
        )}
      </div>

      {/* Analysis Error */}
      {analysisError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {analysisError}
        </div>
      )}

      {/* Analysis Result (agenda only) */}
      {isAgenda && isAnalyzed && agendaAnalysis && (
        <div className="mt-3 bg-white rounded-lg border border-purple-200 overflow-hidden">
          <div className="px-3 py-2 bg-purple-50 border-b border-purple-200 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-semibold text-purple-800">AI 議程分析結果</span>
          </div>
          <div className="p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-80 overflow-y-auto">
            {agendaAnalysis}
          </div>
        </div>
      )}

      {/* Raw Text (agenda only, no AI analysis) */}
      {isAgenda && hasRawText && !isAnalyzed && agendaRawText && (
        <div className="mt-2 bg-white rounded border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs"
          >
            <span className="text-gray-600">已提取文字（{agendaRawText.length} 字）</span>
            {showRawText ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
          </button>
          {showRawText && (
            <div className="p-3 text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {agendaRawText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
