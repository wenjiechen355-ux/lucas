import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default async function AttendancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user?.id).single()

  // 只顯示已開放出席嘅活動
  // 執委會例會（is_exec_only）只對執委會成員顯示
  const isExec = !!profile?.position

  let query = supabase
    .from('events')
    .select('*')
    .eq('attendance_open', true)
  if (!isExec) {
    query = query.eq('is_exec_only', false)
  }
  const { data: events } = await query
    .order('event_date', { ascending: false })
    .limit(20)

  // 获取当前用户的出席记录
  const { data: myAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('member_id', profile?.id)

  const attendanceMap = new Map(myAttendance?.map(a => [a.event_id, a]) || [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">出席打卡</h1>
          <p className="text-gray-500 mt-1">查看活動、簽到打卡</p>
        </div>
      </div>

      {(!events || events.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">暫無活動</h3>
          <p className="text-sm text-gray-500">目前未有安排任何活動</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => {
            const myRecord = attendanceMap.get(event.id)
            const isPast = new Date(event.event_date) < new Date()

            return (
              <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      <span>{new Date(event.event_date).toLocaleDateString('zh-HK')}</span>
                      {event.location && <span>📍 {event.location}</span>}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                    )}
                    {event.is_exec_only && isExec && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-purple-600">
                        <Users className="w-3 h-3" /> 執委會例會
                      </span>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {myRecord ? (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        myRecord.status === 'present'
                          ? 'bg-green-50 text-green-700'
                          : myRecord.status === 'excused'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {myRecord.status === 'present' ? <CheckCircle className="w-3.5 h-3.5" /> :
                         myRecord.status === 'excused' ? <Clock className="w-3.5 h-3.5" /> :
                         <XCircle className="w-3.5 h-3.5" />}
                        {myRecord.status === 'present' ? '已簽到' :
                         myRecord.status === 'excused' ? '請假' : '缺席'}
                      </span>
                    ) : (
                      <CheckInButton eventId={event.id} isPast={isPast} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CheckInButton({ eventId, isPast }: { eventId: string; isPast: boolean }) {
  if (isPast) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
        已結束
      </span>
    )
  }

  return (
    <form action={`/api/attendance/checkin/${eventId}`} method="POST" className="flex gap-2">
      <button
        type="submit"
        name="status"
        value="present"
        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        簽到
      </button>
      <button
        type="submit"
        name="status"
        value="excused"
        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
      >
        請假
      </button>
    </form>
  )
}
