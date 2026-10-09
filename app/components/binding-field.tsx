'use client'
import { useEffect, useRef } from 'react'

/*
  Background motion: a few faint molecules drifting by Brownian motion.
  When two of different kinds meet they bind (a short bond line appears),
  travel together for a few seconds, then let go. Scrolling stirs them
  slightly. Hidden entirely when the visitor prefers reduced motion.
*/

type P = {
  x: number
  y: number
  vx: number
  vy: number
  kind: 0 | 1
  partner: number
  bondUntil: number
  cooldownUntil: number
  r: number
}

export function BindingField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let w = 0
    let h = 0
    let raf = 0
    let ps: P[] = []
    let lastScroll = window.scrollY
    let stir = 0
    let colors = read()

    function read() {
      const s = getComputedStyle(document.documentElement)
      const g = (v: string, f: string) => s.getPropertyValue(v).trim() || f
      return {
        a: g('--hema', '#4636a6'),
        b: g('--eosin', '#b8355f'),
        bond: g('--muted', '#5b5570'),
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(24, Math.max(10, (w * h) / 60000)))
      while (ps.length < count) ps.push(spawn())
      ps.length = count
    }

    function spawn(): P {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        kind: Math.random() < 0.5 ? 0 : 1,
        partner: -1,
        bondUntil: 0,
        cooldownUntil: 0,
        r: 1.6 + Math.random() * 1.4,
      }
    }

    function step(now: number) {
      // Scroll velocity stirs the field a little
      const sy = window.scrollY
      stir = stir * 0.9 + (sy - lastScroll) * 0.02
      lastScroll = sy

      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]
        // Brownian kicks with drag
        p.vx = (p.vx + (Math.random() - 0.5) * 0.06) * 0.985
        p.vy = (p.vy + (Math.random() - 0.5) * 0.06) * 0.985 - stir * 0.04
        if (p.partner >= 0) {
          const q = ps[p.partner]
          if (now > p.bondUntil) {
            // Release, pushing apart gently
            const dx = p.x - q.x
            const dy = p.y - q.y
            const d = Math.hypot(dx, dy) || 1
            p.vx += (dx / d) * 0.35
            p.vy += (dy / d) * 0.35
            q.vx -= (dx / d) * 0.35
            q.vy -= (dy / d) * 0.35
            p.partner = -1
            q.partner = -1
            p.cooldownUntil = q.cooldownUntil = now + 6000
          } else {
            // Spring holding the pair at bond length
            const dx = q.x - p.x
            const dy = q.y - p.y
            const d = Math.hypot(dx, dy) || 1
            const f = (d - 16) * 0.01
            p.vx += (dx / d) * f
            p.vy += (dy / d) * f
          }
        }
        p.x += p.vx
        p.y += p.vy
        // Wrap around the screen edges
        if (p.x < -20) p.x = w + 20
        if (p.x > w + 20) p.x = -20
        if (p.y < -20) p.y = h + 20
        if (p.y > h + 20) p.y = -20
      }

      // Binding: opposite kinds that meet stick together for a while
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]
        if (p.partner >= 0 || now < p.cooldownUntil) continue
        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j]
          if (q.partner >= 0 || q.kind === p.kind || now < q.cooldownUntil) continue
          if (Math.hypot(p.x - q.x, p.y - q.y) < 26) {
            const until = now + 3000 + Math.random() * 4000
            p.partner = j
            q.partner = i
            p.bondUntil = q.bondUntil = until
            break
          }
        }
      }
    }

    function draw(now: number) {
      ctx!.clearRect(0, 0, w, h)
      // Bonds
      ctx!.strokeStyle = colors.bond
      ctx!.lineWidth = 1
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]
        if (p.partner > i) {
          const q = ps[p.partner]
          const left = p.bondUntil - now
          ctx!.globalAlpha = Math.min(0.35, left / 1500) // fades just before release
          ctx!.beginPath()
          ctx!.moveTo(p.x, p.y)
          ctx!.lineTo(q.x, q.y)
          ctx!.stroke()
        }
      }
      // Particles
      for (const p of ps) {
        ctx!.globalAlpha = p.partner >= 0 ? 0.42 : 0.2
        ctx!.fillStyle = p.kind === 0 ? colors.a : colors.b
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    function frame(now: number) {
      step(now)
      draw(now)
      raf = requestAnimationFrame(frame)
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf) {
        raf = requestAnimationFrame(frame)
      }
    }

    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    const mo = new MutationObserver(() => (colors = read()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      mo.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  )
}
