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
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + dir)
  }
  return dates
}

export default function MonthCalendar({ selectedDates, onToggleDate, month: m, year: y, minDate, maxDate, memberAvatars }: MonthCalendarProps) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(m ?? today.getMonth())
  const [viewYear, setViewYear] = useState(y ?? today.getFullYear())

  // ── Visual rendering state ──
  const [dragHoverVisual, setDragHoverVisual] = useState<string | null>(null)

  // ── Refs: all drag logic uses refs → no stale closure ──
  const dragStartRef = useRef<string | null>(null)
  const dragHoverRef = useRef<string | null>(null)  // <-- FIX: ref for hover, not state
  const isDraggingRef = useRef(false)

  // ── Refs for callback props (avoid stale closure in global handler) ──
  const selectedDatesRef = useRef(selectedDates)
  selectedDatesRef.current = selectedDates
  const onToggleDateRef = useRef(onToggleDate)
  onToggleDateRef.current = onToggleDate
  const minDateRef = useRef(minDate)
  minDateRef.current = minDate
  const maxDateRef = useRef(maxDate)
  maxDateRef.current = maxDate
  const todayStrRef = useRef('')
  todayStrRef.current = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const hasAvatars = !!memberAvatars

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const dateStr = (d: number) => `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  // ── Global pointerup listener (注册一次，全部用 refs) ──
  useEffect(() => {
    function handleGlobalPointerUp() {
      if (!isDraggingRef.current) return
      const start = dragStartRef.current
      const hoverEnd = dragHoverRef.current  // <-- FIX: read from ref, not state
      if (!start || !hoverEnd) {
        isDraggingRef.current = false
        dragStartRef.current = null
        dragHoverRef.current = null
        setDragHoverVisual(null)
        return
      }

      const range = getDateRange(start, hoverEnd)
      const curSelected = selectedDatesRef.current
      const toggle = onToggleDateRef.current
      const startSel = curSelected.includes(start)
      const ts = todayStrRef.current

      range.forEach(date => {
        if (date < ts) return
        if (minDateRef.current && date < minDateRef.current) return
        if (maxDateRef.current && date > maxDateRef.current) return

        if (startSel) {
          if (curSelected.includes(date)) toggle(date)
        } else {
          if (!curSelected.includes(date)) toggle(date)
        }
      })

      isDraggingRef.current = false
      dragStartRef.current = null
      dragHoverRef.current = null
      setDragHoverVisual(null)
    }

    window.addEventListener('pointerup', handleGlobalPointerUp)
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp)
  }, []) // <-- FIX: empty deps, all values read from refs

  function handlePointerDown(date: string) {
    const ds = date
    if (ds < todayStr) return
    if (minDate && ds < minDate) return
    if (maxDate && ds > maxDate) return

    // Set both ref AND visual state synchronously
    dragStartRef.current = date
    dragHoverRef.current = date
    isDraggingRef.current = true
    setDragHoverVisual(date)
  }

  function handlePointerEnter(date: string) {
    if (!isDraggingRef.current) return
    dragHoverRef.current = date  // ref → immediately available to global handler
    setDragHoverVisual(date)     // state → triggers visual re-render
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const dragRange = dragStartRef.current && dragHoverVisual
    ? getDateRange(dragStartRef.current, dragHoverVisual)
    : []

  return (
    <div
      className="select-none"
      onMouseLeave={() => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false
          dragStartRef.current = null
          dragHoverRef.current = null
          setDragHoverVisual(null)
        }
      }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-700">{viewYear}年 {MONTHS[viewMonth]}</span>
        <button type="button" onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-600">
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
          const inDragRange = isDraggingRef.current && dragRange.includes(ds)
          const past = ds < todayStr
          const outOfRange = !!((minDate && ds < minDate) || (maxDate && ds > maxDate))
          const disabled = past || outOfRange
          const isToday = ds === todayStr
          const avatars = memberAvatars?.[ds] || []

          return (
            <button
              key={ds}
              type="button"
              onPointerDown={() => handlePointerDown(ds)}
              onPointerEnter={() => handlePointerEnter(ds)}
              disabled={disabled}
              className={`rounded-md text-xs font-medium transition-all flex flex-col items-center justify-start pt-0.5 outline-none ${
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
              <span>{d}</span>
              {hasAvatars && avatars.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-1 pb-0.5">
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
