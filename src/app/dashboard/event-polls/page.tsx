'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Vote, Check, Users, RefreshCw, Clock, Calendar, MapPin } from 'lucide-react'
import MonthCalendar from '@/components/month-calendar'

export default function MemberEventPollsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [polls, setPolls] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dragFieldIndex, setDragFieldIndex] = useState<number | null>(null)
  const isPressingRef = useRef(false)
  const dragToggledRef = useRef<Set<number>>(new Set())
  const optimisticSelectionsRef = useRef<Record<string, any[]>>({})

  // Global cleanup — reset press flag only, green stays forever
  useEffect(() => {
    function endDrag() {
      isPressingRef.current = false
      setDragFieldIndex(null)
      dragToggledRef.current = new Set()
    }
    document.addEventListener('mouseup', endDrag)
    document.addEventListener('touchend', endDrag)
    document.addEventListener('touchcancel', endDrag)
    return () => {
      document.removeEventListener('mouseup', endDrag)
      document.removeEventListener('touchend', endDrag)
      document.removeEventListener('touchcancel', endDrag)
    }
  }, [])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data } = await supabase.from('event_polls').select('*, event_poll_votes(*)').order('created_at', { ascending: false })
    // Filter: regular members cannot see exec-only polls
    const isMemberExec = !!prof?.position
    const filtered = isMemberExec ? (data || []) : (data || []).filter(p => !p.is_exec_meeting)
    setPolls(filtered)
    optimisticSelectionsRef.current = {} // DB 已更新，清除樂觀覆蓋
    setLoading(false)
  }

  async function handleVote(pollId: string, selections: { field_idx: number; option_indices: number[] }[]) {
    const existing = polls.find(p => p.id === pollId)?.event_poll_votes?.find((v: any) => v.member_id === profile?.id)
    if (existing) {
      await supabase.from('event_poll_votes').update({ selections, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('event_poll_votes').insert({ poll_id: pollId, member_id: profile?.id, selections })
    }
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>

  const openPolls = polls.filter(p => {
    if (p.status !== 'open') return false
    // Check voting time window
    const now = new Date()
    if (p.vote_start_at && now < new Date(p.vote_start_at)) return false // not yet started
    if (p.vote_end_at && now > new Date(p.vote_end_at)) return false // already ended
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Vote className="w-6 h-6" /> 活動投票
          </h1>
          <p className="text-gray-500 mt-1">投票揀選活動日期、時間及地點</p>
        </div>
        <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {openPolls.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Vote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">目前冇進行中嘅投票</p>
        </div>
      ) : (
        <div className="space-y-4">
          {openPolls.map(poll => {
            const fields: any[] = poll.fields || []
            const votes: any[] = poll.event_poll_votes || []
            const totalVoters = votes.length
            const myVote = votes.find((v: any) => v.member_id === profile?.id)
            const dbSelections: any[] = myVote?.selections || []
            // 樂觀更新：用 ref 追蹤最新 selections
            const mySelections = optimisticSelectionsRef.current[poll.id] || dbSelections

            // Voting time window
            const now = new Date()
            const voteStartAt = poll.vote_start_at ? new Date(poll.vote_start_at) : null
            const voteEndAt = poll.vote_end_at ? new Date(poll.vote_end_at) : null
            const canVote = !(voteStartAt && now < voteStartAt) && !(voteEndAt && now > voteEndAt)

            function fmtDT(dt: Date | null): string {
              if (!dt) return ''
              const m = dt.getMonth() + 1; const d = dt.getDate()
              const h = dt.getHours().toString().padStart(2, '0')
              const min = dt.getMinutes().toString().padStart(2, '0')
              return `${m}/${d} ${h}:${min}`
            }

            return (
              <div key={poll.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{poll.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      poll.event_type === 'unit' ? 'bg-green-50 text-green-600' :
                      poll.event_type === 'joint' ? 'bg-blue-50 text-blue-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {poll.event_type === 'unit' ? '團部' : poll.event_type === 'joint' ? '聯團' : '外出交流'}
                    </span>
                  </div>
                  {poll.description && <p className="text-sm text-gray-500 mt-1">{poll.description}</p>}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Users className="w-3 h-3" /> {totalVoters} 人已投票</p>
                  {(voteStartAt || voteEndAt) && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      投票時間：{voteStartAt ? fmtDT(voteStartAt) : '即時'} ～ {voteEndAt ? fmtDT(voteEndAt) : '不限'}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {fields.map((field: any, fi: number) => {
                    const isMultiple = field.type === 'multiple'
                    const isFreeDate = field.type === 'free_date'
                    const myFieldSel = mySelections.find((s: any) => s.field_idx === fi)

                    // Free date mode
                    if (isFreeDate) {
                      const dateRange = field.date_range || {}
                      const calDates: string[] = myFieldSel?.calendar_dates || []
                      return (
                        <div key={fi}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">{field.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">自由揀</span>
                          </div>
                          <div className="bg-green-50/50 rounded-lg p-3">
                            {dateRange.start && dateRange.end && (
                              <p className="text-xs text-gray-500 mb-2">
                                可選範圍：{dateRange.start} 至 {dateRange.end}
                                {calDates.length > 0 && <span className="ml-2 text-green-600">（已揀 {calDates.length} 日）</span>}
                              </p>
                            )}
                            {/* Top 3 dates ranking — always visible */}
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-600 mb-1.5">🏆 最多人投嘅日子</p>
                              {(() => {
                                const dateCounts: Record<string, number> = {}
                                for (const v of votes) {
                                  const sel = v.selections?.find((s: any) => s.field_idx === fi)
                                  const dates = (sel?.calendar_dates || []) as string[]
                                  for (const d of dates) { dateCounts[d] = (dateCounts[d] || 0) + 1 }
                                }
                                const sorted = Object.entries(dateCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
                                if (sorted.length === 0) return <p className="text-xs text-gray-400 italic">暫無數據</p>
                                const maxCount = sorted[0][1]
                                return (
                                  <div className="space-y-1">
                                    {sorted.map(([date, count], idx) => (
                                      <div key={date} className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                          idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                          idx === 1 ? 'bg-gray-100 text-gray-600' :
                                          'bg-orange-50 text-orange-600'
                                        }`}>{idx + 1}</span>
                                        <span className="text-xs text-gray-700 w-24">{date.slice(5)}</span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.round(count / maxCount * 100)}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-500 w-10 text-right">{count} 票</span>
                                      </div>
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>
                            <MonthCalendar
                              selectedDates={calDates}
                              onToggleDate={(date: string) => toggleCalendarDate(date)}
                              month={dateRange.start ? new Date(dateRange.start).getMonth() : undefined}
                              year={dateRange.start ? new Date(dateRange.start).getFullYear() : undefined}
                              minDate={dateRange.start || undefined}
                              maxDate={dateRange.end || undefined}
                            />
                          </div>
                        </div>
                      )
                    }

                    function toggleOption(oi: number) {
                      if (!canVote) return
                      const existing = mySelections.find((s: any) => s.field_idx === fi)
                      let newSelections = JSON.parse(JSON.stringify(mySelections))
                      if (existing) {
                        if (isMultiple) {
                          const idx = existing.option_indices.indexOf(oi)
                          if (idx >= 0) existing.option_indices.splice(idx, 1)
                          else existing.option_indices.push(oi)
                          if (existing.option_indices.length === 0 && !existing.calendar_dates?.length) newSelections = newSelections.filter((s: any) => s.field_idx !== fi)
                        } else {
                          existing.option_indices = [oi]
                          existing.calendar_dates = []
                        }
                      } else {
                        newSelections.push({ field_idx: fi, option_indices: [oi], calendar_dates: [] })
                      }
                      optimisticSelectionsRef.current[poll.id] = newSelections
                      handleVote(poll.id, newSelections)
                    }

                    function toggleCalendarDate(date: string) {
                      if (!canVote) return
                      let newSelections = JSON.parse(JSON.stringify(mySelections))
                      const existing = newSelections.find((s: any) => s.field_idx === fi)
                      if (existing) {
                        const idx = (existing.calendar_dates || []).indexOf(date)
                        if (idx >= 0) existing.calendar_dates.splice(idx, 1)
                        else existing.calendar_dates.push(date)
                        if (existing.option_indices.length === 0 && !existing.calendar_dates?.length) newSelections = newSelections.filter((s: any) => s.field_idx !== fi)
                      } else {
                        newSelections.push({ field_idx: fi, option_indices: [], calendar_dates: [date] })
                      }
                      optimisticSelectionsRef.current[poll.id] = newSelections
                      handleVote(poll.id, newSelections)
                    }

                    return (
                      <div key={fi}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700">{field.label}</span>
                          {isMultiple && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">多選</span>}
                        </div>
                        <div
                          className="flex flex-wrap gap-2"
                          onMouseMove={(e) => {
                            if (!isPressingRef.current || dragFieldIndex !== fi) return
                            const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
                            if (!el) return
                            const btn = el.closest('[data-oi]') as HTMLElement | null
                            if (!btn) return
                            const oi = parseInt(btn.dataset.oi || '', 10)
                            if (isNaN(oi)) return
                            if (!dragToggledRef.current.has(oi)) {
                              dragToggledRef.current.add(oi)
                              toggleOption(oi)
                            }
                          }}
                          onTouchMove={(e) => {
                            if (!isPressingRef.current || dragFieldIndex !== fi) return
                            const touch = e.touches[0]
                            if (!touch) return
                            const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
                            if (!el) return
                            const btn = el.closest('[data-oi]') as HTMLElement | null
                            if (!btn) return
                            const oi = parseInt(btn.dataset.oi || '', 10)
                            if (isNaN(oi)) return
                            if (!dragToggledRef.current.has(oi)) {
                              dragToggledRef.current.add(oi)
                              toggleOption(oi)
                            }
                          }}
                        >
                          {field.options.map((opt: any, oi: number) => {
                            const isSelected = myFieldSel?.option_indices?.includes(oi) || false
                            const voteCount = votes.filter((v: any) =>
                              v.selections?.find((s: any) => s.field_idx === fi)?.option_indices?.includes(oi)
                            ).length
                            return (
                              <button key={oi} data-oi={oi}
                                // ── mousedown/touchstart: 立即切换绿色+锁定，进入拖拽模式 ──
                                onMouseDown={() => {
                                  if (!canVote) return
                                  isPressingRef.current = true
                                  setDragFieldIndex(fi)
                                  dragToggledRef.current = new Set([oi])
                                  toggleOption(oi)
                                }}
                                onTouchStart={() => {
                                  if (!canVote) return
                                  isPressingRef.current = true
                                  setDragFieldIndex(fi)
                                  dragToggledRef.current = new Set([oi])
                                  toggleOption(oi)
                                }}
                                onClick={(e) => e.preventDefault()}
                                disabled={!canVote}
                                className={`px-3 py-2 rounded-lg border text-sm transition-none flex items-center gap-2 select-none touch-none ${
                                  isSelected
                                    ? 'border-green-500 bg-green-500 text-white font-medium'
                                    : 'border-gray-200 bg-gray-100 text-gray-700'
                                } ${!canVote ? 'cursor-default opacity-60' : 'cursor-pointer'}`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                {opt.label}
                                <span className={`text-xs ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>({voteCount})</span>
                              </button>
                            )
                          })}
                        </div>
                          {field.options.length > 1 && (
                            <div className="mt-1.5 space-y-0.5">
                              {field.options.map((opt: any, oi: number) => {
                                const voteCount = votes.filter((v: any) =>
                                  v.selections?.find((s: any) => s.field_idx === fi)?.option_indices?.includes(oi)
                                ).length
                                const pct = totalVoters > 0 ? Math.round(voteCount / totalVoters * 100) : 0
                                const isSelected = myFieldSel?.option_indices?.includes(oi) || false
                                return (
                                  <div key={oi} className="flex items-center gap-2 text-xs">
                                    <span className="w-16 truncate text-gray-500 text-right">{opt.label}</span>
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${isSelected ? 'bg-green-500' : 'bg-green-300'}`}
                                        style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-gray-400 w-6">{pct}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {field.calendar && (
                            <div className="mt-3">
                              <MonthCalendar
                                selectedDates={(myFieldSel?.calendar_dates || []) as string[]}
                                onToggleDate={(date: string) => toggleCalendarDate(date)}
                              />
                            </div>
                          )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
