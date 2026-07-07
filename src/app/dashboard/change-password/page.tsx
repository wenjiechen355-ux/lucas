'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密碼至少需要 6 個字元' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '兩次輸入嘅新密碼唔一致' })
      return
    }

    setLoading(true)

    try {
      // 先驗證舊密碼 — 嘗試用舊密碼重新登入
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('無法取得用戶資料')

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInErr) {
        setMessage({ type: 'error', text: '目前密碼不正確' })
        setLoading(false)
        return
      }

      // 更新密碼
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) throw updateErr

      setMessage({ type: 'success', text: '密碼已成功更改！' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '更改失敗' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <KeyRound className="w-6 h-6" /> 更改密碼
        </h1>
        <p className="text-gray-500 mt-1">修改你嘅登入密碼</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">目前密碼</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="輸入你而家嘅密碼" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
          <input type={showPw ? 'text' : 'password'} value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="最少 6 個字元" required minLength={6} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
          <input type={showPw ? 'text' : 'password'} value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="再次輸入新密碼" required minLength={6} />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
          顯示密碼
        </label>

        {message && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? '更改中...' : '更改密碼'}
        </button>
      </form>
    </div>
  )
}
