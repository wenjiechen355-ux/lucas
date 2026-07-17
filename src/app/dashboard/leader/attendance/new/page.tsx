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
  const [isOnline, setIsOnline] = useState(false)
// 团部活动子分类选项
const UNIT_CATEGORIES = ['', '宿營活動', '水上活動', '執委會開會'] as const
const [unitCategory, setUnitCategory] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  // 联团/外出交流都视为「普通活动」,全团可签到
  const isExecMeeting = unitCategory === '執委會開會'
  const requiresMinutes = unitCategory === '執委會開會'
  const isExecOnly = eventType === 'unit' && isExecMeeting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    try {
      const formData = new FormData()
      formData.append('event_type', eventType)
      formData.append('unit_category', eventType === 'unit' ? unitCategory : '')
      formData.append('title', title)
      formData.append('description', description)
      formData.append('event_date', eventDate)
      formData.append('location', isOnline ? '線上' : location)
      if (!isOnline && latitude && longitude) {
        formData.append('latitude', String(latitude))
        formData.append('longitude', String(longitude))
      }
      formData.append('is_exec_only', String(isExecOnly))
      formData.append('is_exec_meeting', String(isExecMeeting))
      formData.append('requires_minutes', String(requiresMinutes))
      formData.append('is_online', String(isOnline))

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
              // 切换为联团/外出交流时,清空团部子分类
              if (v !== 'unit') {
                setUnitCategory('')
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
            {eventType === 'unit' && '本團主辦之活動，可選擇活動子類別'}
            {eventType === 'joint' && '與其他旅部聯合舉辦之活動,全團成員可簽到'}
            {eventType === 'exchange' && '外出與其他團體/機構交流之活動,全團成員可簽到'}
          </p>
        </div>

        {/* 团部活动子分类 */}
        {eventType === 'unit' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <label className="text-xs font-medium text-green-800 mb-2 block">團部活動 - 子類別</label>
            <select
              value={unitCategory}
              onChange={e => setUnitCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
            >
              <option value="">一般團部活動</option>
              {UNIT_CATEGORIES.filter(c => c).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {unitCategory === '執委會開會' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-100 rounded px-2 py-1">
                <span>✅ 已自動設定：僅執委會可簽到 + 完成後需上載會議記錄</span>
              </div>
            )}
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

        {/* 线上活动开关 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isOnline}
              onChange={e => {
                setIsOnline(e.target.checked)
                if (e.target.checked) {
                  setLocation('')
                  setLatitude(null)
                  setLongitude(null)
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-blue-800">線上活動</span>
              <span className="text-gray-400 ml-1 text-xs">（毋需填寫地址，活動以線上形式進行）</span>
            </div>
          </label>
        </div>

        {/* 地点 — 线上活动时隐藏 */}
        {!isOnline && (
          <>
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
          </>
        )}

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
