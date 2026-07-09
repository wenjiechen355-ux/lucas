'use client'

import { CalendarPlus } from 'lucide-react'

interface Props {
  title: string
  description?: string
  date?: string
  location?: string
  className?: string
}

export default function GoogleCalendarBtn({ title, description, date, location, className }: Props) {
  function buildUrl() {
    let start = '', end = ''
    if (date) {
      // Google Calendar format: YYYYMMDDTHHMMSSZ
      const d = new Date(date)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      start = `${y}${m}${day}`
      end = `${y}${m}${String(d.getDate() + 1).padStart(2, '0')}`
    }
    
    const params = new URLSearchParams()
    params.set('action', 'TEMPLATE')
    params.set('text', title)
    if (start) params.set('dates', `${start}/${end}`)
    if (description) params.set('details', description)
    if (location) params.set('location', location)
    params.set('ctz', 'Asia/Macau')
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  return (
    <a href={buildUrl()} target="_blank" rel="noopener noreferrer"
      className={className || 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors'}>
      <CalendarPlus className="w-3.5 h-3.5" />
      Google Calendar
    </a>
  )
}
