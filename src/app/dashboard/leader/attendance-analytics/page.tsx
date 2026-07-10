import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceCharts from './charts'

interface EventAttendance {
  id: string
  title: string
  event_date: string
  event_type: string
  total: number
  present: number
  excused: number
  absent: number
  rate: number
}

export default async function AttendanceAnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'leader' && !profile?.position) redirect('/dashboard')

  // Get total member count
  const { count: totalMembers } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true })

  // Get events with attendance aggregation
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date, event_type')
    .order('event_date', { ascending: false })

  // Get all attendance with event info
  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('event_id, status')

  if (!events || !allAttendance) return <div>Loading...</div>

  // Build attendance summary per event
  const attendanceMap: Record<string, { present: number; excused: number; absent: number; total: number }> = {}
  allAttendance.forEach(a => {
    if (!attendanceMap[a.event_id]) attendanceMap[a.event_id] = { present: 0, excused: 0, absent: 0, total: 0 }
    attendanceMap[a.event_id].total++
    if (a.status === 'present') attendanceMap[a.event_id].present++
    else if (a.status === 'excused') attendanceMap[a.event_id].excused++
    else attendanceMap[a.event_id].absent++
  })

  const eventData: EventAttendance[] = events.map(e => {
    const a = attendanceMap[e.id] || { present: 0, excused: 0, absent: 0, total: 0 }
    return {
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      event_type: e.event_type || '團部活動',
      total: a.total,
      present: a.present,
      excused: a.excused,
      absent: a.absent,
      rate: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
    }
  })

  // Sort by date
  eventData.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

  // Summary stats
  const totalEvents = eventData.length
  const avgRate = eventData.length > 0 ? Math.round(eventData.reduce((s, e) => s + e.rate, 0) / eventData.length) : 0
  const maxRate = eventData.length > 0 ? Math.max(...eventData.map(e => e.rate)) : 0
  const minRate = eventData.length > 0 ? Math.min(...eventData.map(e => e.rate)) : 0
  const totalPresent = eventData.reduce((s, e) => s + e.present, 0)
  const totalExcused = eventData.reduce((s, e) => s + e.excused, 0)
  const totalAbsent = eventData.reduce((s, e) => s + e.absent, 0)
  const totalAttendance = totalPresent + totalExcused + totalAbsent

  // Current month
  const now = new Date()
  const thisMonth = now.getMonth() + 1
  const thisYear = now.getFullYear()
  const monthEvents = eventData.filter(e => {
    const d = new Date(e.event_date)
    return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear
  })
  const monthRate = monthEvents.length > 0
    ? Math.round(monthEvents.reduce((s, e) => s + e.rate, 0) / monthEvents.length)
    : 0
  const latestRate = eventData.length > 0 ? eventData[0].rate : 0

  // Category stats
  const categoryMap: Record<string, { rates: number[]; count: number }> = {}
  eventData.forEach(e => {
    const type = e.event_type || '團部活動'
    if (!categoryMap[type]) categoryMap[type] = { rates: [], count: 0 }
    categoryMap[type].rates.push(e.rate)
    categoryMap[type].count++
  })
  const categoryData = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    avgRate: Math.round(data.rates.reduce((a, b) => a + b, 0) / data.rates.length),
    count: data.count,
  }))

  // Monthly heatmap data
  const monthlyMap: Record<string, number[]> = {}
  eventData.forEach(e => {
    const d = new Date(e.event_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyMap[key]) monthlyMap[key] = []
    monthlyMap[key].push(e.rate)
  })
  const heatmapData = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, rates]) => ({
      month,
      avgRate: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
      count: rates.length,
    }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">出席率分析看板</h1>
      <p className="text-sm text-gray-500 mb-6">全維度活動出勤數據分析與可視化</p>

      <AttendanceCharts
        totalEvents={totalEvents}
        avgRate={avgRate}
        monthRate={monthRate}
        latestRate={latestRate}
        maxRate={maxRate}
        minRate={minRate}
        totalPresent={totalPresent}
        totalExcused={totalExcused}
        totalAbsent={totalAbsent}
        eventData={eventData.slice(0, 10).reverse()}
        categoryData={categoryData}
        heatmapData={heatmapData}
      />
    </div>
  )
}
