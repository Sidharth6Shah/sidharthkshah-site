'use client'
import { useEffect, useRef } from 'react'

/*
  A real enzyme (PDB 4ZUO) rendered in 3D (three.js) as a ribbon diagram:
  helices and sheet strands as thick glossy tubes, loops as thin tubes.
  The bound inhibitor is a pink ball-and-stick model beside its zinc ion.

  - The backbone grows in once on load, then the inhibitor appears
  - Turns slowly by itself; drag to spin it (with a little inertia)
  - Tilts slightly toward the cursor on hover
  - Scrolling turns it a little further
  - The canvas is larger than its slot, so the protein is never clipped
  - With reduced motion: a still frame, drag still works
*/

type Segment = { chain: string; ss: string; p: number[] }
type Data = {
  segments: Segment[]
  ligand: { p: number[]; bonds: number[] }
  zinc: number[]
}

// Tube radius per secondary structure, in model units (protein fits a unit sphere)
const TUBE = { H: 0.024, E: 0.021, C: 0.008 } as const

export function Protein({ className, label }: { className?: string; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const host = hostRef.current
    if (!wrap || !host) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      const [THREE, { RoomEnvironment }, data] = await Promise.all([
        import('three'),
        import('three/examples/jsm/environments/RoomEnvironment.js'),
        fetch('/protein.json').then((r) => r.json() as Promise<Data>),
      ])
      if (disposed) return

      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      } catch {
        return // no WebGL: the caption still explains the figure
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setClearColor(0x000000, 0)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.outputColorSpace = THREE.SRGBColorSpace
      const canvas = renderer.domElement
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      host.appendChild(canvas)

      const scene = new THREE.Scene()
      const pmrem = new THREE.PMREMGenerator(renderer)
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = envTex
      const key = new THREE.DirectionalLight(0xffffff, 1.0)
      key.position.set(-2, 3, 4)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0xff8ab0, 0.9)
      rim.position.set(3, -1, -4)
      scene.add(rim)

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)

      // ── Materials, coloured from the site palette ──
      const glossy = () =>
        new THREE.MeshPhysicalMaterial({ roughness: 0.35, metalness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.25 })
      const mats = { H: glossy(), E: glossy(), C: glossy(), lig: glossy(), zn: glossy() }
      mats.zn.metalness = 0.9
      mats.zn.roughness = 0.2
      function applyColors() {
        const s = getComputedStyle(document.documentElement)
        const c = (v: string, f: string) => new THREE.Color(s.getPropertyValue(v).trim() || f)
        mats.H.color = c('--hema', '#4636a6')
        mats.E.color = c('--ink', '#1f1a36')
        mats.C.color = c('--muted', '#5b5570')
        mats.lig.color = c('--eosin', '#b8355f')
        mats.zn.color = new THREE.Color(0xb8b4c4)
      }
      applyColors()

      // ── Backbone: one tube per run of the same secondary structure ──
      const model = new THREE.Group()
      const tubes: { mesh: InstanceType<typeof THREE.Mesh>; count: number }[] = []
      for (const seg of data.segments) {
        const n = seg.ss.length
        const at = (i: number) =>
          new THREE.Vector3(seg.p[i * 3] / 1000, -seg.p[i * 3 + 1] / 1000, seg.p[i * 3 + 2] / 1000)
        let start = 0
        while (start < n - 1) {
          const code = seg.ss[start] as keyof typeof TUBE
          let end = start
          while (end + 1 < n && seg.ss[end + 1] === code) end++
          // overlap one point into the next run so tubes join without gaps
          const stop = Math.min(n - 1, end + 1)
          const pts: InstanceType<typeof THREE.Vector3>[] = []
          for (let i = start; i <= stop; i++) pts.push(at(i))
          if (pts.length >= 2) {
            const curve = new THREE.CatmullRomCurve3(pts)
            const geo = new THREE.TubeGeometry(curve, Math.max(2, pts.length * 2), TUBE[code] ?? TUBE.C, code === 'C' ? 6 : 12, false)
            const mesh = new THREE.Mesh(geo, mats[code] ?? mats.C)
            model.add(mesh)
            tubes.push({ mesh, count: geo.index ? geo.index.count : 0 })
          }
          start = stop
        }
      }

      // ── Inhibitor (ball and stick) and zinc ──
      const ligGroup = new THREE.Group()
      const lp = data.ligand.p
      const ligAt = (i: number) => new THREE.Vector3(lp[i * 3] / 1000, -lp[i * 3 + 1] / 1000, lp[i * 3 + 2] / 1000)
      const ball = new THREE.SphereGeometry(0.018, 20, 14)
      for (let i = 0; i < lp.length / 3; i++) {
        const m = new THREE.Mesh(ball, mats.lig)
        m.position.copy(ligAt(i))
        ligGroup.add(m)
      }
      const stick = new THREE.CylinderGeometry(0.008, 0.008, 1, 10)
      const up = new THREE.Vector3(0, 1, 0)
      for (let b = 0; b < data.ligand.bonds.length; b += 2) {
        const a = ligAt(data.ligand.bonds[b])
        const c = ligAt(data.ligand.bonds[b + 1])
        const m = new THREE.Mesh(stick, mats.lig)
        m.position.copy(a).add(c).multiplyScalar(0.5)
        m.scale.set(1, a.distanceTo(c), 1)
        m.quaternion.setFromUnitVectors(up, c.clone().sub(a).normalize())
        ligGroup.add(m)
      }
      const znBall = new THREE.SphereGeometry(0.03, 24, 16)
      for (let i = 0; i < data.zinc.length / 3; i++) {
        const m = new THREE.Mesh(znBall, mats.zn)
        m.position.set(data.zinc[i * 3] / 1000, -data.zinc[i * 3 + 1] / 1000, data.zinc[i * 3 + 2] / 1000)
        ligGroup.add(m)
      }
      model.add(ligGroup)
      scene.add(model)

      // ── Sizing: the canvas is oversized; keep the protein sized to the slot ──
      function resize() {
        const w = host!.clientWidth
        const h = host!.clientHeight
        const slotW = wrap!.clientWidth
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        // world radius 1 should span ~43% of the slot width in pixels
        const rPx = slotW * 0.43
        const dist = h / 2 / (rPx * Math.tan((camera.fov * Math.PI) / 360))
        camera.position.set(0, 0, dist)
        camera.near = Math.max(0.1, dist - 3)
        camera.far = dist + 3
        camera.updateProjectionMatrix()
      }
      resize()

      // ── Motion state ──
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
      let visible = true
      let raf = 0
      let startTime = 0
      const REVEAL_MS = 2200

      function apply() {
        const total = tubes.length
        const shown = reveal * total
        tubes.forEach((t, i) => {
          const f = Math.max(0, Math.min(1, shown - i))
          t.mesh.visible = f > 0
          // draw ranges must be multiples of 3 (whole triangles)
          t.mesh.geometry.setDrawRange(0, Math.floor((t.count * f) / 3) * 3)
        })
        ligGroup.visible = reveal > 0.92
        const scale = reduceMotion ? 1 : 0.9 + 0.1 * Math.min(1, reveal * 1.2)
        // inhibitor pops in once the backbone is drawn
        ligGroup.scale.setScalar(reduceMotion ? 1 : Math.max(0.01, Math.min(1, (reveal - 0.92) / 0.08)))
        model.scale.setScalar(scale)
        const scrollTurn = reduceMotion ? 0 : window.scrollY * 0.0016
        model.rotation.set(pitch + tiltY, yaw + scrollTurn + tiltX, 0, 'XYZ')
      }

      function frame() {
        raf = 0
        if (disposed) return
        // Time-based so slow devices take the same ~2 s as fast ones
        if (reveal < 1) {
          const now = performance.now()
          if (!startTime) startTime = now
          reveal = Math.min(1, (now - startTime) / REVEAL_MS)
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
        apply()
        renderer.render(scene, camera)
        const settling =
          dragging ||
          Math.abs(yawV) > 1e-4 ||
          Math.abs(pitchV) > 1e-4 ||
          Math.abs(tiltTX - tiltX) > 1e-3 ||
          Math.abs(tiltTY - tiltY) > 1e-3
        if (visible && !document.hidden && (!reduceMotion || settling || reveal < 1)) {
          raf = requestAnimationFrame(frame)
        }
      }
      function kick() {
        if (!raf && !disposed) raf = requestAnimationFrame(frame)
      }

      // Pointer events live on the slot, not the oversized canvas,
      // so the canvas never blocks clicks on the text beside it.
      const local = (e: PointerEvent) => {
        const r = wrap!.getBoundingClientRect()
        return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }
      }
      const onDown = (e: PointerEvent) => {
        dragging = true
        const p = local(e)
        last = { x: p.x, y: p.y }
        wrap!.setPointerCapture(e.pointerId)
        wrap!.style.cursor = 'grabbing'
        kick()
      }
      const onMove = (e: PointerEvent) => {
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
      const onUp = (e: PointerEvent) => {
        dragging = false
        wrap!.style.cursor = 'grab'
        if (wrap!.hasPointerCapture(e.pointerId)) wrap!.releasePointerCapture(e.pointerId)
        kick()
      }
      const onLeave = () => {
        tiltTX = 0
        tiltTY = 0
        kick()
      }
      const onScroll = () => kick()
      const onVisibility = () => !document.hidden && kick()

      const ro = new ResizeObserver(() => {
        resize()
        kick()
      })
      ro.observe(wrap)
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible) kick()
      })
      io.observe(wrap)
      const mo = new MutationObserver(() => {
        applyColors()
        kick()
      })
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

      wrap.addEventListener('pointerdown', onDown)
      wrap.addEventListener('pointermove', onMove)
      wrap.addEventListener('pointerup', onUp)
      wrap.addEventListener('pointercancel', onUp)
      wrap.addEventListener('pointerleave', onLeave)
      window.addEventListener('scroll', onScroll, { passive: true })
      document.addEventListener('visibilitychange', onVisibility)

      kick()

      cleanup = () => {
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
        document.removeEventListener('visibilitychange', onVisibility)
        model.traverse((o) => {
          const mesh = o as InstanceType<typeof THREE.Mesh>
          if (mesh.geometry) mesh.geometry.dispose()
        })
        Object.values(mats).forEach((m) => m.dispose())
        envTex.dispose()
        pmrem.dispose()
        renderer.dispose()
        canvas.remove()
      }
    })()

    return () => {
      disposed = true
      cleanup()
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
      <div
        ref={hostRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: '-30%', top: '-50%', width: '160%', height: '200%' }}
      />
    </div>
  )
}
