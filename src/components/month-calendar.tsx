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
  memberAvatars?: Record<string, string[]> // date -> array of member names (displayed as first-char avatars)
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

export default function MonthCalendar({ selectedDates, onToggleDate, month: m, year: y, minDate, maxDate, memberAvatars }: MonthCalendarProps) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(m ?? today.getMonth())
  const [viewYear, setViewYear] = useState(y ?? today.getFullYear())

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
          const past = isPast(d)
          const outOfRange = isOutOfRange(d)
          const disabled = isDisabled(d)
          const isToday = ds === todayStr
          const avatars = memberAvatars?.[ds] || []

          return (
            <button
              key={ds}
              type="button"
              onClick={() => !disabled && onToggleDate(ds)}
              disabled={disabled}
              className={`rounded-md text-xs font-medium transition-all flex flex-col items-center justify-start pt-0.5 ${
                hasAvatars ? 'min-h-[4rem] px-0.5' : 'h-8'
              } ${
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
              <span>{d}</span>
              {/* Avatar circles */}
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
