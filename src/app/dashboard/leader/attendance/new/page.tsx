'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LocationPicker from '@/components/location-picker'

type EventType = 'unit' | 'joint' | 'exchange'

export default function NewEventPage() {
  const [eventType, setEventType] = useState<EventType>('unit')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [dateTbd, setDateTbd] = useState(false)
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  // 团部活动专属选项
  const [isExecMeeting, setIsExecMeeting] = useState(false)
  const [requiresMinutes, setRequiresMinutes] = useState(false)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  // 联团/外出交流都视为「普通活动」,全团可签到
  const isExecOnly = eventType === 'unit' && isExecMeeting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    try {
      const formData = new FormData()
      formData.append('event_type', eventType)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('event_date', eventDate)
      formData.append('location', location)
      if (latitude && longitude) {
        formData.append('latitude', String(latitude))
        formData.append('longitude', String(longitude))
      }
      formData.append('is_exec_only', String(isExecOnly))
      formData.append('is_exec_meeting', String(isExecMeeting))
      formData.append('requires_minutes', String(requiresMinutes))

      const res = await fetch('/api/events/create', { method: 'POST', body: formData })
      if (res.redirected) {
        router.push(res.url)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '创建失败')
      }
    } catch (err) {
      alert('网络错误')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新增活動</h1>
        <p className="text-gray-500 mt-1">建立一個新活動供成員簽到</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">

        {/* 活动类型 - 必须先选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            活動類型 <span className="text-red-500">*</span>
          </label>
          <select
            value={eventType}
            onChange={e => {
              const v = e.target.value as EventType
              setEventType(v)
              // 切换为联团/外出交流时,清空团部专属选项
              if (v !== 'unit') {
                setIsExecMeeting(false)
                setRequiresMinutes(false)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
            required
          >
            <option value="unit">團部活動</option>
            <option value="joint">聯團活動（兩個旅部聯合）</option>
            <option value="exchange">外出交流活動</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {eventType === 'unit' && '本團主辦之活動,可進一步設定是否為執委會例會'}
            {eventType === 'joint' && '與其他旅部聯合舉辦之活動,全團成員可簽到'}
            {eventType === 'exchange' && '外出與其他團體/機構交流之活動,全團成員可簽到'}
          </p>
        </div>

        {/* 团部活动专属选项 */}
        {eventType === 'unit' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-green-800 mb-2">團部活動 - 進階設定</p>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isExecMeeting"
                checked={isExecMeeting}
                onChange={e => setIsExecMeeting(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="isExecMeeting" className="text-sm text-gray-700">
                執委會例會
                <span className="text-gray-400 ml-1">（僅執委會成員可簽到）</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresMinutes"
                checked={requiresMinutes}
                onChange={e => setRequiresMinutes(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="requiresMinutes" className="text-sm text-gray-700">
                文書上載會議記錄
                <span className="text-gray-400 ml-1">（活動完成後需由文書上載會議記錄）</span>
              </label>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">活動名稱 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="例如：週會集會"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <div className="space-y-2">
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              disabled={dateTbd}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none ${dateTbd ? 'bg-gray-50 text-gray-400 border-gray-200' : 'border-gray-300'}`}
              required={!dateTbd}
            />
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input type="checkbox" checked={dateTbd} onChange={e => { setDateTbd(e.target.checked); if (e.target.checked) setEventDate('') }}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              日期待定 <span className="text-gray-400">（之後再修改）</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">地點（可選）</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="例如：童軍總部"
          />
        </div>

        <LocationPicker
          lat={latitude}
          lng={longitude}
          onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng) }}
          onAddressSelect={(addr) => {
            const shortName = addr.split(',')[0]
            setLocation(shortName)
          }}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">說明（可選）</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
            rows={3}
            placeholder="活動內容概述..."
          />
        </div>

        <button
          type="submit"
          disabled={creating || !title || (!eventDate && !dateTbd)}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {creating ? '建立中...' : '建立活動'}
        </button>
      </form>
    </div>
  )
}
