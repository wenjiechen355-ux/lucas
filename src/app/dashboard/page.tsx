import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LayoutDashboard, ClipboardCheck, TrendingUp, FileText, Users, Calendar, Eye, Megaphone, Pin, Cake } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return null

  const isLeader = profile.role === 'leader'
  const canCreateEvent = isLeader || ['主席','副主席'].includes(profile.position || '')

  // Count queries with default-zero on error
  async function safeCount(query: any): Promise<number> {
    const { count } = await query
    return count ?? 0
  }

  const [eventCount, attendanceCount, presentCount, progressCount, completedCount, docCount, pendingCount] =
    await Promise.all([
      safeCount(supabase.from('events').select('*', { count: 'exact', head: true })),
      safeCount(
        isLeader
          ? supabase.from('attendance').select('*', { count: 'exact', head: true })
          : supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('member_id', user.id)
      ),
      safeCount(
        isLeader
          ? supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('status', 'present')
          : supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('member_id', user.id).eq('status', 'present')
      ),
      safeCount(
        isLeader
          ? supabase.from('progress_items').select('*', { count: 'exact', head: true })
          : supabase.from('progress_items').select('*', { count: 'exact', head: true }).eq('member_id', user.id)
      ),
      safeCount(
        isLeader
          ? supabase.from('progress_items').select('*', { count: 'exact', head: true }).eq('status', 'completed')
          : supabase.from('progress_items').select('*', { count: 'exact', head: true }).eq('member_id', user.id).eq('status', 'completed')
      ),
      safeCount(
        isLeader
          ? supabase.from('documents').select('*', { count: 'exact', head: true })
          : supabase.from('documents').select('*', { count: 'exact', head: true }).eq('member_id', user.id)
      ),
      safeCount(supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
    ])

  // 公告
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, profiles!announcements_created_by_fkey(full_name,position)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  // 本月生日
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const { data: birthdays } = await supabase
    .from('profiles')
    .select('id, full_name, birthday')
    .not('birthday', 'is', null)
    .order('birthday')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">歡迎回來，{profile.full_name}</h1>
        <p className="text-gray-500 mt-1">
          {profile.position ? `${profile.position} · ` : ''}{isLeader ? '領袖' : '執委會成員'}
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ClipboardCheck} label="活動出席"
          value={`${presentCount}/${attendanceCount}`} sub="出席 / 總計" color="green" />
        <StatCard icon={TrendingUp} label="進度完成"
          value={`${completedCount}/${progressCount}`} sub="已完成 / 總項" color="amber" />
        <StatCard icon={FileText} label="文檔"
          value={String(docCount)} sub={pendingCount > 0 ? `${pendingCount} 份待審批` : '全部已處理'} color="blue" />
        <StatCard icon={LayoutDashboard} label="活動總數"
          value={String(eventCount)} sub="已舉辦活動" color="purple" />
      </div>

      {/* 公告 */}
      {announcements && announcements.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> 最新公告
          </h2>
          <div className="space-y-2">
            {announcements.slice(0, 3).map(a => (
              <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.is_pinned ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  {a.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                  <h3 className="font-medium text-gray-900 text-sm">{a.title}</h3>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(a.created_at).toLocaleDateString('zh-HK')}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 本月生日 */}
      {(() => {
        const thisMonth = birthdays?.filter(b => {
          if (!b.birthday) return false
          const d = new Date(b.birthday)
          return d.getMonth() + 1 === currentMonth
        })
        if (!thisMonth || thisMonth.length === 0) return null
        return (
          <div className="mb-8">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" /> 本月生日 ({thisMonth.length})
            </h2>
            <div className="bg-white rounded-xl border border-pink-100 p-4">
              <div className="flex flex-wrap gap-3">
                {thisMonth.map(m => {
                  const d = m.birthday ? new Date(m.birthday) : null
                  return (
                    <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 text-xs font-bold">
                        {m.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.full_name}</p>
                        <p className="text-xs text-pink-500">{d ? `${d.getMonth() + 1}/${d.getDate()}` : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 快速入口 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <QuickLink href="/dashboard/attendance" icon={ClipboardCheck} label="打卡簽到" />
          <QuickLink href="/dashboard/progress" icon={TrendingUp} label="更新進度" />
          <QuickLink href="/dashboard/documents" icon={FileText} label="上載文檔" />
          {canCreateEvent && (
            <>
              <QuickLink href="/dashboard/leader/attendance/new" icon={Calendar} label="創建活動" />
              <QuickLink href="/dashboard/leader/attendance" icon={Eye} label="出席情況" />
            </>
          )}
          {isLeader && (
            <>
              <QuickLink href="/dashboard/leader/members" icon={Users} label="成員管理" />
              <QuickLink href="/dashboard/leader/attendance" icon={ClipboardCheck} label="管理出席" />
              <QuickLink href="/dashboard/leader/documents" icon={FileText} label="文檔審批" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-900 mt-1">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  )
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <a href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      <Icon className="w-4 h-4 text-green-600" />
      {label}
    </a>
  )
}
