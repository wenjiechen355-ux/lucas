'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthCalendarProps {
  selectedDates: string[] // ['2026-07-10', '2026-07-12']
  onToggleDate: (date: string) => void
  month?: number
  year?: number
  minDate?: string  // 'YYYY-MM-DD' — 可选日期范围下限
  maxDate?: string  // 'YYYY-MM-DD' — 可选日期范围上限
}

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const DAYS = ['日','一','二','三','四','五','六']

export default function MonthCalendar({ selectedDates, onToggleDate, month: m, year: y, minDate, maxDate }: MonthCalendarProps) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(m ?? today.getMonth())
  const [viewYear, setViewYear] = useState(y ?? today.getFullYear())

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const dateStr = (d: number) => `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const isPast = (d: number) => dateStr(d) < todayStr
  const isOutOfRange = (d: number) => {
    const ds = dateStr(d)
    if (minDate && ds < minDate) return true
    if (maxDate && ds > maxDate) return true
    return false
  }
  const isDisabled = (d: number) => isPast(d) || isOutOfRange(d)

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="select-none">
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
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="h-8" />
          const ds = dateStr(d)
          const sel = selectedDates.includes(ds)
          const past = isPast(d)
          const outOfRange = isOutOfRange(d)
          const disabled = isDisabled(d)
          const isToday = ds === todayStr

          return (
            <button
              key={ds}
              type="button"
              onClick={() => !disabled && onToggleDate(ds)}
              disabled={disabled}
              className={`h-8 rounded-md text-xs font-medium transition-all ${
                sel
                  ? 'bg-green-500 text-white shadow-sm'
                  : isToday && !outOfRange
                    ? 'bg-green-50 text-green-700 ring-1 ring-green-300'
                    : outOfRange
                      ? 'text-red-200 cursor-not-allowed bg-red-50/30'
                      : past
                        ? 'text-gray-200 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}
