'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Phone, MapPin, Shield, Save, RefreshCw, Check, Hash, Home, AlertTriangle } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [scoutUnit, setScoutUnit] = useState('')
  const [scoutNumber, setScoutNumber] = useState('')
  const [homeAddress, setHomeAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
      setScoutUnit(data.scout_unit || '')
      setScoutNumber(data.scout_number || '')
      setHomeAddress(data.home_address || '')
      setEmergencyContact(data.emergency_contact || '')
      setEmergencyPhone(data.emergency_phone || '')
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      phone,
      scout_unit: scoutUnit,
      scout_number: scoutNumber,
      home_address: homeAddress,
      emergency_contact: emergencyContact,
      emergency_phone: emergencyPhone,
    }).eq('id', profile.id)

    setSaving(false)
    if (error) {
      alert('儲存失敗：' + error.message)
    } else {
      setSaved(true)
      setProfile({ ...profile, full_name: fullName, phone, scout_unit: scoutUnit, scout_number: scoutNumber, home_address: homeAddress, emergency_contact: emergencyContact, emergency_phone: emergencyPhone })
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  const positionColors: Record<string, string> = {
    '主席': 'bg-red-50 text-red-700', '副主席': 'bg-orange-50 text-orange-700',
    '文書': 'bg-purple-50 text-purple-700', '財政': 'bg-green-50 text-green-700',
    '總務': 'bg-blue-50 text-blue-700', '物資': 'bg-amber-50 text-amber-700',
    '網頁管理': 'bg-cyan-50 text-cyan-700', '攝影': 'bg-pink-50 text-pink-700',
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-6 h-6" /> 個人檔案
        </h1>
        <p className="text-gray-500 mt-1">檢視及更新你的個人資料</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Avatar + Role badges */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700 flex-shrink-0">
            {profile.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {profile.position && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${positionColors[profile.position] || 'bg-gray-100 text-gray-600'}`}>
                  <Shield className="w-3 h-3 mr-1" />{profile.position}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                profile.role === 'leader' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {profile.role === 'leader' ? '領袖' : '成員'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              註冊日期：{new Date(profile.created_at).toLocaleDateString('zh-HK')}
            </p>
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電郵地址</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            {profile.email}
          </div>
          <p className="text-xs text-gray-400 mt-1">電郵地址不可修改</p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="你的姓名" required />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="聯絡電話（可選）" />
          </div>
        </div>

        {/* Scout Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">所屬旅團</label>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <input type="text" value={scoutUnit} onChange={e => setScoutUnit(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="所屬旅團（可選）" />
          </div>
        </div>

        {/* Scout Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">童軍編號</label>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <input type="text" value={scoutNumber} onChange={e => setScoutNumber(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="童軍編號（可選）" />
          </div>
        </div>

        {/* Home Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">家庭地址</label>
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-gray-400" />
            <input type="text" value={homeAddress} onChange={e => setHomeAddress(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="家庭地址（可選）" />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> 緊急聯絡資料
          </p>

          {/* Emergency Contact */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">緊急聯絡人姓名</label>
            <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="緊急聯絡人（可選）" />
          </div>

          {/* Emergency Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">緊急聯絡人電話</label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <input type="text" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="緊急聯絡人電話（可選）" />
            </div>
          </div>
        </div>

        {/* Save */}
        <button type="submit" disabled={saving}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {saving ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> 儲存中...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> 已儲存</>
          ) : (
            <><Save className="w-4 h-4" /> 儲存變更</>
          )}
        </button>
      </form>
    </div>
  )
}
