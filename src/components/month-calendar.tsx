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
}

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const DAYS = ['日','一','二','三','四','五','六']

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-orange-500', 'bg-lime-500', 'bg-violet-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const dir = s <= e ? 1 : -1
  const cur = new Date(s)
  while (dir === 1 ? cur <= e : cur >= e) {
    dates.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`)
    cur.setDate(cur.getDate() + dir)
  }
  return dates
}

export default function MonthCalendar({ selectedDates, onToggleDate, month: m, year: y, minDate, maxDate, memberAvatars }: MonthCalendarProps) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const [viewMonth, setViewMonth] = useState(m ?? today.getMonth())
  const [viewYear, setViewYear] = useState(y ?? today.getFullYear())
  const [dragHoverVisual, setDragHoverVisual] = useState<string | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // ── All mutable state in a single ref to avoid stale closures entirely ──
  const s = useRef({
    dragStart: null as string | null,
    dragHover: null as string | null,
    isDragging: false,
    dragActivated: false,
    selectedDates: selectedDates,
    onToggleDate: onToggleDate,
    minDate: minDate,
    maxDate: maxDate,
  })
  // Keep refs current
  s.current.selectedDates = selectedDates
  s.current.onToggleDate = onToggleDate
  s.current.minDate = minDate
  s.current.maxDate = maxDate

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const hasAvatars = !!memberAvatars

  // ── Helper: get date string from a button child ──
  function getDateFromTarget(el: EventTarget | null): string | null {
    if (!(el instanceof Element)) return null
    return el.closest('[data-date]')?.getAttribute('data-date') || null
  }

  // ── All pointer events on native DOM, not React synthetic events ──
  useEffect(() => {
    const cal = calendarRef.current
    if (!cal) return

    function onDown(e: PointerEvent) {
      const date = getDateFromTarget(e.target)
      if (!date) return
      if (date < todayStr) return
      if (s.current.minDate && date < s.current.minDate) return
      if (s.current.maxDate && date > s.current.maxDate) return

      s.current.dragStart = date
      s.current.dragHover = date
      s.current.isDragging = true
      s.current.dragActivated = false
      setDragHoverVisual(date)
      e.preventDefault() // prevent text selection, focus, etc.
    }

    function onMove(e: PointerEvent) {
      if (!s.current.isDragging) return

      // Find what's under the pointer right now
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const date = getDateFromTarget(el)
      if (!date || date === s.current.dragHover) return

      s.current.dragHover = date
      if (date !== s.current.dragStart) {
        s.current.dragActivated = true
      }
      setDragHoverVisual(date)
    }

    function onEnd(_e: PointerEvent) {
      if (!s.current.isDragging) return
      const { dragStart, dragHover, dragActivated } = s.current
      s.current.isDragging = false
      s.current.dragStart = null
      s.current.dragHover = null
      s.current.dragActivated = false
      setDragHoverVisual(null)

      if (!dragStart || !dragHover) return

      // Single click
      if (!dragActivated) {
        s.current.onToggleDate(dragStart)
        return
      }

      // Drag: toggle range
      const range = getDateRange(dragStart, dragHover)
      const curSel = s.current.selectedDates
      const startSel = curSel.includes(dragStart)
      const ts = todayStr
      const mn = s.current.minDate
      const mx = s.current.maxDate

      range.forEach(date => {
        if (date < ts) return
        if (mn && date < mn) return
        if (mx && date > mx) return
        if (startSel) { if (curSel.includes(date)) s.current.onToggleDate(date) }
        else { if (!curSel.includes(date)) s.current.onToggleDate(date) }
      })
    }

    function onCancel() {
      if (!s.current.isDragging) return
      s.current.isDragging = false
      s.current.dragStart = null
      s.current.dragHover = null
      s.current.dragActivated = false
      setDragHoverVisual(null)
    }

    cal.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onCancel)

    return () => {
      cal.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [viewMonth, viewYear, todayStr]) // re-attach when month/year changes

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const dateStr = (d: number) => `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // Compute drag range for visual highlighting
  const dragRange = s.current.dragStart && dragHoverVisual
    ? getDateRange(s.current.dragStart, dragHoverVisual)
    : []

  return (
    <div
      ref={calendarRef}
      className="select-none touch-none"
      style={{ touchAction: 'none' }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onPointerDown={e => e.stopPropagation()} onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-700">{viewYear}年 {MONTHS[viewMonth]}</span>
        <button type="button" onPointerDown={e => e.stopPropagation()} onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-600">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className={`grid grid-cols-7 gap-1 ${hasAvatars ? '' : 'gap-0.5'}`}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className={hasAvatars ? 'min-h-[4rem]' : 'h-8'} />
          const ds = dateStr(d)
          const sel = selectedDates.includes(ds)
          const inDragRange = s.current.isDragging && dragRange.includes(ds)
          const past = ds < todayStr
          const outOfRange = !!((minDate && ds < minDate) || (maxDate && ds > maxDate))
          const disabled = past || outOfRange
          const isToday = ds === todayStr
          const avatars = memberAvatars?.[ds] || []

          return (
            <div
              key={ds}
              data-date={ds}
              className={`rounded-md text-xs font-medium transition-all flex flex-col items-center justify-start pt-0.5 select-none cursor-pointer ${
                hasAvatars ? 'min-h-[4rem] px-0.5' : 'h-8'
              } ${
                sel
                  ? 'bg-green-500 text-white shadow-sm'
                  : inDragRange
                    ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                    : isToday && !outOfRange
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-300'
                      : outOfRange
                        ? 'text-red-200 cursor-not-allowed bg-red-50/30'
                        : past
                          ? 'text-gray-200 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="pointer-events-none">{d}</span>
              {hasAvatars && avatars.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-1 pb-0.5 pointer-events-none">
                  {avatars.slice(0, 6).map((name, ai) => (
                    <span
                      key={ai}
                      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white ${getAvatarColor(name)}`}
                      title={name}
                    >
                      {name.charAt(0)}
                    </span>
                  ))}
                  {avatars.length > 6 && (
                    <span className="text-[8px] text-gray-400">+{avatars.length - 6}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
