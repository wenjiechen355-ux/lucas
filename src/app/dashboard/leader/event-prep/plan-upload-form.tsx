'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Download, Loader2, Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface Props {
  eventId: string
  currentPath?: string | null
  currentName?: string | null
  // Plan analysis fields
  planRawText?: string | null
  planAnalysis?: string | null
  planAnalysisStatus?: string | null
  planCompleteness?: string | null
}

interface CompletenessData {
  is_complete: boolean
  score: number
  items: Record<string, boolean>
  missing: string[]
  detail: string
}

export default function PlanUploadForm({
  eventId, currentPath, currentName,
  planRawText, planAnalysis, planAnalysisStatus, planCompleteness,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [showRawText, setShowRawText] = useState(false)
  const [completenessShown, setCompletenessShown] = useState(true)

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

  async function handleAnalyze() {
    setAnalyzing(true)
    setAnalysisError('')
    try {
      const res = await fetch('/api/plans/analyze', {
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

  // Parse completeness JSON
  let completeness: CompletenessData | null = null
  if (planCompleteness) {
    try {
      completeness = JSON.parse(planCompleteness)
    } catch {}
  }

  // Get public URL for download
  const publicUrl = currentPath
    ? supabase.storage.from('documents').getPublicUrl(currentPath).data.publicUrl
    : null

  const hasFile = !!(currentPath && currentName)
  const isAnalyzed = planAnalysisStatus === 'analyzed'
  const hasRawText = planAnalysisStatus === 'text_extracted'
  const canAnalyze = hasFile && planAnalysisStatus !== 'analyzed' && !analyzing
  const isIncomplete = completeness && !completeness.is_complete

  return (
    <div className="flex-1">
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
        <label className={`cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
          uploading ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? '上載中...' : currentPath ? '更換' : '上載'}
          <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.ppt,.pptx,.txt,.jpg,.png" onChange={handleFileChange} disabled={uploading} />
        </label>

        {/* AI Analyze Button */}
        {canAnalyze && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 disabled:opacity-50"
          >
            {analyzing ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> 分析中...</>
            ) : (
              <><Sparkles className="w-3 h-3" /> AI 分析計劃書</>
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

      {/* Completeness Alert — show when incomplete */}
      {isAnalyzed && isIncomplete && completeness && completenessShown && (
        <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-semibold text-amber-800">計劃書完整性檢查</span>
              <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                得分：{completeness.score}/100
              </span>
            </div>
            <button onClick={() => setCompletenessShown(false)} className="text-amber-500 hover:text-amber-700 text-xs">收起</button>
          </div>
          <div className="p-3 space-y-2">
            {/* Checklist */}
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(completeness.items || {}).map(([key, val]) => (
                <div key={key} className={`flex items-center gap-1.5 text-xs ${val ? 'text-green-700' : 'text-red-700'}`}>
                  {val ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  )}
                  <span>{key}</span>
                </div>
              ))}
            </div>

            {/* Missing items */}
            {completeness.missing && completeness.missing.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                <p className="text-xs font-medium text-red-700 mb-1">⚠️ 以下重要資料缺少或唔夠完整：</p>
                <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                  {completeness.missing.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-red-600">建議重新上載更完整嘅計劃書</span>
                  <label className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                    <RefreshCw className="w-3 h-3" /> 重新上載
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            )}

            {completeness.detail && (
              <p className="text-xs text-amber-700">{completeness.detail}</p>
            )}
          </div>
        </div>
      )}

      {/* Completeness Pass — show when complete */}
      {isAnalyzed && completeness && completeness.is_complete && completenessShown && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-green-100 border-b border-green-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-700" />
              <span className="text-xs font-semibold text-green-800">完整性檢查通過</span>
              <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-medium">
                得分：{completeness.score}/100
              </span>
            </div>
            <button onClick={() => setCompletenessShown(false)} className="text-green-500 hover:text-green-700 text-xs">收起</button>
          </div>
          <div className="p-3 grid grid-cols-2 gap-1.5">
            {Object.entries(completeness.items || {}).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-green-700">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>{key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Result */}
      {isAnalyzed && planAnalysis && (
        <div className="mt-3 bg-white rounded-lg border border-blue-200 overflow-hidden">
          <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-semibold text-blue-800">AI 計劃書分析結果</span>
          </div>
          <div className="p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {planAnalysis}
          </div>
        </div>
      )}

      {/* Raw Text (no AI analysis yet) */}
      {hasRawText && !isAnalyzed && planRawText && (
        <div className="mt-2 bg-white rounded border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs"
          >
            <span className="text-gray-600">已提取文字（{planRawText.length} 字）</span>
            {showRawText ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
          </button>
          {showRawText && (
            <div className="p-3 text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {planRawText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
