import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClipboardCheck, Plus, Lock, Unlock, Users } from 'lucide-react'
import ToggleAttendanceForm from './toggle-form'

export default async function LeaderAttendancePage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('position').eq('id', user?.id).single()
  const isChair = profile?.position === '主席' || profile?.position === '副主席'

  // 获取所有活动（含出席数量）
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      attendance(count)
    `)
    .order('event_date', { ascending: false })
    .limit(20)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">出席管理</h1>
          <p className="text-gray-500 mt-1">建立活動、管理出席記錄</p>
        </div>
        <a
          href="/dashboard/leader/attendance/new"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增活動
        </a>
      </div>

      <div className="space-y-3">
        {events?.map(event => (
          <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{new Date(event.event_date).toLocaleDateString('zh-HK')}</span>
                  {event.location && <span>📍 {event.location}</span>}
                  <span className="flex items-center gap-1">
                    <ClipboardCheck className="w-4 h-4" />
                    出席記錄: {event.attendance?.[0]?.count || 0}
                  </span>
                  <span className={`flex items-center gap-1 ${
                    event.attendance_open ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {event.attendance_open ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {event.attendance_open ? '開放中' : '未開放'}
                  </span>
                  {event.is_exec_only && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <Users className="w-3.5 h-3.5" />
                      執委會
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isChair && (
                  <ToggleAttendanceForm eventId={event.id} open={event.attendance_open} />
                )}
                <a
                  href={`/dashboard/leader/attendance/${event.id}`}
                  className="text-sm text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
                >
                  管理 →
                </a>
              </div>
            </div>
          </div>
        ))}

        {(!events || events.length === 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">暫無活動</h3>
            <p className="text-sm text-gray-500 mb-4">建立第一個活動開始記錄出席</p>
            <a
              href="/dashboard/leader/attendance/new"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              新增活動
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
