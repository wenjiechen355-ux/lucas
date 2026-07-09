import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BellRing, Megaphone, FileCheck, CalendarCheck, MessageSquare, CheckCheck, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const typeIcons: Record<string, typeof BellRing> = {
  announcement: Megaphone,
  approval_progress: FileCheck,
  approval_document: FileCheck,
  activity: CalendarCheck,
  review: MessageSquare,
  poll: CalendarCheck,
}

const typeLabels: Record<string, string> = {
  announcement: '公告',
  approval_progress: '進度審批',
  approval_document: '文檔審批',
  activity: '活動提醒',
  review: '審批結果',
  poll: '投票',
}

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BellRing className="w-6 h-6 text-amber-500" /> 通知中心
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
              {unreadCount} 未讀
            </span>
          )}
        </h1>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <form action="/api/notifications/read-all" method="POST">
            <button className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium">
              <CheckCheck className="w-4 h-4" />
              全部已讀
            </button>
          </form>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BellRing className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暫無通知</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => {
            const Icon = typeIcons[n.type] || BellRing
            return (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-4 transition-colors ${
                  n.is_read ? 'border-gray-100' : 'border-l-4 border-l-green-500 border-gray-200 bg-green-50/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${n.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                        {n.title}
                      </p>
                    </div>
                    {n.message && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">
                        {typeLabels[n.type] || n.type}
                      </span>
                      <span className="text-xs text-gray-300">
                        {new Date(n.created_at).toLocaleString('zh-HK', {
                          month: 'numeric', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {n.link && (
                      <Link href={n.link}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="查看">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                    {!n.is_read && (
                      <form action="/api/notifications/read" method="POST">
                        <input type="hidden" name="id" value={n.id} />
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600" title="標為已讀">
                          <Check className="w-4 h-4" />
                        </button>
                      </form>
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
