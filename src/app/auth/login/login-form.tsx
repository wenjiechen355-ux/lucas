'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type RoleSelection = 'member' | 'regular' | 'leader' | null

export default function LoginForm() {
  const [role, setRole] = useState<RoleSelection>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const savedEmail = localStorage.getItem('scout_saved_email')
    const savedPw = localStorage.getItem('scout_saved_password')
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true) }
    if (savedPw) setPassword(savedPw)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (rememberMe) {
        localStorage.setItem('scout_saved_email', email)
        localStorage.setItem('scout_saved_password', password)
      } else {
        localStorage.removeItem('scout_saved_email')
        localStorage.removeItem('scout_saved_password')
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (session) window.location.href = '/dashboard'
      else { router.push('/dashboard'); router.refresh() }
    } catch (err: any) {
      setError(err.message || '登入失敗')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4" style={{ perspective: '1400px' }}>
      {/* Background */}
      <div className="fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse 100% 70% at 30% 20%, rgba(22,163,74,.07) 0%, transparent 50%), radial-gradient(ellipse 70% 60% at 70% 80%, rgba(34,197,94,.04) 0%, transparent 50%), linear-gradient(180deg, #f0fdf4 0%, #f8fafc 30%, #f1f5f9 70%, #f0fdf4 100%)' }} />

      {/* Particles */}
      <style>{`
        @keyframes fp0{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-25px) rotate(180deg)}}
        @keyframes fp1{0%,100%{transform:translateY(0) rotate(45deg)}50%{transform:translateY(-18px) rotate(-135deg)}}
        @keyframes fp2{0%,100%{transform:translateX(0) rotate(90deg)}50%{transform:translateX(-12px) rotate(-90deg)}}
        @keyframes btnGlow{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.6;transform:scale(1.12)}}
        @keyframes shine{0%{left:-100%}100%{left:200%}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px) rotateX(3deg)}to{opacity:1;transform:translateY(0) rotateX(0)}}
      `}</style>
      {Array.from({ length: 25 }, (_, i) => (
        <div key={i} className="fixed pointer-events-none rounded-full"
          style={{
            left: `${(i * 17 + 7) % 100}%`, top: `${(i * 23 + 13) % 100}%`,
            width: (i % 5) + 2, height: (i % 5) + 2,
            opacity: (i % 4) * 0.07 + 0.05,
            background: i % 4 === 0 ? '#22c55e' : i % 4 === 1 ? '#16a34a' : 'rgba(22,163,74,.3)',
            animation: `fp${i % 3} ${2 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i % 5) * 0.6}s`,
          }} />
      ))}

      {/* Content */}
      {!role ? (
        <RoleSelection onSelect={setRole} />
      ) : (
        <LoginFormFields
          role={role} email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          rememberMe={rememberMe} setRememberMe={setRememberMe}
          error={error} loading={loading}
          onSubmit={handleLogin} onBack={() => setRole(null)}
        />
      )}
    </div>
  )
}

// ============ Role Selection ============
function RoleSelection({ onSelect }: { onSelect: (r: RoleSelection) => void }) {
  const roles = [
    {
      id: 'member' as const, title: '執委會成員登入',
      desc: '檢視個人進度、出席記錄、提交文檔',
      color: 'green', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    },
    {
      id: 'regular' as const, title: '普通團員登入',
      desc: '一般團員使用電郵及身份證號碼登入',
      color: 'blue', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    },
    {
      id: 'leader' as const, title: '領袖登入',
      desc: '管理成員、審批文檔、活動管理',
      color: 'amber', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    },
  ]

  const colorMap: Record<string, { border: string; bg: string; iconBg: string; text: string; shadow: string }> = {
    green: { border: 'border-green-200', bg: 'hover:bg-green-50/50', iconBg: 'bg-green-100', text: 'text-green-600', shadow: 'rgba(22,163,74,.25)' },
    blue: { border: 'border-blue-200', bg: 'hover:bg-blue-50/50', iconBg: 'bg-blue-100', text: 'text-blue-600', shadow: 'rgba(59,130,246,.25)' },
    amber: { border: 'border-amber-200', bg: 'hover:bg-amber-50/50', iconBg: 'bg-amber-100', text: 'text-amber-600', shadow: 'rgba(245,158,11,.25)' },
  }

  return (
    <div className="w-full max-w-sm text-center" style={{ animation: 'fadeUp 0.5s ease-out both' }}>
      {/* 3D Badge */}
      <div className="w-20 h-20 rounded-full mx-auto mb-5 relative"
        style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)',
          boxShadow: '0 0 0 3px rgba(22,163,74,.2), 0 0 0 6px rgba(22,163,74,.1), 0 8px 32px rgba(22,163,74,.3), inset 0 2px 6px rgba(255,255,255,.3), inset 0 -2px 4px rgba(0,0,0,.1)',
        }}>
        <div className="absolute inset-2 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.05), rgba(0,0,0,.05))', boxShadow: 'inset 0 2px 4px rgba(255,255,255,.4)' }}>
          <span className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,.2)' }}>童</span>
        </div>
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.4), transparent 40%, transparent 60%, rgba(0,0,0,.15))' }} />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">選擇身份</h1>
      <p className="text-sm text-gray-500 mb-8">澳門童軍第一旅深資童軍團執行委員會</p>

      <div className="space-y-3">
        {roles.map((r, i) => {
          const c = colorMap[r.color]
          return (
            <button key={r.id} onClick={() => onSelect(r.id)}
              className={`w-full flex items-center gap-4 bg-white/70 backdrop-blur-md border-2 ${c.border} rounded-2xl p-5 text-left ${c.bg} transition-all duration-300 group relative overflow-hidden`}
              style={{
                boxShadow: `0 1px 0 rgba(255,255,255,.8), 0 4px 16px ${c.shadow}`,
                animation: `fadeUp 0.4s ease-out ${0.1 + i * 0.1}s both`,
                transformStyle: 'preserve-3d',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) translateZ(8px)'; e.currentTarget.style.boxShadow = `0 1px 0 rgba(255,255,255,.8), 0 8px 28px ${c.shadow}` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) translateZ(0)'; e.currentTarget.style.boxShadow = `0 1px 0 rgba(255,255,255,.8), 0 4px 16px ${c.shadow}` }}
            >
              {/* Shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute -inset-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12" style={{ animation: 'shine 1.5s ease-in-out infinite' }} />
              </div>
              <div className={`w-12 h-12 rounded-full ${c.iconBg} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,.06), inset 0 2px 4px rgba(255,255,255,.6)' }}>
                <svg className={`w-6 h-6 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{r.icon}</svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{r.title}</p>
                <p className="text-sm text-gray-500">{r.desc}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============ Login Form ============
function LoginFormFields({ role, email, setEmail, password, setPassword, rememberMe, setRememberMe, error, loading, onSubmit, onBack }: {
  role: RoleSelection; email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  rememberMe: boolean; setRememberMe: (v: boolean) => void;
  error: string; loading: boolean; onSubmit: (e: React.FormEvent) => void; onBack: () => void;
}) {
  const roleConfig = {
    member: { color: 'green', label: '執委會成員' },
    regular: { color: 'blue', label: '普通團員' },
    leader: { color: 'amber', label: '領袖' },
  }
  const rc = role ? roleConfig[role] : roleConfig.member

  return (
    <div className="w-full max-w-sm" style={{ animation: 'fadeUp 0.4s ease-out both' }}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 relative"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)', boxShadow: '0 0 0 3px rgba(22,163,74,.2), 0 8px 24px rgba(22,163,74,.25), inset 0 2px 4px rgba(255,255,255,.3)' }}>
          <div className="absolute inset-2 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.05))' }}>
            <span className="text-2xl font-bold text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,.15)' }}>童</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900">登入系統</h1>
        <p className="text-sm text-gray-500 mt-1">澳門童軍第一旅深資童軍團執行委員會</p>
      </div>

      <form onSubmit={onSubmit}
        className="relative rounded-2xl p-6 space-y-4 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148,163,184,.15)',
          boxShadow: '0 1px 0 rgba(255,255,255,.8), 0 4px 24px rgba(0,0,0,.05), 0 8px 48px rgba(0,0,0,.04)',
        }}>
        {/* Role badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          role === 'leader' ? 'bg-amber-50 text-amber-700' : role === 'regular' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {role === 'leader'
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            }
          </svg>
          以{rc.label}身份登入
          <button type="button" onClick={onBack} className="ml-auto text-xs underline opacity-60 hover:opacity-100 cursor-pointer">更換身份</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電郵</label>
          <input type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="your@email.com" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
          <input type="password" name="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="••••••••" required minLength={6} />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
          記住我 <span className="text-gray-400">（下次自動填寫電郵）</span>
        </label>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading}
          className="relative w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm overflow-hidden group"
          style={{
            boxShadow: '0 3px 0 #15803d, 0 4px 12px rgba(22,163,74,.3), inset 0 1px 0 rgba(255,255,255,.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 0 #15803d, 0 6px 20px rgba(22,163,74,.4), inset 0 1px 0 rgba(255,255,255,.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 0 #15803d, 0 4px 12px rgba(22,163,74,.3), inset 0 1px 0 rgba(255,255,255,.2)' }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(-1px)'}
        >
          {/* Shine */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="absolute -inset-full w-20 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12" style={{ animation: 'shine 1.5s ease-in-out infinite' }} />
          </div>
          {loading ? '處理中...' : '登入'}
        </button>

        <div className="text-center text-sm">
          <button type="button" onClick={onBack} className="text-gray-500 hover:underline cursor-pointer">
            ← 返回選擇身份
          </button>
        </div>
      </form>
    </div>
  )
}
