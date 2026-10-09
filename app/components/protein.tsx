'use client'
import { useEffect, useRef } from 'react'

/*
  A real enzyme (PDB 4ZUO) drawn as a point cloud of its backbone atoms,
  with the bound inhibitor in eosin pink.

  - Assembles from a loose cloud once on load
  - Turns slowly by itself; drag to spin it (with a little inertia)
  - Points near the cursor are nudged aside and spring back
  - Scrolling turns it a little further
  - With reduced motion: drawn still, drag still works
*/

type Data = { n: number; p: number[]; k: number[] }

export function Protein({ className, label }: { className?: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let raf = 0

    // Geometry
    let n = 0
    let base = new Float32Array(0) // x,y,z per point, unit sphere
    let kind = new Uint8Array(0)
    let start = new Float32Array(0) // scattered start positions
    // Per-point screen-space nudge from the cursor, with velocity
    let off = new Float32Array(0)
    let offV = new Float32Array(0)
    let order: number[] = []
    let proj = new Float32Array(0) // sx, sy, depth per point

    // View state
    let width = 0
    let height = 0
    let dpr = 1
    let yaw = -0.6
    let pitch = 0.25
    let yawV = 0
    let pitchV = 0
    let assemble = reduceMotion ? 1 : 0
    let dragging = false
    let last = { x: 0, y: 0 }
    let pointer = { x: -9999, y: -9999, active: false }
    let scrollTurn = 0
    let visible = true
    let colors = readColors()

    function readColors() {
      const s = getComputedStyle(document.documentElement)
      const get = (v: string, f: string) => s.getPropertyValue(v).trim() || f
      return {
        a: get('--ink', '#1f1a36'),
        b: get('--hema', '#4636a6'),
        lig: get('--eosin', '#b8355f'),
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function project() {
      const cy = Math.cos(yaw + scrollTurn)
      const sy = Math.sin(yaw + scrollTurn)
      const cp = Math.cos(pitch)
      const sp = Math.sin(pitch)
      const r = Math.min(width * 0.47, height * 0.78)
      const cam = 3.2
      // Ease for the assemble moment
      const t = 1 - Math.pow(1 - assemble, 3)
      for (let i = 0; i < n; i++) {
        const j = i * 3
        let x = base[j] * t + start[j] * (1 - t)
        let y = base[j + 1] * t + start[j + 1] * (1 - t)
        let z = base[j + 2] * t + start[j + 2] * (1 - t)
        // rotate around Y (yaw) then X (pitch)
        const x1 = x * cy + z * sy
        const z1 = -x * sy + z * cy
        const y1 = y * cp - z1 * sp
        const z2 = y * sp + z1 * cp
        const s = cam / (cam - z2)
        proj[j] = width / 2 + x1 * r * s + off[i * 2]
        proj[j + 1] = height / 2 + y1 * r * s + off[i * 2 + 1]
        proj[j + 2] = z2
      }
    }

    function nudge() {
      // Push points away from the cursor in screen space, then spring back
      const radius = Math.min(width, height) * 0.13
      const r2 = radius * radius
      for (let i = 0; i < n; i++) {
        const j = i * 3
        const o = i * 2
        let fx = -off[o] * 0.06
        let fy = -off[o + 1] * 0.06
        if (pointer.active) {
          const dx = proj[j] - pointer.x
          const dy = proj[j + 1] - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const push = (1 - d / radius) * 1.6
            fx += (dx / d) * push
            fy += (dy / d) * push
          }
        }
        offV[o] = (offV[o] + fx) * 0.82
        offV[o + 1] = (offV[o + 1] + fy) * 0.82
        off[o] += offV[o]
        off[o + 1] += offV[o + 1]
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)
      // Paint back to front so nearer points sit on top
      order.sort((a, b) => proj[a * 3 + 2] - proj[b * 3 + 2])
      const dot = Math.max(1.6, width / 290)
      for (let idx = 0; idx < n; idx++) {
        const i = order[idx]
        const j = i * 3
        const z = proj[j + 2] // -1 (far) .. 1 (near)
        const k = kind[i]
        const near = (z + 1) / 2
        if (k === 2) continue
        ctx!.globalAlpha = 0.18 + near * 0.62
        ctx!.fillStyle = k === 0 ? colors.a : colors.b
        const s = dot * (0.7 + near * 0.6)
        ctx!.fillRect(proj[j] - s / 2, proj[j + 1] - s / 2, s, s)
      }
      // Inhibitor atoms always drawn on top so they read through the protein
      ctx!.globalAlpha = 1
      ctx!.fillStyle = colors.lig
      for (let i = 0; i < n; i++) {
        if (kind[i] !== 2) continue
        const j = i * 3
        ctx!.beginPath()
        ctx!.arc(proj[j], proj[j + 1], dot * 1.5, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    function frame() {
      if (disposed) return
      if (visible) {
        if (assemble < 1) assemble = Math.min(1, assemble + 0.012)
        if (!dragging) {
          yawV *= 0.95
          pitchV *= 0.92
          yaw += yawV + (reduceMotion ? 0 : 0.0016)
          pitch += pitchV
          // Drift pitch back to a gentle tilt
          pitch += (0.25 - pitch) * 0.01
        }
        project()
        if (!reduceMotion) nudge()
        draw()
      }
      if (reduceMotion && !dragging && Math.abs(yawV) < 1e-4 && Math.abs(pitchV) < 1e-4) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(frame)
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    // Pointer
    function local(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function onDown(e: PointerEvent) {
      dragging = true
      last = local(e)
      canvas!.setPointerCapture(e.pointerId)
      canvas!.style.cursor = 'grabbing'
      kick()
    }
    function onMove(e: PointerEvent) {
      const p = local(e)
      pointer = { ...p, active: e.pointerType === 'mouse' }
      if (dragging) {
        const dx = p.x - last.x
        const dy = p.y - last.y
        yawV = dx * 0.006
        pitchV = dy * 0.006
        yaw += yawV
        pitch = Math.max(-1.2, Math.min(1.2, pitch + pitchV))
        last = p
        kick()
      }
    }
    function onUp(e: PointerEvent) {
      dragging = false
      canvas!.style.cursor = 'grab'
      if (canvas!.hasPointerCapture(e.pointerId)) canvas!.releasePointerCapture(e.pointerId)
      kick()
    }
    function onLeave() {
      pointer.active = false
    }
    function onScroll() {
      scrollTurn = window.scrollY * 0.0016
      if (reduceMotion) {
        project()
        draw()
      }
    }

    // Load data
    fetch('/protein.json')
      .then((r) => r.json())
      .then((d: Data) => {
        if (disposed) return
        n = d.n
        base = new Float32Array(d.p.map((v) => v / 1000))
        // Flip Y so the inhibitor pockets face the viewer at rest
        for (let i = 1; i < base.length; i += 3) base[i] = -base[i]
        kind = Uint8Array.from(d.k)
        start = new Float32Array(n * 3)
        let seed = 7
        const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
        for (let i = 0; i < n; i++) {
          // Loose shell around the final shape
          const j = i * 3
          const s = 1.6 + rand() * 0.5
          start[j] = base[j] * s + rand() * 0.3
          start[j + 1] = base[j + 1] * s + rand() * 0.3
          start[j + 2] = base[j + 2] * s + rand() * 0.3
        }
        off = new Float32Array(n * 2)
        offV = new Float32Array(n * 2)
        proj = new Float32Array(n * 3)
        order = Array.from({ length: n }, (_, i) => i)
        resize()
        onScroll()
        if (reduceMotion) {
          project()
          draw()
        } else kick()
      })
      .catch(() => {})

    const ro = new ResizeObserver(() => {
      resize()
      if (n) {
        project()
        draw()
      }
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !reduceMotion) kick()
    })
    io.observe(canvas)

    const mo = new MutationObserver(() => {
      colors = readColors()
      if (n) draw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: 'pan-y', cursor: 'grab' }}
      role="img"
      aria-label={label}
    />
  )
}
