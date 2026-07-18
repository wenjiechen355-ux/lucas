'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthCalendarProps {
  selectedDates: string[]
  onToggleDate: (date: string) => void
  month?: number
  year?: number
  minDate?: string
  maxDate?: string
  memberAvatars?: Record<string, string[]>
  readOnly?: boolean  // ← true = display only, no clicking/voting
}

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const DAYS = ['日','一','二','三','四','五','六']

const AVATAR_COLORS = [
  'bg-blue-500','bg-green-500','bg-purple-500','bg-amber-500',
  'bg-pink-500','bg-teal-500','bg-indigo-500','bg-rose-500',
  'bg-cyan-500','bg-orange-500','bg-lime-500','bg-violet-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const s = new Date(start + 'T00:00:00'), e = new Date(end + 'T00:00:00')
  const dir = s <= e ? 1 : -1
  const cur = new Date(s)
  while (dir === 1 ? cur <= e : cur >= e) {
    dates.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`)
    cur.setDate(cur.getDate() + dir)
  }
  return dates
}

export default function MonthCalendar({ selectedDates, onToggleDate, month: m, year: y, minDate, maxDate, memberAvatars, readOnly }: MonthCalendarProps) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const [viewMonth, setViewMonth] = useState(m ?? today.getMonth())
  const [viewYear, setViewYear] = useState(y ?? today.getFullYear())
  const [dragVisual, setDragVisual] = useState<string | null>(null)

  // ── All mutable state in refs (zero stale closures) ──
  const dragRef = useRef({ start: null as string | null, hover: null as string | null, active: false, dragged: false })
  const onToggleRef = useRef(onToggleDate)
  const selectedRef = useRef(selectedDates)
  const minRef = useRef(minDate)
  const maxRef = useRef(maxDate)
  const todayRef = useRef(todayStr)
  // Keep refs updated
  onToggleRef.current = onToggleDate
  selectedRef.current = selectedDates
  minRef.current = minDate
  maxRef.current = maxDate
  todayRef.current = todayStr

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const hasAvatars = !!memberAvatars

  // ── Native window-level events (avoids all React delegation + capture quirks) ──
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (readOnly) return  // ← display only, no interaction
      const target = (e.target as HTMLElement).closest('[data-date]') as HTMLElement | null
      if (!target) return
      const ds = target.getAttribute('data-date')
      if (!ds) return
      const now = todayRef.current
      if (ds < now || (minRef.current && ds < minRef.current) || (maxRef.current && ds > maxRef.current)) return

      // KEY FIX: Release implicit pointer capture so elementFromPoint in onMove
      // returns the actual element under the pointer, not the captured one
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      e.preventDefault()

      dragRef.current = { start: ds, hover: ds, active: true, dragged: false }
      setDragVisual(ds)
    }

    function onMove(e: PointerEvent) {
      if (!dragRef.current.active) return
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el) return
      const dateEl = (el as HTMLElement).closest('[data-date]') as HTMLElement | null
      if (!dateEl) return
      const ds = dateEl.getAttribute('data-date')
      if (!ds || ds === dragRef.current.hover) return
      dragRef.current.hover = ds
      if (ds !== dragRef.current.start) dragRef.current.dragged = true
      setDragVisual(ds)
    }

    function onUp() {
      if (!dragRef.current.active) return
      const { start, hover, dragged } = dragRef.current
      dragRef.current = { start: null, hover: null, active: false, dragged: false }
      setDragVisual(null)
      if (!start || !hover) return
      if (!dragged) { onToggleRef.current(start); return }
      const range = getDateRange(start, hover)
      const curSel = selectedRef.current
      const toggle = onToggleRef.current
      const startSel = curSel.includes(start)
      const now = todayRef.current
      range.forEach(ds => {
        if (ds < now || (minRef.current && ds < minRef.current) || (maxRef.current && ds > maxRef.current)) return
        if (startSel ? curSel.includes(ds) : !curSel.includes(ds)) toggle(ds)
      })
    }

    window.addEventListener('pointerdown', onDown, { passive: false })
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  function dateStr(d: number) { return `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d2 = 1; d2 <= daysInMonth; d2++) cells.push(d2)

  const dragRange = dragRef.current.start && dragVisual ? getDateRange(dragRef.current.start, dragVisual) : []

  return (
    <div
      className="select-none"
      style={{ touchAction: 'none', userSelect: 'none' }}
      onPointerCancel={() => { dragRef.current = { start: null, hover: null, active: false, dragged: false }; setDragVisual(null) }}
      onMouseLeave={() => { if (dragRef.current.active) { dragRef.current = { start: null, hover: null, active: false, dragged: false }; setDragVisual(null) }}}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-600"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-medium text-gray-700">{viewYear}年 {MONTHS[viewMonth]}</span>
        <button type="button" onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-600"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d2 => (<div key={d2} className="text-center text-[10px] text-gray-400 py-1">{d2}</div>))}
      </div>
      <div className={`grid grid-cols-7 gap-1 ${hasAvatars ? '' : 'gap-0.5'}`}>
        {cells.map((d2, i) => {
          if (d2 === null) return <div key={`e${i}`} className={hasAvatars ? 'min-h-[4rem]' : 'h-8'} />
          const ds = dateStr(d2)
          const sel = selectedDates.includes(ds)
          const inDrag = dragRef.current.active && dragRange.includes(ds)
          const disabled = ds < todayStr || !!((minDate && ds < minDate) || (maxDate && ds > maxDate))
          const isToday = ds === todayStr
          const avatars = memberAvatars?.[ds] || []
          return (
            <div key={ds} data-date={ds}
              className={`rounded-md text-xs font-medium flex flex-col items-center justify-start pt-0.5 select-none ${hasAvatars ? 'min-h-[4rem] px-0.5' : 'h-8'} ${
                sel ? 'bg-green-500 text-white shadow-sm'
                : inDrag ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                : isToday && !disabled ? 'bg-green-50 text-green-700 ring-1 ring-green-300'
                : disabled ? 'text-gray-200'
                : 'text-gray-600 cursor-pointer hover:bg-gray-100'
              }`}>
              <span className="pointer-events-none">{d2}</span>
              {hasAvatars && avatars.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-1 pb-0.5 pointer-events-none">
                  {avatars.slice(0,6).map((n,ai) => (
                    <span key={ai} className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white ${getAvatarColor(n)}`} title={n}>{n.charAt(0)}</span>
                  ))}
                  {avatars.length > 6 && <span className="text-[8px] text-gray-400">+{avatars.length-6}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }
}
