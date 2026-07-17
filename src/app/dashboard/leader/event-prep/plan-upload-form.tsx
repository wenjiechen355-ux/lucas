'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Download, Loader2, Sparkles, ChevronDown, ChevronUp, CheckCircle, XCircle, RefreshCw, FileOutput } from 'lucide-react'

interface Props {
  eventId: string
  currentPath?: string | null
  currentName?: string | null
  // Plan analysis fields
  planRawText?: string | null
  planAnalysis?: string | null
  planAnalysisStatus?: string | null
  planCompleteness?: string | null
  planFormatted?: string | null
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
  planRawText, planAnalysis, planAnalysisStatus, planCompleteness, planFormatted,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [formatting, setFormatting] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [formatError, setFormatError] = useState('')
  const [showRawText, setShowRawText] = useState(false)
  const [showFormatted, setShowFormatted] = useState(false)

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
        return
      } else {
        setAnalysisError(data.error || '分析失敗')
      }
    } catch {
      setAnalysisError('網絡錯誤，請重試')
    }
    setAnalyzing(false)
  }

  async function handleFormat() {
    setFormatting(true)
    setFormatError('')
    try {
      const res = await fetch('/api/plans/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowFormatted(true)
        router.refresh()
        return
      } else {
        setFormatError(data.error || '格式調整失敗')
      }
    } catch {
      setFormatError('網絡錯誤，請重試')
    }
    setFormatting(false)
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
  const hasFormatted = !!planFormatted

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

        {/* AI Analyze Button — always visible when file uploaded */}
        {hasFile && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing || planAnalysisStatus === 'analyzed'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
              analyzing
                ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-wait'
                : planAnalysisStatus === 'analyzed'
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {analyzing ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> 分析中...</>
            ) : planAnalysisStatus === 'analyzed' ? (
              <><CheckCircle className="w-3 h-3" /> 已分析</>
            ) : (
              <><Sparkles className="w-3 h-3" /> AI 分析計劃書</>
            )}
          </button>
        )}

        {/* AI Format Button — visible when file uploaded */}
        {hasFile && (
          <button
            onClick={handleFormat}
            disabled={formatting || !!planFormatted}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
              formatting
                ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-wait'
                : planFormatted
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {formatting ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> 格式調整中...</>
            ) : planFormatted ? (
              <><CheckCircle className="w-3 h-3" /> 已調整</>
            ) : (
              <><FileOutput className="w-3 h-3" /> 格式調整</>
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

      {/* Format Error */}
      {formatError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {formatError}
        </div>
      )}

      {/* ── 分析結果區 ── */}
      {isAnalyzed && planAnalysis && (
        <div className="mt-3 space-y-3">
          {/* 合格/不合格 Badge */}
          {completeness && (
            <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
              completeness.is_complete
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                completeness.is_complete
                  ? 'bg-green-200 text-green-800'
                  : 'bg-red-200 text-red-800'
              }`}>
                {completeness.is_complete ? '✅' : '❌'}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${completeness.is_complete ? 'text-green-800' : 'text-red-800'}`}>
                  {completeness.is_complete ? '計劃書合格' : '計劃書唔完整'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  完整性評分：{completeness.score}/100
                  {!completeness.is_complete && completeness.missing?.length > 0 && (
                    <> · 缺少 {completeness.missing.length} 項</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Missing items alert + re-upload */}
          {completeness && !completeness.is_complete && completeness.missing?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-medium text-red-700 mb-1.5">⚠️ 建議補充以下資料後重新上載：</p>
              <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5 mb-2">
                {completeness.missing.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <label className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                <RefreshCw className="w-3 h-3" /> 重新上載計劃書
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
              </label>
            </div>
          )}

          {/* Full analysis content — always visible, scrollable */}
          <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
            <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-semibold text-blue-800">AI 計劃書分析結果</span>
            </div>
            <div className="p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-[600px] overflow-y-auto leading-relaxed">
              {planAnalysis}
            </div>
          </div>
        </div>
      )}

      {/* Formatted Plan Preview */}
      {hasFormatted && (
        <div className="mt-3 bg-white rounded-lg border border-indigo-200 overflow-hidden">
          <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileOutput className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-800">格式調整後嘅計劃書</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/api/plans/download?eventId=${eventId}`}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
              >
                <Download className="w-3 h-3" /> 下載 DOC
              </a>
              <button
                onClick={() => setShowFormatted(!showFormatted)}
                className="text-indigo-500 hover:text-indigo-700 text-xs"
              >
                {showFormatted ? '收起' : '預覽'}
              </button>
            </div>
          </div>
          {showFormatted && (
            <div className="p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {planFormatted}
            </div>
          )}
        </div>
      )}

      {/* Raw Text */}
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
