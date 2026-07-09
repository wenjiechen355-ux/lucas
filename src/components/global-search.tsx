'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, FileText, CalendarDays, Users, Megaphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  type: 'event' | 'member' | 'document' | 'announcement'
  id: string
  title: string
  subtitle: string
  link: string
}

export default function GlobalSearch() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    // Expose global toggle for the search button
    (window as any).__toggleSearch = () => setOpen(true)
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      delete (window as any).__toggleSearch
    }
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
    }
  }, [open])

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Search logic
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results || [])
      setSearching(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  function goTo(link: string) {
    setOpen(false)
    router.push(link)
  }

  if (!open) return null

  const icons: Record<string, typeof Search> = {
    event: CalendarDays,
    member: Users,
    document: FileText,
    announcement: Megaphone,
  }

  const labels: Record<string, string> = {
    event: '活動', member: '成員', document: '文檔', announcement: '公告',
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div ref={modalRef} className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋活動、成員、文檔..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 rounded font-mono">
            <X className="w-3 h-3" /> ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.length < 2 && !searching && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              輸入關鍵字開始搜尋（最少 2 個字）
            </div>
          )}

          {searching && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              搜尋中...
            </div>
          )}

          {!searching && results.length > 0 && Object.entries(grouped).map(([type, items]) => {
            const Icon = icons[type] || Search
            return (
              <div key={type} className="mb-1">
                <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Icon className="w-3 h-3" /> {labels[type] || type}
                </div>
                {items.map(r => (
                  <button
                    key={r.id}
                    onClick={() => goTo(r.link)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.title}</span>
                    {r.subtitle && (
                      <span className="text-xs text-gray-400 truncate ml-auto flex-shrink-0">{r.subtitle}</span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}

          {!searching && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              找不到相關結果
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
