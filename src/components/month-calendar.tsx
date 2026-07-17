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
  const gridRef = useRef<HTMLDivElement>(null)

  // ── All mutable state in a single ref object (zero stale closures) ──
  const st = useRef({
    start: null as string | null,
    hover: null as string | null,
    active: false,
    dragged: false,
  })

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const hasAvatars = !!memberAvatars

  // ── Helper: compute date string from pointer x,y position ──
  function dateFromPoint(x: number, y: number): string | null {
    const grid = gridRef.current
    if (!grid) return null
    const rect = grid.getBoundingClientRect()
    const relX = x - rect.left
    const relY = y - rect.top
    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return null

    // Count cells per row = 7 (CSS grid-cols-7)
    const childCount = grid.children.length
    let cellIdx = -1
    let cumulativeTop = 0
    for (let i = 0; i < childCount; i++) {
      const cell = grid.children[i] as HTMLElement
      const cellRect = cell.getBoundingClientRect()
      const cellTop = cellRect.top - rect.top
      const cellBottom = cellTop + cellRect.height
      const cellLeft = cellRect.left - rect.left
      const cellRight = cellLeft + cellRect.width

      // Check if pointer is inside this cell (including gap handles)
      if (relY >= cellTop && relY <= cellBottom && relX >= cellLeft && relX <= cellRight) {
        cellIdx = i
        break
      }
    }

    if (cellIdx < 0) return null

    // Map cell index to date. Cells with null (leading empty cells) are the first `firstDay` cells
    const dateDay = cellIdx - firstDay + 1
    if (dateDay < 1 || dateDay > daysInMonth) return null

    return `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(dateDay).padStart(2,'0')}`
  }

  // ── Native DOM pointer events ──
  useEffect(() => {
    const cal = calendarRef.current
    if (!cal) return

    function onDown(e: PointerEvent) {
      const ds = dateFromPoint(e.clientX, e.clientY)
      if (!ds) return
      if (ds < todayStr) return
      if (minDate && ds < minDate) return
      if (maxDate && ds > maxDate) return

      st.current.start = ds
      st.current.hover = ds
      st.current.active = true
      st.current.dragged = false
      setDragHoverVisual(ds)
      e.preventDefault()
    }

    function onMove(e: PointerEvent) {
      if (!st.current.active) return

      const ds = dateFromPoint(e.clientX, e.clientY)
      if (!ds || ds === st.current.hover) return

      st.current.hover = ds
      if (ds !== st.current.start) {
        st.current.dragged = true
      }
      setDragHoverVisual(ds)
    }

    function onEnd() {
      if (!st.current.active) return
      const { start, hover, dragged } = st.current
      st.current.active = false
      st.current.start = null
      st.current.hover = null
      st.current.dragged = false
      setDragHoverVisual(null)

      if (!start || !hover) return

      if (!dragged) {
        // Single click
        onToggleDate(start)
        return
      }

      // Drag
      const range = getDateRange(start, hover)
      const toggle = onToggleDate
      const startSel = selectedDates.includes(start)

      range.forEach(d => {
        if (d < todayStr) return
        if (minDate && d < minDate) return
        if (maxDate && d > maxDate) return
        if (startSel) { if (selectedDates.includes(d)) toggle(d) }
        else { if (!selectedDates.includes(d)) toggle(d) }
      })
    }

    function onCancel() {
      if (!st.current.active) return
      st.current.active = false
      st.current.start = null
      st.current.hover = null
      st.current.dragged = false
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
  }, [viewMonth, viewYear, todayStr, minDate, maxDate, selectedDates, onToggleDate])

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

  const dragRange = st.current.start && dragHoverVisual
    ? getDateRange(st.current.start, dragHoverVisual)
    : []

  return (
    <div
      ref={calendarRef}
      className="select-none"
      style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
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

      {/* Date grid — ref needed for coordinate calculation */}
      <div ref={gridRef} className={`grid grid-cols-7 gap-1 ${hasAvatars ? '' : 'gap-0.5'}`}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className={hasAvatars ? 'min-h-[4rem]' : 'h-8'} />
          const ds = dateStr(d)
          const sel = selectedDates.includes(ds)
          const inDragRange = st.current.active && dragRange.includes(ds)
          const past = ds < todayStr
          const outOfRange = !!((minDate && ds < minDate) || (maxDate && ds > maxDate))
          const disabled = past || outOfRange
          const isToday = ds === todayStr
          const avatars = memberAvatars?.[ds] || []

          return (
            <div
              key={ds}
              className={`rounded-md text-xs font-medium flex flex-col items-center justify-start pt-0.5 select-none ${
                hasAvatars ? 'min-h-[4rem] px-0.5' : 'h-8'
              } ${
                sel
                  ? 'bg-green-500 text-white shadow-sm'
                  : inDragRange
                    ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                    : isToday && !outOfRange
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-300'
                      : outOfRange
                        ? 'text-red-200 bg-red-50/30'
                        : past
                          ? 'text-gray-200'
                          : 'text-gray-600 cursor-pointer hover:bg-gray-100'
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
