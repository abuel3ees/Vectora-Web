import { AnimatePresence, motion } from 'framer-motion'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import {
  Brain, Camera, CheckCircle2, ChevronRight,
  Cpu, Globe2, Layers, MapPin, MessageSquare,
  Navigation, Network, Package, PenLine, Send,
  Smartphone, Wifi, Zap, Server, Atom,
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import Map, { Layer, Source } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import QAOAVisualization from '@/components/qaoa-visualization'

/* ─────────────────────────────────────────── types */
interface Props { mapboxToken?: string | null }

const TOTAL = 30

/* ─────────────────────────────────────────── seeded rng */
function seeded(s: number) {
  let n = s

  return () => {
    n = (n * 16807) % 2147483647

    return (n - 1) / 2147483646
  }
}

/* ─────────────────────────────────────────── artur nogueira geo */
const DEPOT_LON = -47.172, DEPOT_LAT = -22.570

/* ─────────────────────────────────────────── cached solve result type */
type CachedRoute = {
  route_index: number
  color: string
  node_ids: number[]
  raw_distance: number | null
  geometry: { type: 'LineString'; coordinates: [number, number][] }
}

type CachedResult = {
  instance: string
  k: number
  algorithm: string
  summary: {
    num_routes: number
    total_distance: number
    distance_std: number
    weighted_fairness: number | null
  }
  nodes: { id: number; lat: number; lng: number; is_depot: boolean }[]
  routes: CachedRoute[]
  bbox: { south: number; north: number; east: number; west: number }
}

function resultToGeoJSON(result: CachedResult): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: result.routes.map((r) => ({
      type: 'Feature' as const,
      properties: { color: r.color },
      geometry: r.geometry,
    })),
  }
}

function nodesToGeoJSON(result: CachedResult): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: result.nodes
      .filter((n) => !n.is_depot)
      .map((n) => ({
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'Point' as const, coordinates: [n.lng, n.lat] as [number, number] },
      })),
  }
}

function loadCachedResults(): { tabu: CachedResult | null; qaoa: CachedResult | null } {
  let tabu: CachedResult | null = null
  let qaoa: CachedResult | null = null

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (!key?.startsWith('vrp:')) {
        continue
      }

      const raw = localStorage.getItem(key)

      if (!raw) {
        continue
      }

      const r = JSON.parse(raw) as CachedResult

      if (!tabu && r.algorithm.includes('tabu')) {
        tabu = r
      }

      if (!qaoa && r.algorithm.includes('qaoa')) {
        qaoa = r
      }

      if (tabu && qaoa) {
        break
      }
    }
  } catch { /* localStorage unavailable */ }

  return { tabu, qaoa }
}

/* ─────────────────────────────────────────── css injection */
function InjectStyles() {
  return (
    <style>{`
      @keyframes shimmer {
        from { background-position: -200% center; }
        to   { background-position:  200% center; }
      }
      @keyframes float-slow {
        0%,100% { transform: translateY(0px); }
        50%     { transform: translateY(-10px); }
      }
      @keyframes vx-radar {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes counter-up {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .anim-shimmer     { animation: shimmer 3.5s linear infinite; background-size: 200% auto; }
      .anim-float       { animation: float-slow 6s ease-in-out infinite; }
      .anim-radar       { animation: vx-radar 8s linear infinite; }
      .mapboxgl-map     { border-radius: 12px; }
      .mapboxgl-ctrl-logo { display: none !important; }
      .mapboxgl-ctrl-attrib { display: none !important; }
      * { cursor: none !important; }
    `}</style>
  )
}

/* ─────────────────────────────────────────── cursor */
function CursorDot() {
  const [pos, setPos] = useState({ x: -20, y: -20 })
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      setVisible(true)

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => setVisible(false), 3000)
    }

    window.addEventListener('mousemove', h)

    return () => {
      window.removeEventListener('mousemove', h)

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full transition-opacity duration-500"
      style={{
        width: 7,
        height: 7,
        background: 'var(--primary)',
        transform: `translate(${pos.x - 3.5}px, ${pos.y - 3.5}px)`,
        opacity: visible ? 1 : 0,
      }}
    />
  )
}

/* ─────────────────────────────────────────── root */
export default function Presentation({ mapboxToken }: Props) {
  const [cur, setCur] = useState(0)

  const go = useCallback((n: number) => {
    if (n < 0 || n >= TOTAL) {
      return
    }

    setCur(n)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        go(cur + 1)
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        go(cur - 1)
      }
    }

    window.addEventListener('keydown', h)

    return () => window.removeEventListener('keydown', h)
  }, [cur, go])

  const token = mapboxToken ?? ''

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground select-none font-sans">
      <InjectStyles />
      <CursorDot />
      <AnimatePresence mode="wait">
        <motion.div
          key={cur}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {cur === 0  && <S00Preshow />}
          {cur === 1  && <S01Title />}
          {cur === 2  && <SSection idx={0} />}
          {cur === 3  && <S02Explosion />}
          {cur === 4  && <S03Flaw />}
          {cur === 5  && <SSection idx={1} />}
          {cur === 6  && <S04Tunneling />}
          {cur === 7  && <S05QAOAMath />}
          {cur === 8  && <S06QUBO />}
          {cur === 9  && <S07NISQ />}
          {cur === 10 && <SSection idx={2} />}
          {cur === 11 && <S08Globe token={token} />}
          {cur === 12 && <S09Decomposition />}
          {cur === 13 && <SQAOAScene scene="raw" />}
          {cur === 14 && <SQAOAScene scene="clust" />}
          {cur === 15 && <SQAOAScene scene="leaf" />}
          {cur === 16 && <SQAOAScene scene="super" />}
          {cur === 17 && <SQAOAScene scene="sn_qaoa" />}
          {cur === 18 && <SQAOAScene scene="alloc" />}
          {cur === 19 && <SQAOAScene scene="final" />}
          {cur === 20 && <S11Architecture />}
          {cur === 21 && <SDispatchWorkflow />}
          {cur === 22 && <SDriverApp />}
          {cur === 23 && <SDeliveryProof />}
          {cur === 24 && <SSection idx={3} />}
          {cur === 25 && <S12Maps token={token} />}
          {cur === 26 && <S13Benchmark />}
          {cur === 27 && <S14Hardware />}
          {cur === 28 && <S15FutureWork />}
          {cur === 29 && <S16ThankYou />}
        </motion.div>
      </AnimatePresence>
      <Hud cur={cur} go={go} />
    </div>
  )
}

/* ─────────────────────────────────────────── hud */
const SLIDE_LABELS = [
  'Pre-Show', 'Title',
  '— The Problem —', 'Combinatorial Explosion', 'Classical Flaw',
  '— The Approach —', 'Quantum Tunneling', 'QAOA Mechanics', 'QUBO → Ising', 'NISQ Bottleneck',
  '— The System —', 'The Dataset', 'K-Means Decomposition',
  'QAOA · I · The Landscape', 'QAOA · II · The Partition', 'QAOA · III · Quantum Solve',
  'QAOA · IV · Aggregation', 'QAOA · V · Orchestration', 'QAOA · VI · Allotment', 'QAOA · VII · Finale',
  'System Architecture', 'Dispatch Workflow', 'Driver Mobile App', 'Proof of Delivery',
  '— The Results —', '200-Node Visual Proof', 'Benchmark Results', 'Hardware Validation', 'Future Work',
  'Thank You',
]

const SECTIONS = [
  { label: '',            start: 0,  end: 1  },
  { label: 'The Problem', start: 2,  end: 4  },
  { label: 'The Approach', start: 5,  end: 9  },
  { label: 'The System',  start: 10, end: 23 },
  { label: 'The Results', start: 24, end: 29 },
]

function getSectionFor(n: number) {
  return SECTIONS.find((s) => n >= s.start && n <= s.end)
}

function Hud({ cur, go }: { cur: number; go: (n: number) => void }) {
  const section = getSectionFor(cur)

  return (
    <>
      <div className="fixed top-5 left-8 z-50">
        {section?.label && (
          <div className="text-[9px] uppercase tracking-[0.18em] font-mono mb-0.5" style={{ color: 'var(--primary)', opacity: 0.75 }}>
            {section.label}
          </div>
        )}
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-sans">
          {SLIDE_LABELS[cur]}
        </div>
      </div>
      <div className="fixed top-5 right-8 text-xs font-mono tabular-nums text-muted-foreground z-50">
        {String(cur + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
      </div>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
        {SECTIONS.map((sec, si) => (
          <div key={si} className="flex items-center gap-1">
            {Array.from({ length: sec.end - sec.start + 1 }, (_, di) => {
              const idx = sec.start + di

              return (
                <button
                  key={idx}
                  onClick={() => go(idx)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: idx === cur ? 22 : 4,
                    height: 3,
                    background: idx === cur
                      ? 'var(--primary)'
                      : getSectionFor(idx) === section
                        ? 'rgba(255,255,255,0.35)'
                        : 'rgba(255,255,255,0.12)',
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="fixed bottom-4 right-8 text-[10px] font-mono text-muted-foreground z-50">← →</div>
    </>
  )
}

/* ─────────────────────────────────────────── shared primitives */
function Ey({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-sans uppercase tracking-[0.22em] text-primary mb-4">
      {children}
    </div>
  )
}

function H({ children, size = 'lg' }: { children: React.ReactNode; size?: 'xl' | 'lg' | 'sm' }) {
  const fs = {
    xl: 'clamp(3.5rem,10vw,8rem)',
    lg: 'clamp(2rem,5vw,4rem)',
    sm: 'clamp(1.4rem,3vw,2.2rem)',
  }[size]

  return (
    <h2
      className="font-serif italic font-light leading-[1.06] tracking-[-0.03em] text-foreground"
      style={{ fontSize: fs }}
    >
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base leading-relaxed text-muted-foreground mt-5 max-w-[54ch]">{children}</p>
}

function Hr() {
  return <div className="my-6 h-px w-10 bg-border" />
}

function Badge({ children, v = 'primary' }: { children: React.ReactNode; v?: 'primary' | 'muted' | 'destructive' }) {
  const col =
    v === 'primary' ? 'var(--primary)'
    : v === 'destructive' ? 'var(--destructive)'
    : 'var(--muted-foreground)'

  return (
    <span
      className="inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-widest rounded-sm font-sans"
      style={{
        background: `color-mix(in oklch, ${col} 15%, transparent)`,
        color: col,
        border: `1px solid color-mix(in oklch, ${col} 30%, transparent)`,
      }}
    >
      {children}
    </span>
  )
}

function Card({ children, className = '', glow, style }: {
  children: React.ReactNode
  className?: string
  glow?: boolean
  style?: React.CSSProperties
}) {
  const glowStyle: React.CSSProperties = glow
    ? { boxShadow: '0 0 0 1px oklch(0.72 0.18 35 / 0.3), 0 4px 40px oklch(0.72 0.18 35 / 0.12)' }
    : {}

  return (
    <div
      className={`bg-card text-foreground rounded-xl border border-border py-6 shadow-sm ${className}`}
      style={{ ...glowStyle, ...style }}
    >
      {children}
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center text-center px-10 max-w-5xl w-full">{children}</div>
}

function Split({ L, R }: { L: React.ReactNode; R: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-14 max-w-6xl w-full px-14 items-center">
      <div>{L}</div>
      <div>{R}</div>
    </div>
  )
}

/* ─────────────────────────────────────────── section dividers */
const SECTION_DATA = [
  {
    roman: 'I',
    title: 'The Problem',
    tagline: 'Classical routing optimises distance. It does not care who drives fourteen hours.',
    topics: ['Combinatorial Explosion', 'Distance-Only Metrics', 'The Fairness Deficit'],
  },
  {
    roman: 'II',
    title: 'The Approach',
    tagline: 'Quantum superposition evaluates exponentially many routes simultaneously.',
    topics: ['Quantum Tunneling', 'QAOA Variational Circuit', 'QUBO Formulation', 'NISQ Hardware Limits'],
  },
  {
    roman: 'III',
    title: 'The System',
    tagline: 'A real city. Real streets. A full-stack dispatch platform built around the solver.',
    topics: ['Artur Nogueira · São Paulo', 'Angular K-Means Partition', 'Recursive Execution Pipeline', 'Laravel + React + Flutter'],
  },
  {
    roman: 'IV',
    title: 'The Results',
    tagline: 'Seven algorithms. One city. IBM ibm_fez quantum hardware. The numbers speak.',
    topics: ['OSMnx Route Visualisation', 'Benchmark Table · Φ Metric', 'IBM ibm_fez Validation', 'Parameter Transferability'],
  },
] as const

function SSection({ idx }: { idx: number }) {
  const { roman, title, tagline, topics } = SECTION_DATA[idx]

  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* giant background numeral */}
      <div
        className="absolute font-serif italic pointer-events-none select-none"
        style={{
          fontSize: 'clamp(18rem, 38vw, 34rem)',
          lineHeight: 1,
          color: 'oklch(0.72 0.18 35 / 0.045)',
          top: '50%',
          left: '50%',
          transform: 'translate(-44%, -52%)',
          letterSpacing: '-0.06em',
        }}
      >
        {roman}
      </div>

      {/* horizontal rule top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-border opacity-40" />

      <div className="relative text-center max-w-[640px] px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] mb-5" style={{ color: 'var(--primary)' }}>
            Part {roman}
          </div>
          <h2
            className="font-serif italic font-light leading-none tracking-[-0.04em] text-foreground"
            style={{ fontSize: 'clamp(3.8rem, 8.5vw, 6.5rem)' }}
          >
            {title}
          </h2>
          <div className="h-px w-16 mx-auto my-7 bg-border" />
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[46ch] mx-auto">
            {tagline}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-2">
            {topics.map((topic) => (
              <span
                key={topic}
                className="text-[10px] font-mono uppercase tracking-wider border border-border text-muted-foreground px-3 py-1.5 rounded"
              >
                {topic}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* horizontal rule bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border opacity-40" />
    </div>
  )
}

/* ─────────────────────────────────────────── slide 0 — pre-show */
function S00Preshow() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[260, 420, 580, 760].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-border"
            style={{ width: r, height: r, opacity: 0.3 - i * 0.06 }}
          />
        ))}
        <div className="absolute w-[600px] h-[600px] rounded-full overflow-hidden opacity-[0.15]">
          <div
            className="absolute inset-0 anim-radar"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, oklch(0.72 0.18 35 / 0.8) 55deg, transparent 55deg)',
            }}
          />
        </div>
      </div>
      <div className="relative text-center">
        <div className="mb-6 flex justify-center gap-3">
          <Badge v="primary">Ready</Badge>
          <Badge v="muted">Vectora · VRPFR</Badge>
        </div>
        <div
          className="anim-shimmer anim-float font-serif italic font-light"
          style={{
            fontSize: 'clamp(2.6rem,7vw,5.5rem)',
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--foreground) 45%, var(--primary) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Vectora: Quantum Logistics
        </div>
        <div className="mt-10 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          Press → or Space to begin
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 1 — title */
function S01Title() {
  return (
    <Center>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05 }}
      >
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <Badge>Computer Engineering</Badge>
          <Badge v="muted">Thesis Defense · 2026</Badge>
        </div>
        <h1
          className="font-serif italic font-light leading-[1.06] tracking-[-0.04em] text-foreground mb-8"
          style={{ fontSize: 'clamp(1.8rem,3.8vw,3.2rem)' }}
        >
          Design and Implementation of Optimal<br />
          Delivery Routes Using{' '}
          <span style={{ color: 'var(--primary)' }}>Quantum Optimization</span>
          <br />Algorithms
        </h1>
        <div className="h-px w-28 mx-auto bg-border my-8" />
        <div className="font-sans text-muted-foreground text-sm">
          Leen Almousa &nbsp;·&nbsp; Abdulrahman Al-Essa &nbsp;·&nbsp; Malak Alshawish
        </div>
        <div className="mt-2 font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Artur Nogueira Benchmark · IBM Quantum · React + Laravel + Flutter
        </div>
      </motion.div>
    </Center>
  )
}

/* ─────────────────────────────────────────── slide 2 — explosion */
function ExpCounter() {
  const [exp, setExp] = useState(0)

  useEffect(() => {
    const dur = 2400
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      setExp(Math.floor((1 - Math.pow(1 - p, 3)) * 165))

      if (p < 1) {
requestAnimationFrame(tick)
}
    }
    const id = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="text-center my-4">
      <span className="font-serif italic font-light text-foreground" style={{ fontSize: 'clamp(4rem,11vw,8rem)', lineHeight: 1 }}>
        10
      </span>
      <sup
        className="font-mono tabular-nums"
        style={{ fontSize: 'clamp(2rem,5vw,4rem)', color: 'var(--primary)', verticalAlign: 'super' }}
      >
        {exp}
      </sup>
    </div>
  )
}

function S02Explosion() {
  return (
    <Split
      L={
        <div>
          <Ey>NP-Hard Combinatorics</Ey>
          <H size="lg">The Vehicle Routing Problem.</H>
          <Hr />
          <ExpCounter />
          <div className="text-xs font-mono text-muted-foreground mb-4">possible assignments · 10 vehicles · 100 customers</div>
          <P>
            Exact classical solvers exhaust time and memory before approaching real-world scale.
            Heuristics sacrifice accuracy for speed. Neither is acceptable for safety-critical logistics.
          </P>
        </div>
      }
      R={
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Zap size={18} />, label: '10¹⁵ ops/sec', sub: 'fastest classical computer' },
            { icon: <Brain size={18} />, label: '10¹⁵⁰ years', sub: 'brute-force · 200 nodes' },
            { icon: <Network size={18} />, label: 'NP-Hard', sub: 'no polynomial algorithm known' },
            { icon: <Cpu size={18} />, label: 'Heuristics', sub: 'fast — but sacrifice optimality' },
          ].map(({ icon, label, sub }) => (
            <Card key={label} className="px-4 py-5">
              <div style={{ color: 'var(--primary)' }} className="mb-2">{icon}</div>
              <div className="text-sm font-medium text-foreground">{label}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>
            </Card>
          ))}
        </div>
      }
    />
  )
}

/* ─────────────────────────────────────────── slide 3 — classical flaw */
function S03Flaw() {
  return (
    <div className="grid grid-cols-2 gap-0 max-w-6xl w-full min-h-[72vh]">
      <motion.div
        className="flex flex-col justify-center px-14 border-r border-border"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55 }}
      >
        <Badge v="muted">Classical Approach</Badge>
        <div className="mt-5 text-2xl font-light text-foreground">Pure Distance Optimisation</div>
        <div className="mt-6 px-5 py-4 bg-card border border-border rounded-xl font-mono text-lg">
          min <span style={{ color: 'var(--chart-3)' }}>Σ d(i,j)</span>
        </div>
        <P>
          Minimises total kilometres driven. Ignores workload distribution across the fleet.
          One driver runs 14 hours; others clock out at noon.
          Gas saved, labour law violated.
        </P>
        <div className="mt-6 space-y-2.5">
          {['Driver overload undetected', 'Fleet systematically underutilised', 'No fairness invariant'].map((x) => (
            <div key={x} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span style={{ color: 'var(--destructive)' }}>✕</span> {x}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="flex flex-col justify-center px-14"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.12 }}
      >
        <Badge>Our Metric</Badge>
        <div className="mt-5 text-2xl font-light text-foreground">Cost + Fairness</div>
        <div
          className="mt-6 px-5 py-4 bg-card rounded-xl font-mono text-xl leading-relaxed"
          style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, transparent)' }}
        >
          <span style={{ color: 'var(--primary)' }}>Φ</span>
          {' = 0.5 · '}
          <span style={{ color: 'var(--chart-2)' }}>(D/k)</span>
          {' + 0.5 · '}
          <span style={{ color: 'var(--chart-4)' }}>σ</span>
        </div>
        <div className="mt-3 font-mono text-xs space-y-1 text-muted-foreground">
          <div><span style={{ color: 'var(--chart-2)' }}>D/k</span> → average route length per vehicle</div>
          <div><span style={{ color: 'var(--chart-4)' }}>σ</span> → standard deviation of workloads</div>
        </div>
        <div className="mt-6 space-y-2.5">
          {['Balanced driver workload enforced', 'Full fleet capacity utilised', 'Measurable, minimisable fairness'].map((x) => (
            <div key={x} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span style={{ color: 'var(--chart-2)' }}>✓</span> {x}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 4 — tunneling */
function S04Tunneling() {
  const landscape = 'M 0 80 C 12 80, 18 45, 28 58 C 38 72, 43 70, 48 74 C 53 78, 56 72, 62 55 C 68 37, 74 18, 80 16 C 86 14, 92 22, 100 20'

  return (
    <Split
      L={
        <div>
          <Ey>Why Quantum</Ey>
          <H size="lg">Tunnelling escapes the local trap.</H>
          <Hr />
          <P>
            Classical hill-descent gets permanently stuck in local minima. Quantum superposition evaluates
            the entire energy landscape simultaneously; interference amplifies paths toward the global minimum.
          </P>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { t: 'Superposition', d: 'All routes evaluated simultaneously' },
              { t: 'Entanglement', d: 'Constraints encoded as qubit correlations' },
              { t: 'Interference', d: 'Poor routes cancel; good routes reinforce' },
              { t: 'Tunnelling', d: 'Barrier penetration · no gradient required' },
            ].map(({ t, d }) => (
              <Card key={t} className="px-4 py-4">
                <div className="text-xs font-medium" style={{ color: 'var(--primary)' }}>{t}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{d}</div>
              </Card>
            ))}
          </div>
        </div>
      }
      R={
        <svg viewBox="0 0 100 100" className="w-full" style={{ maxHeight: 300 }}>
          <text x="3" y="14" fontSize="5" fill="var(--muted-foreground)" fontFamily="JetBrains Mono">E</text>
          <text x="50" y="98" fontSize="4.5" fill="var(--muted-foreground)" fontFamily="JetBrains Mono" textAnchor="middle">solution space</text>
          <path d={landscape} fill="none" stroke="var(--border)" strokeWidth="1.4" />
          <circle cx="28" cy="58" r="2.8" fill="var(--destructive)" />
          <text x="28" y="68" fontSize="4.5" fill="var(--destructive)" textAnchor="middle" fontFamily="JetBrains Mono">local min</text>
          <circle cx="80" cy="16" r="2.8" fill="var(--chart-2)" />
          <text x="80" y="11" fontSize="4.5" fill="var(--chart-2)" textAnchor="middle" fontFamily="JetBrains Mono">global min</text>
          <motion.circle
            cx="28" cy="58" r="3.5"
            fill="none" stroke="var(--muted-foreground)" strokeWidth="0.8"
            animate={{ cy: [58, 54, 58] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 28 58 Q 54 28 80 16"
            fill="none" stroke="var(--primary)" strokeWidth="1.2" strokeDasharray="3 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.3, ease: 'easeInOut' }}
          />
          <text x="53" y="33" fontSize="4.2" fill="var(--primary)" textAnchor="middle" fontFamily="JetBrains Mono">quantum</text>
          <text x="53" y="38" fontSize="4.2" fill="var(--primary)" textAnchor="middle" fontFamily="JetBrains Mono">tunnelling</text>
        </svg>
      }
    />
  )
}

/* ─────────────────────────────────────────── shared math equation canvas */
type MathHighlight = 'cost' | 'qubo' | 'nisq'

const MATH_COLORS_HEX: Record<string, string> = {
  cost:  '#e06c3a',
  mixer: '#818cf8',
  qubo:  '#facc15',
  nisq:  '#ef4444',
}

const MATH_EXPLANATIONS: Record<MathHighlight, { label: string; title: string; body: string }> = {
  cost: {
    label: 'QAOA Mechanics',
    title: 'Two Hamiltonians. One objective.',
    body: 'H_C encodes routing distances as Pauli-Z spin couplings — J_{ij} weights the edge cost, h_i the node bias. H_M drives quantum superposition across all candidate routes. COBYLA classically tunes γ and β until the quantum state collapses toward the minimum-cost solution.',
  },
  qubo: {
    label: 'Mathematical Mapping',
    title: 'Binary variables → Pauli-Z spins.',
    body: 'Quantum hardware evaluates Pauli-Z spins (−1, +1), not bits (0, 1). The substitution x = (1−Z)/2 bridges them. Off-diagonal Q entries become J_{ij} spin couplings; the diagonal becomes h_i biases. H is normalised by max|c| to prevent COBYLA divergence.',
  },
  nisq: {
    label: 'NISQ Hardware Constraint',
    title: 'The 29-qubit wall.',
    body: 'Simulating n qubits requires 2ⁿ × 16 B of statevector memory — exponential blowup. At 5 nodes we exhaust local RAM; at 29 we exceed ibm_fez. Our solution: decompose recursively until every sub-problem has ≤ 4 nodes (LEAF_SIZE = 4), then solve each independently on the QPU.',
  },
}

function tex(latex: string, color?: string): string {
  const expr = color ? `{\\color{${color}}{${latex}}}` : latex

  return katex.renderToString(expr, { throwOnError: false, output: 'html' })
}

function KTerm({
  latex,
  id,
  highlight,
  display = false,
  delay = 0.15,
}: {
  latex: string
  id: string
  highlight: MathHighlight
  display?: boolean
  delay?: number
}) {
  const isActive = id === highlight || (id === 'mixer' && highlight === 'cost')
  const color = MATH_COLORS_HEX[id] ?? '#ffffff'
  const html = tex(latex, isActive ? color : undefined)

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{
        opacity: isActive ? 1 : 0.14,
        scale: isActive ? 1.03 : 1,
        filter: isActive ? `drop-shadow(0 0 28px ${color}99)` : 'none',
      }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: display ? 'block' : 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function KDim({ latex, delay = 0.1 }: { latex: string; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.2 }}
      transition={{ duration: 0.6, delay }}
      style={{ display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: tex(latex) }}
    />
  )
}

function MathEquationSlide({ highlight }: { highlight: MathHighlight }) {
  const { label, title, body } = MATH_EXPLANATIONS[highlight]
  const accentColor = MATH_COLORS_HEX[highlight]

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 72px', gap: 0 }}>

      {/* Section badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.26em', color: accentColor, marginBottom: 32 }}
      >
        {label}
      </motion.div>

      {/* ── Row 1: state evolution — large display ── */}
      <div style={{ fontSize: '3.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3em', flexWrap: 'wrap', marginBottom: '0.2em' }}>
        <KDim latex="|\psi(\gamma,\beta)\rangle =" />
        <KTerm latex="e^{-i\beta H_M}" id="mixer" highlight={highlight} delay={0.2} />
        <KDim latex="\cdot" delay={0.12} />
        <KTerm latex="e^{-i\gamma H_C}" id="cost" highlight={highlight} delay={0.25} />
        <KDim latex="|{+}\rangle^{\otimes n}" delay={0.1} />
      </div>

      {/* where */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--muted-foreground)', margin: '0.55em 0 0.45em', letterSpacing: '0.06em' }}
      >
        where
      </motion.div>

      {/* ── Row 2: Hamiltonian definitions ── */}
      <div style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.8em', flexWrap: 'wrap', marginBottom: '0.4em' }}>
        <KTerm latex="H_C = \sum_{i,j} J_{ij}Z_i Z_j + \sum_i h_i Z_i" id="cost" highlight={highlight} delay={0.28} />
        <KDim latex="\quad" delay={0} />
        <KTerm latex="H_M = \sum_i X_i" id="mixer" highlight={highlight} delay={0.32} />
      </div>

      {/* ── Row 3: QUBO substitution + NISQ bound ── */}
      <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2em', flexWrap: 'wrap' }}>
        <KTerm latex="x = \dfrac{1 - Z}{2}" id="qubo" highlight={highlight} delay={0.35} />
        <KDim latex="\quad" delay={0} />
        <KTerm latex="|P| \leq 4 \text{ nodes}" id="nisq" highlight={highlight} delay={0.38} />
      </div>

      {/* ── Explanation callout ── */}
      <motion.div
        key={highlight}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          marginTop: 38,
          maxWidth: 680,
          width: '100%',
          textAlign: 'center',
          padding: '22px 32px',
          borderRadius: 14,
          background: `color-mix(in oklch, ${accentColor} 8%, transparent)`,
          border: `1px solid color-mix(in oklch, ${accentColor} 26%, transparent)`,
        }}
      >
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: accentColor, marginBottom: 10 }}>
          {title}
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.75 }}>
          {body}
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 5 — qaoa math */
function S05QAOAMath() {
 return <MathEquationSlide highlight="cost" /> 
}

/* ─────────────────────────────────────────── slide 6 — qubo */
function S06QUBO() {
 return <MathEquationSlide highlight="qubo" /> 
}

/* ─────────────────────────────────────────── slide 7 — nisq */
function S07NISQ() {
 return <MathEquationSlide highlight="nisq" /> 
}

/* ─────────────────────────────────────────── slide 8 — dataset */
const RC_LON = -47.5601
const RC_LAT = -22.4106

const RC_GEOJSON_S8: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Point', coordinates: [RC_LON, RC_LAT] },
}

function S08Globe({ token }: { token: string }) {
  return (
    <Split
      L={
        <div>
          <Ey>Rio Claro · São Paulo · Brazil</Ey>
          <H size="lg">Real streets, not toy graphs.</H>
          <Hr />
          <P>
            All benchmarks use actual street geometry from Rio Claro municipality,
            extracted from OpenStreetMap and snapped to the road network via OSMnx.
            Delivery nodes are sampled from real postal address clusters.
          </P>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { k: 'Coordinates', v: '22.41°S · 47.56°W' },
              { k: 'Source', v: 'OSM + OSMnx road snap' },
              { k: 'Scales tested', v: '50 / 100 / 200 nodes' },
              { k: 'Fleet sizes', v: '6 → 30 → 45 vehicles' },
            ].map(({ k, v }) => (
              <div key={k} className="bg-card border border-border rounded-lg px-4 py-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{k}</div>
                <div className="text-sm font-mono" style={{ color: 'var(--primary)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      }
      R={
        <div
          className="relative rounded-xl overflow-hidden w-full"
          style={{ height: 380, boxShadow: '0 0 0 1px var(--border)' }}
        >
          {token ? (
            <Map
              mapboxAccessToken={token}
              initialViewState={{ longitude: RC_LON, latitude: RC_LAT, zoom: 13 }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              attributionControl={false}
              interactive={false}
              style={{ width: '100%', height: '100%' }}
            >
              <Source id="depot-s8" type="geojson" data={RC_GEOJSON_S8}>
                <Layer
                  id="depot-s8-glow"
                  type="circle"
                  paint={{ 'circle-radius': 28, 'circle-color': 'oklch(0.72 0.18 35)', 'circle-opacity': 0.18, 'circle-blur': 1 }}
                />
                <Layer
                  id="depot-s8-ring"
                  type="circle"
                  paint={{ 'circle-radius': 14, 'circle-color': 'oklch(0.72 0.18 35)', 'circle-opacity': 0.12, 'circle-stroke-width': 1.5, 'circle-stroke-color': 'oklch(0.72 0.18 35)', 'circle-stroke-opacity': 0.5 }}
                />
                <Layer
                  id="depot-s8-dot"
                  type="circle"
                  paint={{ 'circle-radius': 6, 'circle-color': 'oklch(0.72 0.18 35)', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff', 'circle-opacity': 1 }}
                />
              </Source>
            </Map>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card text-muted-foreground text-sm">
              Map requires Mapbox token
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 50px oklch(0.13 0.02 250 / 0.7)' }} />
          <div className="absolute bottom-3 left-3 z-10">
            <span className="font-mono text-[10px] px-2 py-1 rounded bg-background/70 backdrop-blur-sm text-muted-foreground">
              22.4106°S · 47.5601°W · Rio Claro
            </span>
          </div>
        </div>
      }
    />
  )
}

/* ─────────────────────────────────────────── slide 9 — decomposition */
const rng50s = seeded(13)
const SCATTER50 = Array.from({ length: 50 }, () => ({
  x: 18 + rng50s() * 364,
  y: 14 + rng50s() * 272,
}))

const CLUSTER_CENTERS_SVG = [
  { x: 90, y: 90 }, { x: 200, y: 75 }, { x: 320, y: 90 },
  { x: 80, y: 210 }, { x: 205, y: 220 }, { x: 325, y: 205 },
]

const CLUSTER_COLOR_VARS = [
  'oklch(0.72 0.18 35)', 'oklch(0.65 0.15 200)', 'oklch(0.75 0.12 80)',
  'oklch(0.60 0.20 320)', 'oklch(0.55 0.18 180)', 'oklch(0.72 0.18 35)',
]

const ASSIGNED50 = SCATTER50.map((p) => {
  let best = 0, bestD = Infinity

  CLUSTER_CENTERS_SVG.forEach(({ x, y }, i) => {
    const d = Math.hypot(p.x - x, p.y - y)

    if (d < bestD) {
      bestD = d
      best = i
    }
  })

  return best
})

const rngCp = seeded(31)

const CLUSTER_POS50 = SCATTER50.map((_, i) => {
  const c = CLUSTER_CENTERS_SVG[ASSIGNED50[i]]

  return { x: c.x + (rngCp() - 0.5) * 55, y: c.y + (rngCp() - 0.5) * 42 }
})

function S09Decomposition() {
  const [phase, setPhase] = useState<'scatter' | 'cluster'>('scatter')

  useEffect(() => {
    const t = setTimeout(() => setPhase('cluster'), 1400)

    return () => clearTimeout(t)
  }, [])

  return (
    <Split
      L={
        <div>
          <Ey>Angular-Sweep K-Means</Ey>
          <H size="lg">Scatter. Partition. Solve.</H>
          <Hr />
          <P>
            200 nodes are partitioned into √n geographic clusters. Each sub-problem is guaranteed
            ≤ 5 nodes — perfectly fitting our 29-qubit hardware limit. No qubit overhead, no noise amplification.
          </P>
          <div className="mt-8 space-y-3">
            {CLUSTER_CENTERS_SVG.slice(0, 5).map((_, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: CLUSTER_COLOR_VARS[i] }} />
                Cluster {i + 1} — leaf QAOA sub-problem
              </div>
            ))}
          </div>
        </div>
      }
      R={
        <svg viewBox="0 0 400 300" className="w-full max-w-sm mx-auto" style={{ aspectRatio: '4/3' }}>
          {SCATTER50.map((p, i) => (
            <motion.circle
              key={i}
              r={phase === 'cluster' ? 4 : 3.5}
              animate={{
                x: phase === 'cluster' ? CLUSTER_POS50[i].x - p.x : 0,
                y: phase === 'cluster' ? CLUSTER_POS50[i].y - p.y : 0,
                fill: phase === 'cluster' ? CLUSTER_COLOR_VARS[ASSIGNED50[i]] : 'var(--muted-foreground)',
              } as { x: number; y: number; fill: string }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, delay: i * 0.012 }}
              cx={p.x}
              cy={p.y}
              fill={phase === 'cluster' ? CLUSTER_COLOR_VARS[ASSIGNED50[i]] : 'var(--muted-foreground)'}
            />
          ))}
          {phase === 'cluster' && CLUSTER_CENTERS_SVG.map(({ x, y }, i) => (
            <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
              <circle cx={x} cy={y} r="10" fill={CLUSTER_COLOR_VARS[i]} opacity="0.15" />
              <circle cx={x} cy={y} r="5" fill={CLUSTER_COLOR_VARS[i]} opacity="0.7" />
            </motion.g>
          ))}
        </svg>
      }
    />
  )
}

/* ─────────────────────────────────────────── slides 13-19 — QAOA algorithm acts */
function SQAOAScene({ scene }: { scene: string }) {
  return <div className="absolute inset-0"><QAOAVisualization forcedTab={scene} /></div>
}

/* ─────────────────────────────────────────── slide 21 — dispatch workflow */
function SDispatchWorkflow() {
  const steps = [
    { n: '01', icon: <Atom size={20} />, label: 'Quantum Solve', sub: 'QAOA decomposes and optimises the full instance end-to-end', c: 'var(--chart-3)' },
    { n: '02', icon: <Globe2 size={20} />, label: 'Review Routes', sub: 'Dispatcher inspects the Φ-optimised plan on the live map', c: 'var(--primary)' },
    { n: '03', icon: <Send size={20} />, label: 'Dispatch', sub: 'One click — one DriverAssignment row per vehicle created', c: 'var(--chart-2)' },
    { n: '04', icon: <Smartphone size={20} />, label: 'Driver Receives', sub: 'Flutter app polls; route appears within seconds of dispatch', c: 'var(--chart-4)' },
  ]

  return (
    <Center>
      <Ey>End-to-End Dispatch</Ey>
      <H size="lg">One Click. Seven Assignments.</H>
      <Hr />
      <div className="mt-6 flex items-stretch gap-0 w-full max-w-4xl">
        {steps.map(({ n, icon, label, sub, c }, i) => (
          <React.Fragment key={n}>
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="px-5 py-6 h-full text-center" style={{ borderColor: `color-mix(in oklch, ${c} 25%, var(--border))` }}>
                <div className="text-[10px] font-mono text-muted-foreground mb-3">{n}</div>
                <div style={{ color: c }} className="flex justify-center mb-3">{icon}</div>
                <div className="text-sm font-medium text-foreground mb-2">{label}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">{sub}</div>
              </Card>
            </motion.div>
            {i < steps.length - 1 && (
              <div className="flex items-center px-1 shrink-0">
                <ChevronRight size={16} className="text-border" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-6 text-xs text-muted-foreground font-mono max-w-2xl text-center leading-relaxed">
        <code style={{ color: 'var(--primary)' }}>POST /optimize/dispatch</code>
        {' '}creates one{' '}
        <code style={{ color: 'var(--chart-2)' }}>DriverAssignment</code>
        {' '}row per vehicle — instantly accessible via Sanctum token on the Flutter app.
      </div>
    </Center>
  )
}

/* ─────────────────────────────────────────── slide 22 — driver mobile app */
function DriverPhoneMockup() {
  const accent = 'oklch(0.72 0.18 35)'

  return (
    <div
      className="relative mx-auto"
      style={{
        width: 228,
        height: 456,
        borderRadius: 36,
        background: 'oklch(0.10 0.025 250)',
        border: '2px solid oklch(0.22 0.025 250)',
        boxShadow: `0 0 0 1px oklch(0.30 0.03 250 / 0.4), 0 24px 72px rgba(0,0,0,0.55), 0 0 60px ${accent}28`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* status bar */}
      <div style={{ height: 30, background: 'oklch(0.08 0.02 250)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: 'oklch(0.55 0 0)', fontFamily: 'JetBrains Mono, monospace' }}>9:41</span>
        <div style={{ width: 52, height: 7, borderRadius: 8, background: 'oklch(0.13 0.02 250)' }} />
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
          {[5, 7, 9].map((h, i) => <div key={i} style={{ width: 3, height: h, background: 'oklch(0.55 0 0)', borderRadius: 1 }} />)}
        </div>
      </div>

      {/* app bar */}
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid oklch(0.16 0.025 250)', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'oklch(0.90 0 0)', fontFamily: 'sans-serif' }}>My Routes</span>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>A</span>
        </div>
      </div>

      {/* active chip */}
      <div style={{ padding: '8px 14px 4px', flexShrink: 0 }}>
        <span style={{ fontSize: 8, padding: '2px 8px', borderRadius: 4, background: `${accent}22`, color: accent, border: `1px solid ${accent}44`, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Active · 1 route
        </span>
      </div>

      {/* route card */}
      <div style={{ margin: '4px 10px', padding: '10px', background: 'oklch(0.14 0.025 250)', borderRadius: 12, border: `1px solid ${accent}33`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.88 0 0)', fontFamily: 'sans-serif' }}>Route #7</span>
          <span style={{ fontSize: 8, color: accent, fontFamily: 'monospace' }}>3 / 8 done</span>
        </div>
        <div style={{ fontSize: 9, color: 'oklch(0.50 0 0)', marginBottom: 8, fontFamily: 'sans-serif' }}>Artur Nogueira · 24.3 km</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < 3 ? accent : 'oklch(0.20 0.025 250)' }} />
          ))}
        </div>
      </div>

      {/* map area */}
      <div style={{ flex: 1, margin: '6px 10px', borderRadius: 10, overflow: 'hidden', background: 'oklch(0.12 0.035 230)', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 208 118" preserveAspectRatio="xMidYMid slice">
          {[20, 40, 60, 80, 100].map(y => <line key={`h${y}`} x1="0" y1={y} x2="208" y2={y} stroke="oklch(0.17 0.035 230)" strokeWidth="0.5" />)}
          {[30, 60, 90, 120, 150, 180].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="118" stroke="oklch(0.17 0.035 230)" strokeWidth="0.5" />)}
          <polyline points="20,95 50,70 80,82" fill="none" stroke={`${accent}55`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="80,82 105,52 130,65 155,38 175,55 193,42" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
          {([[20, 95], [50, 70], [80, 82]] as [number, number][]).map(([cx, cy], i) => (
            <circle key={`c${i}`} cx={cx} cy={cy} r={3.5} fill={`${accent}80`} stroke={accent} strokeWidth="1" />
          ))}
          <circle cx="105" cy="52" r="6.5" fill={accent} stroke="#fff" strokeWidth="1.5" opacity="0.95" />
          <text x="105" y="53" textAnchor="middle" dominantBaseline="middle" fontSize="6" fill="#fff" fontWeight="800">4</text>
          {([[130, 65], [155, 38], [175, 55], [193, 42]] as [number, number][]).map(([cx, cy], i) => (
            <circle key={`r${i}`} cx={cx} cy={cy} r={3} fill="oklch(0.22 0.03 250)" stroke="oklch(0.38 0 0)" strokeWidth="0.8" />
          ))}
          <circle cx="20" cy="95" r="5" fill="oklch(0.09 0.02 250)" stroke="#facc15" strokeWidth="1.5" />
          <text x="20" y="96" textAnchor="middle" dominantBaseline="middle" fontSize="5" fill="#facc15" fontWeight="800">D</text>
          <circle cx="80" cy="82" r="9" fill={`${accent}18`} stroke={accent} strokeWidth="0.8" strokeDasharray="3 2" />
        </svg>
      </div>

      {/* navigate button */}
      <div style={{ padding: '6px 10px', flexShrink: 0 }}>
        <div style={{ background: accent, borderRadius: 10, padding: '9px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>
          Navigate to Stop 4
        </div>
      </div>

      {/* bottom nav */}
      <div style={{ height: 42, borderTop: '1px solid oklch(0.16 0.025 250)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 6, flexShrink: 0 }}>
        {[['⊙', true], ['☰', false], ['◉', false], ['▣', false]].map(([icon, active], i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 13, color: active ? accent : 'oklch(0.38 0 0)' }}>{icon as string}</span>
            <div style={{ width: 3, height: 3, borderRadius: 1.5, background: active ? accent : 'transparent' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SDriverApp() {
  return (
    <Split
      L={
        <div>
          <Ey>Flutter · Sanctum Token Auth</Ey>
          <H size="lg">The route, in the driver's hand.</H>
          <Hr />
          <P>
            Assignments flow from the dispatcher to the Flutter app the moment dispatch is clicked.
            The driver sees their ordered stops, navigates in sequence, and logs every delivery in the field.
          </P>
          <div className="mt-8 space-y-4">
            {[
              { icon: <Navigation size={15} />, t: 'Live navigation', d: 'OSMnx stop order · GPS-locked turn-by-turn' },
              { icon: <Wifi size={15} />, t: 'GPS heartbeat', d: 'Location logged every 30 s via /api/driver/location' },
              { icon: <Package size={15} />, t: 'Stop lifecycle', d: 'Pending → In Transit → Delivered' },
              { icon: <MessageSquare size={15} />, t: 'Dispatcher messages', d: 'Real-time in-app channel per assignment' },
            ].map(({ icon, t, d }) => (
              <div key={t} className="flex items-start gap-3">
                <span style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div className="text-sm font-medium text-foreground">{t}</div>
                  <div className="text-[11px] text-muted-foreground">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      R={
        <div className="flex justify-center">
          <DriverPhoneMockup />
        </div>
      }
    />
  )
}

/* ─────────────────────────────────────────── slide 23 — proof of delivery */
function SDeliveryProof() {
  const steps = [
    { n: '01', icon: <MapPin size={20} />, label: 'Arrive at Stop', sub: 'GPS locks within 50 m — stop unlocks on the driver\'s screen', c: 'var(--chart-3)' },
    { n: '02', icon: <Camera size={20} />, label: 'Capture Photo', sub: 'Required photo of the delivered package stored to /storage/', c: 'var(--primary)' },
    { n: '03', icon: <PenLine size={20} />, label: 'Collect Signature', sub: 'Customer signs directly on the driver\'s device', c: 'var(--chart-4)' },
    { n: '04', icon: <CheckCircle2 size={20} />, label: 'Mark Complete', sub: 'Stop closes and syncs to the dispatcher view in real time', c: 'var(--chart-2)' },
  ]

  return (
    <Center>
      <Ey>Proof of Delivery</Ey>
      <H size="lg">Every delivery, verified and logged.</H>
      <Hr />
      <div className="mt-6 grid grid-cols-4 gap-4 w-full max-w-4xl">
        {steps.map(({ n, icon, label, sub, c }, i) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className="px-4 py-6 text-center h-full" style={{ borderColor: `color-mix(in oklch, ${c} 25%, var(--border))` }}>
              <div className="text-[10px] font-mono text-muted-foreground mb-3">{n}</div>
              <div style={{ color: c }} className="flex justify-center mb-3">{icon}</div>
              <div className="text-sm font-medium text-foreground mb-2">{label}</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">{sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground max-w-3xl">
        <Server size={14} className="shrink-0" style={{ color: 'var(--primary)' }} />
        <span>
          Photos and signatures are stored at{' '}
          <code className="font-mono text-foreground">storage/app/public/delivery-photos/</code>
          {' '}and served via <code className="font-mono text-foreground">/storage/</code>.
          Dispatchers review all proofs in real time at{' '}
          <code className="font-mono text-foreground">/delivery-proofs</code>.
        </span>
      </div>
    </Center>
  )
}

/* ─────────────────────────────────────────── slide 20 — architecture */
const STACK = [
  {
    icon: <Atom size={22} />,
    label: 'Python / Qiskit',
    role: 'Quantum Core',
    detail: 'QAOA · QUBO · Aer simulator · ibm_fez execution · 900s+ async jobs',
    c: 'var(--chart-3)',
  },
  {
    icon: <Server size={22} />,
    label: 'Laravel 13',
    role: 'Queue Orchestrator',
    detail: 'nohup worker · Sanctum · Fortify · Spatie RBAC · Inertia bridge',
    c: 'var(--primary)',
  },
  {
    icon: <Globe2 size={22} />,
    label: 'React 19 + Inertia',
    role: 'Dispatcher SPA',
    detail: 'Mapbox route viz · Recharts analytics · Framer Motion · WebAuthn',
    c: 'var(--chart-2)',
  },
  {
    icon: <Smartphone size={22} />,
    label: 'Flutter Mobile',
    role: 'Driver Edge Node',
    detail: 'Sanctum tokens · GPS heartbeat · Proof-of-delivery · Offline cache',
    c: 'var(--chart-4)',
  },
]

function S11Architecture() {
  return (
    <Center>
      <Ey>Full-Stack Ecosystem</Ey>
      <H>Four layers. One dispatch.</H>
      <Hr />
      <div className="mt-4 grid grid-cols-4 gap-4 w-full max-w-5xl">
        {STACK.map(({ icon, label, role, detail, c }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card
              className="px-5 py-6 text-center h-full"
              style={{ borderColor: `color-mix(in oklch, ${c} 30%, var(--border))` }}
            >
              <div className="flex justify-center mb-4" style={{ color: c }}>{icon}</div>
              <div className="text-sm font-medium text-foreground">{label}</div>
              <div className="mt-1 text-xs" style={{ color: c }}>{role}</div>
              <div className="mt-3 text-[10px] text-muted-foreground leading-relaxed">{detail}</div>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground max-w-3xl text-left">
        <Layers size={14} className="shrink-0" style={{ color: 'var(--primary)' }} />
        <span>
          Python workers are spawned via <code className="font-mono text-foreground">nohup python3 run_vrp.py</code>; results are polled
          via a filesystem sentinel (.out.json). Quantum jobs on IBM hardware exceed 900 seconds — handled fully asynchronously.
        </span>
      </div>
    </Center>
  )
}

/* ─────────────────────────────────────────── slide 12 — live mapbox */
const EMPTY_GEOJSON: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

const DEPOT_FEATURE: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Point', coordinates: [DEPOT_LON, DEPOT_LAT] },
}

const PANEL_META = {
  destructive: {
    insight: 'Routes cross city boundaries — one driver covers everything',
    statColor: 'oklch(0.577 0.245 27.325)',
  },
  primary: {
    insight: 'Each vehicle stays in its geographic cluster — balanced workload',
    statColor: 'oklch(0.72 0.18 35)',
  },
} as const

function MapPanel({
  geojson, nodeGeojson, badge, token, result,
}: {
  geojson: GeoJSON.FeatureCollection
  nodeGeojson: GeoJSON.FeatureCollection
  badge: 'destructive' | 'primary'
  token: string
  result: CachedResult | null
}) {
  const mapRef = useRef<MapRef>(null)
  const stopRef = useRef(false)
  const meta = PANEL_META[badge]

  useEffect(() => {
    stopRef.current = false

    return () => {
      stopRef.current = true
    }
  }, [])

  const handleLoad = useCallback(() => {
    if (!mapRef.current || !result) {
      return
    }

    stopRef.current = false

    const cx = (result.bbox.east + result.bbox.west) / 2
    const cy = (result.bbox.north + result.bbox.south) / 2

    // Phase 1: fly straight down from globe into the routes — no rotation, no tilt
    setTimeout(() => {
      if (stopRef.current || !mapRef.current) {
        return
      }

      mapRef.current.flyTo({
        center: [cx, cy],
        zoom: 13,
        bearing: 0,
        pitch: 0,
        duration: 4500,
        curve: 1,
        essential: true,
      })

      // Phase 2: gentle north-south drift + subtle zoom pulse once landed
      setTimeout(() => {
        let dir = 1

        const drift = () => {
          if (stopRef.current || !mapRef.current) {
            return
          }

          mapRef.current.easeTo({
            center: [cx, cy + dir * 0.005],
            zoom: 13 + dir * 0.12,
            duration: 8000,
          })
          dir *= -1
          setTimeout(() => {
            if (!stopRef.current) {
              drift()
            }
          }, 8500)
        }

        drift()
      }, 5000)
    }, 700)
  }, [result])

  const num = result?.summary.num_routes ?? '—'
  const sigma = result ? Math.round(result.summary.distance_std).toLocaleString() : '—'
  const phi = result?.summary.weighted_fairness
    ? Math.round(result.summary.weighted_fairness).toLocaleString()
    : '—'
  const dist = result ? Math.round(result.summary.total_distance / 1000).toLocaleString() + ' km' : '—'
  const label = badge === 'destructive' ? 'Tabu Search' : 'Recursive QAOA'

  return (
    <div className="flex-1 flex flex-col gap-2.5 min-h-0">
      {/* map canvas */}
      <div className="relative flex-1 rounded-xl overflow-hidden" style={{ minHeight: 260 }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={token}
          initialViewState={{ longitude: DEPOT_LON, latitude: DEPOT_LAT - 18, zoom: 2 }}
          attributionControl={false}
          onLoad={handleLoad}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          <Source id={`routes-${badge}`} type="geojson" data={geojson}>
            <Layer
              id={`glow-${badge}`}
              type="line"
              paint={{ 'line-color': ['get', 'color'], 'line-width': 10, 'line-opacity': 0.15, 'line-blur': 6 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id={`routes-line-${badge}`}
              type="line"
              paint={{ 'line-color': ['get', 'color'], 'line-width': 2, 'line-opacity': 0.92 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </Source>
          <Source id={`nodes-${badge}`} type="geojson" data={nodeGeojson}>
            <Layer
              id={`nodes-circle-${badge}`}
              type="circle"
              paint={{ 'circle-radius': 2, 'circle-color': '#ffffff', 'circle-opacity': 0.4 }}
            />
          </Source>
          <Source id={`depot-${badge}`} type="geojson" data={DEPOT_FEATURE}>
            <Layer
              id={`depot-glow-${badge}`}
              type="circle"
              paint={{ 'circle-radius': 16, 'circle-color': meta.statColor, 'circle-opacity': 0.2, 'circle-blur': 1 }}
            />
            <Layer
              id={`depot-dot-${badge}`}
              type="circle"
              paint={{ 'circle-radius': 6, 'circle-color': '#ffffff', 'circle-stroke-width': 2.5, 'circle-stroke-color': meta.statColor, 'circle-opacity': 1 }}
            />
          </Source>
        </Map>

        {/* top badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <Badge v={badge}>{label}</Badge>
          {result && (
            <span className="text-[10px] font-mono text-muted-foreground bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded">
              {num} vehicles
            </span>
          )}
        </div>

        {/* insight callout bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3">
          <div
            className="text-[10px] font-sans leading-snug px-3 py-2 rounded-lg backdrop-blur-sm"
            style={{
              background: `color-mix(in oklch, ${meta.statColor} 12%, oklch(0.13 0.02 250 / 0.75))`,
              border: `1px solid color-mix(in oklch, ${meta.statColor} 30%, transparent)`,
              color: meta.statColor,
            }}
          >
            {meta.insight}
          </div>
        </div>

        {/* vignette */}
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 36px oklch(0.13 0.02 250 / 0.45)' }} />
      </div>

      {/* stats row */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        {[
          { k: 'Routes', v: String(num) },
          { k: 'Dist (total)', v: dist },
          { k: 'Std Dev σ', v: sigma },
          { k: 'Φ score', v: phi },
        ].map(({ k, v }) => (
          <div key={k} className="bg-card border border-border rounded-lg px-2.5 py-2 text-center">
            <div className="font-mono text-sm tabular-nums" style={{ color: meta.statColor }}>{v}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{k}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function S12Maps({ token }: { token: string }) {
  const [{ tabu, qaoa }] = useState(() => loadCachedResults())

  if (!token) {
    return (
      <Center>
        <Ey>Visual Proof</Ey>
        <H size="sm">Mapbox token not provided.</H>
        <P>Pass <code className="font-mono">mapboxToken</code> from the Laravel controller to enable this slide.</P>
      </Center>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col px-8 py-5">
      <div className="mb-4 shrink-0">
        <Ey>Same Instance · Same Distance Matrix · OSMnx Street-Routed</Ey>
        <H size="sm">Same city. Radically different fairness.</H>
      </div>
      <div className="flex-1 flex gap-5 min-h-0">
        <MapPanel
          token={token}
          geojson={tabu ? resultToGeoJSON(tabu) : EMPTY_GEOJSON}
          nodeGeojson={tabu ? nodesToGeoJSON(tabu) : EMPTY_GEOJSON}
          result={tabu}
          badge="destructive"
        />
        <MapPanel
          token={token}
          geojson={qaoa ? resultToGeoJSON(qaoa) : EMPTY_GEOJSON}
          nodeGeojson={qaoa ? nodesToGeoJSON(qaoa) : EMPTY_GEOJSON}
          result={qaoa}
          badge="primary"
        />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 13 — benchmark */
function fmt(n: number) {
  return n.toLocaleString('en-US')
}

type BRow = { algo: string; short: string; k: number; dist: number; sd: number; phi: number; gap: number; win?: boolean }

const BENCH: Record<string, BRow[]> = {
  '50': [
    { algo: 'Recursive QAOA + 2-opt',      short: 'QAOA + 2-opt',    k: 15, dist:  87_140, sd:  2_954, phi:  4_382, gap:   0.0,  win: true },
    { algo: 'Recursive QAOA (No 2-opt)',   short: 'QAOA',            k: 15, dist:  87_359, sd:  2_957, phi:  4_391, gap:   0.2 },
    { algo: 'Sweep + 2-opt',               short: 'Sweep + 2-opt',   k: 15, dist: 102_780, sd:  2_337, phi:  4_595, gap:   4.9 },
    { algo: 'Genetic Algorithm',           short: 'Genetic',         k: 15, dist: 103_784, sd:  2_291, phi:  4_605, gap:   5.1 },
    { algo: 'Tabu Search',                 short: 'Tabu Search',     k: 15, dist:  67_819, sd:  5_051, phi:  4_786, gap:   9.2 },
    { algo: 'Sweep',                       short: 'Sweep',           k: 15, dist: 111_370, sd:  2_741, phi:  5_083, gap:  16.0 },
    { algo: 'Clarke-Wright Par. + 2-opt',  short: 'CW-Par + 2-opt', k: 15, dist:  60_508, sd:  6_194, phi:  5_114, gap:  16.7 },
    { algo: 'OR-Tools (Savings + GLS)',    short: 'OR-Tools',        k: 15, dist:  60_412, sd:  6_328, phi:  5_178, gap:  18.2 },
    { algo: 'Clarke-Wright Parallel',      short: 'CW-Par',          k: 15, dist:  61_275, sd:  6_383, phi:  5_234, gap:  19.5 },
    { algo: 'Clarke-Wright Seq. + 2-opt',  short: 'CW-Seq + 2-opt', k:  9, dist:  72_661, sd:  3_118, phi:  5_596, gap:  27.7 },
    { algo: 'Insertion Heuristics + 2-opt',short: 'Insertion + 2-opt',k:15, dist: 156_770, sd:  2_059, phi:  6_255, gap:  42.8 },
    { algo: "Benchmark's Optimizer",       short: 'Prior Benchmark', k:  7, dist:  47_761, sd:  8_355, phi:  7_589, gap:  64.6 },
  ],
  '100': [
    { algo: 'Recursive QAOA + 2-opt',      short: 'QAOA + 2-opt',    k: 30, dist: 179_702, sd:  3_035, phi:  4_513, gap:   0.0,  win: true },
    { algo: 'Recursive QAOA (No 2-opt)',   short: 'QAOA',            k: 30, dist: 180_323, sd:  3_034, phi:  4_522, gap:   0.22 },
    { algo: 'Clarke-Wright Par. + Or-opt', short: 'CW-Par + Or-opt', k: 30, dist: 111_147, sd:  6_604, phi:  5_154, gap:  14.22 },
    { algo: 'Clarke-Wright Parallel',      short: 'CW-Par',          k: 30, dist: 111_259, sd:  6_623, phi:  5_166, gap:  14.47 },
    { algo: 'OR-Tools (Savings + GLS)',    short: 'OR-Tools',        k: 30, dist: 108_732, sd:  7_499, phi:  5_562, gap:  23.25 },
    { algo: 'Clarke-Wright Seq. + 2-opt',  short: 'CW-Seq + 2-opt', k: 14, dist: 129_147, sd:  2_089, phi:  5_657, gap:  25.36 },
    { algo: 'Iterated Local Search',       short: 'ILS',             k: 23, dist: 105_091, sd:  7_638, phi:  6_225, gap:  37.94 },
    { algo: 'Nearest-Neighbour + 2-opt',   short: 'NN + 2-opt',      k: 30, dist: 340_595, sd:  3_017, phi:  7_185, gap:  59.22 },
    { algo: 'Simulated Annealing',         short: 'Sim. Annealing',  k:  9, dist:  73_313, sd: 11_827, phi: 10_887, gap: 141.24 },
    { algo: 'Tabu Search',                 short: 'Tabu Search',     k:  5, dist:  68_016, sd: 12_724, phi: 12_163, gap: 169.52 },
  ],
  '200': [
    { algo: 'Recursive QAOA + 2-opt',      short: 'QAOA + 2-opt',    k: 30, dist: 224_555, sd:  3_899, phi:  5_692, gap:   0.0,  win: true },
    { algo: 'Recursive QAOA (No 2-opt)',   short: 'QAOA',            k: 30, dist: 230_951, sd:  4_010, phi:  5_854, gap:   2.84 },
    { algo: 'Clarke-Wright Seq. + 2-opt',  short: 'CW-Seq + 2-opt', k: 27, dist: 278_702, sd:  2_118, phi:  6_220, gap:   9.27 },
    { algo: 'OR-Tools (Savings + GLS)',    short: 'OR-Tools',        k: 30, dist: 130_159, sd:  9_088, phi:  6_714, gap:  17.94 },
    { algo: 'Clarke-Wright Par. + 2-opt',  short: 'CW-Par + 2-opt', k: 30, dist: 131_394, sd:  9_263, phi:  6_821, gap:  19.83 },
    { algo: 'Clarke-Wright Parallel',      short: 'CW-Par',          k: 30, dist: 134_214, sd:  9_713, phi:  7_093, gap:  24.61 },
    { algo: 'Iterated Local Search',       short: 'ILS',             k: 22, dist: 126_723, sd: 10_490, phi:  8_125, gap:  42.73 },
    { algo: 'Sweep',                       short: 'Sweep',           k: 30, dist: 551_830, sd:  4_047, phi: 11_221, gap:  97.11 },
    { algo: 'Simulated Annealing',         short: 'Sim. Annealing',  k:  8, dist: 103_332, sd: 16_303, phi: 14_610, gap: 156.66 },
    { algo: 'Tabu Search',                 short: 'Tabu Search',     k:  6, dist:  97_512, sd: 17_664, phi: 16_958, gap: 197.91 },
  ],
  '1000': [
    { algo: 'Recursive QAOA + 2-opt',      short: 'QAOA + 2-opt',    k: 45, dist: 387_653, sd:  4_268, phi:  6_441, gap:   0.0,  win: true },
    { algo: 'Clarke-Wright Seq. + 2-opt',  short: 'CW-Seq + 2-opt', k: 45, dist: 467_485, sd:  3_030, phi:  6_709, gap:   4.16 },
    { algo: 'Clarke-Wright Sequential',    short: 'CW-Seq',          k: 45, dist: 485_505, sd:  3_212, phi:  7_001, gap:   8.68 },
    { algo: 'Recursive QAOA (No 2-opt)',   short: 'QAOA',            k: 45, dist: 438_321, sd:  4_881, phi:  7_311, gap:  13.50 },
    { algo: 'Clarke-Wright Par. + Or-opt', short: 'CW-Par + Or-opt', k: 45, dist: 218_560, sd: 18_258, phi: 11_557, gap:  79.42 },
    { algo: 'OR-Tools (Savings + GLS)',    short: 'OR-Tools',        k: 45, dist: 219_329, sd: 18_400, phi: 11_637, gap:  80.66 },
    { algo: 'Clarke-Wright Parallel',      short: 'CW-Par',          k: 45, dist: 224_586, sd: 18_913, phi: 11_952, gap:  85.55 },
    { algo: 'Iterated Local Search',       short: 'ILS',             k: 37, dist: 215_397, sd: 20_184, phi: 13_003, gap: 101.87 },
    { algo: 'Brazil Benchmark',            short: 'Prior Benchmark', k: 22, dist: 509_692, sd: 14_616, phi: 18_892, gap:  65.90 },
    { algo: 'Tabu Search',                 short: 'Tabu Search',     k: 12, dist: 200_695, sd: 33_986, phi: 25_355, gap: 293.63 },
    { algo: 'Simulated Annealing',         short: 'Sim. Annealing',  k: 12, dist: 201_637, sd: 33_934, phi: 25_369, gap: 293.84 },
  ],
}

const SCALE_PANELS = [
  { key: '50',   label: 'n = 50',   sub: 'k = 15 · 1 run'   },
  { key: '100',  label: 'n = 100',  sub: 'k = 30 · 10 runs' },
  { key: '200',  label: 'n = 200',  sub: 'k = 30 · 1 run'   },
  { key: '1000', label: 'n = 1000', sub: 'k = 45 · 1 run'   },
]

function ScalePanel({ scaleKey, label, sub }: { scaleKey: string; label: string; sub: string }) {
  const rows = BENCH[scaleKey]
  const maxPhi = Math.max(...rows.map((r) => r.phi))
  const winner = rows.find((r) => r.win)
  const worst = rows.reduce((a, b) => (a.phi > b.phi ? a : b))

  return (
    <div
      className="flex flex-col min-h-0 rounded-xl p-4 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* panel header */}
      <div className="shrink-0 flex items-baseline justify-between mb-3 pb-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-mono font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{label}</div>
        <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>
      </div>

      {/* rows */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1.5 pr-0.5">
        {rows.map(({ short, phi, gap, win }, i) => (
          <motion.div
            key={short}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.035 }}
          >
            {/* label */}
            <div
              className="font-mono text-[9px] shrink-0 truncate"
              style={{ width: 100, color: win ? 'var(--primary)' : 'var(--muted-foreground)' }}
            >
              {win && <span className="mr-0.5">★</span>}{short}
            </div>
            {/* bar */}
            <div className="flex-1 h-4 rounded overflow-hidden relative" style={{ background: 'color-mix(in oklch, var(--muted-foreground) 10%, transparent)' }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded"
                style={{
                  background: win
                    ? 'color-mix(in oklch, var(--primary) 75%, transparent)'
                    : 'color-mix(in oklch, var(--muted-foreground) 22%, transparent)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${(phi / maxPhi) * 100}%` }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.035, ease: [0.22, 1, 0.36, 1] }}
              />
              <div
                className="absolute right-1.5 inset-y-0 flex items-center font-mono text-[8px] tabular-nums"
                style={{ color: win ? 'var(--primary)' : 'var(--muted-foreground)' }}
              >
                {fmt(phi)}
              </div>
            </div>
            {/* gap */}
            <div
              className="font-mono text-[8px] tabular-nums shrink-0 text-right"
              style={{ width: 36, color: win ? 'var(--primary)' : gap > 100 ? 'var(--destructive)' : 'var(--muted-foreground)' }}
            >
              {gap.toFixed(1)}%
            </div>
          </motion.div>
        ))}
      </div>

      {/* winner callout */}
      {winner && (
        <div
          className="shrink-0 mt-3 pt-2.5 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div>
            <div className="font-mono text-[9px]" style={{ color: 'var(--muted-foreground)' }}>QAOA Φ</div>
            <div className="font-mono text-xs tabular-nums font-semibold" style={{ color: 'var(--primary)' }}>{fmt(winner.phi)}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px]" style={{ color: 'var(--muted-foreground)' }}>worst vs QAOA</div>
            <div className="font-mono text-xs tabular-nums font-semibold" style={{ color: 'var(--destructive)' }}>
              +{((worst.phi / winner.phi - 1) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px]" style={{ color: 'var(--muted-foreground)' }}>gap</div>
            <div className="font-mono text-xs tabular-nums font-semibold" style={{ color: 'var(--chart-3)' }}>{winner.gap.toFixed(1)}%</div>
          </div>
        </div>
      )}
    </div>
  )
}

function S13Benchmark() {
  return (
    <div className="absolute inset-0 flex flex-col px-8 py-5">
      <div className="shrink-0 mb-4">
        <Ey>Algorithm Benchmark · Rio Claro Dataset · Φ = Weighted Fairness Index (lower is better)</Ey>
        <H size="sm">QAOA leads on fairness at every scale.</H>
      </div>
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0">
        {SCALE_PANELS.map(({ key, label, sub }) => (
          <ScalePanel key={key} scaleKey={key} label={label} sub={sub} />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 14 — hardware */
function S14Hardware() {
  return (
    <Center>
      <Ey>Physical Quantum Hardware Validation</Ey>
      <H>ibm_fez · 156 qubits.</H>
      <Hr />
      <motion.div
        className="mt-6 w-full max-w-2xl rounded-2xl p-8 text-left"
        style={{
          background: 'color-mix(in oklch, var(--primary) 8%, var(--card))',
          border: '1px solid color-mix(in oklch, var(--primary) 35%, transparent)',
          boxShadow: '0 0 60px oklch(0.72 0.18 35 / 0.06)',
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-4">
          Execution Report
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[
            { k: 'Backend', v: 'ibm_fez' },
            { k: 'Physical qubits', v: '156' },
            { k: 'Problem size', v: '36 qubits' },
            { k: 'Distance result', v: '12,348.3' },
            { k: 'Optimal gap', v: '+0.00%' },
            { k: 'Projection method', v: 'Hungarian algorithm' },
          ].map(({ k, v }) => (
            <div key={k}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{k}</div>
              <div className="font-mono text-lg" style={{ color: 'var(--primary)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-border text-sm text-muted-foreground leading-relaxed">
          The Hungarian projection method recovers optimality gap exactly to +0.00% — confirming that
          our QUBO formulation correctly maps the routing objective onto physical qubit interactions,
          and that the ansatz depth was sufficient to reach the ground state on real hardware.
        </div>
      </motion.div>
      <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-2xl">
        {[
          { v: '0.37%', label: '2Q gate error · ibm_fez', c: 'var(--chart-3)' },
          { v: '900s+', label: 'Async job execution time', c: 'var(--destructive)' },
        ].map(({ v, label, c }) => (
          <div key={label} className="text-center bg-card border border-border rounded-xl py-4">
            <div className="font-mono text-2xl tabular-nums" style={{ color: c }}>{v}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </Center>
  )
}

/* ─────────────────────────────────────────── slide 15 — future work */
function S15FutureWork() {
  return (
    <Center>
      <Ey>Future Research</Ey>
      <H>Parameter Transferability.</H>
      <Hr />
      <div className="mt-4 grid grid-cols-2 gap-6 w-full max-w-3xl">
        {[
          {
            label: 'Cold Start',
            desc: 'Initialise QAOA angles randomly. Standard baseline — correct for novel problem classes with no prior data.',
            steps: ['Random β, γ initialisation', 'COBYLA full optimisation', 'Complete circuit evaluation each run'],
            c: 'var(--chart-3)',
          },
          {
            label: 'Warm Start · Proved',
            desc: 'Optimal angles learned on one cluster transfer zero-shot to a different geographic cluster of the same size.',
            steps: ['Parameter library cached per cluster size', 'Structural similarity lookup (QUBO embedding)', 'Fine-tune only · 60% fewer evaluations'],
            c: 'var(--primary)',
          },
        ].map(({ label, desc, steps, c }) => (
          <motion.div
            key={label}
            className="p-7 text-left bg-card rounded-xl border"
            style={{ borderColor: `color-mix(in oklch, ${c} 30%, var(--border))` }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge>{label}</Badge>
            <div className="mt-4 text-sm leading-relaxed text-muted-foreground">{desc}</div>
            <div className="mt-5 space-y-3">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono shrink-0"
                    style={{ background: `color-mix(in oklch, ${c} 15%, transparent)`, color: c }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 w-full max-w-3xl bg-card border border-border rounded-xl p-5 text-left">
        <div className="font-mono text-xs mb-2" style={{ color: 'var(--chart-4)' }}>Open problem</div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          Can warm-start parameters transfer across{' '}
          <em className="text-foreground">structurally similar</em> VRP instances of{' '}
          <em className="text-foreground">different sizes</em>?
          A graph-embedding similarity measure on the QUBO matrix structure —
          rather than raw cluster geography — may generalise this finding into a universal parameter cache.
        </div>
      </div>
    </Center>
  )
}

/* ─────────────────────────────────────────── slide 29 — thank you */
function S16ThankYou() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[320, 520, 740, 980].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-border"
            style={{ width: r, height: r, opacity: 0.18 - i * 0.035 }}
          />
        ))}
        {/* slow radar sweep */}
        <div className="absolute w-[700px] h-[700px] rounded-full overflow-hidden opacity-[0.07]">
          <div
            className="absolute inset-0 anim-radar"
            style={{ background: 'conic-gradient(from 0deg, transparent 0deg, oklch(0.72 0.18 35 / 0.9) 50deg, transparent 50deg)' }}
          />
        </div>
      </div>

      <div className="relative text-center max-w-2xl px-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] mb-8" style={{ color: 'var(--primary)', opacity: 0.8 }}>
            Vectora · VRPFR · 2026
          </div>

          <h1
            className="font-serif italic font-light leading-[1.04] tracking-[-0.04em] text-foreground mb-8"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 7rem)' }}
          >
            Thank you.
          </h1>

          <div className="h-px w-20 mx-auto bg-border mb-8" />

          <p className="text-sm leading-relaxed text-muted-foreground mb-10 max-w-[44ch] mx-auto">
            We kindly ask non-committee members to step outside for the examination. Thank you for attending.
          </p>

          <div className="font-sans text-muted-foreground text-sm">
            Leen Almousa &nbsp;·&nbsp; Abdulrahman Al-Essa &nbsp;·&nbsp; Malak Alshawish
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-border opacity-30" />
    </div>
  )
}
