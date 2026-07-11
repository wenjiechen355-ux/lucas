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
  User,
} from 'lucide-react'
import { useState } from 'react'
import { Calendar, Eye, CheckSquare, ClipboardList, Database, Vote, Megaphone, CalendarDays, Wallet, BarChart3 } from 'lucide-react'
import { Search } from 'lucide-react'
import NotifBell from '@/components/notif-bell'
import ThemeToggle from '@/components/theme-toggle'
import GlobalSearch from '@/components/global-search'
import ThreeDBackground from '@/components/three-d-background'

const memberNavItems = [
  { label: '儀表板', href: '/dashboard', icon: LayoutDashboard },
  { label: '出席打卡', href: '/dashboard/attendance', icon: ClipboardCheck },
  { label: '活動日曆', href: '/dashboard/calendar', icon: CalendarDays },
  { label: '進度記錄', href: '/dashboard/progress', icon: TrendingUp },
  { label: '我的文檔', href: '/dashboard/documents', icon: FileText },
  { label: '活動投票', href: '/dashboard/event-polls', icon: Vote },
]

const leaderNavItems = [
  { label: '儀表板', href: '/dashboard', icon: LayoutDashboard },
  { label: '活動日曆', href: '/dashboard/calendar', icon: CalendarDays },
  { label: '成員管理', href: '/dashboard/leader/members', icon: Users },
  { label: '出席管理', href: '/dashboard/leader/attendance', icon: ClipboardCheck },
  { label: '財政管理', href: '/dashboard/leader/finance', icon: Wallet },
  { label: '出席分析', href: '/dashboard/leader/attendance-analytics', icon: BarChart3 },
  { label: '進度記錄', href: '/dashboard/progress', icon: TrendingUp },
  { label: '文檔審批', href: '/dashboard/leader/documents', icon: FileText },
]

const execNavItems = [
  { label: '儀表板', href: '/dashboard', icon: LayoutDashboard },
  { label: '活動日曆', href: '/dashboard/calendar', icon: CalendarDays },
  { label: '活動籌備', href: '/dashboard/leader/event-prep', icon: ClipboardList },
  { label: '資料庫', href: '/dashboard/leader/event-archive', icon: Database },
  { label: '活動時間徵集', href: '/dashboard/leader/event-polls', icon: Vote },
  { label: '公告管理', href: '/dashboard/leader/announcements', icon: Megaphone },
  { label: '財政管理', href: '/dashboard/leader/finance', icon: Wallet },
  { label: '出席分析', href: '/dashboard/leader/attendance-analytics', icon: BarChart3 },
  { label: '創建活動', href: '/dashboard/leader/attendance/new', icon: Calendar },
  { label: '出席情況', href: '/dashboard/leader/attendance', icon: Eye },
]

const approvalItem = { label: '審批項目', href: '/dashboard/leader/approvals', icon: CheckSquare }

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

  let navItems: { label: string; href: string; icon: any }[] = []
  if (isLeader) {
    navItems = [...leaderNavItems]
  } else if (isExec) {
    navItems = [...execNavItems]
  } else {
    navItems = [...memberNavItems]
  }
  if (isChair) navItems.push(approvalItem)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex shell-bg">
      <ThreeDBackground />
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 glass-sidebar
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
        <div className="border-t border-gray-100 dark:border-slate-800 p-3 space-y-1">
          <NotifBell />
          <ThemeToggle />          <Link href="/dashboard/profile"
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard/profile'
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            個人檔案
          </Link>
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
        {/* 顶部栏 */}
        <header className="h-16 glass-header flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm lg:hidden">第一旅深資團執委會</h2>

          {/* Search trigger - desktop */}
          <button
            onClick={() => (window as any).__toggleSearch?.()}
            className="hidden lg:flex items-center gap-2 px-4 py-2 mr-2 text-sm text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>搜尋...</span>
            <kbd className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 ml-4">Ctrl+K</kbd>
          </button>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global search modal */}
      <GlobalSearch />
    </div>
  )
}
