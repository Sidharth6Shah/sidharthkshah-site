'use client'
import { useEffect, useRef } from 'react'

/*
  Caffeine, drawn the way a graph neural network sees it:
  atoms are nodes, bonds are edges. Coordinates are in bond-length units.
  The atoms fly in once on load, then settle; visitors can drag them.
*/

type Element = 'C' | 'N' | 'O'

const ATOMS: { el: Element; x: number; y: number }[] = [
  { el: 'N', x: -0.866, y: 0.5 }, // 0  N1
  { el: 'C', x: -0.866, y: -0.5 }, // 1  C2
  { el: 'N', x: 0, y: -1 }, // 2  N3
  { el: 'C', x: 0.866, y: -0.5 }, // 3  C4
  { el: 'C', x: 0.866, y: 0.5 }, // 4  C5
  { el: 'C', x: 0, y: 1 }, // 5  C6
  { el: 'N', x: 1.82, y: 0.81 }, // 6  N7
  { el: 'C', x: 2.41, y: 0 }, // 7  C8
  { el: 'N', x: 1.82, y: -0.81 }, // 8  N9
  { el: 'C', x: -1.73, y: 1 }, // 9  methyl on N1
  { el: 'O', x: -1.73, y: -1 }, // 10 O on C2
  { el: 'C', x: 0, y: -2 }, // 11 methyl on N3
  { el: 'O', x: 0, y: 2 }, // 12 O on C6
  { el: 'C', x: 2.13, y: 1.76 }, // 13 methyl on N7
]

// [a, b, bond order]
const BONDS: [number, number, number][] = [
  [0, 1, 1],
  [1, 2, 1],
  [2, 3, 1],
  [3, 4, 2],
  [4, 5, 1],
  [5, 0, 1],
  [3, 8, 1],
  [8, 7, 2],
  [7, 6, 1],
  [6, 4, 1],
  [1, 10, 2],
  [5, 12, 2],
  [0, 9, 1],
  [2, 11, 1],
  [6, 13, 1],
]

const ROTATION = -0.32 // radians, so it doesn't sit square

export function Molecule({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    // Centre the template on its centroid and rotate it
    const cx = ATOMS.reduce((s, a) => s + a.x, 0) / ATOMS.length
    const cy = ATOMS.reduce((s, a) => s + a.y, 0) / ATOMS.length
    const cos = Math.cos(ROTATION)
    const sin = Math.sin(ROTATION)
    const template = ATOMS.map((a) => {
      const x = a.x - cx
      const y = a.y - cy
      return { x: x * cos - y * sin, y: x * sin + y * cos }
    })

    const bonded = new Set(BONDS.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`))
    const n = ATOMS.length

    let width = 0
    let height = 0
    let scale = 1
    const pos = template.map(() => ({ x: 0, y: 0 }))
    const vel = template.map(() => ({ x: 0, y: 0 }))
    let rest: number[][] = []
    let initialised = false
    let dragIndex = -1
    let dragTarget = { x: 0, y: 0 }
    let raf = 0
    let running = false
    let colors = readColors()

    function readColors() {
      const s = getComputedStyle(document.documentElement)
      return {
        ink: s.getPropertyValue('--ink').trim() || '#1f1a36',
        muted: s.getPropertyValue('--muted').trim() || '#5b5570',
        ground: s.getPropertyValue('--ground').trim() || '#fbf8f9',
        hema: s.getPropertyValue('--hema').trim() || '#4636a6',
        eosin: s.getPropertyValue('--eosin').trim() || '#b8355f',
      }
    }

    function layout() {
      const rect = canvas!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Template spans about 4.6 x 4.2 bond lengths
      scale = Math.min(width / 5.4, height / 5.0)

      rest = []
      for (let i = 0; i < n; i++) {
        rest.push([])
        for (let j = 0; j < n; j++) {
          const dx = template[i].x - template[j].x
          const dy = template[i].y - template[j].y
          rest[i][j] = Math.hypot(dx, dy) * scale
        }
      }

      if (!initialised) {
        initialised = true
        for (let i = 0; i < n; i++) {
          const home = homeOf(i)
          if (reduceMotion) {
            pos[i] = { ...home }
          } else {
            // Scatter atoms outward so they assemble on load
            const angle = (i / n) * Math.PI * 2 + 0.6
            const r = Math.max(width, height) * (0.55 + (i % 3) * 0.12)
            pos[i] = {
              x: width / 2 + Math.cos(angle) * r,
              y: height / 2 + Math.sin(angle) * r,
            }
          }
        }
      }
    }

    function homeOf(i: number) {
      return {
        x: width / 2 + template[i].x * scale,
        y: height / 2 + template[i].y * scale,
      }
    }

    function step() {
      // Elastic body: every pair of atoms is joined by a spring at its
      // template distance. Bonds are stiff, other pairs soft.
      const fx = new Array(n).fill(0)
      const fy = new Array(n).fill(0)
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = pos[j].x - pos[i].x
          const dy = pos[j].y - pos[i].y
          const d = Math.hypot(dx, dy) || 0.001
          const k = bonded.has(`${i}-${j}`) ? 0.09 : 0.012
          const f = (k * (d - rest[i][j])) / d
          fx[i] += f * dx
          fy[i] += f * dy
          fx[j] -= f * dx
          fy[j] -= f * dy
        }
      }
      // Gentle pull of every atom toward its home keeps the molecule in frame
      for (let i = 0; i < n; i++) {
        const home = homeOf(i)
        fx[i] += (home.x - pos[i].x) * 0.006
        fy[i] += (home.y - pos[i].y) * 0.006
      }

      let energy = 0
      for (let i = 0; i < n; i++) {
        if (i === dragIndex) {
          pos[i].x += (dragTarget.x - pos[i].x) * 0.5
          pos[i].y += (dragTarget.y - pos[i].y) * 0.5
          vel[i] = { x: 0, y: 0 }
          continue
        }
        vel[i].x = (vel[i].x + fx[i]) * 0.82
        vel[i].y = (vel[i].y + fy[i]) * 0.82
        pos[i].x += vel[i].x
        pos[i].y += vel[i].y
        energy += vel[i].x * vel[i].x + vel[i].y * vel[i].y
      }
      return energy
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)
      const atomR = Math.max(10, scale * 0.24)

      // Bonds
      ctx!.lineCap = 'round'
      ctx!.strokeStyle = colors.muted
      ctx!.lineWidth = Math.max(1.5, scale * 0.035)
      for (const [a, b, order] of BONDS) {
        const p = pos[a]
        const q = pos[b]
        if (order === 1) {
          ctx!.beginPath()
          ctx!.moveTo(p.x, p.y)
          ctx!.lineTo(q.x, q.y)
          ctx!.stroke()
        } else {
          const dx = q.x - p.x
          const dy = q.y - p.y
          const len = Math.hypot(dx, dy) || 1
          const ox = (-dy / len) * scale * 0.07
          const oy = (dx / len) * scale * 0.07
          for (const s of [-1, 1]) {
            ctx!.beginPath()
            ctx!.moveTo(p.x + ox * s, p.y + oy * s)
            ctx!.lineTo(q.x + ox * s, q.y + oy * s)
            ctx!.stroke()
          }
        }
      }

      // Atoms
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'
      ctx!.font = `600 ${Math.round(atomR * 1.05)}px ${getComputedStyle(document.body).fontFamily}`
      for (let i = 0; i < n; i++) {
        const { el } = ATOMS[i]
        const p = pos[i]
        if (el === 'C') {
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, atomR * 0.42, 0, Math.PI * 2)
          ctx!.fillStyle = colors.ink
          ctx!.fill()
        } else {
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, atomR, 0, Math.PI * 2)
          ctx!.fillStyle = el === 'N' ? colors.hema : colors.eosin
          ctx!.fill()
          ctx!.fillStyle = colors.ground
          ctx!.fillText(el, p.x, p.y + 1)
        }
        if (i === dragIndex) {
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, atomR * 1.5, 0, Math.PI * 2)
          ctx!.strokeStyle = colors.ink
          ctx!.lineWidth = 1.5
          ctx!.stroke()
          ctx!.strokeStyle = colors.muted
          ctx!.lineWidth = Math.max(1.5, scale * 0.035)
        }
      }
    }

    function frame() {
      let energy = 0
      for (let s = 0; s < 2; s++) energy = step()
      draw()
      if (energy < 0.002 && dragIndex < 0) {
        running = false
        return
      }
      raf = requestAnimationFrame(frame)
    }

    function kick() {
      if (running) return
      running = true
      raf = requestAnimationFrame(frame)
    }

    function pointerPos(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function nearest(p: { x: number; y: number }) {
      const hit = Math.max(22, scale * 0.45)
      let best = -1
      let bestD = hit
      for (let i = 0; i < n; i++) {
        const d = Math.hypot(pos[i].x - p.x, pos[i].y - p.y)
        if (d < bestD) {
          best = i
          bestD = d
        }
      }
      return best
    }

    function onDown(e: PointerEvent) {
      const p = pointerPos(e)
      const i = nearest(p)
      if (i < 0) return
      dragIndex = i
      dragTarget = p
      canvas!.setPointerCapture(e.pointerId)
      canvas!.style.cursor = 'grabbing'
      e.preventDefault()
      kick()
    }

    function onMove(e: PointerEvent) {
      const p = pointerPos(e)
      if (dragIndex >= 0) {
        dragTarget = p
        kick()
      } else {
        canvas!.style.cursor = nearest(p) >= 0 ? 'grab' : 'default'
      }
    }

    function onUp(e: PointerEvent) {
      if (dragIndex < 0) return
      dragIndex = -1
      canvas!.style.cursor = 'grab'
      if (canvas!.hasPointerCapture(e.pointerId)) {
        canvas!.releasePointerCapture(e.pointerId)
      }
      kick()
    }

    layout()
    if (reduceMotion) draw()
    else kick()

    const ro = new ResizeObserver(() => {
      layout()
      draw()
      kick()
    })
    ro.observe(canvas)

    // Redraw when the theme changes
    const mo = new MutationObserver(() => {
      colors = readColors()
      draw()
    })
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)

    // Fonts may finish loading after first paint
    document.fonts?.ready.then(() => draw())

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: 'pan-y' }}
      role="img"
      aria-label="A caffeine molecule drawn as a graph, with atoms as nodes and bonds as edges. The atoms can be dragged."
    />
  )
}
