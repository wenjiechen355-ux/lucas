'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database, Calendar, MapPin, FileText, DollarSign, Camera, Download, Search, RefreshCw, Edit3, TrendingUp, CheckCircle, XCircle, Clock, Upload } from 'lucide-react'

interface EventData {
  id: string
  title: string
  event_date: string
  location?: string
  status: string
  plan_doc_path?: string
  plan_doc_name?: string
  finance_doc_path?: string
  finance_doc_name?: string
  photo_doc_path?: string
  photo_doc_name?: string
  is_meeting?: boolean
  minutes_doc_path?: string
  minutes_doc_name?: string
}

interface ProgressItem {
  id: string
  member_id: string
  title: string
  category?: string
  status: string
  document_name?: string
  document_path?: string
  document_status?: string
  reviewer_comment?: string
  profiles?: { full_name: string; position?: string }
}

export default function EventArchivePage() {
  const router = useRouter()
  const supabase = createClient()
  const [events, setEvents] = useState<EventData[]>([])
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState<'events' | 'progress'>('events')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [evtRes, progRes] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: false }),
      supabase.from('progress_items').select('*, profiles!progress_items_member_id_fkey(full_name,position)').order('updated_at', { ascending: false }).limit(100),
    ])
    setEvents(evtRes.data || [])
    setProgressItems(progRes.data || [])
    setLoading(false)
  }

  function getPublicUrl(path?: string) {
    if (!path) return null
    return supabase.storage.from('documents').getPublicUrl(path).data.publicUrl
  }

  // --- Events ---
  const filteredEvents = events.filter(e => {
    if (filter === 'completed' && e.status !== 'completed') return false
    if (filter === 'active' && e.status !== 'active') return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // --- Progress ---
  const filteredProgress = progressItems.filter(p => {
    if (search) {
      const name = p.profiles?.full_name?.toLowerCase() || ''
      const title = p.title.toLowerCase()
      const q = search.toLowerCase()
      if (!name.includes(q) && !title.includes(q)) return false
    }
    return true
  })

  const completedCount = progressItems.filter(p => p.status === 'completed').length
  const pendingCount = progressItems.filter(p => p.document_status === 'pending').length
  const inProgressCount = progressItems.filter(p => p.status === 'in_progress' && !p.document_status).length

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6" /> 資料庫
          </h1>
          <p className="text-gray-500 mt-1">活動文件及進度記錄一覽</p>
        </div>
        <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('events')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'events' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          活動文件（{events.length}）
        </button>
        <button onClick={() => setTab('progress')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'progress' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          進度記錄（{progressItems.length}）
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'events' ? '搜尋活動...' : '搜尋成員或項目...'}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-400"
        />
      </div>

      {/* ===== Events Tab ===== */}
      {tab === 'events' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              <p className="text-xs text-gray-500 mt-1">總活動</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{events.filter(e => e.status === 'preparation').length}</p>
              <p className="text-xs text-gray-500 mt-1">籌備中</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{events.filter(e => e.status === 'active').length}</p>
              <p className="text-xs text-gray-500 mt-1">進行中</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{events.filter(e => e.status === 'completed').length}</p>
              <p className="text-xs text-gray-500 mt-1">已完成</p>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-1 mb-6">
            {(['all', 'active', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f === 'all' ? '全部' : f === 'active' ? '進行中' : '已完成'}
              </button>
            ))}
          </div>

          {/* Event list */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">暫無記錄</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm">
                  <div className="p-5 border-b border-gray-100 flex items-start justify-between">
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
                  </div>
                  <div className="divide-y divide-gray-50">
                    <DocRow icon={FileText} label="計劃書" path={event.plan_doc_path} name={event.plan_doc_name} getUrl={getPublicUrl} />
                    {event.is_meeting && <DocRow icon={Edit3} label="會議記錄" path={event.minutes_doc_path} name={event.minutes_doc_name} getUrl={getPublicUrl} iconColor="text-purple-500" />}
                    <DocRow icon={DollarSign} label="財務報告" path={event.finance_doc_path} name={event.finance_doc_name} getUrl={getPublicUrl} iconColor="text-green-500" />
                    <DocRow icon={Camera} label="活動相片" path={event.photo_doc_path} name={event.photo_doc_name} getUrl={getPublicUrl} iconColor="text-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== Progress Tab ===== */}
      {tab === 'progress' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{progressItems.length}</p>
              <p className="text-xs text-gray-500 mt-1">總項目</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-gray-500 mt-1">已完成</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">待審批</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-xs text-gray-500 mt-1">進行中</p>
            </div>
          </div>

          {/* Group by member */}
          {(() => {
            // Group items by member
            const memberMap = new Map<string, { id: string; name: string; position?: string; items: typeof progressItems }>()
            for (const item of filteredProgress) {
              const mid = item.member_id
              if (!memberMap.has(mid)) {
                memberMap.set(mid, { id: mid, name: item.profiles?.full_name || '(未知)', position: item.profiles?.position, items: [] })
              }
              memberMap.get(mid)!.items.push(item)
            }
            const members = Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-HK'))

            if (members.length === 0) {
              return (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">暫無進度記錄</p>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                {members.map(member => {
                  const completed = member.items.filter(i => i.status === 'completed').length
                  const pending = member.items.filter(i => i.document_status === 'pending').length
                  const inProg = member.items.filter(i => i.status === 'in_progress' && !i.document_status).length
                  const total = member.items.length

                  return (
                    <details key={member.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
                      <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-green-700">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            {member.position && <p className="text-xs text-gray-500">{member.position}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="text-green-600 font-medium">{completed}/{total}</span>
                          {pending > 0 && <span className="text-amber-600">{pending}待審</span>}
                          {inProg > 0 && <span className="text-blue-600">{inProg}進行</span>}
                        </div>
                      </summary>
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {member.items.map(item => {
                          const isPending = item.document_status === 'pending'
                          const isApproved = item.document_status === 'approved'
                          const isRejected = item.document_status === 'rejected'
                          const isCompleted = item.status === 'completed'

                          return (
                            <a key={item.id} href={`/dashboard/progress/${item.id}`}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                            >
                              {isCompleted || isApproved ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                : isPending ? <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                : isRejected ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                : <Upload className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-400">{item.category}</span>
                                  {item.document_name && (
                                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                      <FileText className="w-3 h-3" />{item.document_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                                isCompleted || isApproved ? 'bg-green-50 text-green-700' :
                                isPending ? 'bg-amber-50 text-amber-700' :
                                isRejected ? 'bg-red-50 text-red-700' :
                                'bg-blue-50 text-blue-700'
                              }`}>
                                {isCompleted || isApproved ? '已' :
                                 isPending ? '待審' :
                                 isRejected ? '退回' : '進行'}
                              </span>
                            </a>
                          )
                        })}
                      </div>
                    </details>
                  )
                })}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

// Helper component for document rows
function DocRow({ icon: Icon, label, path, name, getUrl, iconColor = 'text-gray-400' }: {
  icon: any
  label: string
  path?: string | null
  name?: string | null
  getUrl: (p?: string) => string | null
  iconColor?: string
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
      <span className="text-sm text-gray-700 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} /> {label}
      </span>
      {path && name ? (
        <a href={getUrl(path)!} target="_blank" className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
          <Download className="w-3 h-3" /> {name}
        </a>
      ) : (
        <span className="text-xs text-gray-300">未上載</span>
      )}
    </div>
  )
}
