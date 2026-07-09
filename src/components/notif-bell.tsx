'use client'

import { useEffect, useState } from 'react'
import { BellRing } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NotifBell() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count: unread } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (unread !== null) setCount(unread)
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const isActive = pathname === '/dashboard/notifications'

  return (
    <Link
      href="/dashboard/notifications"
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
        isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <BellRing className="w-5 h-5" />
      通知中心
      {count > 0 && (
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-500 text-white rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
