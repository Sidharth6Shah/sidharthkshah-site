'use client'
import { useEffect, useRef } from 'react'

/*
  A real enzyme (PDB 4ZUO) drawn as a ribbon diagram, the way crystal
  structures are usually shown: helices as coils, sheet strands as flat
  bands, loops as thin tubes. The bound inhibitor is a pink ball-and-stick
  model sitting next to its zinc ion.

  - The backbone draws itself in once on load
  - Turns slowly by itself; drag to spin it (with a little inertia)
  - Tilts slightly toward the cursor on hover
  - Scrolling turns it a little further
  - The canvas is larger than its slot, so the protein is never clipped
  - With reduced motion: drawn still, drag still works
*/

type Segment = { chain: string; ss: string; p: number[] }
type Data = {
  segments: Segment[]
  ligand: { p: number[]; bonds: number[] }
  zinc: number[]
}

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

// Item kinds for the painter's sort
const SEG = 0
const BOND = 1
const ATOM = 2
const ZN = 3

export function Protein({ className, label }: { className?: string; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let raf = 0

    // Geometry (model space, unit sphere)
    let pts = new Float32Array(0) // backbone curve points, all segments concatenated
    let ssCode = new Uint8Array(0) // 0 loop, 1 helix, 2 strand
    const segStart: number[] = []
    const segEnd: number[] = []
    let lig = new Float32Array(0)
    let ligBonds: number[] = []
    let zinc = new Float32Array(0)
    let total = 0

    // Projected positions
    let P = new Float32Array(0) // backbone: sx, sy, z, perspective scale
    let L = new Float32Array(0)
    let Z = new Float32Array(0)

    const items: { k: number; i: number; d: number }[] = []

    // View
    let cw = 0
    let ch = 0
    let slotW = 0
    let yaw = 0.5
    let pitch = 0.35
    let yawV = 0
    let pitchV = 0
    let tiltX = 0
    let tiltY = 0
    let tiltTX = 0
    let tiltTY = 0
    let reveal = reduceMotion ? 1 : 0
    let dragging = false
    let last = { x: 0, y: 0 }
    let scrollTurn = 0
    let visible = true
    let colors = readColors()

    function readColors() {
      const s = getComputedStyle(document.documentElement)
      const get = (v: string, f: string) => hexToRgb(s.getPropertyValue(v).trim() || f)
      return {
        ground: get('--ground', '#fbf8f9'),
        helix: get('--hema', '#4636a6'),
        strand: get('--ink', '#1f1a36'),
        loop: get('--muted', '#5b5570'),
        lig: get('--eosin', '#b8355f'),
        zinc: get('--muted', '#5b5570'),
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      cw = rect.width
      ch = rect.height
      slotW = wrap!.getBoundingClientRect().width
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(cw * dpr)
      canvas!.height = Math.round(ch * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function projectInto(src: Float32Array, dst: Float32Array, stride: number) {
      const a = yaw + scrollTurn + tiltX
      const b = pitch + tiltY
      const cy = Math.cos(a)
      const sy = Math.sin(a)
      const cp = Math.cos(b)
      const sp = Math.sin(b)
      const r = slotW * 0.43
      const cam = 4
      const n = src.length / 3
      for (let i = 0; i < n; i++) {
        const j = i * 3
        const x = src[j]
        const y = src[j + 1]
        const z = src[j + 2]
        const x1 = x * cy + z * sy
        const z1 = -x * sy + z * cy
        const y1 = y * cp - z1 * sp
        const z2 = y * sp + z1 * cp
        const s = cam / (cam - z2)
        const o = i * stride
        dst[o] = cw / 2 + x1 * r * s
        dst[o + 1] = ch / 2 + y1 * r * s
        dst[o + 2] = z2
        if (stride > 3) dst[o + 3] = s
      }
    }

    function draw() {
      projectInto(pts, P, 4)
      projectInto(lig, L, 3)
      projectInto(zinc, Z, 3)
      ctx!.clearRect(0, 0, cw, ch)

      const r = slotW * 0.43
      const shown = Math.floor(reveal * total)
      const ligAlpha = reduceMotion ? 1 : Math.max(0, Math.min(1, (reveal - 0.85) / 0.15))

      items.length = 0
      for (let s = 0; s < segStart.length; s++) {
        for (let i = segStart[s]; i < segEnd[s] - 1; i++) {
          if (i >= shown) break
          items.push({ k: SEG, i, d: (P[i * 4 + 2] + P[(i + 1) * 4 + 2]) / 2 })
        }
      }
      if (ligAlpha > 0) {
        for (let b = 0; b < ligBonds.length; b += 2) {
          items.push({ k: BOND, i: b, d: (L[ligBonds[b] * 3 + 2] + L[ligBonds[b + 1] * 3 + 2]) / 2 })
        }
        for (let a = 0; a < lig.length / 3; a++) items.push({ k: ATOM, i: a, d: L[a * 3 + 2] + 0.002 })
        for (let a = 0; a < zinc.length / 3; a++) items.push({ k: ZN, i: a, d: Z[a * 3 + 2] })
      }
      items.sort((p, q) => p.d - q.d)

      ctx!.lineCap = 'round'
      ctx!.lineJoin = 'round'
      const widthFor = [r * 0.012, r * 0.042, r * 0.038]
      for (const it of items) {
        const fog = (1 - (it.d + 1) / 2) * 0.7 // far = faded toward background
        if (it.k === SEG) {
          const i = it.i
          const code = ssCode[i]
          const base = code === 1 ? colors.helix : code === 2 ? colors.strand : colors.loop
          const s = (P[i * 4 + 3] + P[(i + 1) * 4 + 3]) / 2
          ctx!.globalAlpha = 1
          ctx!.strokeStyle = mix(base, colors.ground, fog)
          ctx!.lineWidth = Math.max(1, widthFor[code] * s)
          ctx!.beginPath()
          ctx!.moveTo(P[i * 4], P[i * 4 + 1])
          ctx!.lineTo(P[(i + 1) * 4], P[(i + 1) * 4 + 1])
          ctx!.stroke()
        } else if (it.k === BOND) {
          const a = ligBonds[it.i]
          const b = ligBonds[it.i + 1]
          ctx!.globalAlpha = ligAlpha
          ctx!.strokeStyle = mix(colors.lig, colors.ground, fog * 0.5)
          ctx!.lineWidth = Math.max(1.5, r * 0.018)
          ctx!.beginPath()
          ctx!.moveTo(L[a * 3], L[a * 3 + 1])
          ctx!.lineTo(L[b * 3], L[b * 3 + 1])
          ctx!.stroke()
        } else if (it.k === ATOM) {
          const a = it.i
          ctx!.globalAlpha = ligAlpha
          ctx!.fillStyle = mix(colors.lig, colors.ground, fog * 0.5)
          ctx!.beginPath()
          ctx!.arc(L[a * 3], L[a * 3 + 1], Math.max(2.5, r * 0.025), 0, Math.PI * 2)
          ctx!.fill()
        } else {
          const a = it.i
          ctx!.globalAlpha = ligAlpha
          ctx!.fillStyle = mix(colors.zinc, colors.ground, fog * 0.5)
          ctx!.beginPath()
          ctx!.arc(Z[a * 3], Z[a * 3 + 1], Math.max(3, r * 0.032), 0, Math.PI * 2)
          ctx!.fill()
        }
      }
      ctx!.globalAlpha = 1
    }

    function frame() {
      raf = 0
      if (disposed) return
      let moving = false
      if (reveal < 1) {
        reveal = Math.min(1, reveal + 0.009)
        moving = true
      }
      if (!dragging) {
        yawV *= 0.95
        pitchV *= 0.92
        yaw += yawV + (reduceMotion ? 0 : 0.0018)
        pitch += pitchV
        pitch += (0.35 - pitch) * 0.008
      }
      tiltX += (tiltTX - tiltX) * 0.06
      tiltY += (tiltTY - tiltY) * 0.06
      moving =
        moving ||
        !reduceMotion ||
        dragging ||
        Math.abs(yawV) > 1e-4 ||
        Math.abs(pitchV) > 1e-4 ||
        Math.abs(tiltTX - tiltX) > 1e-3 ||
        Math.abs(tiltTY - tiltY) > 1e-3
      if (visible) draw()
      if (moving && visible) raf = requestAnimationFrame(frame)
    }

    function kick() {
      if (!raf && !disposed) raf = requestAnimationFrame(frame)
    }

    // Pointer events live on the slot, not the oversized canvas,
    // so the canvas never blocks clicks on the text beside it.
    function local(e: PointerEvent) {
      const rect = wrap!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height }
    }
    function onDown(e: PointerEvent) {
      dragging = true
      const p = local(e)
      last = { x: p.x, y: p.y }
      wrap!.setPointerCapture(e.pointerId)
      wrap!.style.cursor = 'grabbing'
      kick()
    }
    function onMove(e: PointerEvent) {
      const p = local(e)
      if (dragging) {
        yawV = (p.x - last.x) * 0.006
        pitchV = (p.y - last.y) * 0.006
        yaw += yawV
        pitch = Math.max(-1.3, Math.min(1.3, pitch + pitchV))
        last = { x: p.x, y: p.y }
      } else if (e.pointerType === 'mouse' && !reduceMotion) {
        tiltTX = (p.x / p.w - 0.5) * 0.35
        tiltTY = (p.y / p.h - 0.5) * 0.25
      }
      kick()
    }
    function onUp(e: PointerEvent) {
      dragging = false
      wrap!.style.cursor = 'grab'
      if (wrap!.hasPointerCapture(e.pointerId)) wrap!.releasePointerCapture(e.pointerId)
      kick()
    }
    function onLeave() {
      tiltTX = 0
      tiltTY = 0
      kick()
    }
    function onScroll() {
      scrollTurn = window.scrollY * 0.0016
      kick()
    }

    fetch('/protein.json')
      .then((r) => r.json())
      .then((d: Data) => {
        if (disposed) return
        const all: number[] = []
        const codes: number[] = []
        for (const seg of d.segments) {
          segStart.push(all.length / 3)
          for (let i = 0; i < seg.p.length; i++) all.push(seg.p[i] / 1000)
          for (const c of seg.ss) codes.push(c === 'H' ? 1 : c === 'E' ? 2 : 0)
          segEnd.push(all.length / 3)
        }
        pts = Float32Array.from(all)
        ssCode = Uint8Array.from(codes)
        total = pts.length / 3
        lig = Float32Array.from(d.ligand.p.map((v) => v / 1000))
        ligBonds = d.ligand.bonds
        zinc = Float32Array.from(d.zinc.map((v) => v / 1000))
        P = new Float32Array(total * 4)
        L = new Float32Array(lig.length)
        Z = new Float32Array(zinc.length)
        resize()
        scrollTurn = window.scrollY * 0.0016
        draw()
        kick()
      })
      .catch(() => {})

    const ro = new ResizeObserver(() => {
      resize()
      if (total) draw()
    })
    ro.observe(canvas)
    ro.observe(wrap)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) kick()
    })
    io.observe(wrap)

    const mo = new MutationObserver(() => {
      colors = readColors()
      if (total) draw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    wrap.addEventListener('pointerdown', onDown)
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerup', onUp)
    wrap.addEventListener('pointercancel', onUp)
    wrap.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      wrap.removeEventListener('pointerdown', onDown)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerup', onUp)
      wrap.removeEventListener('pointercancel', onUp)
      wrap.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className={`relative ${className ?? ''}`}
      style={{ touchAction: 'pan-y', cursor: 'grab' }}
      role="img"
      aria-label={label}
    >
      {/* Oversized so the protein can turn freely without being clipped */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: '-30%', top: '-50%', width: '160%', height: '200%' }}
      />
    </div>
  )
}
