'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, RefreshCw, Loader2 } from 'lucide-react'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const DAYS = ['日','一','二','三','四','五','六']
const COLORS = ['bg-green-500','bg-blue-500','bg-amber-500','bg-purple-500','bg-pink-500','bg-teal-500']

export default function CalendarPage() {
  const router = useRouter()
  const supabase = createClient()
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [events, setEvents] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const isExec = !!prof?.position
    let query = supabase.from('events').select('id,title,event_date,location,description,is_exec_only,is_meeting').gte('event_date', `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-01`)
    if (!isExec) query = query.eq('is_exec_only', false)
    const { data } = await query.order('event_date', { ascending: true }).limit(100)
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { if (!loading) loadData() }, [viewMonth, viewYear])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
    setSelectedDate(null)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dateStr(d: number) { return `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
  function eventsOnDate(d: number) { return events.filter(e => e.event_date === dateStr(d)) }
  function isPast(d: number) { return dateStr(d) < todayStr }

  const selectedEvents = selectedDate ? events.filter(e => e.event_date === selectedDate) : []

  // Scroll to today
  useEffect(() => {
    const el = document.getElementById('today-btn')
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [viewMonth])

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6" /> 活動日曆
          </h1>
          <p className="text-gray-500 mt-1">月曆檢視所有活動</p>
        </div>
        <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="lg:flex gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">{viewYear}年 {MONTHS[viewMonth]}</h2>
              <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs text-gray-400 py-1 font-medium">{d}</div>
              ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={`e${i}`} className="min-h-[80px]" />
                const ds = dateStr(d)
                const dayEvents = eventsOnDate(d)
                const isToday = ds === todayStr
                const isSelected = ds === selectedDate
                const past = isPast(d)

                return (
                  <button
                    key={ds}
                    id={isToday ? 'today-btn' : undefined}
                    onClick={() => setSelectedDate(isSelected ? null : ds)}
                    className={`relative min-h-[80px] p-1 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : isToday
                          ? 'border-green-300 bg-green-50/50'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-green-700' : past ? 'text-gray-300' : 'text-gray-600'}`}>
                      {d}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map(e => {
                        const colorIdx = e.is_meeting ? 3 : e.is_exec_only ? 4 : 0
                        return (
                          <div key={e.id}
                            className={`${COLORS[colorIdx % COLORS.length]} h-1.5 rounded-full opacity-80`}
                            title={e.title} />
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                    {dayEvents.length > 0 && (
                      <span className="absolute top-1 right-1 text-[9px] text-gray-400">{dayEvents.length}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected date events */}
        {selectedDate && (
          <div className="lg:w-72 mt-4 lg:mt-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{selectedDate}</h3>
              <p className="text-xs text-gray-400 mb-3">
                {(() => {
                  const d = new Date(selectedDate)
                  return `${MONTHS[d.getMonth()]} ${d.getDate()}日 · 星期${DAYS[d.getDay()]}`
                })()}
                · {selectedEvents.length} 個活動
              </p>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">當日冇活動</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(e => (
                    <a key={e.id}
                      href={profile?.position ? `/dashboard/leader/attendance/${e.id}` : `/dashboard/attendance`}
                      className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        {e.is_exec_only && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                        {e.is_meeting && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                        <span className="text-sm font-medium text-gray-900 truncate">{e.title}</span>
                      </div>
                      {e.location && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</p>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
