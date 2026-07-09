import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, CheckCircle2, XCircle,
  FileText, Vote, Shield, UserIcon, Award, BarChart3, Activity, Medal
} from 'lucide-react'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Fetch member profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  // Fetch attendance records with event names
  const { data: attendance } = await supabase
    .from('attendance')
    .select('status, created_at, events(title, event_date)')
    .eq('member_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch progress items
  const { data: progress } = await supabase
    .from('progress_items')
    .select('*')
    .eq('member_id', id)
    .order('created_at', { ascending: false })

  // Fetch documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('member_id', id)
    .order('created_at', { ascending: false })

  // Fetch poll votes
  const { data: pollVotes } = await supabase
    .from('event_poll_votes')
    .select('poll_id, created_at, event_polls(title, status)')
    .eq('member_id', id)
    .order('created_at', { ascending: false })

  // Fetch badges
  const { data: badges } = await supabase.from('badges').select('*').order('sort_order')
  const { data: memberBadges } = await supabase
    .from('member_badges')
    .select('*')
    .eq('member_id', id)
  const badgeMap = new Map((memberBadges || []).map((mb: any) => [mb.badge_id, mb]))
  const badgesByCategory: Record<string, any[]> = {}
  for (const badge of (badges || [])) {
    const cat = badge.category || 'other'
    if (!badgesByCategory[cat]) badgesByCategory[cat] = []
    badgesByCategory[cat].push({ ...badge, memberBadge: badgeMap.get(badge.id) || null })
  }

  // Calculate stats
  const attendanceList = attendance || []
  const present = attendanceList.filter(a => a.status === 'present').length
  const total = attendanceList.length
  const attendanceRate = total > 0 ? Math.round(present / total * 100) : 0
  const progressCompleted = (progress || []).filter(p => p.status === 'completed').length
  const progressTotal = (progress || []).length
  const docsApproved = (documents || []).filter(d => d.status === 'approved').length
  const docsTotal = (documents || []).length
  const badgesTotal = badges?.length || 0
  const badgesAwarded = (memberBadges || []).filter((mb: any) => mb.status === 'awarded' || mb.status === 'completed').length

  return (
    <div>
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/leader/members" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成員檔案</h1>
          <p className="text-gray-500 text-sm">{profile.full_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* === LEFT: Personal Info === */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
                {profile.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {profile.position && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      profile.position === '主席' ? 'bg-red-50 text-red-700' :
                      profile.position === '副主席' ? 'bg-orange-50 text-orange-700' :
                      'bg-purple-50 text-purple-700'
                    }`}>
                      <Shield className="w-3 h-3 mr-1" />{profile.position}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    profile.role === 'leader' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {profile.role === 'leader' ? '領袖' : '成員'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profile.phone}</span>
                </div>
              )}
              {profile.scout_unit && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profile.scout_unit}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">
                  註冊日期：{new Date(profile.created_at).toLocaleDateString('zh-HK')}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
              <div className="text-xs text-gray-500 mt-1">出席率</div>
              <div className="text-xs text-gray-400">{present}/{total} 次</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{progressCompleted}</div>
              <div className="text-xs text-gray-500 mt-1">進度完成</div>
              <div className="text-xs text-gray-400">共 {progressTotal} 項</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{docsApproved}</div>
              <div className="text-xs text-gray-500 mt-1">文檔已審批</div>
              <div className="text-xs text-gray-400">共 {docsTotal} 份</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{badgesAwarded}</div>
              <div className="text-xs text-gray-500 mt-1">獎章獲得</div>
              <div className="text-xs text-gray-400">共 {badgesTotal} 項</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{pollVotes?.length || 0}</div>
              <div className="text-xs text-gray-500 mt-1">參與投票</div>
              <div className="text-xs text-gray-400">次</div>
            </div>
          </div>
        </div>

        {/* === RIGHT: Detailed Records === */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance History */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-green-600" /> 出席記錄
            </h3>
            {attendanceList.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">暫無出席記錄</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendanceList.slice(0, 20).map((a, i) => {
                  const event = a.events as any
                  return (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        {a.status === 'present' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                         a.status === 'excused' ? <Clock className="w-4 h-4 text-amber-500" /> :
                         <XCircle className="w-4 h-4 text-red-400" />}
                        <span className="text-sm text-gray-700">{event?.title || '活動'}</span>
                        {event?.event_date && (
                          <span className="text-xs text-gray-400">{event.event_date}</span>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        a.status === 'present' ? 'bg-green-50 text-green-600' :
                        a.status === 'excused' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-500'
                      }`}>
                        {a.status === 'present' ? '出席' : a.status === 'excused' ? '請假' : '缺席'}
                      </span>
                    </div>
                  )
                })}
                {attendanceList.length > 20 && (
                  <p className="text-xs text-gray-400 text-center py-1">還有 {attendanceList.length - 20} 條記錄...</p>
                )}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" /> 進度記錄
            </h3>
            {progressTotal === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">暫無進度記錄</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(progress || []).slice(0, 20).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      {p.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                       p.status === 'in_progress' ? <Activity className="w-4 h-4 text-blue-500" /> :
                       <Clock className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm text-gray-700">{p.title}</span>
                      {p.category && <span className="text-xs text-gray-400">{p.category}</span>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      p.status === 'completed' ? 'bg-green-50 text-green-600' :
                      p.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {p.status === 'completed' ? '已完成' : p.status === 'in_progress' ? '進行中' : '未開始'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" /> 文檔記錄
            </h3>
            {docsTotal === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">暫無文檔記錄</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(documents || []).slice(0, 20).map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{d.title || d.file_name}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                      d.status === 'approved' ? 'bg-green-50 text-green-600' :
                      d.status === 'rejected' ? 'bg-red-50 text-red-500' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {d.status === 'approved' ? '已通過' : d.status === 'rejected' ? '已退回' : '待審核'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Medal className="w-5 h-5 text-amber-600" /> 獎章進度
            </h3>
            {(!badges || badges.length === 0) ? (
              <p className="text-sm text-gray-400 py-4 text-center">暫無獎章</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(badgesByCategory).map(([cat, list]) => {
                  const completed = list.filter(b => b.memberBadge?.status === 'awarded' || b.memberBadge?.status === 'completed').length
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">{cat}</span>
                        <span className="text-xs text-gray-400">{completed}/{list.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {list.map(b => {
                          const mb = b.memberBadge
                          const done = mb?.status === 'awarded' || mb?.status === 'completed'
                          const inProg = mb?.status === 'in_progress'
                          return (
                            <div key={b.id} title={b.description || b.name}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                done ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                inProg ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                'bg-gray-50 border-gray-200 text-gray-400'
                              }`}>
                              <span className="text-sm">{b.icon || '🏅'}</span>
                              <span>{b.name}</span>
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

          {/* Polls */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Vote className="w-5 h-5 text-orange-600" /> 投票參與
            </h3>
            {(!pollVotes || pollVotes.length === 0) ? (
              <p className="text-sm text-gray-400 py-4 text-center">暫無投票記錄</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pollVotes.slice(0, 15).map((v, i) => {
                  const poll = v.event_polls as any
                  return (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Vote className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700">{poll?.title || '投票'}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        poll?.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {poll?.status === 'open' ? '進行中' : '已結束'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
