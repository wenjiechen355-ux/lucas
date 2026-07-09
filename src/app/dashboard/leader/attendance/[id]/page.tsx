import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle, XCircle, Users, FileText, Calendar } from 'lucide-react'
import DeleteEventForm from './delete-event-form'
import LocationMap from '@/components/location-map'
import AgendaUpload from './agenda-upload'
import SetDateForm from './set-date-form'

export default async function EventAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: eventId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('role,position').eq('id', user?.id).single()
  const canDelete = profile?.role === 'leader' || ['主席','副主席'].includes(profile?.position || '')

  // 获取活动
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) notFound()

  // 获取所有成员
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  // 获取此活动的出席记录
  const { data: attendanceRecords } = await supabase
    .from('attendance')
    .select('*')
    .eq('event_id', eventId)

  const attendanceMap = new Map(attendanceRecords?.map(a => [a.member_id, a]) || [])
  const checkedInCount = attendanceRecords?.filter(a => a.status === 'present').length || 0
  const absentCount = attendanceRecords?.filter(a => a.status === 'absent').length || 0
  const excusedCount = attendanceRecords?.filter(a => a.status === 'excused').length || 0

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {event.event_date ? (
                <span>{new Date(event.event_date).toLocaleDateString('zh-HK')}</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium">
                  <Calendar className="w-3 h-3" /> 日期待定
                </span>
              )}
              {event.location && <span>📍 {event.location}</span>}
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-2">{event.description}</p>
            )}
            {event.is_exec_only && (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                <Users className="w-3 h-3" /> 僅限執委會
              </span>
            )}
          </div>
          {canDelete && <DeleteEventForm eventId={eventId} />}
        </div>
        {event.latitude && event.longitude && (
          <div className="mt-3">
            <LocationMap lat={event.latitude} lng={event.longitude} label={event.location || '活動地點'} />
          </div>
        )}
      </div>

      {/* 設定日期 — 日期待定時顯示 */}
      {!event.event_date && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
          <SetDateForm eventId={eventId} />
        </div>
      )}

      {/* 議程上載 — 執委會開會 */}
      {event.is_meeting && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 mb-6">
          <AgendaUpload
            eventId={eventId}
            agendaPath={event.agenda_doc_path}
            agendaName={event.agenda_doc_name}
          />
        </div>
      )}

      {/* 出席统计 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{checkedInCount}</p>
          <p className="text-sm text-green-600 mt-1">出席</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{absentCount}</p>
          <p className="text-sm text-red-600 mt-1">缺席</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{excusedCount}</p>
          <p className="text-sm text-amber-600 mt-1">請假</p>
        </div>
      </div>

      {/* 成员列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">成員</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">簽到時間</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">狀態</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members?.map(member => {
                const record = attendanceMap.get(member.id)
                return (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-700">{member.full_name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{member.full_name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {record?.checkin_time
                        ? new Date(record.checkin_time).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'present' ? 'bg-green-50 text-green-700' :
                          record.status === 'excused' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {record.status === 'present' ? '出席' :
                           record.status === 'excused' ? '請假' : '缺席'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">未有記錄</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <form action={`/api/attendance/batch/${eventId}`} method="POST" className="inline-flex gap-1">
                        <input type="hidden" name="memberId" value={member.id} />
                        <button
                          type="submit"
                          name="status"
                          value="present"
                          className="p-1.5 rounded hover:bg-green-50 text-green-600"
                          title="標記出席"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="submit"
                          name="status"
                          value="absent"
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                          title="標記缺席"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
