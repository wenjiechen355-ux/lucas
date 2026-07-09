'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored === 'dark' || (!stored && prefersDark)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-300 transition-colors"
      title={isDark ? '切換淺色模式' : '切換深色模式'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      {isDark ? '淺色模式' : '深色模式'}
    </button>
  )
}
