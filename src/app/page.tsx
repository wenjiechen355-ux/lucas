'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [badgeHover, setBadgeHover] = useState(false)
  const [badgeClick, setBadgeClick] = useState(false)
  const [navFlipped, setNavFlipped] = useState(false)
  const [cardsVisible, setCardsVisible] = useState(false)
  const reducedMotion = useRef(false)
  const isMobile = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    isMobile.current = window.innerWidth < 768
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    window.addEventListener('mousemove', onMouse)
    setCardsVisible(true)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  const tiltX = reducedMotion.current ? 0 : (mousePos.y - 0.5) * 10
  const tiltY = reducedMotion.current ? 0 : (mousePos.x - 0.5) * -10
  const mobile = isMobile.current
  const rm = reducedMotion.current

  // Floating login button animation
  const [floatPhase, setFloatPhase] = useState(0)
  useEffect(() => {
    if (rm) return
    const id = setInterval(() => setFloatPhase(p => p + 0.02), 16)
    return () => clearInterval(id)
  }, [rm])
  const floatY = rm ? 0 : Math.sin(floatPhase) * 6

  // Particles data
  const particles = useRef(Array.from({ length: 30 }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    s: Math.random() * 5 + 2, spd: Math.random() * 2 + 1,
    dly: Math.random() * 3, o: Math.random() * .3 + .08,
  }))).current

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ perspective: '1400px' }}>
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse 100% 70% at 30% 20%, rgba(22,163,74,.07) 0%, transparent 50%), radial-gradient(ellipse 70% 60% at 70% 80%, rgba(34,197,94,.04) 0%, transparent 50%), linear-gradient(180deg, #f0fdf4 0%, #f8fafc 30%, #f1f5f9 70%, #f0fdf4 100%)' }} />

      {/* Floating particles */}
      <style>{`
        @keyframes fp0 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-25px) rotate(180deg)} }
        @keyframes fp1 { 0%,100%{transform:translateY(0) rotate(45deg)} 50%{transform:translateY(-18px) rotate(-135deg)} }
        @keyframes fp2 { 0%,100%{transform:translateX(0) rotate(90deg)} 50%{transform:translateX(-12px) rotate(-90deg)} }
        @keyframes btnGlow { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.6;transform:scale(1.15)} }
        @keyframes cardEnter { from{opacity:0;transform:translateY(50px) rotateX(5deg)} to{opacity:1;transform:translateY(0) rotateX(0)} }
        @keyframes shine { 0%{left:-100%} 100%{left:200%} }
      `}</style>
      {!mobile && particles.map((p, i) => (
        <div key={i} className="fixed pointer-events-none rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, opacity: p.o,
            background: i % 4 === 0 ? '#22c55e' : i % 4 === 1 ? '#16a34a' : 'rgba(22,163,74,.3)',
            animation: `fp${i%3} ${2+p.spd}s ease-in-out infinite`, animationDelay: `${p.dly}s`,
          }} />
      ))}

      {/* ===== HEADER ===== */}
      <header className="relative z-50 bg-white/60 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg transition-transform duration-700 hover:rotate-[360deg]"
              style={{ boxShadow: '0 4px 16px rgba(22,163,74,.3), inset 0 2px 4px rgba(255,255,255,.3)' }}>
              童
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm leading-tight">澳門童軍第一旅深資童軍團</h1>
              <p className="text-xs text-gray-500">執行委員會</p>
            </div>
          </div>
          {/* 3D Flip login button */}
          <button
            onMouseEnter={() => !mobile && setNavFlipped(true)}
            onMouseLeave={() => !mobile && setNavFlipped(false)}
            onClick={() => window.location.href = '/auth/login'}
            className="relative w-[100px] h-[38px] cursor-pointer"
            style={{ perspective: '600px' }}>
            <div className="absolute inset-0 transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: navFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)' }}>
              <div className="absolute inset-0 bg-green-600 text-white rounded-lg flex items-center justify-center text-sm font-medium"
                style={{ backfaceVisibility: 'hidden', boxShadow: '0 4px 12px rgba(22,163,74,.3), inset 0 1px 0 rgba(255,255,255,.2)' }}>
                登入系統
              </div>
              <div className="absolute inset-0 bg-slate-700 text-white rounded-lg flex items-center justify-center text-sm font-medium"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', boxShadow: '0 4px 12px rgba(0,0,0,.2)' }}>
                Login
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center" style={{ transformStyle: 'preserve-3d' }}>
        <div className="max-w-2xl" style={{ transformStyle: 'preserve-3d' }}>
          {/* 3D Badge */}
          <div className="relative mb-8 cursor-pointer mx-auto w-24 h-24"
            onMouseEnter={() => !mobile && setBadgeHover(true)}
            onMouseLeave={() => { setBadgeHover(false); setBadgeClick(false) }}
            onClick={() => { setBadgeClick(true); setTimeout(() => setBadgeClick(false), 800) }}
            style={{
              transformStyle: 'preserve-3d',
              transform: mobile ? 'none' : `rotateY(${badgeHover ? tiltY + 15 : tiltY}deg) rotateX(${badgeHover ? tiltX - 5 : tiltX}deg) translateZ(${badgeHover ? 25 : 0}px) ${badgeClick ? 'rotateY(360deg)' : ''}`,
              transition: badgeClick ? 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1)' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
            {/* Glow */}
            <div className="absolute -inset-4 rounded-full transition-opacity duration-500"
              style={{ background: 'radial-gradient(circle, rgba(22,163,74,.35) 0%, transparent 70%)', opacity: badgeHover ? 0.8 : 0.3, filter: `blur(${badgeHover ? 8 : 4}px)` }} />
            {/* Ring */}
            <div className="w-24 h-24 rounded-full relative"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                boxShadow: '0 0 0 3px rgba(22,163,74,.2), 0 0 0 6px rgba(22,163,74,.1), 0 8px 32px rgba(22,163,74,.3), inset 0 2px 8px rgba(255,255,255,.3), inset 0 -2px 4px rgba(0,0,0,.1)' }}>
              <div className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.25) 0%, rgba(255,255,255,.05) 50%, rgba(0,0,0,.05) 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,.4), inset 0 -2px 4px rgba(0,0,0,.1)' }}>
                <span className="text-3xl font-bold text-white select-none"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,.2), 0 0 20px rgba(22,163,74,.3)', transform: badgeHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s ease' }}>童</span>
              </div>
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.4) 0%, transparent 40%, transparent 60%, rgba(0,0,0,.15) 100%)' }} />
            </div>
          </div>

          {/* 3D Title */}
          <div className="mb-8" style={{ transformStyle: 'preserve-3d', transform: mobile ? 'none' : `rotateX(${tiltX * 0.3}deg) rotateY(${tiltY * 0.3}deg)`, transition: 'transform 0.3s ease-out' }}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 select-none"
              style={{ textShadow: '0 1px 0 rgba(255,255,255,.8), 0 4px 12px rgba(0,0,0,.04)', transform: mobile ? 'none' : 'translateZ(8px)' }}>
              澳門童軍第一旅深資童軍團<br/>
              <span className="relative inline-block px-3 py-1 mt-1 rounded-lg text-green-600"
                style={{ background: 'rgba(255,255,255,.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(22,163,74,.2)', boxShadow: '0 2px 12px rgba(22,163,74,.1), inset 0 1px 0 rgba(255,255,255,.6), inset 0 -1px 0 rgba(0,0,0,.03)', textShadow: '0 2px 8px rgba(22,163,74,.15)' }}>
                管理系統
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">一站式追蹤成員進度、管理活動出席、處理文檔簽批，提升執委會工作效率</p>
          </div>

          {/* 3D Login Button */}
          <div className="flex justify-center mb-4">
            <Link href="/auth/login" className="relative inline-block group"
              style={{ transformStyle: 'preserve-3d', transform: `translateY(${floatY}px)`, transition: 'transform 0.05s linear' }}>
              {/* Glow ring */}
              <div className="absolute -inset-2 rounded-full opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(34,197,94,.5) 0%, transparent 70%)', animation: 'btnGlow 2s ease-in-out infinite' }} />
              {/* Button body */}
              <div className="relative cursor-pointer" style={{ transformStyle: 'preserve-3d', transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
                onMouseEnter={e => { if (mobile) return; const el = e.currentTarget; el.style.transform = `rotateX(-8deg) rotateY(${(mousePos.x - .5) * 15}deg)` }}
                onMouseLeave={e => { if (mobile) return; e.currentTarget.style.transform = 'rotateX(0) rotateY(0)' }}
                onMouseDown={e => { if (mobile) return; e.currentTarget.style.transform = 'translateZ(-6px)' }}
                onMouseUp={e => { if (mobile) return; e.currentTarget.style.transform = 'translateZ(0) rotateX(-8deg)' }}>
                {/* Top face */}
                <div className="relative bg-green-600 text-white px-10 py-3.5 rounded-2xl text-base font-bold select-none"
                  style={{ boxShadow: '0 4px 0 #15803d, 0 6px 20px rgba(22,163,74,.3), inset 0 1px 0 rgba(255,255,255,.25)', textShadow: '0 1px 2px rgba(0,0,0,.15)' }}>
                  立即登入
                  {/* Shine */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-0 w-20 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" style={{ animation: 'shine 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
                {/* Bottom face (3D depth) */}
                <div className="absolute left-0 right-0 rounded-2xl bg-[#15803d] pointer-events-none"
                  style={{ top: '100%', height: '6px', transform: 'translateZ(-6px) rotateX(-90deg)', transformOrigin: 'top', transformStyle: 'preserve-3d' }} />
              </div>
            </Link>
          </div>

          {/* 3D Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto" style={{ transformStyle: 'preserve-3d' }}>
            {/* Card 1 — Attendance */}
            <FeatureCard
              color="green" icon="check" title="出席打卡" desc="活動簽到、出席記錄追蹤、缺席管理，自動生成統計報表"
              delay={0} visible={cardsVisible} mobile={mobile} mousePos={mousePos} index={0} rm={rm}
            />
            {/* Card 2 — Progress */}
            <FeatureCard
              color="amber" icon="chart" title="進度記錄" desc="成員技能進度可視化、任務狀態管理、完成認證一覽無遺"
              delay={0.15} visible={cardsVisible} mobile={mobile} mousePos={mousePos} index={1} rm={rm}
            />
            {/* Card 3 — Documents */}
            <FeatureCard
              color="blue" icon="doc" title="文檔簽批" desc="線上提交申請、領袖審閱批核、電子簽名存檔，流程透明可追溯"
              delay={0.3} visible={cardsVisible} mobile={mobile} mousePos={mousePos} index={2} rm={rm}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm relative z-10">
        <p>© {new Date().getFullYear()} 澳門童軍第一旅深資童軍團執行委員會</p>
      </footer>
    </div>
  )
}

function FeatureCard({ color, icon, title, desc, delay, visible, mobile, mousePos, index, rm }: {
  color: string; icon: string; title: string; desc: string; delay: number; visible: boolean; mobile: boolean; mousePos: { x: number; y: number }; index: number; rm: boolean
}) {
  const colorMap: Record<string, { bg: string; iconBg: string; text: string; shadow: string }> = {
    green:  { bg: 'bg-green-50', iconBg: 'bg-green-100', text: 'text-green-600', shadow: 'rgba(22,163,74,.2)' },
    amber:  { bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', shadow: 'rgba(245,158,11,.2)' },
    blue:   { bg: 'bg-blue-50',  iconBg: 'bg-blue-100',  text: 'text-blue-600',  shadow: 'rgba(59,130,246,.2)' },
  }
  const c = colorMap[color]
  const arcX = (index - 1) * 0.05
  const isCenter = index === 1

  return (
    <div
      className={`${c.bg} rounded-2xl p-8 text-center relative overflow-hidden group`}
      style={{
        transformStyle: 'preserve-3d',
        transform: visible
          ? `rotateY(${arcX * 50}deg) ${isCenter ? 'translateZ(20px)' : ''}`
          : 'translateY(50px) rotateX(5deg)',
        opacity: visible ? 1 : 0,
        animation: visible ? `cardEnter 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both` : 'none',
        boxShadow: `0 4px 24px ${c.shadow}, 0 1px 0 rgba(255,255,255,.8), inset 0 1px 0 rgba(255,255,255,.5)`,
        border: '1px solid rgba(148,163,184,.12)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
      }}
      onMouseEnter={e => { if (mobile) return; e.currentTarget.style.transform = `rotateY(${arcX * 50}deg) translateZ(${isCenter ? 40 : 30}px) rotateX(-3deg)`; e.currentTarget.style.boxShadow = `0 12px 40px ${c.shadow}, 0 4px 16px rgba(0,0,0,.1)` }}
      onMouseLeave={e => { if (mobile) return; e.currentTarget.style.transform = `rotateY(${arcX * 50}deg) ${isCenter ? 'translateZ(20px)' : ''}`; e.currentTarget.style.boxShadow = `0 4px 24px ${c.shadow}, 0 1px 0 rgba(255,255,255,.8), inset 0 1px 0 rgba(255,255,255,.5)` }}
    >
      {/* Shine on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute -inset-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12" style={{ animation: 'shine 1.2s ease-in-out infinite' }} />
      </div>
      {/* 3D thickness bottom */}
      <div className="absolute left-2 right-2 rounded-2xl opacity-30 pointer-events-none"
        style={{ bottom: '-6px', height: '8px', background: c.shadow, filter: 'blur(6px)' }} />
      {/* Icon */}
      <div className={`w-14 h-14 rounded-full ${c.iconBg} flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,.06), inset 0 2px 4px rgba(255,255,255,.6)' }}>
        <svg className={`w-7 h-7 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon === 'check' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
          {icon === 'chart' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
          {icon === 'doc' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
        </svg>
      </div>
      <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">{title}</h4>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  )
}
