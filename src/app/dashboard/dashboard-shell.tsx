'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import {
  LayoutDashboard,
  ClipboardCheck,
  TrendingUp,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  KeyRound,
} from 'lucide-react'
import { useState } from 'react'
import { Calendar, Eye, CheckSquare, ClipboardList, Database, Vote } from 'lucide-react'

const memberNavItems = [
  { label: '儀表板', href: '/dashboard', icon: LayoutDashboard },
  { label: '出席打卡', href: '/dashboard/attendance', icon: ClipboardCheck },
  { label: '進度記錄', href: '/dashboard/progress', icon: TrendingUp },
  { label: '我的文檔', href: '/dashboard/documents', icon: FileText },
  { label: '活動投票', href: '/dashboard/event-polls', icon: Vote },
]

const leaderNavItems = [
  { label: '儀表板', href: '/dashboard', icon: LayoutDashboard },
  { label: '成員管理', href: '/dashboard/leader/members', icon: Users },
  { label: '出席管理', href: '/dashboard/leader/attendance', icon: ClipboardCheck },
  { label: '進度記錄', href: '/dashboard/progress', icon: TrendingUp },
  { label: '文檔審批', href: '/dashboard/leader/documents', icon: FileText },
]

const createEventItem = { label: '創建活動', href: '/dashboard/leader/attendance/new', icon: Calendar }
const viewAttendanceItem = { label: '出席情況', href: '/dashboard/leader/attendance', icon: Eye }
const approvalItem = { label: '審批項目', href: '/dashboard/leader/approvals', icon: CheckSquare }
const prepItem = { label: '活動籌備', href: '/dashboard/leader/event-prep', icon: ClipboardList }
const archiveItem = { label: '資料庫', href: '/dashboard/leader/event-archive', icon: Database }
const pollItem = { label: '活動時間徵集', href: '/dashboard/leader/event-polls', icon: Vote }

export default function DashboardShell({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isLeader = profile.role === 'leader'
  const isExec = !!profile.position // 所有有職位嘅執委會成員
  const isChair = profile.position === '主席' || profile.position === '副主席'
  const execItems = isExec ? [prepItem, archiveItem, pollItem, createEventItem, viewAttendanceItem] : []
  const chairItems = isChair ? [approvalItem] : []
  const navItems = [...(isLeader ? leaderNavItems : memberNavItems), ...execItems, ...chairItems]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            童
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">第一旅深資團執委會</p>
            <p className="text-xs text-gray-500 truncate">
              {profile.position ? `${profile.position} · ` : ''}{profile.full_name}
            </p>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* 底部 */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          <Link href="/dashboard/change-password"
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard/change-password'
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <KeyRound className="w-5 h-5" />
            更改密碼
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            登出
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏（移动端） */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="ml-3 font-semibold text-gray-900 text-sm">第一旅深資團執委會</h2>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
