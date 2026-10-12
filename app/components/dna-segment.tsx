'use client'
import { useEffect, useRef } from 'react'

/*
  A short segment of B-DNA rendered in real 3D (three.js): every atom is a
  glossy sphere, lit by a studio-style environment with a pink rim light.
  It floats in the left part of the page, behind the text, and stays in
  view while scrolling.

  The model is built from standard B-DNA geometry (10.5 base pairs per
  turn, 3.38 Å rise, phosphates ~8.9 Å from the axis). It is an idealised
  model rather than one specific crystal structure.

  Motion: a slow turn about its own axis plus a gentle drift; scrolling
  turns it further and tilts it. Reduced motion: one still frame.
  Only shown on medium screens and up.
*/

type El = 'C' | 'N' | 'O' | 'P'
type Atom = { el: El; x: number; y: number; z: number }

const BP = 21 // base pairs in the segment (two full turns)
const TWIST = (2 * Math.PI) / 10.5
const RISE = 3.38

// Backbone + sugar of one nucleotide, cylindrical coordinates in the
// base-pair frame: [element, radius Å, angle deg, height Å]
const BACKBONE: [El, number, number, number][] = [
  ['P', 8.9, 95, 2.2],
  ['O', 9.9, 101, 3.1],
  ['O', 9.6, 86, 1.2],
  ['O', 7.9, 88, 2.9],
  ['C', 7.7, 79, 3.4],
  ['C', 7.8, 70, 2.8],
  ['O', 6.5, 66, 2.5],
  ['C', 8.4, 64, 1.5],
  ['O', 9.1, 55, 1.2],
  ['C', 7.4, 57, 0.8],
  ['C', 5.9, 62, 1.0],
]

function cyl(r: number, deg: number, z: number) {
  const a = (deg * Math.PI) / 180
  return { x: r * Math.cos(a), y: r * Math.sin(a), z }
}

// Ring vertices in a 2D (u, v) plane
function ring(cu: number, cv: number, n: number, rad: number, rot: number) {
  const out: [number, number][] = []
  for (let k = 0; k < n; k++) {
    const a = rot + (k * 2 * Math.PI) / n
    out.push([cu + rad * Math.cos(a), cv + rad * Math.sin(a)])
  }
  return out
}

function buildDNA(): Atom[] {
  const atoms: Atom[] = []
  let seed = 11
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

  for (let i = 0; i < BP; i++) {
    const rot = i * TWIST
    const h = i * RISE - (BP * RISE) / 2
    const place = (p: { x: number; y: number; z: number }, el: El) => {
      const c = Math.cos(rot)
      const s = Math.sin(rot)
      atoms.push({ el, x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z + h })
    }

    // Two backbones: strand 2 is strand 1 mirrored through the dyad axis
    for (const [el, r, deg, z] of BACKBONE) {
      place(cyl(r, deg, z), el)
      place(cyl(r, -deg, -z), el)
    }

    // Base pair, laid in the plane between the two C1' atoms
    const a = cyl(5.9, 62, 0)
    const b = cyl(5.9, -62, 0)
    const L = Math.hypot(b.x - a.x, b.y - a.y)
    const ux = (b.x - a.x) / L
    const uy = (b.y - a.y) / L
    // v points toward the helix axis side (minor groove)
    const vx = -uy
    const vy = ux
    const toXYZ = (u: number, v: number, z: number) => ({
      x: a.x + ux * u + vx * v,
      y: a.y + uy * u + vy * v,
      z,
    })
    const purineFirst = rand() < 0.5
    const gc = rand() < 0.55
    // Purine (5- and 6-membered rings) on one side, pyrimidine on the other
    const purineAt = (u0: number, dir: 1 | -1) => {
      const five = ring(u0 + dir * 2.35, 0.2, 5, 1.19, 0)
      const six = ring(u0 + dir * 4.35, -0.2, 6, 1.4, Math.PI / 6)
      for (const [u, v] of [...five, ...six]) place(toXYZ(u, v, 0), Math.abs(v) > 1.1 ? 'N' : 'C')
      // exocyclic O / N
      place(toXYZ(u0 + dir * 5.0, -2.4, 0), gc ? 'O' : 'N')
      if (gc) place(toXYZ(u0 + dir * 3.2, -2.6, 0), 'N')
    }
    const pyrimidineAt = (u0: number, dir: 1 | -1) => {
      const six = ring(u0 + dir * 2.85, 0, 6, 1.4, 0)
      for (const [u, v] of six) place(toXYZ(u, v, 0), Math.abs(v) > 1.1 && rand() < 0.5 ? 'N' : 'C')
      place(toXYZ(u0 + dir * 2.85, 2.6, 0), 'O')
      place(toXYZ(u0 + dir * 4.1, -2.2, 0), gc ? 'N' : 'O')
    }
    if (purineFirst) {
      purineAt(0, 1)
      pyrimidineAt(L, -1)
    } else {
      pyrimidineAt(0, 1)
      purineAt(L, -1)
    }
  }
  return atoms
}

export function DnaSegment() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const mq = window.matchMedia('(min-width: 768px)')
    if (!mq.matches) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      const THREE = await import('three')
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
      if (disposed) return

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
      renderer.setClearColor(0x000000, 0)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.outputColorSpace = THREE.SRGBColorSpace
      host.appendChild(renderer.domElement)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'

      const scene = new THREE.Scene()
      const pmrem = new THREE.PMREMGenerator(renderer)
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = envTex

      const camera = new THREE.PerspectiveCamera(30, 1, 1, 1000)
      camera.position.set(0, 0, 150)

      // Lights: a cool key from the upper left and a pink rim from behind
      const key = new THREE.DirectionalLight(0xffffff, 1.2)
      key.position.set(-60, 80, 100)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0xff7aa8, 1.6)
      rim.position.set(80, -20, -120)
      scene.add(rim)
      scene.add(new THREE.AmbientLight(0x8b84b0, 0.25))

      // Atoms, one instanced mesh per element
      const atoms = buildDNA()
      const group = new THREE.Group()
      const sphere = new THREE.IcosahedronGeometry(1, 3)
      // Backbone atoms full size, base atoms smaller so the grooves read clearly
      const radius: Record<El, number> = { C: 0.95, N: 0.9, O: 0.92, P: 1.3 }
      // Dystopian palette: gunmetal and graphite, a hint of pink on phosphates
      const mat = (color: number, metal: number) =>
        new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: metal, clearcoat: 0.9, clearcoatRoughness: 0.22 })
      const mats: Record<El, InstanceType<typeof THREE.MeshPhysicalMaterial>> = {
        C: mat(0x4a4852, 0.55),
        N: mat(0x403d5c, 0.5),
        O: mat(0x3a3640, 0.6),
        P: mat(0x7a4a5c, 0.65),
      }
      const m = new THREE.Matrix4()
      for (const el of ['C', 'N', 'O', 'P'] as El[]) {
        const list = atoms.filter((a) => a.el === el)
        const mesh = new THREE.InstancedMesh(sphere, mats[el], list.length)
        list.forEach((a, i) => {
          const inBase = Math.hypot(a.x, a.y) < 5.2 && el !== 'P'
          const r = radius[el] * (inBase ? 0.72 : 1)
          m.makeScale(r, r, r).setPosition(a.x, a.z, a.y) // helix axis along y
          mesh.setMatrixAt(i, m)
        })
        group.add(mesh)
      }

      // Lay the helix on a diagonal
      const pivot = new THREE.Group()
      pivot.add(group)
      pivot.rotation.z = -0.35
      pivot.rotation.x = 0.15
      scene.add(pivot)

      let w = 0
      let h = 0
      function resize() {
        w = host!.clientWidth
        h = host!.clientHeight
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        // Place the segment in the left part of the view
        const dist = camera.position.z
        const halfH = Math.tan((camera.fov * Math.PI) / 360) * dist
        const halfW = halfH * camera.aspect
        pivot.position.x = -halfW * 0.56
        // Scale so the segment is ~70% of the viewport height
        const s = (halfH * 2 * 0.62) / (BP * RISE)
        pivot.scale.setScalar(s)
      }
      resize()

      let raf = 0
      let t = 0
      function render() {
        const scroll = reduceMotion ? 0 : window.scrollY
        group.rotation.y = t * 0.12 + scroll * 0.0022
        pivot.rotation.z = -0.35 + Math.sin(scroll * 0.0009) * 0.1
        pivot.position.y = Math.sin(t * 0.25) * 2.5
        renderer.render(scene, camera)
      }
      let last = performance.now()
      function frame(now: number) {
        raf = 0
        if (disposed || document.hidden) return
        t += Math.min(0.05, (now - last) / 1000)
        last = now
        render()
        raf = requestAnimationFrame(frame)
      }
      if (reduceMotion) render()
      else raf = requestAnimationFrame(frame)

      const onResize = () => {
        resize()
        render()
      }
      const onVisibility = () => {
        if (!document.hidden && !reduceMotion && !raf) {
          last = performance.now()
          raf = requestAnimationFrame(frame)
        }
      }
      window.addEventListener('resize', onResize)
      document.addEventListener('visibilitychange', onVisibility)

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        document.removeEventListener('visibilitychange', onVisibility)
        sphere.dispose()
        Object.values(mats).forEach((mt) => mt.dispose())
        envTex.dispose()
        pmrem.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    })()

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="dna-segment pointer-events-none fixed top-0 left-0 -z-10 hidden h-screen w-[50vw] md:block"
    />
  )
}
