'use client'
import { useEffect, useRef } from 'react'

/*
  Background DNA double helix, fixed in the left margin so it stays in
  view while the page scrolls.

  Drawn like the protein: 3D tubes with depth shading, painted back to
  front. Geometry follows B-DNA: 10.5 base pairs per turn, and the two
  backbones sit about 150° apart rather than 180°, which gives the real
  major and minor grooves.

  Motion: a slow spin on its own; scrolling screws it through the view
  (it moves a bit slower than the page, so it reads as behind it).
  Reduced motion: drawn once, still.
  Only shown on wide screens, where the margin has room for it.
*/

type RGB = [number, number, number]

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(a: RGB, b: RGB, t: number) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`
}

const BP_PER_TURN = 10.5
const GROOVE = (150 / 180) * Math.PI // angle between the two backbones
const SUB = 4 // backbone curve points per base pair
const TILT = 0 // upright, so it never runs into the edge of its area

// Deterministic "sequence": 0 = A–T pair, 1 = G–C pair
function pairType(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x) < 0.45 ? 0 : 1
}

export function DnaHelix() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const wide = window.matchMedia('(min-width: 1280px)')

    let w = 0
    let h = 0
    let raf = 0
    let spin = 0
    let colors = read()

    type Item = { d: number; draw: () => void }
    const items: Item[] = []

    function read() {
      const s = getComputedStyle(document.documentElement)
      const g = (v: string, f: string) => hexToRgb(s.getPropertyValue(v).trim() || f)
      return {
        ground: g('--ground', '#fbf8f9'),
        backbone: g('--ink', '#1f1a36'),
        at: g('--eosin', '#b8355f'),
        gc: g('--hema', '#4636a6'),
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      w = rect.width
      h = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)
      const R = Math.min(44, w * 0.26) // helix radius in px
      const rise = R * 0.36 // vertical distance per base pair (real ratio ≈ 3.4 Å / 10 Å)
      const cx = w / 2
      const cy = h / 2
      const cam = 6
      const offset = reduceMotion ? 0 : window.scrollY * 0.55
      const ct = Math.cos(TILT)
      const st = Math.sin(TILT)
      // Base everything back toward the page colour so it stays in the background
      const quiet = 0.55

      // 3D point for strand s (0/1) at fractional base-pair position t
      const pt = (t: number, s: number) => {
        const theta = (t * 2 * Math.PI) / BP_PER_TURN + spin + (s ? GROOVE : 0)
        const x = R * Math.cos(theta)
        const z = Math.sin(theta) // -1..1 depth
        const y = t * rise - offset
        const k = cam / (cam - z * 0.6)
        const px = x * k
        const py = y - cy
        return {
          x: cx + px * ct - py * st,
          y: cy + px * st + py * ct,
          z,
          k,
        }
      }

      items.length = 0
      // Cover the viewport plus margin for the tilt
      const first = Math.floor((offset - 120) / rise)
      const last = Math.ceil((offset + h + 120) / rise)

      for (let i = first; i <= last; i++) {
        // Backbone tubes
        for (let s = 0; s < 2; s++) {
          for (let j = 0; j < SUB; j++) {
            const a = pt(i + j / SUB, s)
            const b = pt(i + (j + 1) / SUB, s)
            const d = (a.z + b.z) / 2
            items.push({
              d,
              draw: () => {
                const fog = quiet + (1 - (d + 1) / 2) * (1 - quiet) * 0.7
                ctx!.strokeStyle = mix(colors.backbone, colors.ground, fog)
                ctx!.lineWidth = Math.max(1.5, R * 0.16 * ((a.k + b.k) / 2))
                ctx!.beginPath()
                ctx!.moveTo(a.x, a.y)
                ctx!.lineTo(b.x, b.y)
                ctx!.stroke()
              },
            })
          }
        }
        // Base pair rung: two halves, one per base, meeting in the middle
        const a = pt(i + 0.5, 0)
        const b = pt(i + 0.5, 1)
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        const type = pairType(i)
        const base = type === 0 ? colors.at : colors.gc
        for (const [p, z] of [
          [a, (a.z * 3 + b.z) / 4],
          [b, (b.z * 3 + a.z) / 4],
        ] as const) {
          items.push({
            d: z - 0.01,
            draw: () => {
              const fog = quiet + (1 - (z + 1) / 2) * (1 - quiet) * 0.7
              ctx!.strokeStyle = mix(base, colors.ground, fog)
              ctx!.lineWidth = Math.max(1.5, R * 0.1)
              ctx!.beginPath()
              ctx!.moveTo(p.x, p.y)
              ctx!.lineTo(mx, my)
              ctx!.stroke()
            },
          })
        }
      }

      items.sort((p, q) => p.d - q.d)
      ctx!.lineCap = 'round'
      for (const it of items) it.draw()
    }

    function frame() {
      raf = 0
      if (!wide.matches || document.hidden) return
      spin += 0.0035
      draw()
      raf = requestAnimationFrame(frame)
    }

    function start() {
      if (!wide.matches) return
      resize()
      if (reduceMotion) draw()
      else if (!raf) raf = requestAnimationFrame(frame)
    }

    start()
    const onResize = () => {
      resize()
      if (reduceMotion) draw()
      else start()
    }
    const onVisibility = () => !document.hidden && start()
    window.addEventListener('resize', onResize)
    wide.addEventListener('change', start)
    document.addEventListener('visibilitychange', onVisibility)
    const mo = new MutationObserver(() => {
      colors = read()
      if (reduceMotion) draw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      wide.removeEventListener('change', start)
      document.removeEventListener('visibilitychange', onVisibility)
      mo.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 -z-10 hidden h-screen w-[calc((100vw-72rem)/2+2rem)] max-w-[260px] xl:block"
    />
  )
}
