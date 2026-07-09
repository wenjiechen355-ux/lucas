'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Vote, Plus, X, CheckCircle, Calendar, MapPin, Clock, Users, Trash2, RefreshCw, Loader2, Check, GripVertical, CalendarDays, CalendarRange } from 'lucide-react'
import MonthCalendar from '@/components/month-calendar'

interface Field {
  label: string
  type: 'single' | 'multiple' | 'free_date'
  calendar?: boolean
  options: { label: string }[]
  date_range?: { start: string; end: string }
}

type EventType = 'unit' | 'joint' | 'exchange'

export default function EventPollsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [polls, setPolls] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [pollTitle, setPollTitle] = useState('')
  const [pollDesc, setPollDesc] = useState('')
  const [eventType, setEventType] = useState<EventType>('unit')
  const [isExecMeeting, setIsExecMeeting] = useState(false)
  const [fields, setFields] = useState<Field[]>([{ label: '日期', type: 'multiple', options: [{ label: '' }] }])
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data } = await supabase.from('event_polls').select('*, event_poll_votes(*)').order('created_at', { ascending: false })
    setPolls(data || [])
    setLoading(false)
  }

  const isExec = !!profile?.position

  function addField() {
    if (fields.length >= 5) return
    setFields([...fields, { label: '', type: 'single', options: [{ label: '' }] }])
  }

  function updateField(i: number, key: string, val: any) {
    const copy = [...fields]
    ;(copy[i] as any)[key] = val
    setFields(copy)
  }

  function addOption(fi: number) {
    if (fields[fi].options.length >= 20) return
    const copy = [...fields]
    copy[fi].options.push({ label: '' })
    setFields(copy)
  }

  function removeOption(fi: number, oi: number) {
    const copy = [...fields]
    if (copy[fi].options.length <= 1) return
    copy[fi].options.splice(oi, 1)
    setFields(copy)
  }

  function updateOption(fi: number, oi: number, val: string) {
    const copy = [...fields]
    copy[fi].options[oi].label = val
    setFields(copy)
  }

  function removeField(i: number) {
    if (fields.length <= 1) return
    setFields(fields.filter((_, idx) => idx !== i))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!pollTitle.trim()) return
    setCreating(true)

    const { error } = await supabase.from('event_polls').insert({
      title: pollTitle, description: pollDesc || null,
      event_type: eventType,
      is_exec_meeting: eventType === 'unit' ? isExecMeeting : false,
      fields: fields, created_by: profile?.id,
    })
    if (error) alert(error.message)
    else { setShowCreate(false); setPollTitle(''); setPollDesc(''); setEventType('unit'); setIsExecMeeting(false); setFields([{ label: '日期', type: 'multiple', options: [{ label: '' }] }]); loadData() }
    setCreating(false)
  }

  async function handleVote(pollId: string, selections: { field_idx: number; option_indices: number[] }[]) {
    const existing = polls.find(p => p.id === pollId)?.event_poll_votes?.find((v: any) => v.member_id === profile?.id)
    const payload = { poll_id: pollId, member_id: profile?.id, selections }
    if (existing) {
      await supabase.from('event_poll_votes').update({ selections, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('event_poll_votes').insert(payload)
    }
    loadData()
  }

  async function handleClosePoll(pollId: string) {
    await supabase.from('event_polls').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', pollId)
    loadData()
  }

  async function handleDeletePoll(pollId: string) {
    if (!confirm('確定刪除此投票？')) return
    await supabase.from('event_polls').delete().eq('id', pollId)
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>

  const openPolls = polls.filter(p => p.status === 'open')
  const closedPolls = polls.filter(p => p.status === 'closed')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Vote className="w-6 h-6" /> 活動時間徵集
          </h1>
          <p className="text-gray-500 mt-1">多選項投票 — 揀日期、時間、地點</p>
        </div>
        {isExec && (
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? '取消' : '新增投票'}
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && isExec && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">建立活動投票</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">活動名稱 *</label>
            <input type="text" value={pollTitle} onChange={e => setPollTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="例如：週年 camp" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">說明（可選）</label>
            <textarea value={pollDesc} onChange={e => setPollDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" rows={2} placeholder="投票詳情..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">活動類型 *</label>
            <select value={eventType} onChange={e => setEventType(e.target.value as EventType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
              <option value="unit">團部活動</option>
              <option value="joint">聯團活動（兩個旅部聯合）</option>
              <option value="exchange">外出交流活動</option>
            </select>
          </div>

          {eventType === 'unit' && (
            <div className="flex items-center gap-3 py-1">
              <input type="checkbox" id="pollExecMeeting" checked={isExecMeeting} onChange={e => setIsExecMeeting(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <label htmlFor="pollExecMeeting" className="text-sm text-gray-700">
                執委會開會<span className="text-gray-400 ml-1">（僅執委會可簽到）</span>
              </label>
            </div>
          )}

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">投票欄位</label>
              <button type="button" onClick={addField} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> 加欄位
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((f, fi) => (
                <div key={fi} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="text" value={f.label} onChange={e => updateField(fi, 'label', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="欄位名（如：日期、地點）" />
                    <select value={f.type} onChange={e => {
                      const newType = e.target.value;
                      updateField(fi, 'type', newType);
                      if (newType === 'free_date' && !f.date_range) {
                        updateField(fi, 'date_range', { start: '', end: '' });
                      }
                    }}
                      className="px-2 py-1 border border-gray-200 rounded text-sm text-gray-600 outline-none">
                      <option value="single">單選</option>
                      <option value="multiple">多選</option>
                      <option value="free_date">自由揀日子</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" title="顯示月曆俾人㩒日子">
                      <input type="checkbox" checked={!!f.calendar} onChange={e => updateField(fi, 'calendar', e.target.checked)}
                        className="w-3 h-3 rounded border-gray-300 text-green-600" />
                      <CalendarDays className="w-3 h-3" />日曆
                    </label>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => removeField(fi)} className="p-1 text-gray-300 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 ml-1">
                    {f.type === 'free_date' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">開始日期</label>
                          <input type="date" value={f.date_range?.start || ''} onChange={e => updateField(fi, 'date_range', { ...f.date_range, start: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">結束日期</label>
                          <input type="date" value={f.date_range?.end || ''} onChange={e => updateField(fi, 'date_range', { ...f.date_range, end: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                      </div>
                    ) : (
                      <>{f.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 w-4">{oi + 1}.</span>
                        <input type="text" value={o.label} onChange={e => updateOption(fi, oi, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          placeholder={`選項 ${oi + 1}`} />
                        {f.options.length > 1 && (
                          <button type="button" onClick={() => removeOption(fi, oi)} className="p-0.5 text-gray-200 hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      ))}
                      <button type="button" onClick={() => addOption(fi)}
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-0.5 mt-1">
                        <Plus className="w-3 h-3" /> 加選項
                      </button>
                    </>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={creating || !pollTitle.trim()}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {creating ? '建立中...' : '發起投票'}
          </button>
        </form>
      )}

      {/* 進行中 */}
      {openPolls.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" /> 進行中投票
          </h2>
          <div className="space-y-4">
            {openPolls.map(poll => (
              <PollCardV2 key={poll.id} poll={poll} profile={profile} isExec={isExec}
                onVote={(sels: any) => handleVote(poll.id, sels)}
                onClose={() => handleClosePoll(poll.id)}
                onDelete={() => handleDeletePoll(poll.id)} />
            ))}
          </div>
        </div>
      )}

      {/* 已結束 */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-gray-400" /> 已結束
        </h2>
        {closedPolls.length > 0 ? (
          <div className="space-y-4">
            {closedPolls.map(poll => (
              <PollCardV2 key={poll.id} poll={poll} profile={profile} isExec={isExec}
                onVote={() => {}} onClose={() => {}} onDelete={() => handleDeletePoll(poll.id)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Vote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">未有投票活動</p>
          </div>
        )}
      </div>
    </div>
  )
}

function PollCardV2({ poll, profile, isExec, onVote, onClose, onDelete }: any) {
  const fields: any[] = poll.fields || []
  const votes: any[] = poll.event_poll_votes || []
  const totalVoters = votes.length
  const myVote = votes.find((v: any) => v.member_id === profile?.id)
  const mySelections: any[] = myVote?.selections || []
  const isOpen = poll.status === 'open'

  function toggleOption(fieldIdx: number, optionIdx: number) {
    if (!isOpen) return
    const existing = mySelections.find((s: any) => s.field_idx === fieldIdx)
    const field = fields[fieldIdx]
    const isMultiple = field?.type === 'multiple'

    let newSelections: any[] = JSON.parse(JSON.stringify(mySelections))
    if (existing) {
      if (isMultiple) {
        const idx = existing.option_indices.indexOf(optionIdx)
        if (idx >= 0) existing.option_indices.splice(idx, 1)
        else existing.option_indices.push(optionIdx)
        if (existing.option_indices.length === 0 && !existing.calendar_dates?.length) newSelections = newSelections.filter((s: any) => s.field_idx !== fieldIdx)
      } else {
        existing.option_indices = [optionIdx]
        existing.calendar_dates = []
      }
    } else {
      newSelections.push({ field_idx: fieldIdx, option_indices: [optionIdx], calendar_dates: [] })
    }
    onVote(newSelections)
  }

  function toggleCalendarDate(fieldIdx: number, date: string) {
    if (!isOpen) return
    let newSelections: any[] = JSON.parse(JSON.stringify(mySelections))
    const existing = newSelections.find((s: any) => s.field_idx === fieldIdx)

    if (existing) {
      const idx = (existing.calendar_dates || []).indexOf(date)
      if (idx >= 0) existing.calendar_dates.splice(idx, 1)
      else existing.calendar_dates.push(date)
      if (existing.option_indices.length === 0 && !existing.calendar_dates?.length) {
        newSelections = newSelections.filter((s: any) => s.field_idx !== fieldIdx)
      }
    } else {
      newSelections.push({ field_idx: fieldIdx, option_indices: [], calendar_dates: [date] })
    }
    onVote(newSelections)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{poll.title}</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              poll.event_type === 'unit' ? 'bg-green-50 text-green-600' :
              poll.event_type === 'joint' ? 'bg-blue-50 text-blue-600' :
              'bg-orange-50 text-orange-600'
            }`}>
              {poll.event_type === 'unit' ? '團部' : poll.event_type === 'joint' ? '聯團' : '外出交流'}
            </span>
            {isOpen ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">投票中</span>
              : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">已結束</span>}
            {poll.is_exec_meeting && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600">開會</span>}
          </div>
          {poll.description && <p className="text-sm text-gray-500 mt-1">{poll.description}</p>}
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Users className="w-3 h-3" /> {totalVoters} 人已投票</p>
        </div>
        {isExec && isOpen && (
          <div className="flex items-center gap-1">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">結束投票</button>
            <button onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
        {isExec && !isOpen && <button onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {fields.map((field: any, fi: number) => {
          const isMultiple = field.type === 'multiple'
          const isFreeDate = field.type === 'free_date'
          const myFieldSel = mySelections.find((s: any) => s.field_idx === fi)

          // Free date: show calendar only
          if (isFreeDate) {
            const dateRange = field.date_range || {}
            const calDates: string[] = myFieldSel?.calendar_dates || []
            return (
              <div key={fi}>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarRange className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">{field.label}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">自由揀</span>
                </div>
                <div className="bg-green-50/50 rounded-lg p-3">
                  {dateRange.start && dateRange.end && (
                    <p className="text-xs text-gray-500 mb-2">
                      📅 可選範圍：{dateRange.start} 至 {dateRange.end}
                      {calDates.length > 0 && <span className="ml-2 text-green-600">（已揀 {calDates.length} 日）</span>}
                    </p>
                  )}
                  <MonthCalendar
                    selectedDates={calDates}
                    onToggleDate={(date: string) => toggleCalendarDate(fi, date)}
                    month={dateRange.start ? new Date(dateRange.start).getMonth() : undefined}
                    year={dateRange.start ? new Date(dateRange.start).getFullYear() : undefined}
                  />
                </div>
              </div>
            )
          }

          return (
            <div key={fi}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">{field.label}</span>
                {isMultiple && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">多選</span>}
                {!isMultiple && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">單選</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt: any, oi: number) => {
                  const isSelected = myFieldSel?.option_indices?.includes(oi) || false
                  const voteCount = votes.filter((v: any) =>
                    v.selections?.find((s: any) => s.field_idx === fi)?.option_indices?.includes(oi)
                  ).length
                  const pct = totalVoters > 0 ? Math.round(voteCount / totalVoters * 100) : 0

                  return (
                    <button key={oi} onClick={() => toggleOption(fi, oi)}
                      disabled={!isOpen}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-2 ${
                        isSelected ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      } ${!isOpen ? 'cursor-default opacity-80' : ''}`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {opt.label}
                      <span className={`text-xs ${isSelected ? 'text-green-500' : 'text-gray-400'}`}>({voteCount})</span>
                    </button>
                  )
                })}
              </div>
              {/* Progress bar */}
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
                          <div className={`h-full rounded-full transition-all ${opt.label ? (isSelected ? 'bg-green-500' : 'bg-green-300') : ''}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-gray-400 w-6">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Calendar view */}
              {field.calendar && (
                <div className="mt-3">
                  <MonthCalendar
                    selectedDates={(myFieldSel?.calendar_dates || []) as string[]}
                    onToggleDate={(date: string) => toggleCalendarDate(fi, date)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
