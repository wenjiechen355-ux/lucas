'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, ClipboardList, User, Calendar, MapPin, MoreHorizontal, CheckCircle, XCircle, Clock, RefreshCw, Trash2, FileText, Play, Flag, DollarSign, Camera, Edit3 } from 'lucide-react'
import PlanUploadForm from './plan-upload-form'
import EventDocUpload from './event-doc-upload'
import ReviewerSelector from '@/components/reviewer-selector'

interface Profile {
  id: string
  full_name: string
  position: string
}

interface EventData {
  id: string
  title: string
  event_date: string
  location?: string
  description?: string
  plan_doc_path?: string
  plan_doc_name?: string
  status: string
  is_meeting?: boolean
  minutes_doc_path?: string
  minutes_doc_name?: string
  finance_doc_path?: string
  finance_doc_name?: string
  photo_doc_path?: string
  photo_doc_name?: string
  agenda_doc_path?: string
  agenda_doc_name?: string
  start_approved?: boolean
  start_approval_status?: string
  start_approval_comment?: string
}

interface PrepItem {
  id: string
  event_id: string
  title: string
  description?: string
  responsible_id?: string
  status: string
  created_by: string
}

export default function EventPrepPage() {
  const router = useRouter()
  const supabase = createClient()
  const [events, setEvents] = useState<EventData[]>([])
  const [prepItems, setPrepItems] = useState<PrepItem[]>([])
  const [execMembers, setExecMembers] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventReviewers, setEventReviewers] = useState<Record<string, string>>({})

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newResponsible, setNewResponsible] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Get current profile
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    // Get all exec members (anyone with a position)
    const { data: members } = await supabase
      .from('profiles')
      .select('id, full_name, position')
      .not('position', 'is', null)
      .order('full_name')
    setExecMembers(members || [])

    // Get events that have or can have prep items
    const { data: evts } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
    setEvents(evts || [])

    // Get all prep items
    const { data: items } = await supabase
      .from('event_prep_items')
      .select('*')
      .order('created_at', { ascending: false })
    setPrepItems(items || [])

    setLoading(false)
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('event_prep_items').insert({
      event_id: selectedEvent,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      responsible_id: newResponsible || null,
      created_by: user?.id,
    })

    if (error) {
      alert('新增失敗：' + error.message)
    } else {
      setShowModal(false)
      setNewTitle('')
      setNewDesc('')
      setNewResponsible('')
      loadData()
    }
    setSaving(false)
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('確定刪除此籌備項目？')) return
    const { error } = await supabase.from('event_prep_items').delete().eq('id', itemId)
    if (!error) loadData()
  }

  async function handleToggleStatus(item: PrepItem) {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase
      .from('event_prep_items')
      .update({ status: newStatus })
      .eq('id', item.id)
    if (!error) loadData()
  }

  // Get prep items for a specific event
  function getItemsForEvent(eventId: string) {
    return prepItems.filter(i => i.event_id === eventId)
  }

  // Get member name by id
  function getMemberName(id?: string) {
    if (!id) return null
    const m = execMembers.find(m => m.id === id)
    return m ? `${m.full_name}（${m.position}）` : null
  }

  // Get pending items assigned to current user
  const myPendingItems = prepItems.filter(
    i => i.responsible_id === profile?.id && i.status !== 'completed'
  )

  const isChair = profile?.position === '主席' || profile?.position === '副主席'
  const isExec = !!profile?.position
  const isSecretary = profile?.position === '文書'

  async function handleStartEvent(eventId: string) {
    if (!confirm('確定開始此活動？活動開始後會開放出席俾成員簽到。')) return
    await supabase.from('events').update({ status: 'active', attendance_open: true, start_approval_status: 'approved' }).eq('id', eventId)
    loadData()
  }

  async function handleRequestStart(eventId: string) {
    if (!confirm('提交開始活動申請？主席/副主席審批後即可開始。')) return
    await supabase.from('events').update({ start_approval_status: 'pending' }).eq('id', eventId)
    loadData()
  }

  async function handleRejectStart(eventId: string) {
    const comment = prompt('請輸入退回原因（可選）：')
    if (comment === null) return // cancelled
    await supabase.from('events').update({ start_approval_status: 'rejected', start_approval_comment: comment || null }).eq('id', eventId)
    loadData()
  }

  async function handleEndEvent(eventId: string) {
    if (!confirm('確定結束此活動？結束後可繳交財務報告及活動相片。')) return
    await supabase.from('events').update({ status: 'completed' }).eq('id', eventId)
    loadData()
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('確定刪除此活動？所有籌備項目同出席記錄將一併清除。')) return
    const formData = new FormData()
    const res = await fetch(`/api/events/delete/${eventId}`, { method: 'POST', body: formData })
    if (res.ok || res.redirected) {
      loadData()
    } else {
      const data = await res.json()
      alert(data.error || '刪除失敗')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">活動籌備</h1>
          <p className="text-gray-500 mt-1">統籌各活動嘅籌備工作</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/dashboard/leader/attendance/new')}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> 新增活動
          </button>
        </div>
      </div>

      {/* 需協助項目 (assigned to me) */}
      {myPendingItems.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" />
            需協助此項目（{myPendingItems.length}）
          </h2>
          <div className="space-y-2">
            {myPendingItems.map(item => {
              const evt = events.find(e => e.id === item.event_id)
              return (
                <div key={item.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500">{evt?.title} · {evt ? new Date(evt.event_date).toLocaleDateString('zh-HK') : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                  >
                    標記完成
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Events list */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">未有活動</h3>
          <p className="text-sm text-gray-500 mb-4">建立第一個活動嚟開始籌備</p>
          <button
            onClick={() => router.push('/dashboard/leader/attendance/new')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            新增活動
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Event header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      {event.status === 'preparation' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">籌備中</span>}
                      {event.status === 'active' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">進行中</span>}
                      {event.status === 'completed' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">已完成</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(event.event_date).toLocaleDateString('zh-HK')}</span>
                      {event.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* 審核人選擇 + 提醒 */}
                    {event.status === 'preparation' && (!event.start_approval_status || event.start_approval_status === 'rejected') && (
                      <div className="mr-2">
                        <ReviewerSelector type="event" title={event.title}
                          selectedId={eventReviewers[event.id] || null}
                          onSelectReviewer={(id) => setEventReviewers(prev => ({ ...prev, [event.id]: id || '' }))}
                          link={`/dashboard/leader/event-prep`}
                        />
                      </div>
                    )}
                    {/* 開始/審批活動 */}
                    {event.status === 'preparation' && (!event.start_approval_status || event.start_approval_status === 'rejected') && isExec && (
                      <button onClick={() => handleRequestStart(event.id)}
                        disabled={!eventReviewers[event.id]}
                        title={!eventReviewers[event.id] ? '請先選擇審核人' : ''}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Play className="w-3.5 h-3.5" /> 申請開始活動
                      </button>
                    )}
                    {event.status === 'preparation' && event.start_approval_status === 'pending' && isChair && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                          <Clock className="w-3 h-3" /> 待批核
                        </span>
                        <button onClick={() => handleStartEvent(event.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                          <CheckCircle className="w-3.5 h-3.5" /> 批准開始
                        </button>
                        <button onClick={() => handleRejectStart(event.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100">
                          <XCircle className="w-3.5 h-3.5" /> 退回
                        </button>
                      </div>
                    )}
                    {event.start_approval_comment && event.start_approval_status === 'rejected' && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                        💬 {event.start_approval_comment}
                      </div>
                    )}
                    {isChair && event.status === 'active' && (
                      <button
                        onClick={() => handleEndEvent(event.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <Flag className="w-3.5 h-3.5" /> 結束活動
                      </button>
                    )}
                    {event.status === 'preparation' && (
                      <button
                        onClick={() => { setSelectedEvent(event.id); setShowModal(true) }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        <Plus className="w-3.5 h-3.5" /> 新增項目
                      </button>
                    )}
                    {/* 刪除按鈕 — 任何狀態、任何執委會成員都可以刪 */}
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除活動"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 議程 — 執委會開會（所有執委會成員可見） */}
              {event.is_meeting && (
                <div className="px-5 py-3 bg-purple-50/30 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" /> 議程
                  </span>
                  <EventDocUpload
                    eventId={event.id}
                    docType="agenda"
                    currentPath={event.agenda_doc_path}
                    currentName={event.agenda_doc_name}
                  />
                </div>
              )}

              {/* 計劃書 */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> 計劃書
                </span>
                <PlanUploadForm
                  eventId={event.id}
                  currentPath={event.plan_doc_path}
                  currentName={event.plan_doc_name}
                />
              </div>

              {/* 會後提交（活動完成後顯示） */}
              {event.status === 'completed' && (
                <div className="border-b border-gray-100 divide-y divide-gray-50 bg-gray-50/50">
                  {/* 會議記錄 — 僅執委會開會 + 文書先見到 */}
                  {event.is_meeting && isSecretary && (
                    <div className="px-5 py-3 flex items-center justify-between bg-purple-50/50">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-purple-600" /> 會議記錄上載
                      </span>
                      <EventDocUpload
                        eventId={event.id}
                        docType="minutes"
                        currentPath={event.minutes_doc_path}
                        currentName={event.minutes_doc_name}
                      />
                    </div>
                  )}
                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-green-600" /> 財務報告繳交
                    </span>
                    <EventDocUpload
                      eventId={event.id}
                      docType="finance"
                      currentPath={event.finance_doc_path}
                      currentName={event.finance_doc_name}
                    />
                  </div>
                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" /> 有關相片繳交
                    </span>
                    <EventDocUpload
                      eventId={event.id}
                      docType="photo"
                      currentPath={event.photo_doc_path}
                      currentName={event.photo_doc_name}
                    />
                  </div>
                </div>
              )}

              {/* Prep items */}
              {getItemsForEvent(event.id).length === 0 ? (
                <div className="p-5 text-center text-sm text-gray-400">
                  未有籌備項目，按「新增項目」加入
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {getItemsForEvent(event.id).map(item => {
                    const responsibleName = getMemberName(item.responsible_id)
                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              item.status === 'completed'
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {item.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                          </button>
                          <div className="min-w-0">
                            <p className={`font-medium text-sm ${item.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          {responsibleName ? (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {responsibleName}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">未指派</span>
                          )}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 rotate-90" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">新增籌備項目</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">項目名稱 *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-400"
                  placeholder="例如：財政、物資、場地"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">詳細描述</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-green-400"
                  placeholder="需要準備啲咩？"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">負責人</label>
                <select
                  value={newResponsible}
                  onChange={e => setNewResponsible(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white"
                >
                  <option value="">未指派</option>
                  {execMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}（{m.position}）</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                  取消
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? '新增中...' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
