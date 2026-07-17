'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, ClipboardList, User, Calendar, MapPin, MoreHorizontal, CheckCircle, XCircle, Clock, RefreshCw, Trash2, FileText, Play, Flag, DollarSign, Camera, Edit3, AlertCircle, ChevronRight, Shield, Crown, Users } from 'lucide-react'
import PlanUploadForm from './plan-upload-form'
import EventDocUpload from './event-doc-upload'
import EventTransactions from '@/components/event-transactions'
import ReviewerSelector from '@/components/reviewer-selector'
import MemberReminder, { type MemberStatus } from '@/components/member-reminder'

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
  agenda_raw_text?: string
  agenda_analysis?: string
  agenda_analysis_status?: string
  is_online?: boolean
  // 計劃書 AI 分析
  plan_raw_text?: string
  plan_analysis?: string
  plan_analysis_status?: string
  plan_analyzed_at?: string
  plan_completeness?: string
  // 新 3 步審批字段
  approval_state?: string       // 'none' | 'vp_pending' | 'vp_approved' | 'chair_approved' | 'leader_approved' | 'rejected'
  vp_approved_by?: string
  vp_approved_at?: string
  chair_approved_by?: string
  chair_approved_at?: string
  leader_approved_by?: string
  leader_approved_at?: string
  approval_rejected_by?: string
  approval_rejected_at?: string
  approval_rejected_comment?: string
  // 舊字段（向後兼容）
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

/* ───── 審批狀態 helpers ───── */

/** 取得當前審批步驟描述 */
function getApprovalStepText(state: string | undefined, rejectComment?: string) {
  switch (state) {
    case 'none': return { label: '未申請', color: 'text-gray-400', bg: 'bg-gray-50', icon: Clock }
    case 'vp_pending': return { label: '待副主席審批', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock }
    case 'vp_approved': return { label: '副主席已批 · 待主席審批', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock }
    case 'chair_approved': return { label: '主席已批 · 待領袖審批', color: 'text-purple-600', bg: 'bg-purple-50', icon: Clock }
    case 'leader_approved': return { label: '全部審批通過', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle }
    case 'rejected': return { label: `已退回${rejectComment ? `：${rejectComment}` : ''}`, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle }
    default: return { label: '未申請', color: 'text-gray-400', bg: 'bg-gray-50', icon: Clock }
  }
}

/** 審批步驟進度（1-based） */
function getApprovalStep(state: string | undefined): number {
  switch (state) {
    case 'vp_approved': return 1
    case 'chair_approved': return 2
    case 'leader_approved': return 3
    default: return 0
  }
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
  const [allMembers, setAllMembers] = useState<Profile[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, string>>>({})

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

    // Get events
    const { data: evts } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
    setEvents(evts || [])

    // Get all members (for reminder)
    const { data: allMems } = await supabase
      .from('profiles')
      .select('id, full_name, position')
      .order('full_name')
    setAllMembers(allMems || [])

    // Get all prep items
    const { data: items } = await supabase
      .from('event_prep_items')
      .select('*')
      .order('created_at', { ascending: false })
    setPrepItems(items || [])

    // Get all attendance records
    const { data: attRecs } = await supabase
      .from('attendance')
      .select('event_id, member_id, status')
    if (attRecs) {
      const map: Record<string, Record<string, string>> = {}
      for (const r of attRecs) {
        if (!map[r.event_id]) map[r.event_id] = {}
        map[r.event_id][r.member_id] = r.status
      }
      setAttendanceMap(map)
    }

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

  // ─── 角色判斷 ───
  const isVp = profile?.position === '副主席'
  const isChair = profile?.position === '主席'
  const isOtherLeader = !!profile?.position && profile?.position !== '主席' && profile?.position !== '副主席'
  const isExec = !!profile?.position
  const isSecretary = profile?.position === '文書'

  // ─── 審批處理 ───

  /** 申請開始活動（任何執委會成員） */
  async function handleRequestStart(eventId: string) {
    if (!confirm('提交 3 步審批申請？副主席 → 主席 → 領袖 審批後即可開始活動。')) return
    await supabase.from('events').update({
      approval_state: 'vp_pending',
      approval_rejected_comment: null,
    }).eq('id', eventId)
    loadData()
  }

  /** Step 1: 副主席審批通過 */
  async function handleVpApprove(eventId: string) {
    if (!confirm('副主席審批通過？下一步將交由主席審批。')) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('events').update({
      approval_state: 'vp_approved',
      vp_approved_by: user?.id,
      vp_approved_at: new Date().toISOString(),
      approval_rejected_comment: null,
    }).eq('id', eventId)
    loadData()
  }

  /** Step 2: 主席審批通過 */
  async function handleChairApprove(eventId: string) {
    if (!confirm('主席審批通過？下一步將交由領袖審批。')) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('events').update({
      approval_state: 'chair_approved',
      chair_approved_by: user?.id,
      chair_approved_at: new Date().toISOString(),
    }).eq('id', eventId)
    loadData()
  }

  /** Step 3: 領袖審批通過 → 活動自動開始 */
  async function handleLeaderApprove(eventId: string) {
    if (!confirm('領袖審批通過？活動將立即開始並開放簽到。')) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('events').update({
      approval_state: 'leader_approved',
      leader_approved_by: user?.id,
      leader_approved_at: new Date().toISOString(),
      status: 'active',
      attendance_open: true,
    }).eq('id', eventId)
    loadData()
  }

  /** 退回（任何步驟） */
  async function handleRejectApproval(eventId: string) {
    const comment = prompt('請輸入退回原因（可選）：')
    if (comment === null) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('events').update({
      approval_state: 'rejected',
      approval_rejected_by: user?.id,
      approval_rejected_at: new Date().toISOString(),
      approval_rejected_comment: comment || null,
    }).eq('id', eventId)
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
          {events.map(event => {
            // 決定使用新定舊審批字段
            const state = event.approval_state || (
              !event.start_approval_status || event.start_approval_status === 'approved'
                ? 'none'
                : event.start_approval_status === 'pending'
                  ? 'vp_pending'
                  : event.start_approval_status === 'rejected'
                    ? 'rejected'
                    : 'none'
            )
            const stepInfo = getApprovalStepText(state, event.approval_rejected_comment || event.start_approval_comment)
            const currentStep = getApprovalStep(state)
            const StepIcon = stepInfo.icon

            return (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Event header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      {event.status === 'preparation' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">籌備中</span>}
                      {event.status === 'active' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">進行中</span>}
                      {event.status === 'completed' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">已完成</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(event.event_date).toLocaleDateString('zh-HK')}</span>
                      {event.is_online ? <span className="flex items-center gap-1 text-blue-600">💻 線上</span> :
                       event.location ? <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Member Reminder */}
                    {(() => {
                      const eventAttMap = attendanceMap[event.id] || {}
                      const members: MemberStatus[] = (allMembers || []).map((m: Profile) => ({
                        memberId: m.id,
                        fullName: m.full_name,
                        position: m.position,
                        attendanceStatus: (eventAttMap[m.id] || null) as any,
                      }))
                      return (
                        <MemberReminder
                          targetTitle={event.title}
                          link={`https://scout1venture.vercel.app/dashboard/attendance`}
                          type="attendance"
                          members={members}
                        />
                      )
                    })()}

                    {/* ─── 3 步審批 UI ─── */}
                    {event.status === 'preparation' && state === 'none' && isExec && (
                      <button onClick={() => handleRequestStart(event.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100">
                        <Play className="w-3.5 h-3.5" /> 申請開始活動
                      </button>
                    )}

                    {event.status === 'preparation' && state === 'rejected' && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg max-w-[200px] truncate" title={event.approval_rejected_comment || event.start_approval_comment || ''}>
                          <XCircle className="w-3 h-3 flex-shrink-0" /> {event.approval_rejected_comment || event.start_approval_comment || '已退回'}
                        </span>
                        {isExec && (
                          <button onClick={() => handleRequestStart(event.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100">
                            重新申請
                          </button>
                        )}
                      </div>
                    )}

                    {/* Step 1: VP pending — 副主席審批 */}
                    {event.status === 'preparation' && state === 'vp_pending' && isVp && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                          <Clock className="w-3 h-3" /> 待你審批 (1/3)
                        </span>
                        <button onClick={() => handleVpApprove(event.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                          <CheckCircle className="w-3.5 h-3.5" /> 副主席批准
                        </button>
                        <button onClick={() => handleRejectApproval(event.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100">
                          <XCircle className="w-3.5 h-3.5" /> 退回
                        </button>
                      </div>
                    )}

                    {/* Step 1 done, Step 2 pending — 主席審批 */}
                    {event.status === 'preparation' && state === 'vp_approved' && (
                      <>
                        {isChair ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                              <Clock className="w-3 h-3" /> 待你審批 (2/3)
                            </span>
                            <button onClick={() => handleChairApprove(event.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                              <CheckCircle className="w-3.5 h-3.5" /> 主席批准
                            </button>
                            <button onClick={() => handleRejectApproval(event.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100">
                              <XCircle className="w-3.5 h-3.5" /> 退回
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3" /> 待主席審批 (2/3)
                          </span>
                        )}
                      </>
                    )}

                    {/* Step 2 done, Step 3 pending — 領袖審批 */}
                    {event.status === 'preparation' && state === 'chair_approved' && (
                      <>
                        {isOtherLeader ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                              <Clock className="w-3 h-3" /> 待你審批 (3/3)
                            </span>
                            <button onClick={() => handleLeaderApprove(event.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                              <CheckCircle className="w-3.5 h-3.5" /> 領袖批准
                            </button>
                            <button onClick={() => handleRejectApproval(event.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100">
                              <XCircle className="w-3.5 h-3.5" /> 退回
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3" /> 待領袖審批 (3/3)
                          </span>
                        )}
                      </>
                    )}

                    {/* All approved — show info */}
                    {state === 'leader_approved' && event.status === 'active' && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        <CheckCircle className="w-3 h-3" /> 3 步審批通過
                      </span>
                    )}

                    {/* VP / Chair waiting (show for non-approver roles) */}
                    {event.status === 'preparation' && state === 'vp_pending' && !isVp && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" /> 待副主席審批 (1/3)
                      </span>
                    )}

                    {/* End event button */}
                    {(isChair || isVp) && event.status === 'active' && (
                      <button
                        onClick={() => handleEndEvent(event.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <Flag className="w-3.5 h-3.5" /> 結束活動
                      </button>
                    )}

                    {/* Add prep item button */}
                    {event.status === 'preparation' && (
                      <button
                        onClick={() => { setSelectedEvent(event.id); setShowModal(true) }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        <Plus className="w-3.5 h-3.5" /> 新增項目
                      </button>
                    )}

                    {/* 刪除 */}
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除活動"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ─── 審批進度條 ─── */}
                {event.status === 'preparation' && state !== 'none' && state !== 'rejected' && (
                  <div className="mt-3 flex items-center gap-1">
                    {/* Step 1: 副主席 */}
                    <div className={`flex items-center gap-1.5 text-xs ${
                      currentStep >= 1 ? 'text-green-600' : state === 'vp_pending' ? 'text-amber-600' : 'text-gray-400'
                    }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        currentStep >= 1 ? 'bg-green-100' : state === 'vp_pending' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        <Shield className="w-3 h-3" />
                      </div>
                      <span>副主席</span>
                      {currentStep >= 1 && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>
                    <ChevronRight className={`w-3 h-3 ${currentStep >= 1 ? 'text-gray-400' : 'text-gray-200'}`} />
                    {/* Step 2: 主席 */}
                    <div className={`flex items-center gap-1.5 text-xs ${
                      currentStep >= 2 ? 'text-green-600' : currentStep === 1 && state === 'vp_approved' ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        currentStep >= 2 ? 'bg-green-100' : currentStep === 1 ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Crown className="w-3 h-3" />
                      </div>
                      <span>主席</span>
                      {currentStep >= 2 && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>
                    <ChevronRight className={`w-3 h-3 ${currentStep >= 2 ? 'text-gray-400' : 'text-gray-200'}`} />
                    {/* Step 3: 領袖 */}
                    <div className={`flex items-center gap-1.5 text-xs ${
                      currentStep >= 3 ? 'text-green-600' : currentStep === 2 && state === 'chair_approved' ? 'text-purple-600' : 'text-gray-400'
                    }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        currentStep >= 3 ? 'bg-green-100' : currentStep === 2 ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <Users className="w-3 h-3" />
                      </div>
                      <span>領袖</span>
                      {currentStep >= 3 && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>
                  </div>
                )}
              </div>

              {/* 議程 */}
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
                    agendaRawText={event.agenda_raw_text}
                    agendaAnalysis={event.agenda_analysis}
                    agendaAnalysisStatus={event.agenda_analysis_status}
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
                  planRawText={event.plan_raw_text}
                  planAnalysis={event.plan_analysis}
                  planAnalysisStatus={event.plan_analysis_status}
                  planCompleteness={event.plan_completeness}
                />
              </div>

              {/* 活動付款管理 */}
              <div className="border-b border-gray-100 px-5 py-3">
                <PaymentManager eventId={event.id} eventStatus={event.status} isExec={isExec} />
              </div>

              {/* 會後提交 */}
              {event.status === 'completed' && (
                <div className="border-b border-gray-100 divide-y divide-gray-50 bg-gray-50/50">
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

              {/* 活动收支 */}
              <div className="p-5 border-t border-gray-100">
                <EventTransactions eventId={event.id} isExec={isExec} />
              </div>
            </div>
          )})}
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

/* ───── 活動付款管理元件 ───── */
function PaymentManager({ eventId, eventStatus, isExec }: { eventId: string; eventStatus: string; isExec: boolean }) {
  const supabase = createClient()
  const [paymentType, setPaymentType] = useState<string | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [savingPayment, setSavingPayment] = useState(false)

  useEffect(() => { loadPayments() }, [eventId])

  async function loadPayments() {
    const { data: evt } = await supabase.from('events').select('payment_type').eq('id', eventId).single()
    setPaymentType(evt?.payment_type || null)

    const { data: pays } = await supabase
      .from('event_payments')
      .select('*, profiles:member_id(full_name)')
      .eq('event_id', eventId)
    setPayments(pays || [])

    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, position')
      .order('full_name')
    setAllProfiles(profs || [])
  }

  async function handleSetPaymentType(type: string | null) {
    if (!isExec) return
    setSavingPayment(true)
    if (type === 'pre') {
      setSelectedMembers(payments.filter(p => !p.receipt_path && p.status !== 'paid').map(p => p.member_id))
      setShowMemberPicker(true)
    }
    await fetch('/api/events/set-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, paymentType: type, memberIds: [] }),
    })
    setPaymentType(type)
    loadPayments()
    setSavingPayment(false)
  }

  async function handleConfirmMembers() {
    if (!isExec || selectedMembers.length === 0) return
    setSavingPayment(true)
    const res = await fetch('/api/events/set-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, paymentType: 'pre', memberIds: selectedMembers }),
    })
    const data = await res.json()
    if (data.success) {
      setShowMemberPicker(false)
      loadPayments()
    } else {
      alert(data.error || '設定失敗')
    }
    setSavingPayment(false)
  }

  const canSetPayment = isExec && (eventStatus === 'preparation' || eventStatus === 'active')
  const canPostPayment = isExec && eventStatus === 'completed'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-green-600" /> 活動付款
        </span>
        {canSetPayment && (
          <div className="flex items-center gap-1">
            <select
              value={paymentType || ''}
              onChange={e => handleSetPaymentType(e.target.value || null)}
              disabled={savingPayment}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white outline-none"
            >
              <option value="">唔需要付款</option>
              <option value="pre">事前付款</option>
              <option value="post">事後付款</option>
            </select>
          </div>
        )}
        {canPostPayment && !paymentType && (
          <div className="flex items-center gap-1">
            <select
              value={paymentType || ''}
              onChange={e => handleSetPaymentType(e.target.value || null)}
              disabled={savingPayment}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white outline-none"
            >
              <option value="">唔需要付款</option>
              <option value="post">事後付款</option>
            </select>
          </div>
        )}
      </div>

      {paymentType === 'pre' && (
        <p className="text-xs text-amber-600 mb-2">💰 事前付款 — 需要揀邊啲成員需要俾錢</p>
      )}
      {paymentType === 'post' && (
        <p className="text-xs text-blue-600 mb-2">📋 事後付款 — 活動完成後揀邊啲成員需要俾錢</p>
      )}

      {paymentType === 'pre' && (
        <>
          {showMemberPicker ? (
            <div className="bg-amber-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-amber-700">揀需要俾錢嘅成員</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {allProfiles.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(p.id)}
                      onChange={() => {
                        setSelectedMembers(prev =>
                          prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                        )
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-green-600"
                    />
                    {p.full_name}
                    {p.position && <span className="text-gray-400">（{p.position}）</span>}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleConfirmMembers} disabled={savingPayment || selectedMembers.length === 0}
                  className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {savingPayment ? '設定中...' : `確定（${selectedMembers.length} 人）`}
                </button>
                <button onClick={() => setShowMemberPicker(false)}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => {
              setSelectedMembers(payments.map(p => p.member_id))
              setShowMemberPicker(true)
            }}
              className="text-xs text-amber-600 hover:text-amber-700 underline">
              揀需要付款嘅成員（{payments.length} 人已設定）
            </button>
          )}
        </>
      )}

      {paymentType === 'post' && eventStatus === 'completed' && (
        <>
          {showMemberPicker ? (
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-blue-700">揀需要俾錢嘅成員</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {allProfiles.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(p.id)}
                      onChange={() => {
                        setSelectedMembers(prev =>
                          prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                        )
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-green-600"
                    />
                    {p.full_name}
                    {p.position && <span className="text-gray-400">（{p.position}）</span>}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleConfirmMembers} disabled={savingPayment || selectedMembers.length === 0}
                  className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {savingPayment ? '設定中...' : `確定（${selectedMembers.length} 人）`}
                </button>
                <button onClick={() => setShowMemberPicker(false)}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => {
              setSelectedMembers(payments.map(p => p.member_id))
              setShowMemberPicker(true)
            }}
              className="text-xs text-blue-600 hover:text-blue-700 underline">
              揀需要付款嘅成員（{payments.length} 人已設定）
            </button>
          )}
        </>
      )}

      {payments.length > 0 && (
        <div className="mt-2 space-y-1">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-gray-700">{p.profiles?.full_name || '未知'}</span>
              <div className="flex items-center gap-2">
                {p.receipt_name && (
                  <span className="text-green-500">📎 已上載單據</span>
                )}
                {p.status === 'paid' ? (
                  <span className="flex items-center gap-0.5 text-green-600 font-medium">
                    <CheckCircle className="w-3 h-3" /> 已付款
                  </span>
                ) : (
                  <span className="text-amber-500">⏳ 未付款</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
