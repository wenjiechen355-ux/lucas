'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type RoleSelection = 'member' | 'regular' | 'leader' | null

export default function LoginForm() {
  const [role, setRole] = useState<RoleSelection>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupRole, setSignupRole] = useState<'member' | 'leader'>('member')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSignUpMode = searchParams.get('signup') === 'true'
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // 确保 session 已写入 cookie 后再跳转
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/dashboard'
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('請輸入姓名'); return }
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: signupRole } },
      })
      if (error) throw error
      alert('註冊成功！請檢查電郵確認帳號。')
      router.push('/auth/login')
    } catch (err: any) {
      setError(err.message || '註冊失敗')
    } finally {
      setLoading(false)
    }
  }

  const submitHandler = isSignUpMode ? handleSignUp : handleLogin
  const submitLabel = loading ? '處理中...' : isSignUpMode ? '註冊' : '登入'

  // —— 角色選擇畫面（僅登入模式顯示）——
  if (!role && !isSignUpMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">童</div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">選擇身份</h1>
          <p className="text-sm text-gray-500 mb-8">澳門童軍第一旅深資童軍團執行委員會</p>

          <div className="space-y-3">
            <button onClick={() => setRole('member')}
              className="w-full flex items-center gap-4 bg-white border-2 border-green-200 rounded-2xl p-5 text-left hover:border-green-400 hover:bg-green-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">執委會成員登入</p>
                <p className="text-sm text-gray-500">檢視個人進度、出席記錄、提交文檔</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button onClick={() => setRole('regular')}
              className="w-full flex items-center gap-4 bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">普通團員登入</p>
                <p className="text-sm text-gray-500">一般團員使用電郵及身份證號碼登入</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button onClick={() => setRole('leader')}
              className="w-full flex items-center gap-4 bg-white border-2 border-amber-200 rounded-2xl p-5 text-left hover:border-amber-400 hover:bg-amber-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">領袖登入</p>
                <p className="text-sm text-gray-500">管理成員、審批文檔、活動管理</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            未有帳號？{' '}
            <a href="/auth/login?signup=true" className="text-green-600 font-medium hover:underline">申請註冊</a>
          </p>
        </div>
      </div>
    )
  }

  // —— 登入/註冊表單 ——
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">童</div>
          <h1 className="text-xl font-bold text-gray-900">{isSignUpMode ? '申請帳號' : '登入系統'}</h1>
          <p className="text-sm text-gray-500 mt-1">澳門童軍第一旅深資童軍團執行委員會</p>
        </div>

        <form onSubmit={submitHandler} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          {/* 角色標籤（僅登入） */}
          {role && !isSignUpMode && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              role === 'leader' ? 'bg-amber-50 text-amber-700' :
              role === 'regular' ? 'bg-blue-50 text-blue-700' :
              'bg-green-50 text-green-700'
            }`}>
              {role === 'leader'
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              }
              {role === 'leader' ? '以領袖身份登入' :
               role === 'regular' ? '以普通團員身份登入' :
               '以執委會成員身份登入'}
              <button type="button" onClick={() => setRole(null)} className="ml-auto text-xs underline opacity-60 hover:opacity-100">更換身份</button>
            </div>
          )}

          {/* 註冊角色選擇 */}
          {isSignUpMode && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">註冊身份</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSignupRole('member')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    signupRole === 'member'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  執委會成員
                </button>
                <button type="button" onClick={() => setSignupRole('leader')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    signupRole === 'leader'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  領袖
                </button>
              </div>
            </div>
          )}

          {/* 姓名（僅註冊） */}
          {isSignUpMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="你的全名" required />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電郵</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="your@email.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="••••••••" required minLength={6} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitLabel}
          </button>

          <div className="text-center text-sm">
            {isSignUpMode ? (
              <a href="/auth/login" className="text-gray-500 hover:underline">← 返回登入</a>
            ) : (
              <button type="button" onClick={() => { setRole(null); router.push('/auth/login') }} className="text-gray-500 hover:underline cursor-pointer">
                ← 返回選擇身份
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
