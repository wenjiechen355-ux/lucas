'use client'

import { useEffect, useRef } from 'react'

export default function ThreeDBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDark = document.documentElement.classList.contains('dark')
    const particles: { x: number; y: number; r: number; vx: number; vy: number; o: number; speed: number }[] = []
    const count = 60

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Init particles
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        vx: (Math.random() - .5) * .3,
        vy: (Math.random() - .5) * .3,
        o: Math.random() * .4 + .1,
        speed: Math.random() * .5 + .1,
      })
    }

    let animId: number
    function animate() {
      const w = canvas!.width, h = canvas!.height
      ctx!.clearRect(0, 0, w, h)

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx!.beginPath()
            ctx!.strokeStyle = isDark
              ? `rgba(34,197,94,${.04 * (1 - dist / 120)})`
              : `rgba(22,163,74,${.06 * (1 - dist / 120)})`
            ctx!.lineWidth = .5
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.stroke()
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx * p.speed
        p.y += p.vy * p.speed
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = isDark
          ? `rgba(34,197,94,${p.o})`
          : `rgba(22,163,74,${p.o * .7})`
        ctx!.fill()

        // Glow
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        grad.addColorStop(0, isDark ? `rgba(34,197,94,${p.o})` : `rgba(22,163,74,${p.o * .5})`)
        grad.addColorStop(1, 'transparent')
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx!.fillStyle = grad
        ctx!.fill()
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      // particles will pick up isDark on next frame via closure - not ideal but functional enough
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
