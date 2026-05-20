import { AnimatePresence, motion } from 'framer-motion'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { ReactFlow, Handle, Position, type Node, type Edge, Background } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Camera, CheckCircle2,
  Globe2, Layers, MapPin, PenLine,
  Smartphone, Wifi, Server, Atom,
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import Map, { Layer, Source } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAppearance } from '@/hooks/use-appearance'

const mapboxStyleFor = (mode: 'light' | 'dark') =>
  mode === 'light'
    ? 'mapbox://styles/mapbox/light-v11'
    : 'mapbox://styles/mapbox/dark-v11'

/* ─────────────────────────────────────────── types */
interface Props { mapboxToken?: string | null }

const TOTAL = 35

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
      @keyframes dm-blink { 0%,49%{opacity:1}50%,100%{opacity:0} }
      @keyframes dm-pulse-glow { 0%,100%{box-shadow:0 0 0 0 oklch(0.72 0.18 35 / 0.6)}70%{box-shadow:0 0 0 8px oklch(0.72 0.18 35 / 0)} }
      @keyframes dm-loadbar { 0%{width:0%;opacity:1}90%{width:100%;opacity:1}100%{width:100%;opacity:0} }
      .dm-blink { animation: dm-blink 1.05s steps(1) infinite; }
      .dm-pulse-glow { animation: dm-pulse-glow 2.4s ease-in-out infinite; }
      .dm-loadbar { animation: dm-loadbar 1.6s cubic-bezier(.2,1,.3,1) forwards; }
      @keyframes qa-numeral { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
      @keyframes qa-rule { from{transform:scaleX(0)} to{transform:scaleX(1)} }
      @keyframes qa-title { 0%{opacity:0;transform:translateY(22px);filter:blur(6px)}60%{filter:blur(0)}100%{opacity:1;transform:translateY(0);filter:blur(0)} }
      @keyframes qa-soft { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes qa-stat { from{opacity:0;transform:translateY(8px);filter:blur(4px)} to{opacity:1;transform:translateY(0);filter:blur(0)} }
      @keyframes qa-plate { from{opacity:0;transform:scale(0.985)} to{opacity:1;transform:scale(1)} }
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
  const [flawPhase, setFlawPhase] = useState<0 | 1>(0)
  const { resolvedAppearance } = useAppearance()
  const mapStyle = mapboxStyleFor(resolvedAppearance)

  const go = useCallback((n: number) => {
    if (n < 0 || n >= TOTAL) {
      return
    }

    setCur(n)
    setFlawPhase(0)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        if (cur === 6 && flawPhase === 0) {
          setFlawPhase(1)
        } else {
          go(cur + 1)
        }
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (cur === 6 && flawPhase === 1) {
          setFlawPhase(0)
        } else {
          go(cur - 1)
        }
      }
    }

    window.addEventListener('keydown', h)

    return () => window.removeEventListener('keydown', h)
  }, [cur, flawPhase, go])

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
          {cur === 4  && <SQuantumRecap />}
          {cur === 5  && <SDataset token={token} />}
          {cur === 6  && <S03Flaw phase={flawPhase} />}
          {cur === 7  && <SSection idx={1} />}
          {cur === 8  && <SFramework />}
          {cur === 9  && <SAerSimulator />}
          {cur === 10 && <SQUBOPosition />}
          {cur === 11 && <SQUBOEdge />}
          {cur === 12 && <SPauliSlide />}
          {cur === 13 && <SQAOACircuit />}
          {cur === 14 && <SQAOALoop />}
          {cur === 15 && <SSection idx={2} />}
          {cur === 16 && <S09Decomposition />}
          {cur === 17 && <SAlgoStep step={1} />}
          {cur === 18 && <SAlgoStep step={2} />}
          {cur === 19 && <SAlgoStep step={3} />}
          {cur === 20 && <SAlgoStep step={4} />}
          {cur === 21 && <SAlgoStep step={5} />}
          {cur === 22 && <SAlgoStep step={6} />}
          {cur === 23 && <SAlgoStep step={7} />}
          {cur === 24 && <S11Architecture />}
          {cur === 25 && <SDispatchMobile />}
          {cur === 26 && <SDeliveryProof />}
          {cur === 27 && <SSection idx={3} />}
          {cur === 28 && <S12Maps token={token} />}
          {cur === 29 && <S13Benchmark />}
          {cur === 30 && <S13Benchmark100 />}
          {cur === 31 && <S14Hardware />}
          {cur === 32 && <S15FutureWork />}
          {cur === 33 && <SConclusion />}
          {cur === 34 && <S16ThankYou />}
        </motion.div>
      </AnimatePresence>
      <Hud cur={cur} go={go} flawPhase={flawPhase} />
    </div>
  )
}

/* ─────────────────────────────────────────── hud */
const SLIDE_LABELS = [
  'Pre-Show', 'Title',
  '— The Problem —', 'Combinatorial Explosion', 'Quantum Primer', 'The Dataset', 'The Classical Flaw',
  '— The Approach —', 'Framework of Choice', 'Simulator vs Hardware',
  'QUBO · Position-Based', 'QUBO · Edge-Based',
  'Pauli-Z Mapping', 'QAOA Circuit', 'QAOA · Variational Loop',
  '— The System —', 'K-Means Decomposition',
  'Algo · I–II · Angular Sweep & K-Means', 'Algo · III · Vehicle Allocation',
  'Algo · IV–V · Recursion Gate & Depot', 'Algo · VI · Quantum Solve',
  'Algo · VII · Supernode Compression', 'Algo · VIII · Supernode Routing', 'Algo · IX · Final Routes',
  'System Architecture', 'Dispatch → Driver', 'Proof of Delivery',
  '— The Results —', '200-Node Visual Proof', 'Benchmark Results', 'Benchmark · 100 Nodes · 10 Runs',
  'Hardware Validation', 'Future Work', 'Conclusion', 'Thank You',
]

const SLIDE_SUBLABELS: Record<number, string[]> = {
  6: ['The Distance Trap', 'The Φ Metric'],
}

const SECTIONS = [
  { label: '',             start: 0,  end: 1  },
  { label: 'The Problem',  start: 2,  end: 6  },
  { label: 'The Approach', start: 7,  end: 14 },
  { label: 'The System',   start: 15, end: 26 },
  { label: 'The Results',  start: 27, end: 34 },
]

function getSectionFor(n: number) {
  return SECTIONS.find((s) => n >= s.start && n <= s.end)
}

function Hud({ cur, go, flawPhase }: { cur: number; go: (n: number) => void; flawPhase: 0 | 1 }) {
  const section = getSectionFor(cur)
  const sublabels = SLIDE_SUBLABELS[cur]
  const label = sublabels ? sublabels[flawPhase] : SLIDE_LABELS[cur]

  return (
    <>
      <div className="fixed top-5 left-8 z-50">
        {section?.label && (
          <div className="text-[9px] uppercase tracking-[0.18em] font-mono mb-0.5" style={{ color: 'var(--primary)', opacity: 0.75 }}>
            {section.label}
          </div>
        )}
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-sans">
          {label}
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
      {/* dark wash */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        style={{ background: 'oklch(0.07 0.018 250)' }}
      />

      {/* giant background numeral */}
      <motion.div
        className="absolute font-serif italic pointer-events-none select-none"
        initial={{ opacity: 0, scale: 1.07 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontSize: 'clamp(22rem, 44vw, 40rem)',
          lineHeight: 1,
          color: 'oklch(0.72 0.18 35 / 0.05)',
          top: '50%',
          left: '50%',
          transform: 'translate(-44%, -52%)',
          letterSpacing: '-0.06em',
        }}
      >
        {roman}
      </motion.div>

      {/* top line — draws from left */}
      <motion.div
        className="absolute top-0 left-0 h-px"
        style={{ background: 'oklch(0.72 0.18 35 / 0.5)' }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="relative text-center max-w-[680px] px-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="font-mono text-[10px] uppercase tracking-[0.42em] mb-7"
          style={{ color: 'var(--primary)', opacity: 0.9 }}
        >
          Part {roman}
        </motion.div>

        <motion.h2
          className="font-serif italic font-light leading-none tracking-[-0.04em] text-foreground"
          style={{ fontSize: 'clamp(4.8rem, 10vw, 8.5rem)' }}
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h2>

        <motion.div
          className="h-px mx-auto my-8"
          style={{ background: 'var(--border)' }}
          initial={{ width: 0 }}
          animate={{ width: 72 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.p
          className="text-sm leading-relaxed text-muted-foreground max-w-[46ch] mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
        >
          {tagline}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.95 }}
        >
          {topics.map((topic) => (
            <span
              key={topic}
              className="text-[10px] font-mono uppercase tracking-wider border border-border/70 text-muted-foreground px-3 py-1.5 rounded"
            >
              {topic}
            </span>
          ))}
        </motion.div>
      </div>

      {/* bottom line — draws from right */}
      <motion.div
        className="absolute bottom-0 right-0 h-px"
        style={{ background: 'oklch(0.72 0.18 35 / 0.5)' }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
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
/* ─────────────────────────────────────────── vrp graph visual */
const VRP_SEG_DUR = 0.28
const VRP_ROUTE_STAGGER = 0.38

function VRPGraph() {
  const depot = { x: 185, y: 158 }

  const routes: { color: string; label: string; stops: { x: number; y: number }[] }[] = [
    {
      color: 'oklch(0.72 0.18 35)',
      label: 'Vehicle 1',
      stops: [{ x: 75, y: 55 }, { x: 42, y: 120 }, { x: 85, y: 182 }, { x: 130, y: 95 }],
    },
    {
      color: 'oklch(0.62 0.19 230)',
      label: 'Vehicle 2',
      stops: [{ x: 288, y: 48 }, { x: 340, y: 115 }, { x: 308, y: 182 }, { x: 252, y: 112 }],
    },
    {
      color: 'oklch(0.68 0.15 158)',
      label: 'Vehicle 3',
      stops: [{ x: 95, y: 288 }, { x: 158, y: 330 }, { x: 238, y: 320 }, { x: 278, y: 270 }],
    },
  ]

  return (
    <svg viewBox="0 0 375 358" className="w-full" style={{ maxHeight: 420 }}>
      {/* faint grid */}
      {[60, 120, 180, 240, 300].map((v) => (
        <React.Fragment key={v}>
          <line x1={v} y1={0} x2={v} y2={358} stroke="oklch(0.22 0.01 250)" strokeWidth={0.5} />
          <line x1={0} y1={v} x2={375} y2={v} stroke="oklch(0.22 0.01 250)" strokeWidth={0.5} />
        </React.Fragment>
      ))}

      {/* route edges — one motion.path per segment so each draws sequentially */}
      {routes.map((route, ri) => {
        const pts = [depot, ...route.stops, depot]
        return pts.slice(0, -1).map((from, si) => {
          const to = pts[si + 1]
          const delay = 0.2 + ri * VRP_ROUTE_STAGGER + si * VRP_SEG_DUR
          return (
            <motion.path
              key={`seg-${ri}-${si}`}
              d={`M${from.x},${from.y} L${to.x},${to.y}`}
              stroke={route.color}
              strokeWidth={2}
              fill="none"
              strokeOpacity={0.68}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: VRP_SEG_DUR, delay, ease: 'easeInOut' }}
            />
          )
        })
      })}

      {/* customer nodes — spring-pop as the route arrives at each stop */}
      {routes.map((route, ri) =>
        route.stops.map((stop, si) => {
          // node appears right as the inbound segment (si+1-th segment) finishes
          const delay = 0.2 + ri * VRP_ROUTE_STAGGER + (si + 1) * VRP_SEG_DUR + 0.04
          return (
            <motion.circle
              key={`node-${ri}-${si}`}
              cx={stop.x}
              cy={stop.y}
              r={6}
              fill={route.color}
              fillOpacity={0.9}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, delay, type: 'spring', stiffness: 400, damping: 18 }}
            />
          )
        })
      )}

      {/* depot — fades in first, then a soft halo pulses after routes are drawn */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <motion.circle
          cx={depot.x}
          cy={depot.y}
          r={21}
          fill="none"
          stroke="oklch(0.80 0.01 250)"
          strokeOpacity={0.09}
          animate={{ r: [21, 27, 21], strokeOpacity: [0.09, 0.0, 0.09] }}
          transition={{ duration: 2.8, delay: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <rect
          x={depot.x - 12}
          y={depot.y - 12}
          width={24}
          height={24}
          rx={4}
          fill="oklch(0.16 0.025 250)"
          stroke="oklch(0.80 0.01 250)"
          strokeWidth={1.8}
        />
        <text
          x={depot.x}
          y={depot.y + 4.5}
          textAnchor="middle"
          fontSize={11}
          fontFamily="monospace"
          fill="oklch(0.88 0.01 250)"
          fontWeight="600"
        >
          D
        </text>
      </motion.g>

      {/* legend — each entry appears once its route finishes */}
      {routes.map((route, ri) => {
        const done = 0.2 + ri * VRP_ROUTE_STAGGER + (route.stops.length + 1) * VRP_SEG_DUR + 0.1
        return (
          <motion.g
            key={ri}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: done, duration: 0.28 }}
          >
            <rect x={14} y={15 + ri * 20} width={18} height={3} rx={1.5} fill={route.color} fillOpacity={0.72} />
            <text x={38} y={22 + ri * 20} fontSize={9.5} fontFamily="monospace" fill="oklch(0.48 0.01 250)">
              {route.label}
            </text>
          </motion.g>
        )
      })}
    </svg>
  )
}

function S02Explosion() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 1450),
      setTimeout(() => setPhase(3), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <Split
      L={
        <div>
          <Ey>NP-Hard Combinatorics</Ey>
          <H size="lg">The Vehicle Routing Problem.</H>

          {/* VRP definition */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2.5 font-mono">Definition</div>
            <p className="text-sm leading-relaxed text-foreground">
              Given a{' '}
              <span className="font-medium" style={{ color: 'var(--primary)' }}>central depot</span>
              {' '}and{' '}
              <span className="font-medium" style={{ color: 'var(--primary)' }}>n customers</span>
              {' '}distributed across a city, assign{' '}
              <span className="font-medium" style={{ color: 'var(--primary)' }}>k vehicles</span>
              {' '}to cover every delivery — each route starts and ends at the depot, and every customer is visited exactly once.
            </p>
          </motion.div>

          <Hr />

          <div className="space-y-3">
            {/* Factor 1 */}
            <motion.div
              initial={{ opacity: 0, x: -16, scale: 0.97 }}
              animate={{ opacity: phase >= 1 ? 1 : 0, x: phase >= 1 ? 0 : -16, scale: phase >= 1 ? 1 : 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border border-border bg-card px-5 py-4"
            >
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-mono">
                Factor 1 · Customer Assignment
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm text-muted-foreground">k<sup>n</sup> =</span>
                <span className="font-serif italic text-foreground" style={{ fontSize: '2rem', lineHeight: 1 }}>10</span>
                <sup className="font-mono" style={{ fontSize: '1.15rem', color: 'var(--primary)', lineHeight: 1 }}>100</sup>
              </div>
              <div className="text-[9px] text-muted-foreground mt-1.5">
                possible customer-to-vehicle assignments · k = 10, n = 100
              </div>
            </motion.div>

            {/* Factor 2 */}
            <motion.div
              initial={{ opacity: 0, x: -16, scale: 0.97 }}
              animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : -16, scale: phase >= 2 ? 1 : 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border border-border bg-card px-5 py-4"
            >
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-mono">
                Factor 2 · Route Ordering
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm text-muted-foreground">(n/k)!<sup>k</sup> =</span>
                <span className="font-serif italic text-foreground" style={{ fontSize: '2rem', lineHeight: 1 }}>(10!)</span>
                <sup className="font-mono text-muted-foreground" style={{ fontSize: '0.85rem' }}>10</sup>
                <span className="font-mono text-sm text-muted-foreground">≈</span>
                <span className="font-serif italic text-foreground" style={{ fontSize: '2rem', lineHeight: 1 }}>10</span>
                <sup className="font-mono" style={{ fontSize: '1.15rem', color: 'var(--primary)', lineHeight: 1 }}>65</sup>
              </div>
              <div className="text-[9px] text-muted-foreground mt-1.5">
                route orderings across all vehicles · ≈ 3.6 × 10⁶ per vehicle
              </div>
            </motion.div>

            {/* Total */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 12, scale: phase >= 3 ? 1 : 0.97 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl px-5 py-4"
              style={{
                border: '1px solid color-mix(in oklch, var(--primary) 38%, transparent)',
                background: 'color-mix(in oklch, var(--primary) 7%, transparent)',
              }}
            >
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-mono">
                Total Search Space · k<sup>n</sup> × (n/k)!<sup>k</sup>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif italic text-foreground" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', lineHeight: 1 }}>
                  10
                </span>
                <sup style={{ fontSize: 'clamp(1.3rem, 2.8vw, 2rem)', color: 'var(--primary)', lineHeight: 1, fontWeight: 600, fontFamily: 'monospace' }}>
                  165
                </sup>
              </div>
              <div className="text-[9px] text-muted-foreground mt-1.5">
                possible routes · 10 vehicles · 100 customers
              </div>
            </motion.div>
          </div>
        </div>
      }
      R={<VRPGraph />}
    />
  )
}

/* ─────────────────────────────────────────── slides 6–7 — classical flaw → Φ metric */
function WorkloadChart({ balanced }: { balanced: boolean }) {
  const bars = balanced
    ? [{ h: 62, label: 'V1' }, { h: 58, label: 'V2' }, { h: 65, label: 'V3' }, { h: 60, label: 'V4' }, { h: 61, label: 'V5' }]
    : [{ h: 92, label: 'V1' }, { h: 20, label: 'V2' }, { h: 70, label: 'V3' }, { h: 16, label: 'V4' }, { h: 44, label: 'V5' }]
  const maxH = 92, W = 200, trackTop = 8

  return (
    <svg viewBox={`0 0 ${W} 118`} overflow="visible" className="w-full h-full">
      {bars.map(({ h, label }, i) => {
        const x = 14 + i * 36
        const barY = trackTop + maxH - h
        const fill = balanced
          ? 'oklch(0.72 0.18 35)'
          : h > 55 ? 'oklch(0.58 0.22 18)' : 'oklch(0.35 0.01 250)'
        return (
          <g key={i}>
            {/* track */}
            <rect x={x} y={trackTop} width={22} height={maxH} rx={4} fill="oklch(0.17 0.01 250)" />
            {/* animated bar */}
            <motion.rect
              x={x} width={22} rx={4} fill={fill}
              initial={{ height: 0, y: trackTop + maxH }}
              animate={{ height: h, y: barY }}
              transition={{ duration: 0.65, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* km label above */}
            <motion.text
              x={x + 11} fontSize={7.5} fontFamily="monospace" textAnchor="middle"
              fill={balanced ? 'oklch(0.72 0.18 35)' : h > 55 ? 'oklch(0.58 0.22 18)' : 'oklch(0.40 0.01 250)'}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.09 }}
              y={barY - 4}
            >
              {balanced ? '~60' : `${h}`}
            </motion.text>
            {/* vehicle label */}
            <text x={x + 11} y={110} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="oklch(0.38 0.01 250)">{label}</text>
          </g>
        )
      })}

      {/* mean line (balanced) */}
      {balanced && (
        <motion.line x1={10} x2={W - 10} y1={trackTop + maxH - 61} y2={trackTop + maxH - 61}
          stroke="oklch(0.72 0.18 35 / 0.55)" strokeWidth={1.2} strokeDasharray="4,3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        />
      )}

      {/* σ bracket (unbalanced) */}
      {!balanced && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          <path d={`M${W - 8},${trackTop + maxH - 92} L${W - 4},${trackTop + maxH - 92} L${W - 4},${trackTop + maxH - 16} L${W - 8},${trackTop + maxH - 16}`}
            fill="none" stroke="oklch(0.58 0.22 18)" strokeWidth={1.5} />
          <text x={W - 2} y={trackTop + maxH - 52} fontSize={9} fontFamily="monospace" fill="oklch(0.58 0.22 18)"
            transform={`rotate(90, ${W - 2}, ${trackTop + maxH - 52})`} textAnchor="middle">σ large</text>
        </motion.g>
      )}
    </svg>
  )
}

function S03Flaw({ phase }: { phase: 0 | 1 }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={phase}
          initial={{ opacity: 0, x: phase === 0 ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: phase === 0 ? 50 : -50 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex items-center justify-center"
        >
          {phase === 0 ? <S03FlawClassical /> : <S03FlawMetric />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function S03FlawClassical() {
  const failures = [
    { text: 'One driver works 14 h — others clock out at noon', note: 'identical total distance, catastrophic distribution' },
    { text: 'Labour law violations accumulate silently', note: 'no per-driver constraint in the objective' },
    { text: 'Fleet capacity wasted on idle vehicles', note: 'underloaded drivers could absorb more stops' },
    { text: 'Driver burnout and attrition rise', note: 'safety and retention costs invisible to the solver' },
  ]

  return (
    <Split
      L={
        <div>
          <Badge v="destructive">Classical Objective</Badge>
          <div className="mt-5"><H size="lg">The distance trap.</H></div>
          <Hr />
          <div className="mt-2 px-5 py-4 bg-card border border-border rounded-xl font-mono text-2xl tracking-wide">
            min <span style={{ color: 'var(--destructive)' }}>Σ d(i,j)</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-[48ch]">
            The classical objective minimises only the <em>sum</em> of all distances driven by all vehicles.
            It is completely blind to how that distance is distributed across the fleet —
            treating one driver doing 300 km and four doing 20 km identically to five drivers doing 100 km each.
          </p>
          <div className="mt-6 space-y-3.5">
            {failures.map(({ text, note }) => (
              <div key={text} className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-base" style={{ color: 'var(--destructive)' }}>✕</span>
                <div>
                  <div className="text-sm text-foreground">{text}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      R={
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Route lengths per vehicle · km</div>
          <div style={{ height: 260 }}>
            <WorkloadChart balanced={false} />
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
            Same total distance as the balanced case — the solver is satisfied.
            The <span style={{ color: 'var(--destructive)' }}>inequality goes unpenalised</span>.
          </div>
        </div>
      }
    />
  )
}

function S03FlawMetric() {
  const terms = [
    {
      token: 'D',
      color: 'var(--muted-foreground)',
      desc: 'Total distance driven by the entire fleet',
      detail: 'Sum of every route length across all k vehicles',
    },
    {
      token: 'D / k',
      color: 'var(--chart-2)',
      desc: 'Mean route length — the efficiency term',
      detail: 'Drives the average workload down. When D/k is small, the fleet moves less in total.',
    },
    {
      token: 'σ',
      color: 'var(--chart-4)',
      desc: 'Standard deviation of route lengths — the fairness term',
      detail: 'When σ → 0, every driver travels exactly D/k km. Perfect equality.',
    },
  ]

  return (
    <Split
      L={
        <div>
          <Badge>Our Metric</Badge>
          <div className="mt-5"><H size="lg">Cost plus fairness.</H></div>
          <Hr />
          <div
            className="mt-2 px-5 py-5 bg-card rounded-xl font-mono text-2xl tracking-wide leading-relaxed"
            style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, transparent)' }}
          >
            <span style={{ color: 'var(--primary)' }}>Φ</span>
            {' = 0.5 · '}
            <span style={{ color: 'var(--chart-2)' }}>( D / k )</span>
            {' + 0.5 · '}
            <span style={{ color: 'var(--chart-4)' }}>σ</span>
          </div>
          <div className="mt-6 space-y-4">
            {terms.map(({ token, color, desc, detail }, i) => (
              <motion.div key={token}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.4 }}
                className="flex gap-3"
              >
                <div className="font-mono text-base shrink-0 w-14 pt-0.5" style={{ color }}>{token}</div>
                <div>
                  <div className="text-sm text-foreground">{desc}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono leading-relaxed">{detail}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-[10px] font-mono text-muted-foreground leading-relaxed px-1">
            Equal weights (0.5 each) mean efficiency and fairness are traded at parity.
            The solver minimises a single scalar — no multi-objective tuning required.
          </div>
        </div>
      }
      R={
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Route lengths per vehicle · km</div>
          <div style={{ height: 260 }}>
            <WorkloadChart balanced={true} />
          </div>
          <div className="rounded-xl px-4 py-3 text-[11px] text-muted-foreground leading-relaxed"
            style={{ border: '1px solid color-mix(in oklch, var(--primary) 30%, transparent)', background: 'color-mix(in oklch, var(--primary) 6%, transparent)' }}>
            σ ≈ 0 · D/k ≈ 60 km ·{' '}
            <span style={{ color: 'var(--primary)' }}>every driver carries an equal share</span>.
          </div>
        </div>
      }
    />
  )
}

/* ─────────────────────────────────────────── slide 8 — framework */
function SFramework() {
  const reasons = [
    {
      Icon: Atom,
      label: 'Primitives',
      title: 'Native QAOA toolchain',
      detail: 'qiskit-algorithms ships QAOA + COBYLA. qiskit-optimization maps QUBO → Ising in one call — no glue code required.',
    },
    {
      Icon: Server,
      label: 'Simulation',
      title: 'Aer statevector simulator',
      detail: 'Noise-free local simulation up to 29 qubits. No queue, no cost per shot, no decoherence drift.',
    },
    {
      Icon: Wifi,
      label: 'Hardware',
      title: 'QPU-ready circuits',
      detail: 'The same circuit targets ibm_fez via a single backend swap — zero rewrite to run on real hardware.',
    },
    {
      Icon: Layers,
      label: 'Ecosystem',
      title: 'Mature OSS community',
      detail: '4+ years of NISQ-era maturity, 500k+ users, and the most comprehensive gate-level documentation available.',
    },
  ]

  const sdks = [
    { name: 'Qiskit',     vendor: 'IBM',    chosen: true,  note: 'Full-stack · sim + real QPU + optimization' },
    { name: 'PennyLane',  vendor: 'Xanadu', chosen: false, note: 'ML-gradient focus · sparse QAOA support'    },
    { name: 'Cirq',       vendor: 'Google', chosen: false, note: 'Sycamore-only · no cross-vendor simulator'  },
    { name: 'Braket SDK', vendor: 'AWS',    chosen: false, note: 'Cloud-only · latency + per-shot cost'       },
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center px-14">
      <div className="w-full max-w-7xl flex gap-12 items-start">

        {/* ── Left: header + 2×2 reason cards ── */}
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Ey>Framework Selection</Ey>
            <H size="lg">Why Qiskit.</H>
            <Hr />
          </motion.div>

          <div className="grid grid-cols-2 gap-5">
            {reasons.map(({ Icon, label, title, detail }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="px-8 py-7 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-5">
                    <Icon size={22} style={{ color: 'var(--primary)' }} />
                    <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-mono">{label}</span>
                  </div>
                  <div className="text-xl font-medium text-foreground mb-3">{title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{detail}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Right: SDK comparison ── */}
        <div className="w-[340px] shrink-0 pt-1">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-5"
          >
            SDK landscape
          </motion.div>
          <div className="space-y-3">
            {sdks.map(({ name, vendor, chosen, note }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: chosen ? 1 : 0.42, x: 0 }}
                transition={{ delay: 0.26 + i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="px-6 py-5" glow={chosen}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-base font-semibold" style={{ color: chosen ? 'var(--primary)' : 'var(--foreground)' }}>
                      {name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">{vendor}</span>
                    {chosen && (
                      <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--primary)' }}>✦ chosen</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{note}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 9 — aer simulator */
function SAerSimulator() {
  const realCons = [
    { label: 'Gate errors',   detail: 'CNOT fidelity ~99.5% per gate — errors compound across every circuit layer' },
    { label: 'Readout noise', detail: '~1–2% bit-flip probability per qubit per measurement shot'                  },
    { label: 'Decoherence',   detail: 'T₁ / T₂ times cap usable circuit depth before the quantum state decays'    },
    { label: 'Job queues',    detail: 'IBM Quantum queue: minutes-to-hours wait per run, blocking fast iteration'  },
  ]

  const aerPros = [
    { label: 'Zero noise',   detail: 'Exact statevector — no gate errors, no decoherence, no readout flip'        },
    { label: 'Instant runs', detail: 'No queue — full experiment results in seconds on local hardware'              },
    { label: 'Reproducible', detail: 'Deterministic output enables fair, controlled algorithm benchmarking'        },
  ]

  const memSteps = [5, 10, 15, 20, 24, 27, 29]

  return (
    <div className="fixed inset-0 flex items-center justify-center px-14 py-10">
      <div className="w-full max-w-7xl flex flex-col gap-8" style={{ maxHeight: '86vh' }}>

        {/* ── header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Ey>Execution Environment</Ey>
          <H size="lg">Simulator over hardware.</H>
          <Hr />
        </motion.div>

        {/* ── two panels ── */}
        <div className="grid grid-cols-2 gap-7 flex-1 min-h-0">

          {/* Real hardware */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <Card className="px-9 py-8 h-full flex flex-col">
              <Badge v="destructive">Real Hardware</Badge>
              <div className="mt-1.5 font-mono text-sm text-muted-foreground">ibm_fez · 156 qubits</div>
              <div className="mt-7 space-y-5 flex-1">
                {realCons.map(({ label, detail }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.09, duration: 0.4 }}
                    className="flex gap-4"
                  >
                    <span className="shrink-0 mt-0.5 text-lg leading-snug" style={{ color: 'var(--destructive)' }}>✕</span>
                    <div>
                      <div className="text-base font-medium text-foreground">{label}</div>
                      <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{detail}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-7 pt-5 border-t border-border font-mono text-sm text-muted-foreground">
                Errors accumulate multiplicatively — a 10-layer circuit on 5 qubits already sees ~{'>'}5% total infidelity.
              </div>
            </Card>
          </motion.div>

          {/* Aer simulator */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <Card className="px-9 py-8 h-full flex flex-col" glow>
              <Badge>Aer Simulator</Badge>
              <div className="mt-1.5 font-mono text-sm text-muted-foreground">Qiskit Aer · local statevector</div>
              <div className="mt-7 space-y-5">
                {aerPros.map(({ label, detail }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.32 + i * 0.09, duration: 0.4 }}
                    className="flex gap-4"
                  >
                    <span className="shrink-0 mt-0.5 text-lg leading-snug" style={{ color: 'var(--primary)' }}>✓</span>
                    <div>
                      <div className="text-base font-medium text-foreground">{label}</div>
                      <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{detail}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* memory wall */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.45 }}
                className="mt-7 pt-5 border-t border-border flex-1 flex flex-col justify-end"
              >
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    statevector memory · 2<sup>n</sup> × 16 B
                  </span>
                  <span className="text-sm font-mono" style={{ color: 'var(--primary)' }}>≈ 8 GB at n = 29</span>
                </div>
                <AerMemoryViz steps={memSteps} />
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function AerMemoryViz({ steps }: { steps: number[] }) {
  const maxLog = steps[steps.length - 1] + Math.log2(16)
  const W = 300, rowH = 18, gap = 7
  const totalH = steps.length * (rowH + gap) - gap

  const label = (n: number) => {
    const b = Math.pow(2, n) * 16
    if (b < 1024 ** 2) return `${Math.round(b / 1024)} KB`
    if (b < 1024 ** 3) return `${Math.round(b / 1024 / 1024)} MB`
    return `${(b / 1024 ** 3).toFixed(1)} GB`
  }

  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} overflow="visible" className="w-full" style={{ height: totalH }}>
      {steps.map((n, i) => {
        const barW = ((n + Math.log2(16)) / maxLog) * (W - 90)
        const y = i * (rowH + gap)
        const isLast = i === steps.length - 1
        const fill = isLast ? 'var(--primary)' : `oklch(${0.20 + i * 0.025} 0.015 250)`
        return (
          <g key={n}>
            <rect x={0} y={y} width={W - 90} height={rowH} rx={3} fill="oklch(0.14 0.01 250)" />
            <motion.rect
              x={0} y={y} height={rowH} rx={3} fill={fill}
              initial={{ width: 0 }}
              animate={{ width: barW }}
              transition={{ delay: 0.75 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.text
              x={W - 86} y={y + rowH / 2 + 4.5} fontSize={12} fontFamily="monospace"
              fill={isLast ? 'var(--primary)' : 'var(--muted-foreground)'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.82 + i * 0.07 }}
            >
              n={n} · {label(n)}
            </motion.text>
          </g>
        )
      })}
    </svg>
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
/* ─────────────────────────────────────────── slide 10 — pauli-z mapping */
function SPauliSlide() {
  const coral = '#e06c3a'

  return (
    <Split
      L={
        <div>
          <Badge>Mathematical Bridge</Badge>
          <div className="mt-5"><H size="lg">QUBO to Hamiltonian.</H></div>
          <Hr />
          <P>
            Quantum hardware measures in the Pauli-Z basis — outcomes are −1 or +1, never 0 or 1.
            A single substitution converts every binary variable into a spin, turning the routing
            cost function directly into a quantum Hamiltonian H_C.
          </P>
          <div className="mt-6 px-6 py-5 bg-card border border-border rounded-xl text-center">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">the substitution</div>
            <TexGlow latex="x = \dfrac{1-Z}{2}" color={coral} size="1.9rem" display delay={0.25} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-4 px-6 py-5 rounded-xl"
            style={{
              border: '1px solid color-mix(in oklch, var(--primary) 28%, transparent)',
              background: 'color-mix(in oklch, var(--primary) 5%, transparent)',
            }}
          >
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground mb-4">resulting cost Hamiltonian</div>
            <TexGlow latex="H_C = \displaystyle\sum_{i<j} J_{ij} Z_i Z_j + \sum_i h_i Z_i" color={coral} size="1.1rem" display delay={0.75} />
          </motion.div>
        </div>
      }
      R={
        <motion.div className="w-full"
          initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Final Energy (QUBO)</span>
            <div className="flex gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground">distance term</span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border text-muted-foreground" style={{ borderColor: `${coral}44`, color: coral, opacity: 0.8 }}>+ penalties</span>
            </div>
          </div>
          <div className="rounded-2xl p-8 flex flex-col gap-3"
            style={{
              background: 'oklch(0.1 0.015 250)',
              border: `1px solid ${coral}28`,
              boxShadow: `0 0 48px ${coral}14`,
            }}>
            <TexGlow
              latex="\min \displaystyle\sum_{i \neq j} d_{i,j}\, x_{i,j}"
              color={coral} size="1.55rem" display delay={0.35} />
            <TexGlow
              latex="+\,P\!\left[\,\sum_{i=1}^{n-1}\!\left(\sum_{j \neq i} x_{i,j} - 1\right)^{\!2}\right."
              color="#e2c9b8" size="1.05rem" display delay={0.48} />
            <TexGlow
              latex="\left.\qquad+\,\sum_{i=1}^{n-1}\!\left(\sum_{j \neq i} x_{j,i} - 1\right)^{\!2}\right."
              color="#e2c9b8" size="1.05rem" display delay={0.56} />
            <TexGlow
              latex="\left.\qquad+\,\left(\sum_{j=1}^{n-1} x_{0,j} - K\right)^{\!2} + \left(\sum_{j=1}^{n-1} x_{j,0} - K\right)^{\!2}\,\right]"
              color="#e2c9b8" size="1.05rem" display delay={0.64} />
            <div className="h-px mt-2" style={{ background: `color-mix(in oklch, ${coral} 12%, transparent)` }} />
            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-muted-foreground">
              <div><span style={{ color: coral, opacity: 0.7 }}>P1/P2</span> — row &amp; col flow = 1 per node</div>
              <div><span style={{ color: coral, opacity: 0.7 }}>P3/P4</span> — exactly K vehicles depart &amp; return</div>
            </div>
          </div>
        </motion.div>
      }
    />
  )
}

/* ─────────────────────────────────────────── slide 11 — qaoa circuit */
const CQY = [110, 175, 240, 305] as const
const CW  = 780
const CH  = 430

const CIRC_X = {
  wireStart: 52, wireEnd: 724,
  label: 44, hCx: 78,
  cost1: [98, 246] as [number, number],
  mix1:  [260, 366] as [number, number],
  cost2: [382, 530] as [number, number],
  mix2:  [544, 650] as [number, number],
  meas:  [664, 718] as [number, number],
} as const

const COST_COLOR  = '#e06c3a'
const MIXER_COLOR = '#6b8cff'

/* ── circuit gate primitives — smooth editorial style ── */
function CircBlock({ x1, x2, color, latexLabel, delay }:
  { x1: number; x2: number; color: string; latexLabel: string; delay: number }) {
  const top    = CQY[0] - 24
  const height = CQY[CQY.length - 1] - CQY[0] + 48
  const cx     = (x1 + x2) / 2
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: `${cx}px ${top + height / 2}px` }}
    >
      <rect x={x1} y={top} width={x2 - x1} height={height} rx={8}
        fill={`color-mix(in oklch, ${color} 9%, transparent)`}
        stroke={`color-mix(in oklch, ${color} 45%, transparent)`}
        strokeWidth={1.2}
      />
      <foreignObject x={cx - 72} y={top - 8} width={144} height={34}>
        <div style={{ color, fontSize: 15, textAlign: 'center', fontFamily: 'KaTeX_Math, serif',
          filter: `drop-shadow(0 0 8px ${color}bb)` }}
          dangerouslySetInnerHTML={{ __html: tex(latexLabel) }}
        />
      </foreignObject>
    </motion.g>
  )
}

function ZZPair({ x, qi, delay }: { x: number; qi: number; delay: number }) {
  const y1 = CQY[qi], y2 = CQY[qi + 1], r = 8
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <line x1={x} y1={y1 + r} x2={x} y2={y2 - r}
        stroke={COST_COLOR} strokeWidth={1.5} strokeOpacity={0.55} />
      <circle cx={x} cy={y1} r={r}
        fill={`color-mix(in oklch, ${COST_COLOR} 85%, transparent)`}
        stroke={COST_COLOR} strokeWidth={1} />
      <circle cx={x} cy={y2} r={r}
        fill={`color-mix(in oklch, ${COST_COLOR} 85%, transparent)`}
        stroke={COST_COLOR} strokeWidth={1} />
      <text x={x} y={y1 + 3.5} textAnchor="middle" fontSize={6.5}
        fontFamily="KaTeX_Math, serif" fontStyle="italic" fill="white" opacity={0.95}>ZZ</text>
      <text x={x} y={y2 + 3.5} textAnchor="middle" fontSize={6.5}
        fontFamily="KaTeX_Math, serif" fontStyle="italic" fill="white" opacity={0.95}>ZZ</text>
    </motion.g>
  )
}

function RxGate({ cx, qi, delay }: { cx: number; qi: number; delay: number }) {
  const y = CQY[qi], w = 32, h = 22
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: `${cx}px ${y}px` }}
    >
      <rect x={cx - w / 2} y={y - h / 2} width={w} height={h} rx={4}
        fill="oklch(0.15 0.01 250)"
        stroke={`color-mix(in oklch, ${MIXER_COLOR} 55%, transparent)`}
        strokeWidth={1.2} />
      <text x={cx} y={y + 4.5} textAnchor="middle" fontSize={10}
        fontFamily="KaTeX_Math, serif" fontStyle="italic" fill={MIXER_COLOR}>
        Rₓ
      </text>
    </motion.g>
  )
}

function HGate({ qi, delay }: { qi: number; delay: number }) {
  const cx = CIRC_X.hCx, y = CQY[qi], w = 28, h = 24
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: `${cx}px ${y}px` }}
    >
      <rect x={cx - w / 2} y={y - h / 2} width={w} height={h} rx={4}
        fill="oklch(0.15 0.01 250)" stroke="oklch(0.38 0.01 250)" strokeWidth={1.2} />
      <text x={cx} y={y + 5} textAnchor="middle" fontSize={14}
        fontFamily="KaTeX_Math, serif" fontWeight="bold" fill="oklch(0.82 0.01 250)">
        H
      </text>
    </motion.g>
  )
}

function MeasGate({ qi, delay }: { qi: number; delay: number }) {
  const [x1, x2] = CIRC_X.meas
  const y = CQY[qi], cx = (x1 + x2) / 2, w = x2 - x1, h = 26
  const arcR = (w - 14) / 2
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: `${cx}px ${y}px` }}
    >
      <rect x={x1} y={y - h / 2} width={w} height={h} rx={4}
        fill="oklch(0.15 0.01 250)" stroke="oklch(0.32 0.01 250)" strokeWidth={1.2} />
      <path d={`M${x1 + 7},${y + 6} A${arcR},${arcR} 0 0,1 ${x2 - 7},${y + 6}`}
        fill="none" stroke="oklch(0.48 0.01 250)" strokeWidth={1.2} />
      <motion.line
        x1={cx} y1={y + 6} x2={cx - 2} y2={y - 4}
        stroke="oklch(0.78 0.01 250)" strokeWidth={1.4} strokeLinecap="round"
        initial={{ rotate: -45 }} animate={{ rotate: 18 }}
        transition={{ delay: delay + 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${y + 6}px` }}
      />
    </motion.g>
  )
}

function SQAOACircuit() {
  const coral = COST_COLOR
  const blue  = MIXER_COLOR
  const zzOffsets1 = [122, 152, 182]
  const zzOffsets2 = [406, 436, 466]
  const mixCx1 = (CIRC_X.mix1[0] + CIRC_X.mix1[1]) / 2
  const mixCx2 = (CIRC_X.mix2[0] + CIRC_X.mix2[1]) / 2

  const hyperparams = [
    { k: 'Layers (p)',          v: '2'      },
    { k: 'Classical optimizer', v: 'COBYLA' },
    { k: 'maxiter',             v: '50'     },
    { k: 'Random restarts',     v: '3'      },
  ]

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 50% at 65% 45%, oklch(0.72 0.18 35 / 0.05), transparent 70%)' }} />

      {/* LEFT editorial — 34% */}
      <div className="relative z-10 flex w-[34%] shrink-0 flex-col justify-center px-14 gap-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground/60">Quantum Circuit</span>
        </motion.div>
        <span className="h-px w-16 origin-left bg-primary/70" style={{ animation: 'qa-rule 800ms cubic-bezier(0.76,0,0.24,1) 140ms both' }} />
        <motion.h1 className="font-serif italic leading-[0.9] tracking-tight text-foreground"
          style={{ fontSize: 'clamp(2.6rem, 4.2vw, 3.8rem)' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          QAOA<br />Circuit.
        </motion.h1>
        <motion.p className="font-serif italic text-[13.5px] leading-[1.8] text-foreground/65 max-w-[36ch]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}>
          Two alternating layers of cost (H<sub>C</sub>) and mixer (H<sub>M</sub>) unitaries
          applied to 4 qubits. COBYLA minimises ⟨C⟩ by tuning γ and β between runs.
        </motion.p>

        {/* hyperparameter table */}
        <motion.div className="rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'oklch(0.115 0.018 250)', border: `1px solid ${coral}28` }}>
          {hyperparams.map(({ k, v }, i) => (
            <div key={k} className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: i < hyperparams.length - 1 ? '1px solid oklch(0.17 0.01 250)' : 'none' }}>
              <span className="font-mono text-[11px] text-muted-foreground/70">{k}</span>
              <span className="font-mono text-sm font-semibold" style={{ color: coral }}>{v}</span>
            </div>
          ))}
        </motion.div>

        {/* equation strip — left column */}
        <motion.div className="flex flex-col gap-2.5 mt-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
          {[
            { label: 'cost H', latex: 'H_C = \\textstyle\\sum_{i<j} J_{ij}\\,Z_i Z_j', color: coral },
            { label: 'mixer H', latex: 'H_M = \\textstyle\\sum_i X_i', color: blue },
          ].map(({ label, latex, color }) => (
            <div key={label} className="flex items-center gap-3 rounded-lg px-4 py-2.5"
              style={{ background: 'oklch(0.105 0.015 250)', border: `1px solid ${color}20` }}>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 w-12 shrink-0">{label}</span>
              <TexGlow latex={latex} color={color} size="0.82rem" delay={0.6} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* RIGHT — circuit plate 66% */}
      <div className="relative z-10 flex flex-1 flex-col pr-10 pl-3 py-8">
        {/* legend header */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <div className="flex gap-5">
            {[
              { c: coral, label: 'Cost unitary  e^{-iγH_C}' },
              { c: blue,  label: 'Mixer  e^{-iβH_M}' },
            ].map(({ c, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c, opacity: 0.85 }} />
                <span className="font-mono text-[10px] text-muted-foreground/60">{label}</span>
              </div>
            ))}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40">p = 2 layers · 4 qubits</div>
        </div>

        {/* circuit plate */}
        <motion.div className="relative flex-1 min-h-0 rounded-xl overflow-hidden flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'transparent' }}>
          <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-full" style={{ maxHeight: '100%' }}
            preserveAspectRatio="xMinYMid meet">

            {/* layer bounding boxes */}
            <motion.rect
              x={CIRC_X.cost1[0] - 12} y={CQY[0] - 52}
              width={CIRC_X.mix1[1] - CIRC_X.cost1[0] + 24}
              height={CQY[CQY.length - 1] - CQY[0] + 104}
              rx={10}
              fill={`color-mix(in oklch, ${COST_COLOR} 4%, transparent)`}
              stroke={`color-mix(in oklch, ${COST_COLOR} 20%, transparent)`}
              strokeWidth={1.1} strokeDasharray="4 3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
            <motion.text
              x={CIRC_X.cost1[0] - 12} y={CQY[0] - 58}
              fontSize={8} fontFamily="monospace" letterSpacing="0.14em"
              fill={COST_COLOR} fillOpacity={0.45}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>LAYER 1</motion.text>

            <motion.rect
              x={CIRC_X.cost2[0] - 12} y={CQY[0] - 52}
              width={CIRC_X.mix2[1] - CIRC_X.cost2[0] + 24}
              height={CQY[CQY.length - 1] - CQY[0] + 104}
              rx={10}
              fill={`color-mix(in oklch, ${MIXER_COLOR} 4%, transparent)`}
              stroke={`color-mix(in oklch, ${MIXER_COLOR} 20%, transparent)`}
              strokeWidth={1.1} strokeDasharray="4 3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.85 }} />
            <motion.text
              x={CIRC_X.cost2[0] - 12} y={CQY[0] - 58}
              fontSize={8} fontFamily="monospace" letterSpacing="0.14em"
              fill={MIXER_COLOR} fillOpacity={0.45}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>LAYER 2</motion.text>

            {/* qubit wires */}
            {CQY.map((y, qi) => (
              <motion.line key={`w${qi}`} x1={CIRC_X.wireStart} y1={y} x2={CIRC_X.wireEnd} y2={y}
                stroke="oklch(0.26 0.01 250)" strokeWidth={1.5}
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
                style={{ transformOrigin: `${CIRC_X.wireStart}px ${y}px` } as React.CSSProperties}
                transition={{ delay: qi * 0.07, duration: 0.55, ease: 'easeOut' }} />
            ))}

            {/* |0⟩ labels */}
            {CQY.map((y, qi) => (
              <motion.text key={`lbl${qi}`} x={CIRC_X.label} y={y + 5.5} textAnchor="end"
                fontSize={15} fontFamily="KaTeX_Math, serif" fontStyle="italic"
                fill="oklch(0.42 0.01 250)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + qi * 0.07 }}>|0⟩</motion.text>
            ))}

            {/* H gates */}
            {CQY.map((_, qi) => (
              <HGate key={`H${qi}`} qi={qi} delay={0.4 + qi * 0.07} />
            ))}

            {/* Layer 1 — cost */}
            <CircBlock x1={CIRC_X.cost1[0]} x2={CIRC_X.cost1[1]}
              color={COST_COLOR} latexLabel="e^{-i\gamma_1 H_C}" delay={0.72} />
            {zzOffsets1.map((x, qi) => (
              <ZZPair key={`zz1-${qi}`} x={x} qi={qi} delay={0.9 + qi * 0.09} />
            ))}

            {/* Layer 1 — mixer */}
            <CircBlock x1={CIRC_X.mix1[0]} x2={CIRC_X.mix1[1]}
              color={MIXER_COLOR} latexLabel="e^{-i\beta_1 H_M}" delay={1.28} />
            {CQY.map((_, qi) => (
              <RxGate key={`rx1-${qi}`} cx={mixCx1} qi={qi} delay={1.44 + qi * 0.07} />
            ))}


            {/* Layer 2 — cost */}
            <CircBlock x1={CIRC_X.cost2[0]} x2={CIRC_X.cost2[1]}
              color={COST_COLOR} latexLabel="e^{-i\gamma_2 H_C}" delay={1.92} />
            {zzOffsets2.map((x, qi) => (
              <ZZPair key={`zz2-${qi}`} x={x} qi={qi} delay={2.08 + qi * 0.09} />
            ))}

            {/* Layer 2 — mixer */}
            <CircBlock x1={CIRC_X.mix2[0]} x2={CIRC_X.mix2[1]}
              color={MIXER_COLOR} latexLabel="e^{-i\beta_2 H_M}" delay={2.42} />
            {CQY.map((_, qi) => (
              <RxGate key={`rx2-${qi}`} cx={mixCx2} qi={qi} delay={2.58 + qi * 0.07} />
            ))}

            {/* measurements */}
            {CQY.map((_, qi) => (
              <MeasGate key={`meas${qi}`} qi={qi} delay={2.88 + qi * 0.08} />
            ))}

            {/* classical readout wires */}
            {CQY.map((y, qi) => (
              <motion.line key={`cw${qi}`}
                x1={CIRC_X.meas[1]} y1={y} x2={CIRC_X.wireEnd} y2={y}
                stroke="oklch(0.34 0.01 250)" strokeWidth={2} strokeDasharray="5 3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 3.15 + qi * 0.07 }} />
            ))}

            {/* classical bus */}
            <motion.line x1={CIRC_X.wireEnd} y1={CQY[0]} x2={CIRC_X.wireEnd} y2={CQY[CQY.length - 1]}
              stroke="oklch(0.30 0.01 250)" strokeWidth={2}
              initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
              style={{ transformOrigin: `${CIRC_X.wireEnd}px ${CQY[0]}px` } as React.CSSProperties}
              transition={{ delay: 3.42, duration: 0.22 }} />

            {/* "⟶ COBYLA" label at end of bus */}
            <motion.text x={CIRC_X.wireEnd + 6} y={CQY[1] + 5}
              fontSize={9} fontFamily="monospace" fontWeight="700"
              fill={COST_COLOR} fillOpacity={0.75} letterSpacing="0.1em"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.55 }}>
              → COBYLA
            </motion.text>

            {/* COBYLA feedback arc — updates γ,β for next run */}
            <defs>
              <marker id="cobyla-tip" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 Z" fill={COST_COLOR} opacity={0.6} />
              </marker>
            </defs>
            <motion.path
              d={`M ${CIRC_X.wireEnd},${CQY[CQY.length - 1] + 30}
                  C ${CIRC_X.wireEnd + 42},${CQY[CQY.length - 1] + 80}
                    ${mixCx1 + 30},${CQY[CQY.length - 1] + 80}
                    ${mixCx1},${CQY[CQY.length - 1] + 30}`}
              fill="none" stroke={COST_COLOR} strokeWidth={1.3} strokeOpacity={0.5}
              strokeDasharray="5 3"
              markerEnd="url(#cobyla-tip)"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 3.7, duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
            />
            <motion.text x={(CIRC_X.wireEnd + mixCx1) / 2} y={CQY[CQY.length - 1] + 90}
              fontSize={8} fontFamily="monospace" textAnchor="middle"
              fill={COST_COLOR} fillOpacity={0.45} letterSpacing="0.1em"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.4 }}>
              update γ, β
            </motion.text>
          </svg>
        </motion.div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── QAOA variational loop slide */
const LOOP_CORAL = '#e06c3a'
const LOOP_GREEN = '#4ade80'
const LOOP_BLUE  = '#6b8cff'

/* ── React Flow custom node types ── */
type LoopNodeData = { label: string; sub?: string; nodeType: 'init' | 'process' | 'diamond' | 'output' }

function FlowNodePill({ data }: { data: LoopNodeData }) {
  const color = data.nodeType === 'output' ? LOOP_GREEN : LOOP_CORAL
  return (
    <div style={{
      minWidth: 220, padding: '8px 20px', borderRadius: 999, textAlign: 'center',
      background: `color-mix(in oklch, ${color} 12%, oklch(0.10 0.015 250))`,
      border: `1.5px solid ${color}cc`,
      boxShadow: `0 0 18px ${color}18`,
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, fontWeight: 700, color }}>{data.label}</div>
      {data.sub && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color, opacity: 0.55, marginTop: 2 }}>{data.sub}</div>}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

function FlowNodeProcess({ data }: { data: LoopNodeData }) {
  const color = data.nodeType === 'process' ? LOOP_BLUE : '#a0b0ff'
  return (
    <div style={{
      width: 260, height: 56, display: 'flex', alignItems: 'center',
      padding: '0 14px 0 18px', borderRadius: 8, gap: 0,
      background: 'oklch(0.115 0.018 250)',
      border: `1px solid ${color}38`,
      borderLeft: `3px solid ${color}cc`,
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, fontWeight: 600, color, opacity: 0.9 }}>{data.label}</div>
        {data.sub && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'oklch(0.44 0.01 250)', marginTop: 3 }}>{data.sub}</div>}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

function FlowNodeDiamond({ data }: { data: LoopNodeData }) {
  return (
    <div style={{ width: 140, height: 70, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        background: `color-mix(in oklch, ${LOOP_CORAL} 12%, oklch(0.10 0.015 250))`,
        border: `1.5px solid ${LOOP_CORAL}bb`,
      }} />
      <span style={{
        position: 'relative', fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11.5, fontWeight: 700, color: LOOP_CORAL,
      }}>{data.label}</span>
      <Handle type="source" id="yes" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" id="no" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  )
}

const FLOW_NODE_TYPES = {
  pill: FlowNodePill,
  process: FlowNodeProcess,
  diamond: FlowNodeDiamond,
} as const

function SQAOALoop() {
  const nodes: Node[] = [
    { id: 'init',    type: 'pill',    position: { x: 90, y: 20  }, data: { label: 'Initialise θ₀', sub: '(γ₁, β₁, … , γₚ, βₚ)', nodeType: 'init' } },
    { id: 'prep',    type: 'process', position: { x: 80, y: 110 }, data: { label: 'Prepare |ψ(θ)⟩', sub: 'p alternating cost & mixer layers', nodeType: 'process' } },
    { id: 'meas',    type: 'process', position: { x: 80, y: 210 }, data: { label: 'Measure ⟨C(θ)⟩', sub: 'circuit sampling · expectation value', nodeType: 'process' } },
    { id: 'update',  type: 'process', position: { x: 80, y: 310 }, data: { label: 'COBYLA: minimise ⟨C⟩', sub: 'gradient-free classical update', nodeType: 'cobyla' } },
    { id: 'conv',    type: 'diamond', position: { x: 90, y: 415 }, data: { label: 'Converged?', nodeType: 'diamond' } },
    { id: 'output',  type: 'pill',    position: { x: 90, y: 530 }, data: { label: 'Return θ*  ·  best route', nodeType: 'output' } },
  ]

  const edges: Edge[] = [
    { id: 'e-init-prep',   source: 'init',   target: 'prep',   animated: false, style: { stroke: LOOP_CORAL, strokeWidth: 1.5, opacity: 0.6 }, markerEnd: { type: 'arrowclosed' as const, color: LOOP_CORAL, width: 16, height: 16 } },
    { id: 'e-prep-meas',   source: 'prep',   target: 'meas',   animated: false, style: { stroke: LOOP_CORAL, strokeWidth: 1.5, opacity: 0.6 }, markerEnd: { type: 'arrowclosed' as const, color: LOOP_CORAL, width: 16, height: 16 } },
    { id: 'e-meas-upd',    source: 'meas',   target: 'update', animated: false, style: { stroke: LOOP_CORAL, strokeWidth: 1.5, opacity: 0.6 }, markerEnd: { type: 'arrowclosed' as const, color: LOOP_CORAL, width: 16, height: 16 } },
    { id: 'e-upd-conv',    source: 'update', target: 'conv',   animated: false, style: { stroke: LOOP_CORAL, strokeWidth: 1.5, opacity: 0.6 }, markerEnd: { type: 'arrowclosed' as const, color: LOOP_CORAL, width: 16, height: 16 } },
    { id: 'e-conv-yes',    source: 'conv',   target: 'output', sourceHandle: 'yes', animated: false, label: 'Yes', labelStyle: { fill: LOOP_GREEN, fontFamily: 'JetBrains Mono', fontSize: 10 }, style: { stroke: LOOP_GREEN, strokeWidth: 1.5, opacity: 0.7 }, markerEnd: { type: 'arrowclosed' as const, color: LOOP_GREEN, width: 16, height: 16 } },
    { id: 'e-conv-no',     source: 'conv',   target: 'prep',   sourceHandle: 'no', type: 'smoothstep', animated: true, label: 'No', labelStyle: { fill: LOOP_CORAL, fontFamily: 'JetBrains Mono', fontSize: 10 }, labelBgStyle: { fill: 'oklch(0.12 0.02 250)', fillOpacity: 0.9 }, style: { stroke: LOOP_CORAL, strokeWidth: 1.5, strokeDasharray: '5 4', opacity: 0.55 }, markerEnd: { type: 'arrowclosed' as const, color: LOOP_CORAL, width: 14, height: 14 } },
  ]

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 48% 40% at 76% 48%, oklch(0.72 0.18 35 / 0.06), transparent 70%)' }} />

      {/* LEFT editorial */}
      <div className="relative z-10 flex w-[32%] shrink-0 flex-col justify-center px-14 gap-5">
        <div style={{ animation: 'qa-numeral 700ms cubic-bezier(0.76,0,0.24,1) 60ms both' }}>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground/60">Variational Algorithm</span>
        </div>
        <span className="h-px w-16 origin-left bg-primary/70" style={{ animation: 'qa-rule 800ms cubic-bezier(0.76,0,0.24,1) 140ms both' }} />
        <h1 className="font-serif italic leading-[0.9] tracking-tight text-foreground"
          style={{ fontSize: 'clamp(2.6rem, 4.5vw, 4rem)', animation: 'qa-title 850ms cubic-bezier(0.76,0,0.24,1) 180ms both' }}>
          QAOA<br />Optimization<br />Loop.
        </h1>
        <p className="max-w-[38ch] font-serif italic text-[14px] leading-[1.8] text-foreground/70"
          style={{ animation: 'qa-soft 850ms cubic-bezier(0.76,0,0.24,1) 360ms both' }}>
          COBYLA tunes the angle vector θ = (γ, β) until ⟨C⟩ converges.
          Warm-starting seeds θ₀ from a prior solved instance cuts iterations by 60%.
        </p>
        <div className="mt-2 border-t border-border/40 pt-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {[
              { v: 'γ, β', l: 'Angle pair' },
              { v: 'p', l: 'Circuit depth' },
              { v: 'COBYLA', l: 'Optimizer' },
              { v: 'θ*', l: 'Warm-start seed' },
            ].map((st, i) => (
              <div key={i} className="flex items-baseline justify-between border-b border-border/25 pb-2"
                style={{ animation: `qa-stat 600ms cubic-bezier(0.76,0,0.24,1) ${440 + i * 70}ms both` }}>
                <span className="text-[9px] uppercase tracking-[0.32em] text-muted-foreground/55 font-mono">{st.l}</span>
                <span className="font-serif italic text-lg tabular-nums text-foreground/90">{st.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — React Flow flowchart */}
      <div className="relative z-10 flex flex-1 flex-col pr-10 pl-4 py-8">
        <div className="flex items-end justify-between pb-3 shrink-0">
          <div className="flex items-baseline gap-3 font-mono">
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/50">Algorithm</span>
            <span className="font-serif italic text-2xl text-foreground/90">Loop</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45 font-mono">QAOA · COBYLA · Warm-Start</div>
        </div>

        <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden"
          style={{ background: 'transparent' }}>

          {/* warm-start annotation */}
          <motion.div className="absolute top-4 right-5 z-20 rounded-lg p-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ background: 'oklch(0.12 0.03 160)', border: `1px dashed ${LOOP_GREEN}55`, maxWidth: 172 }}>
            <div className="font-mono text-[11px] font-bold mb-1" style={{ color: LOOP_GREEN }}>Warm-Start</div>
            <div className="font-mono text-[11px]" style={{ color: LOOP_GREEN, opacity: 0.8 }}>θ₀ ← θ*_source</div>
            <div className="font-mono text-[10px] mt-1 italic" style={{ color: 'oklch(0.40 0.01 250)' }}>Cold: θ₀ ← random</div>
          </motion.div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={FLOW_NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            <Background color="oklch(0.22 0.01 250)" gap={32} size={1} style={{ opacity: 0.3 }} />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 4 — quantum recap */

/* Qubit viz: two probability bars seesawing — showing the coin-in-air metaphor */
function QubitViz() {
  const barW = 22, bottom = 62
  const h0anim = [44, 28, 8, 28, 44]
  const h1anim = [8,  28, 44, 28, 8 ]
  return (
    <svg viewBox="0 0 100 76" className="w-full h-full">
      {/* track backgrounds */}
      <rect x={18} y={bottom - 44} width={barW} height={44} rx={4} fill="oklch(0.18 0.01 250)" />
      <rect x={60} y={bottom - 44} width={barW} height={44} rx={4} fill="oklch(0.18 0.01 250)" />

      {/* bar 0 */}
      <motion.rect
        x={18} width={barW} rx={4}
        fill="oklch(0.72 0.18 35)"
        animate={{
          height: h0anim,
          y: h0anim.map((h) => bottom - h),
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
      />
      {/* bar 1 */}
      <motion.rect
        x={60} width={barW} rx={4}
        fill="oklch(0.62 0.19 230)"
        animate={{
          height: h1anim,
          y: h1anim.map((h) => bottom - h),
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
      />

      {/* labels */}
      <text x={29} y={72} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="oklch(0.45 0.01 250)">0</text>
      <text x={71} y={72} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="oklch(0.45 0.01 250)">1</text>

      {/* "both" label pulses at equilibrium */}
      <motion.text x={50} y={36} textAnchor="middle" fontSize={7} fontFamily="monospace"
        fill="oklch(0.72 0.18 35)"
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.35, 0.45, 0.55, 0.65], repeatType: 'mirror' }}
      >both</motion.text>
    </svg>
  )
}

/* Superposition viz: grid of 12 cells all lighting up together — "all at once" */
function SuperpositionViz() {
  const cols = 4, rows = 3
  return (
    <svg viewBox="0 0 100 76" className="w-full h-full">
      {Array.from({ length: cols * rows }, (_, i) => {
        const col = i % cols, row = Math.floor(i / cols)
        return (
          <motion.rect
            key={i}
            x={6 + col * 23} y={6 + row * 21}
            width={18} height={15} rx={3}
            fill="oklch(0.72 0.18 35)"
            animate={{ opacity: [0.08, 0.88, 0.08] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,           // all start together — that's the point
            }}
          />
        )
      })}
      <motion.text x={50} y={74} textAnchor="middle" fontSize={7} fontFamily="monospace"
        fill="oklch(0.72 0.18 35)"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      >all at once</motion.text>
    </svg>
  )
}

/* Entanglement viz: two nodes pulse in sync — measuring one collapses both */
function EntanglementViz() {
  const pulseProps = {
    animate: { r: [12, 19, 12], strokeOpacity: [0.7, 0, 0.7] } as const,
    transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const },
  }
  return (
    <svg viewBox="0 0 100 76" className="w-full h-full">
      {/* dashed connection */}
      <line x1={30} y1={36} x2={70} y2={36} stroke="oklch(0.32 0.01 250)" strokeWidth={1} strokeDasharray="3,2.5" />

      {/* pulsing halos — same phase = entangled */}
      <motion.circle cx={19} cy={36} r={12} fill="none" stroke="oklch(0.72 0.18 35)" strokeWidth={1.2} {...pulseProps} />
      <motion.circle cx={81} cy={36} r={12} fill="none" stroke="oklch(0.72 0.18 35)" strokeWidth={1.2} {...pulseProps} />

      {/* static node bodies */}
      <circle cx={19} cy={36} r={11} fill="oklch(0.62 0.19 230 / 0.14)" stroke="oklch(0.62 0.19 230)" strokeWidth={1.5} />
      <text x={19} y={40} textAnchor="middle" fontSize={8.5} fontFamily="monospace" fill="oklch(0.62 0.19 230)">A</text>
      <circle cx={81} cy={36} r={11} fill="oklch(0.68 0.15 158 / 0.14)" stroke="oklch(0.68 0.15 158)" strokeWidth={1.5} />
      <text x={81} y={40} textAnchor="middle" fontSize={8.5} fontFamily="monospace" fill="oklch(0.68 0.15 158)">B</text>

      {/* "in sync" label pulses with the halos */}
      <motion.text x={50} y={18} textAnchor="middle" fontSize={7} fontFamily="monospace"
        fill="oklch(0.72 0.18 35)"
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >in sync</motion.text>

      {/* sub-labels */}
      <text x={19} y={56} textAnchor="middle" fontSize={6} fontFamily="monospace" fill="oklch(0.38 0.01 250)">measure</text>
      <text x={81} y={56} textAnchor="middle" fontSize={6} fontFamily="monospace" fill="oklch(0.38 0.01 250)">knows</text>
    </svg>
  )
}

function SQuantumRecap() {
  const concepts = [
    {
      label: 'Qubit',
      icon: <Atom size={15} />,
      headline: 'A coin mid-flip.',
      body: 'A normal bit is always 0 or 1 — a coin lying flat. A qubit is that same coin while it\'s still spinning: genuinely both at once, until the moment you look at it.',
      detail: 'Reading a qubit collapses it to 0 or 1 — the act of measuring destroys the superposition.',
      viz: <QubitViz />,
    },
    {
      label: 'Superposition',
      icon: <Layers size={15} />,
      headline: 'Try everything at once.',
      body: 'A classical computer checks one route, then the next. A quantum computer holds every possible solution simultaneously and operates on all of them in a single step.',
      detail: '50 qubits encode 2⁵⁰ ≈ 10¹⁵ states at the same time.',
      viz: <SuperpositionViz />,
    },
    {
      label: 'Entanglement',
      icon: <Wifi size={15} />,
      headline: 'Instant shared fate.',
      body: 'Two qubits can be linked so that measuring one instantly determines the other — no matter how far apart. The whole system shares information as a single connected unit.',
      detail: 'Einstein called it "spooky action at a distance."',
      viz: <EntanglementViz />,
    },
  ] as const

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-10">
      <motion.div
        className="w-full max-w-7xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="text-center mb-2">
          <Ey>Quantum Fundamentals</Ey>
        </div>
        <div className="text-center">
          <H size="lg">Before the equations.</H>
        </div>
        <div className="flex justify-center"><Hr /></div>
        <p className="text-base text-muted-foreground text-center mb-10 max-w-[58ch] mx-auto leading-relaxed">
          Three ideas — no physics background required — that explain why quantum hardware can
          attack problems classical computers cannot.
        </p>

        <div className="grid grid-cols-3 gap-7">
          {concepts.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Card className="px-8 py-7 h-full flex flex-col" glow={i === 0}>
                {/* header */}
                <div className="flex items-center gap-3 mb-6">
                  <span style={{ color: 'var(--primary)' }}>{React.cloneElement(c.icon as React.ReactElement, { size: 20 })}</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-mono">{c.label}</span>
                </div>

                {/* animated visual — taller */}
                <div className="mb-6 w-full" style={{ height: 120 }}>{c.viz}</div>

                {/* punchy headline */}
                <div className="text-xl font-light text-foreground mb-3">{c.headline}</div>

                {/* plain-English body */}
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">{c.body}</p>

                {/* footnote */}
                <div className="mt-5 pt-4 border-t border-border text-[11px] font-mono text-muted-foreground">
                  {c.detail}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 5 — dataset */
const AN_GEOJSON: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Point', coordinates: [DEPOT_LON, DEPOT_LAT] },
}

function SDataset({ token }: { token: string }) {
  const mapRef = useRef<MapRef>(null)
  const { resolvedAppearance } = useAppearance()
  const mapStyle = mapboxStyleFor(resolvedAppearance)

  useEffect(() => {
    const t = setTimeout(() => {
      mapRef.current?.flyTo({
        center: [DEPOT_LON, DEPOT_LAT],
        zoom: 12.5,
        duration: 3200,
        essential: true,
        curve: 1.6,
      })
    }, 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <Split
      L={
        <div>
          <Ey>The Dataset</Ey>
          <H size="lg">Artur Nogueira, Brazil.</H>
          <Hr />
          <P>
            A real Brazilian municipality with non-uniform delivery probabilities shaped
            by city zone, street type, and region — simulating real logistics demand.
          </P>

          {/* Probability factors */}
          <div className="mt-5 flex flex-wrap gap-2">
            {['City Zone', 'Street Type', 'Region'].map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">non-uniform delivery probability factors</div>

          {/* Scale comparison */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Solomon Benchmark</div>
              <div className="font-serif italic text-foreground" style={{ fontSize: '1.6rem', lineHeight: 1 }}>100</div>
              <div className="text-[9px] text-muted-foreground mt-1">locations</div>
            </div>
            <div
              className="rounded-xl px-4 py-3"
              style={{
                border: '1px solid color-mix(in oklch, var(--primary) 38%, transparent)',
                background: 'color-mix(in oklch, var(--primary) 7%, transparent)',
              }}
            >
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Artur Nogueira</div>
              <div className="font-serif italic" style={{ fontSize: '1.6rem', lineHeight: 1, color: 'var(--primary)' }}>30,000</div>
              <div className="text-[9px] text-muted-foreground mt-1">locations</div>
            </div>
          </div>

          {/* Benchmark specs */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { k: 'Distance Matrix', v: 'Pre-computed' },
              { k: 'Coords + R_max', v: '(x, y) per node' },
              { k: 'Vehicle Capacity', v: 'Unlimited' },
              { k: 'Street Graph', v: 'Weighted G' },
            ].map(({ k, v }) => (
              <div key={k} className="rounded-lg border border-border bg-card px-3 py-2">
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">{k}</div>
                <div className="text-xs font-mono" style={{ color: 'var(--primary)' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Cost function */}
          <div className="mt-4 rounded-xl border border-border bg-card px-5 py-4">
            <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2.5">
              Edge Cost · w(d<sub>a</sub>, d<sub>b</sub>)
            </div>
            <div className="font-mono text-sm flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span style={{ color: 'var(--chart-2)' }}>minpath</span>
              <span className="text-muted-foreground text-xs">(d<sub>a</sub>, d<sub>b</sub>, G)</span>
              <span className="text-muted-foreground">+</span>
              <span style={{ color: 'var(--chart-4)' }}>cross</span>
              <span className="text-muted-foreground text-xs">(d<sub>a</sub>, d<sub>b</sub>)</span>
              <span className="text-muted-foreground">+</span>
              <span style={{ color: 'var(--chart-3)' }}>β</span>
            </div>
            <div className="mt-2.5 space-y-1 text-[9px] text-muted-foreground">
              <div><span style={{ color: 'var(--chart-2)' }}>minpath</span> — shortest path in street graph G</div>
              <div><span style={{ color: 'var(--chart-4)' }}>cross</span> — penalty for frequent street crossings</div>
              <div><span style={{ color: 'var(--chart-3)' }}>β</span> — fixed per-edge overhead</div>
            </div>
          </div>
        </div>
      }
      R={
        <div className="relative rounded-xl overflow-hidden w-full" style={{ height: 480, boxShadow: '0 0 0 1px var(--border)' }}>
          {token ? (
            <Map
              ref={mapRef}
              mapboxAccessToken={token}
              initialViewState={{ longitude: -52, latitude: -14, zoom: 3.4 }}
              mapStyle={mapStyle}
              attributionControl={false}
              interactive={false}
              style={{ width: '100%', height: '100%' }}
            >
              <Source id="an-marker" type="geojson" data={AN_GEOJSON}>
                <Layer
                  id="an-glow"
                  type="circle"
                  paint={{ 'circle-radius': 36, 'circle-color': 'oklch(0.72 0.18 35)', 'circle-opacity': 0.15, 'circle-blur': 1 }}
                />
                <Layer
                  id="an-ring"
                  type="circle"
                  paint={{
                    'circle-radius': 15,
                    'circle-color': 'oklch(0.72 0.18 35)',
                    'circle-opacity': 0.1,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'oklch(0.72 0.18 35)',
                    'circle-stroke-opacity': 0.65,
                  }}
                />
                <Layer
                  id="an-dot"
                  type="circle"
                  paint={{ 'circle-radius': 7, 'circle-color': 'oklch(0.72 0.18 35)', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#ffffff' }}
                />
              </Source>
            </Map>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card text-muted-foreground text-sm">
              Map requires Mapbox token
            </div>
          )}
          {/* vignette */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{ boxShadow: 'inset 0 0 70px oklch(0.13 0.02 250 / 0.65)' }}
          />
          {/* coordinate badge */}
          <motion.div
            className="absolute bottom-3 left-3 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.6 }}
          >
            <span className="font-mono text-[10px] px-2.5 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground">
              22.57°S · 47.17°W · Artur Nogueira
            </span>
          </motion.div>
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

  const coral = '#e06c3a'
  const approaches = [
    {
      label: 'k clusters',
      verdict: 'rejected',
      color: '#ef4444',
      icon: '✗',
      desc: 'Fixed k produces uneven sub-problems. Small clusters waste qubits; large ones exceed the NISQ qubit budget.',
    },
    {
      label: '√N clusters',
      verdict: 'chosen',
      color: coral,
      icon: '✓',
      desc: 'Scales naturally with data. Balances sub-problem size, guarantees ≤ LEAF_SIZE nodes per leaf, and matches qubit constraints at any N.',
    },
    {
      label: 'Grid-based',
      verdict: 'rejected',
      color: '#ef4444',
      icon: '✗',
      desc: 'Rotating the grid changes the solution. Cluster membership is orientation-dependent, producing non-reproducible routes.',
    },
  ]

  return (
    <Split
      L={
        <div>
          <Ey>Partitioning Strategy</Ey>
          <H size="lg">How to split the nodes.</H>
          <Hr />
          <P>
            Before any QAOA can run, the full problem must be decomposed into small enough sub-problems.
            We evaluated three strategies — only one gives consistent, qubit-safe clusters at any scale.
          </P>
          <div className="mt-6 space-y-3">
            {approaches.map(({ label, verdict, color, icon, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.4 }}
                className="rounded-xl px-5 py-4 flex gap-4"
                style={{
                  border: `1px solid ${color}${verdict === 'chosen' ? '55' : '28'}`,
                  background: `${color}${verdict === 'chosen' ? '0e' : '06'}`,
                  opacity: verdict === 'chosen' ? 1 : 0.75,
                }}
              >
                <span className="text-xl shrink-0 mt-0.5" style={{ color }}>{icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold" style={{ color }}>{label}</span>
                    {verdict === 'chosen' && (
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ background: `${color}22`, color }}>Our choice</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      }
      R={
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">√N in action — 50 nodes → 7 clusters</div>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'cluster' ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <TexGlow latex="k = \lfloor\sqrt{N}\rfloor" color={coral} size="1.4rem" delay={0.8} />
          </motion.div>
        </div>
      }
    />
  )
}

/* ─────────────────────────────────────────── latex glow helper */
const QUBO_C_CORAL = '#e06c3a'
const QUBO_C_BLUE  = '#7b9fff'

function TexGlow({
  latex,
  color = QUBO_C_CORAL,
  size = '1.4rem',
  display = false,
  delay = 0.25,
}: {
  latex: string
  color?: string
  size?: string | number
  display?: boolean
  delay?: number
}) {
  const html = React.useMemo(() => tex(latex, color), [latex, color])
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        fontSize: size,
        display: display ? 'block' : 'inline-block',
        filter: `drop-shadow(0 0 8px ${color}cc) drop-shadow(0 0 22px ${color}66)`,
        lineHeight: 1.5,
      }}
    />
  )
}

/* ─────────────────────────────────────────── slide 10 — QUBO formulation choices */
function SQUBOPosition() {
  const coral = QUBO_C_CORAL
  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 55% at 20% 50%, color-mix(in oklch, var(--primary) 8%, transparent) 0%, transparent 70%)' }} />

      {/* LEFT editorial column */}
      <div className="relative z-10 flex w-[38%] shrink-0 flex-col justify-center px-14 gap-6">
        <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
          <div className="font-mono text-sm uppercase tracking-[0.22em] mb-2" style={{ color: coral, opacity: 0.7 }}>QUBO · k = 1</div>
          <div className="h-px w-16 mb-5 origin-left" style={{ background: coral, animation: 'qa-rule 0.55s 0.1s cubic-bezier(0.22,1,0.36,1) both' }} />
          <div className="font-serif italic font-light leading-[1.06] tracking-[-0.03em] text-foreground mb-4" style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', animation: 'qa-title 0.65s 0.15s both' }}>
            Position-Based<br />Encoding
          </div>
          <p className="text-base text-muted-foreground leading-relaxed" style={{ animation: 'qa-soft 0.5s 0.35s both' }}>
            When a leaf cluster needs exactly <span className="text-foreground font-medium">one vehicle</span>, we assign a binary variable to each node's position in that single route. The QUBO collapses to a pure distance-minimisation over node membership bits.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4" style={{ animation: 'qa-soft 0.5s 0.45s both' }}>
          {([
            { label: 'Decision variable', latex: 'x_{ip} \\in \\{0,1\\}' },
            { label: 'Constraint',        latex: '\\textstyle\\sum_p x_{ip} = \\sum_i x_{ip} = 1' },
            { label: 'Qubit count',       latex: 'n^2' },
          ] as { label: string; latex: string }[]).map(({ label, latex }, i) => (
            <div key={label} className="flex items-center gap-3" style={{ animation: `qa-stat 0.4s ${0.5 + i * 0.07}s both` }}>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground w-36 shrink-0">{label}</span>
              <TexGlow latex={latex} color={coral} size="0.9rem" delay={0.55 + i * 0.07} />
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.4 }} className="text-xs font-mono text-muted-foreground border-t pt-4" style={{ borderColor: 'color-mix(in oklch, var(--border) 60%, transparent)' }}>
          Permutation matrix — no sub-tours possible by construction.
        </motion.div>
      </div>

      {/* RIGHT — permutation matrix */}
      <div className="relative z-10 flex flex-1 flex-col pr-14 pl-4 py-16 justify-center">
        <div className="mb-4 flex items-center justify-between px-2">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground opacity-50">Position Matrix</span>
          <span className="font-mono text-xs text-muted-foreground opacity-40">Used when k = 1</span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl flex flex-col gap-6 p-9"
          style={{
            background: 'color-mix(in oklch, var(--card) 70%, transparent)',
            border: '1px solid color-mix(in oklch, var(--primary) 22%, var(--border) 60%)',
            boxShadow: '0 0 60px color-mix(in oklch, var(--primary) 10%, transparent), inset 0 1px 0 color-mix(in oklch, white 6%, transparent)',
          }}
        >
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            x<sub>ip</sub> = 1 if node i occupies position p in the tour
          </div>

          {/* Permutation matrix */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-2 ml-12">
              {['p₁','p₂','p₃','p₄'].map((p, j) => (
                <div key={j} className="w-14 text-center font-mono text-sm" style={{ color: coral, opacity: 0.55 }}>{p}</div>
              ))}
            </div>
            {([
              { row: 'n₁', vals: [0,1,0,0] },
              { row: 'n₂', vals: [0,0,0,1] },
              { row: 'n₃', vals: [1,0,0,0] },
              { row: 'n₄', vals: [0,0,1,0] },
            ] as { row: string; vals: number[] }[]).map(({ row, vals }, i) => (
              <motion.div key={row} className="flex items-center gap-2"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <span className="font-mono text-sm w-10 text-right mr-1" style={{ color: coral, opacity: 0.55 }}>{row}</span>
                {vals.map((v, j) => (
                  <div key={j} className="w-14 h-14 rounded-md flex items-center justify-center border font-mono text-base font-bold transition-all"
                    style={{
                      background: v === 1 ? `color-mix(in oklch, ${coral} 18%, transparent)` : 'transparent',
                      borderColor: v === 1 ? `${coral}55` : 'color-mix(in oklch, var(--border) 35%, transparent)',
                      color: v === 1 ? coral : 'var(--muted-foreground)',
                      opacity: v === 1 ? 1 : 0.3,
                      boxShadow: v === 1 ? `0 0 12px ${coral}33` : 'none',
                    }}>
                    {v}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

          <div className="h-px" style={{ background: 'color-mix(in oklch, var(--border) 50%, transparent)' }} />

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="font-mono text-xs text-muted-foreground">≤ 1 per row — each node visits exactly once</div>
              <div className="font-mono text-xs text-muted-foreground">≤ 1 per column — each position filled exactly once</div>
              <div className="font-mono text-xs" style={{ color: coral, opacity: 0.7 }}>No sub-tours possible by construction</div>
            </div>
            <div className="text-center shrink-0 ml-6">
              <TexGlow latex="n^2" color={coral} size="2.6rem" delay={0.85} />
              <div className="font-mono text-[11px] text-muted-foreground mt-1">qubits</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SQUBOEdge() {
  const blue = QUBO_C_BLUE
  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 55% 55% at 20% 50%, ${blue}14 0%, transparent 70%)` }} />

      {/* LEFT editorial column */}
      <div className="relative z-10 flex w-[38%] shrink-0 flex-col justify-center px-14 gap-6">
        <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
          <div className="font-mono text-sm uppercase tracking-[0.22em] mb-2" style={{ color: blue, opacity: 0.8 }}>QUBO · k &gt; 1</div>
          <div className="h-px w-16 mb-5 origin-left" style={{ background: blue, animation: 'qa-rule 0.55s 0.1s cubic-bezier(0.22,1,0.36,1) both' }} />
          <div className="font-serif italic font-light leading-[1.06] tracking-[-0.03em] text-foreground mb-4" style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', animation: 'qa-title 0.65s 0.15s both' }}>
            Edge-Based<br />Encoding
          </div>
          <p className="text-base text-muted-foreground leading-relaxed" style={{ animation: 'qa-soft 0.5s 0.35s both' }}>
            When a territory needs <span className="text-foreground font-medium">multiple vehicles</span> (k &gt; 1), we lift to edge variables. Each binary <span style={{ color: blue }}>x<sub>ij</sub></span> asks "does this route traverse edge i→j?" — enabling flow conservation across a fleet.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4" style={{ animation: 'qa-soft 0.5s 0.45s both' }}>
          {([
            { label: 'Decision variable', latex: 'x_{ij} \\in \\{0,1\\}' },
            { label: 'Vehicle count',     latex: 'k > 1' },
            { label: 'Qubit count',       latex: 'n^2 - n' },
          ] as { label: string; latex: string }[]).map(({ label, latex }, i) => (
            <div key={label} className="flex items-center gap-3" style={{ animation: `qa-stat 0.4s ${0.5 + i * 0.07}s both` }}>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground w-36 shrink-0">{label}</span>
              <TexGlow latex={latex} color={blue} size="0.9rem" delay={0.55 + i * 0.07} />
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.4 }} className="text-xs font-mono text-muted-foreground border-t pt-4" style={{ borderColor: 'color-mix(in oklch, var(--border) 60%, transparent)' }}>
          Applied at territory level — after leaves collapse to supernodes.
        </motion.div>
      </div>

      {/* RIGHT — adjacency matrix */}
      <div className="relative z-10 flex flex-1 flex-col pr-14 pl-4 py-16 justify-center">
        <div className="mb-4 flex items-center justify-between px-2">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground opacity-50">Adjacency Matrix</span>
          <span className="font-mono text-xs text-muted-foreground opacity-40">Used when k &gt; 1</span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl flex flex-col gap-6 p-9"
          style={{
            background: 'color-mix(in oklch, var(--card) 70%, transparent)',
            border: `1px solid ${blue}38`,
            boxShadow: `0 0 60px ${blue}22, inset 0 1px 0 color-mix(in oklch, white 6%, transparent)`,
          }}
        >
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            x<sub>ij</sub> = 1 if a vehicle travels edge i → j
          </div>

          {/* Adjacency matrix — directed, no self-loops */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-2 ml-12">
              {['→1','→2','→3','→4'].map((h, j) => (
                <div key={j} className="w-14 text-center font-mono text-sm" style={{ color: blue, opacity: 0.55 }}>{h}</div>
              ))}
            </div>
            {([
              { row: '1→', vals: ['—',1,0,0] },
              { row: '2→', vals: [0,'—',1,0] },
              { row: '3→', vals: [0,0,'—',1] },
              { row: '4→', vals: [1,0,0,'—'] },
            ] as { row: string; vals: (number | string)[] }[]).map(({ row, vals }, i) => (
              <motion.div key={row} className="flex items-center gap-2"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <span className="font-mono text-sm w-10 text-right mr-1" style={{ color: blue, opacity: 0.55 }}>{row}</span>
                {vals.map((v, j) => (
                  <div key={j} className="w-14 h-14 rounded-md flex items-center justify-center border font-mono text-base font-bold"
                    style={{
                      background: v === 1 ? `color-mix(in oklch, ${blue} 18%, transparent)` : v === '—' ? 'oklch(0.1 0.01 250)' : 'transparent',
                      borderColor: v === 1 ? `${blue}55` : v === '—' ? 'oklch(0.2 0.01 250)' : 'color-mix(in oklch, var(--border) 35%, transparent)',
                      color: v === 1 ? blue : v === '—' ? 'oklch(0.32 0.01 250)' : 'var(--muted-foreground)',
                      opacity: v === 1 ? 1 : v === '—' ? 1 : 0.3,
                      boxShadow: v === 1 ? `0 0 12px ${blue}33` : 'none',
                    }}>
                    {v}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

          <div className="h-px" style={{ background: 'color-mix(in oklch, var(--border) 50%, transparent)' }} />

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="font-mono text-xs text-muted-foreground">Diagonal excluded — no self-loops</div>
              <div className="font-mono text-xs text-muted-foreground">Row & column sums enforce flow conservation</div>
              <div className="font-mono text-xs" style={{ color: blue, opacity: 0.7 }}>Subtour elimination via penalty terms</div>
            </div>
            <div className="text-center shrink-0 ml-6">
              <TexGlow latex="n^2\!-\!n" color={blue} size="2.6rem" delay={0.85} />
              <div className="font-mono text-xs text-muted-foreground mt-1">qubits</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slides 16-24 — algorithm walkthrough (editorial) */
/* real 50-node recursive-QAOA run, mirrored from the notebook log */
const ALGO_D = { id: 0, x: 5215, y: 5704 }
const ALGO_NODES = [
  { id: 1, x: 5150, y: 2695 }, { id: 2, x: 4109, y: 4550 }, { id: 3, x: 7288, y: 4037 },
  { id: 4, x: 5752, y: 4789 }, { id: 5, x: 6929, y: 6198 }, { id: 6, x: 6415, y: 5207 },
  { id: 7, x: 6899, y: 3647 }, { id: 8, x: 4848, y: 6118 }, { id: 9, x: 8726, y: 5357 },
  { id: 10, x: 5753, y: 7314 }, { id: 11, x: 6486, y: 4478 }, { id: 12, x: 4625, y: 4208 },
  { id: 13, x: 9730, y: 4531 }, { id: 14, x: 6205, y: 3288 }, { id: 15, x: 7646, y: 4250 },
  { id: 16, x: 4977, y: 4406 }, { id: 17, x: 5216, y: 5449 }, { id: 18, x: 6035, y: 4479 },
  { id: 19, x: 4628, y: 4673 }, { id: 20, x: 4109, y: 6392 }, { id: 21, x: 8547, y: 3921 },
  { id: 22, x: 8817, y: 4205 }, { id: 23, x: 5174, y: 4326 }, { id: 24, x: 9751, y: 4805 },
  { id: 25, x: 5065, y: 3735 }, { id: 26, x: 5489, y: 5252 }, { id: 27, x: 9340, y: 4581 },
  { id: 28, x: 4857, y: 4233 }, { id: 29, x: 6204, y: 6646 }, { id: 30, x: 4214, y: 5714 },
  { id: 31, x: 4830, y: 5175 }, { id: 32, x: 5203, y: 3487 }, { id: 33, x: 7166, y: 4853 },
  { id: 34, x: 6808, y: 5478 }, { id: 35, x: 6644, y: 3425 }, { id: 36, x: 8002, y: 6832 },
  { id: 37, x: 7407, y: 4605 }, { id: 38, x: 5043, y: 4509 }, { id: 39, x: 3879, y: 4684 },
  { id: 40, x: 4052, y: 4353 }, { id: 41, x: 4040, y: 5465 }, { id: 42, x: 7385, y: 4592 },
  { id: 43, x: 3862, y: 4686 }, { id: 44, x: 8766, y: 4168 }, { id: 45, x: 6869, y: 6108 },
  { id: 46, x: 11032, y: 6436 }, { id: 47, x: 3566, y: 5953 }, { id: 48, x: 6263, y: 5758 },
  { id: 49, x: 4732, y: 5195 }, { id: 50, x: 7178, y: 4853 },
]
const ALGO_NM: Record<number, { id: number; x: number; y: number }> = { 0: ALGO_D }
ALGO_NODES.forEach((n) => { ALGO_NM[n.id] = n })

const ALGO_COLORS = [
  '#e0683a', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899',
  '#84cc16', '#14b8a6', '#d97706', '#6366f1', '#f43f5e', '#10b981', '#e879f9',
  '#0ea5e9', '#fb923c', '#8b5cf6', '#facc15', '#dc2626', '#2dd4bf', '#7c3aed', '#059669',
]

type ALeaf = { id: string; n: number[] }
const ALGO_LEAVES: ALeaf[] = [
  { id: 'L1', n: [6, 26, 48] }, { id: 'L2', n: [10, 29] }, { id: 'L3', n: [5, 34, 45] },
  { id: 'L4', n: [9, 36] }, { id: 'L5', n: [20, 47] }, { id: 'L6', n: [30, 41] },
  { id: 'L7', n: [8, 17] }, { id: 'Ls1', n: [14] }, { id: 'L8', n: [4, 11, 18] },
  { id: 'L9', n: [7, 35] }, { id: 'L10', n: [1, 25, 32] }, { id: 'L11', n: [12, 28] },
  { id: 'L12', n: [16, 38, 23] }, { id: 'L13', n: [19, 31, 49] }, { id: 'L14', n: [40, 2] },
  { id: 'L15', n: [39, 43] }, { id: 'L16', n: [3, 15] }, { id: 'L17', n: [37, 42] },
  { id: 'L18', n: [33, 50] }, { id: 'Ls2', n: [46] }, { id: 'L19', n: [21, 22, 44] },
  { id: 'L20', n: [13, 24, 27] },
]

type ATerr = { id: string; leaves: string[]; label: string }
const ALGO_TERR: ATerr[] = [
  { id: 'D1', leaves: ['L1', 'L2', 'L3'], label: 'NE Central' },
  { id: 'D2', leaves: ['L4'], label: 'Far NE' },
  { id: 'D3', leaves: ['L5', 'L6', 'L7'], label: 'NW' },
  { id: 'D4', leaves: ['Ls1', 'L8', 'L9'], label: 'S-Central E' },
  { id: 'D5', leaves: ['L10', 'L11', 'L12'], label: 'S-Central' },
  { id: 'D6', leaves: ['L13', 'L14', 'L15'], label: 'SW' },
  { id: 'D7', leaves: ['L16', 'L17', 'L18'], label: 'East' },
  { id: 'D8', leaves: ['Ls2', 'L19', 'L20'], label: 'Far East' },
]

const ALGO_FLEET = [
  { id: 'V1', clusters: ['D1', 'D3', 'D5', 'D6'], k: 3 },
  { id: 'V2', clusters: ['D4', 'D7'], k: 2 },
  { id: 'V3', clusters: ['D2', 'D8'], k: 2 },
]

/* step-1 display clusters — pre-k-means, showing varying sizes (some > 4) before refinement */
const STEP1_DISPLAY_CLUSTERS = [
  { id: 'S1', n: [6, 26, 48, 10, 29] },         // 5 nodes
  { id: 'S2', n: [5, 34, 45, 9, 36] },           // 5 nodes
  { id: 'S3', n: [20, 47, 30, 41, 8, 17] },      // 6 nodes
  { id: 'S4', n: [14] },                          // 1 node
  { id: 'S5', n: [4, 11, 18, 7, 35] },           // 5 nodes
  { id: 'S6', n: [1, 25, 32] },                  // 3 nodes
  { id: 'S7', n: [12, 28, 16, 38, 23] },         // 5 nodes
  { id: 'S8', n: [19, 31, 49, 40, 2, 39, 43] }, // 7 nodes
  { id: 'S9', n: [3, 15, 37, 42] },              // 4 nodes
  { id: 'S10', n: [33, 50] },                    // 2 nodes
  { id: 'S11', n: [46, 21, 22, 44, 13, 24, 27] }, // 7 nodes
]

/* plate geometry */
const A_W = 760, A_H = 520, A_PAD = 48
const A_XMIN = 3300, A_XMAX = 11300, A_YMIN = 2300, A_YMAX = 7500
const aSX = (v: number) => A_PAD + ((v - A_XMIN) / (A_XMAX - A_XMIN)) * (A_W - 2 * A_PAD)
const aSY = (v: number) => A_PAD + ((A_YMAX - v) / (A_YMAX - A_YMIN)) * (A_H - 2 * A_PAD)

function aCent(ids: number[]) {
  const pts = ids.map((i) => ALGO_NM[i]).filter(Boolean)
  if (!pts.length) return { x: ALGO_D.x, y: ALGO_D.y }
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length }
}
function aLeafCent(id: string) {
  const l = ALGO_LEAVES.find((x) => x.id === id)
  return l ? aCent(l.n) : { x: ALGO_D.x, y: ALGO_D.y }
}
function aTerrNodes(id: string) {
  const t = ALGO_TERR.find((x) => x.id === id)
  if (!t) return [] as number[]
  return t.leaves.flatMap((lid) => ALGO_LEAVES.find((x) => x.id === lid)?.n ?? [])
}
function aHullPath(pts: [number, number][], expand = 16) {
  if (pts.length < 2) return null
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const sorted = [...pts].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx))
  const ex = sorted.map((p) => {
    const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1
    return [p[0] + (dx / d) * expand, p[1] + (dy / d) * expand] as [number, number]
  })
  return ex.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + 'Z'
}

/* plate primitives */
function ANode({ id, r = 4.5, fill, stroke = '#fff', sw = 1.1, op = 1, animate = false, delay = 0 }:
  { id: number; r?: number; fill: string; stroke?: string; sw?: number; op?: number; animate?: boolean; delay?: number }) {
  const n = ALGO_NM[id] ?? ALGO_D
  const cx = aSX(n.x), cy = aSY(n.y)
  return (
    <motion.circle cx={cx} cy={cy} fill={fill} stroke={stroke} strokeWidth={sw}
      initial={animate ? { r: 0, opacity: 0 } : { r, opacity: op }}
      animate={{ r, opacity: op }}
      transition={animate ? { type: 'spring', stiffness: 320, damping: 15, delay } : { duration: 0 }} />
  )
}
function AEdge({ a, b, color, w = 2, dash, op = 0.8, animate = false, delay = 0 }:
  { a: number; b: number; color: string; w?: number; dash?: string; op?: number; animate?: boolean; delay?: number }) {
  const p = ALGO_NM[a] ?? ALGO_D, q = ALGO_NM[b] ?? ALGO_D
  const x1 = aSX(p.x), y1 = aSY(p.y), x2 = aSX(q.x), y2 = aSY(q.y)
  if (dash) {
    return <motion.line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}
      initial={animate ? { opacity: 0 } : { opacity: op }} animate={{ opacity: op }}
      transition={animate ? { duration: 0.45, delay } : { duration: 0 }} />
  }
  return <motion.line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round"
    initial={animate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: op }}
    animate={{ pathLength: 1, opacity: op }}
    transition={animate ? { duration: 0.65, delay, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }} />
}
function AHull({ ids, color, op = 0.12, expand = 16, dash, sw = 1.4, animate = false, delay = 0 }:
  { ids: number[]; color: string; op?: number; expand?: number; dash?: string; sw?: number; animate?: boolean; delay?: number }) {
  const pts = ids.map((i) => ALGO_NM[i]).filter(Boolean).map((p) => [aSX(p.x), aSY(p.y)] as [number, number])
  const d = aHullPath(pts, expand)
  if (!d) return null
  return (
    <motion.path d={d} fill={color} fillOpacity={op} stroke={color} strokeOpacity={0.42} strokeWidth={sw} strokeDasharray={dash}
      initial={animate ? { opacity: 0 } : { opacity: 1 }} animate={{ opacity: 1 }}
      transition={animate ? { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }} />
  )
}
function ASuper({ x, y, color, label, animate = false, delay = 0 }:
  { x: number; y: number; color: string; label?: string; animate?: boolean; delay?: number }) {
  const cx = aSX(x), cy = aSY(y)
  return (
    <motion.g initial={animate ? { opacity: 0, scale: 0.4 } : false} animate={{ opacity: 1, scale: 1 }}
      transition={animate ? { type: 'spring', stiffness: 260, damping: 16, delay } : { duration: 0 }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
      <motion.circle cx={cx} cy={cy} fill="none" stroke={color} strokeWidth={1.4}
        initial={{ r: 9, opacity: 0.5 }} animate={{ r: [9, 17, 9], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.3 }} />
      <circle cx={cx} cy={cy} r={8.5} fill={color} stroke="#fff" strokeWidth={1.6} />
      {label && <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#fff" fontWeight="700" fontFamily="monospace">{label}</text>}
    </motion.g>
  )
}
function ADepot() {
  const cx = aSX(ALGO_D.x), cy = aSY(ALGO_D.y)
  return (
    <g>
      <motion.circle cx={cx} cy={cy} fill="none" stroke="#facc15" strokeWidth={1.2}
        initial={{ r: 11, opacity: 0.45 }} animate={{ r: [11, 20, 11], opacity: [0.45, 0, 0.45] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx={cx} cy={cy} r={10} fill="#0f172a" stroke="#facc15" strokeWidth={2.4} />
      <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#facc15" fontWeight="800" fontFamily="monospace">D</text>
    </g>
  )
}

function buildAlgoPlate(step: number): React.ReactNode[] {
  const e: React.ReactNode[] = []
  const C = ALGO_COLORS

  if (step === 1) {
    // Combined: Angular Sweep + K-Means Refinement
    const K = Math.floor(Math.sqrt(ALGO_NODES.length))
    const byAngle = [...ALGO_NODES].sort(
      (a, b) => Math.atan2(a.y - ALGO_D.y, a.x - ALGO_D.x) - Math.atan2(b.y - ALGO_D.y, b.x - ALGO_D.x),
    )
    for (let s = 0; s < K - 1; s++) {
      const lastIdx = Math.floor((s + 1) * ALGO_NODES.length / K) - 1
      const nextIdx = lastIdx + 1
      if (nextIdx < ALGO_NODES.length) {
        const a1 = Math.atan2(byAngle[lastIdx].y - ALGO_D.y, byAngle[lastIdx].x - ALGO_D.x)
        const a2 = Math.atan2(byAngle[nextIdx].y - ALGO_D.y, byAngle[nextIdx].x - ALGO_D.x)
        const mid = (a1 + a2) / 2
        const D = 9000
        e.push(<motion.line key={`bnd${s}`}
          x1={aSX(ALGO_D.x)} y1={aSY(ALGO_D.y)}
          x2={aSX(ALGO_D.x + D * Math.cos(mid))} y2={aSY(ALGO_D.y + D * Math.sin(mid))}
          stroke="#e0683a" strokeWidth={0.7} strokeDasharray="5 6"
          initial={{ opacity: 0 }} animate={{ opacity: 0.28 }}
          transition={{ duration: 0.5, delay: 1.1 + s * 0.08 }} />)
      }
    }
    byAngle.forEach((n, i) =>
      e.push(<motion.line key={`ray${n.id}`} x1={aSX(ALGO_D.x)} y1={aSY(ALGO_D.y)} x2={aSX(n.x)} y2={aSY(n.y)}
        stroke="#e0683a" strokeWidth={0.6}
        initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} transition={{ duration: 0.3, delay: 0.3 + i * 0.02 }} />),
    )
    byAngle.forEach((n, i) =>
      e.push(<ANode key={`n${n.id}`} id={n.id} r={4} fill="#475569" stroke="#64748b" sw={1} animate delay={0.3 + i * 0.02} />),
    )
    e.push(<motion.line key="sweep" x1={aSX(ALGO_D.x)} y1={aSY(ALGO_D.y)} x2={aSX(ALGO_D.x)} y2={aSY(ALGO_D.y) - 250}
      stroke="#e0683a" strokeWidth={1.6}
      initial={{ rotate: -110, opacity: 0 }} animate={{ rotate: 250, opacity: [0, 0.7, 0] }}
      transition={{ duration: 2.6, ease: 'easeInOut', delay: 0.2 }}
      style={{ transformOrigin: `${aSX(ALGO_D.x)}px ${aSY(ALGO_D.y)}px` }} />)
    e.push(<text key="theta" x={aSX(ALGO_D.x) + 18} y={aSY(ALGO_D.y) - 16} fontSize="13" fontStyle="italic" fill="#94a3b8" fontFamily="serif">θ</text>)
    // initial clusters appear after sweep — some have > 4 nodes (before k-means refinement)
    STEP1_DISPLAY_CLUSTERS.forEach((cl, i) => {
      const c = C[i % C.length]
      e.push(<AHull key={`h${cl.id}`} ids={cl.n} color={c} op={0.14} animate delay={1.6 + i * 0.04} />)
      cl.n.forEach((nid, k) => e.push(<ANode key={`cn${nid}`} id={nid} r={5} fill={c} animate delay={1.7 + i * 0.05 + k * 0.025} />))
    })
    e.push(
      <motion.g key="kbadge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9, duration: 0.45 }}>
        <rect x={A_W - 168} y={12} width={154} height={22} rx={4}
          fill="oklch(0.115 0.015 250)" stroke="#e0683a" strokeWidth={0.6} strokeOpacity={0.45} />
        <text x={A_W - 91} y={27} textAnchor="middle" fontSize="9" fill="#e0683a" fontFamily="monospace" fontWeight="600">
          {`⌊√${ALGO_NODES.length}⌋ = ${K} sectors · k-means refines`}
        </text>
      </motion.g>,
    )
  }

  if (step === 2) {
    // Vehicle Allocation
    ALGO_LEAVES.forEach((l, i) => {
      const c = C[i % C.length]
      e.push(<AHull key={`lh${l.id}`} ids={l.n} color={c} op={0.05} />)
      l.n.forEach((nid) => e.push(<ANode key={`ln${nid}`} id={nid} r={4} fill={c} sw={0.8} op={0.85} />))
    })
    ALGO_TERR.forEach((t, ti) => {
      const c = C[ti]
      const allN = aTerrNodes(t.id)
      e.push(<AHull key={`th${t.id}`} ids={allN} color={c} op={0.1} expand={24} dash="6 3" animate delay={0.1 + ti * 0.06} />)
      const ct = aCent(allN)
      e.push(<motion.text key={`tl${t.id}`} x={aSX(ct.x)} y={aSY(ct.y) + 30} textAnchor="middle" fontSize="9" fill={c} fontFamily="monospace" fontWeight="600"
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.9, y: 0 }} transition={{ delay: 0.25 + ti * 0.06 }}>{t.label}</motion.text>)
    })
  }

  if (step === 3) {
    // Combined: Recursion Gate + Depot Connections
    ALGO_LEAVES.forEach((l, i) => {
      const c = C[i % C.length]
      e.push(<AHull key={`h${l.id}`} ids={l.n} color={c} op={0.07} />)
      l.n.forEach((nid) => e.push(<ANode key={`n${nid}`} id={nid} r={4} fill={c} op={0.9} />))
      const ct = aLeafCent(l.id)
      e.push(
        <motion.g key={`q${l.id}`} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.04 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle cx={aSX(ct.x)} cy={aSY(ct.y) - 18} r={7} fill="#0f172a" stroke="#e0683a" strokeWidth={1.2} />
          <text x={aSX(ct.x)} y={aSY(ct.y) - 17} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="800" fill="#e0683a" fontFamily="monospace">Q</text>
        </motion.g>,
      )
      e.push(<motion.line key={`dl${l.id}`} x1={aSX(ALGO_D.x)} y1={aSY(ALGO_D.y)} x2={aSX(ct.x)} y2={aSY(ct.y)}
        stroke={c} strokeWidth={1.1} strokeDasharray="5 4"
        initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ duration: 0.4, delay: 0.6 + i * 0.04 }} />)
    })
    e.push(
      <motion.g key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4 }}>
        <rect x={8} y={8} width={120} height={50} rx={4}
          fill="oklch(0.115 0.015 250)" stroke="#e0683a" strokeWidth={0.6} strokeOpacity={0.4} />
        <text x={14} y={26} fontSize="9" fill="#94a3b8" fontFamily="monospace">≤4 nodes</text>
        <text x={72} y={26} fontSize="9" fill="#e0683a" fontFamily="monospace" fontWeight="700">→ QAOA</text>
        <line x1={8} y1={33} x2={128} y2={33} stroke="#334155" strokeWidth={0.5} />
        <text x={14} y={47} fontSize="9" fill="#94a3b8" fontFamily="monospace">≥5 nodes</text>
        <text x={72} y={47} fontSize="9" fill="#64748b" fontFamily="monospace">→ recurse</text>
      </motion.g>,
    )
  }

  if (step === 4) {
    // Quantum Solve
    ALGO_LEAVES.forEach((l, i) => {
      const c = C[i % C.length]
      const base = 0.1 + i * 0.1
      e.push(<AHull key={`h${l.id}`} ids={l.n} color={c} op={0.05} />)
      l.n.forEach((nid) => e.push(<ANode key={`n${nid}`} id={nid} r={4.5} fill={c} />))
      if (l.n.length === 1) {
        e.push(<AEdge key={`s${l.id}`} a={0} b={l.n[0]} color={c} w={1} dash="4 3" op={0.35} />)
        return
      }
      e.push(<AEdge key={`ds${l.id}`} a={0} b={l.n[0]} color={c} w={1} dash="4 3" op={0.3} animate delay={base} />)
      for (let j = 0; j < l.n.length - 1; j++)
        e.push(<AEdge key={`e${l.id}-${j}`} a={l.n[j]} b={l.n[j + 1]} color={c} w={2.2} op={0.85} animate delay={base + 0.15 + j * 0.1} />)
      e.push(<AEdge key={`de${l.id}`} a={l.n[l.n.length - 1]} b={0} color={c} w={1} dash="4 3" op={0.3} animate delay={base + 0.3} />)
    })
  }

  if (step === 5) {
    // Supernode Compression
    ALGO_TERR.forEach((t, ti) => {
      const c = C[ti]
      const allN = aTerrNodes(t.id)
      e.push(<AHull key={`th${t.id}`} ids={allN} color={c} op={0.07} expand={24} dash="6 3" animate delay={0.05 + ti * 0.05} />)
      allN.forEach((nid) => e.push(<ANode key={`f${nid}`} id={nid} r={2} fill={c} stroke="none" op={0.18} />))
      t.leaves.forEach((lid, li) => {
        const ct = aLeafCent(lid)
        const lf = ALGO_LEAVES.find((x) => x.id === lid)
        lf?.n.forEach((nid) => {
          const n = ALGO_NM[nid]
          e.push(<line key={`sp${lid}-${nid}`} x1={aSX(ct.x)} y1={aSY(ct.y)} x2={aSX(n.x)} y2={aSY(n.y)} stroke={c} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.16} />)
        })
        e.push(<ASuper key={`sn${lid}`} x={ct.x} y={ct.y} color={c} label={lid.replace('L', '')} animate delay={0.15 + ti * 0.08 + li * 0.05} />)
      })
    })
  }

  if (step === 6) {
    // Supernode Routing
    ALGO_TERR.forEach((t, ti) => {
      const c = C[ti]
      const allN = aTerrNodes(t.id)
      e.push(<AHull key={`th${t.id}`} ids={allN} color={c} op={0.05} expand={24} />)
      allN.forEach((nid) => e.push(<ANode key={`f${nid}`} id={nid} r={1.5} fill={c} stroke="none" op={0.13} />))
      const cents = t.leaves.map((lid) => aLeafCent(lid))
      const base = 0.1 + ti * 0.12
      if (cents.length > 0) {
        e.push(<motion.line key={`sd${t.id}`} x1={aSX(ALGO_D.x)} y1={aSY(ALGO_D.y)} x2={aSX(cents[0].x)} y2={aSY(cents[0].y)}
          stroke={c} strokeWidth={1.2} strokeDasharray="5 4" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: base }} />)
        for (let j = 0; j < cents.length - 1; j++)
          e.push(<motion.line key={`sc${t.id}-${j}`} x1={aSX(cents[j].x)} y1={aSY(cents[j].y)} x2={aSX(cents[j + 1].x)} y2={aSY(cents[j + 1].y)}
            stroke={c} strokeWidth={2.5} strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.8 }} transition={{ duration: 0.5, delay: base + 0.15 + j * 0.12, ease: [0.65, 0, 0.35, 1] }} />)
        e.push(<motion.line key={`se${t.id}`} x1={aSX(cents[cents.length - 1].x)} y1={aSY(cents[cents.length - 1].y)} x2={aSX(ALGO_D.x)} y2={aSY(ALGO_D.y)}
          stroke={c} strokeWidth={1.2} strokeDasharray="5 4" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: base + 0.4 }} />)
      }
      t.leaves.forEach((lid, li) => {
        const ct = aLeafCent(lid)
        e.push(<ASuper key={`sn${lid}`} x={ct.x} y={ct.y} color={c} label={lid.replace('L', '')} animate delay={base + li * 0.04} />)
      })
    })
  }

  if (step === 7) {
    // Final Routes
    const vcolors = ['#e0683a', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4', '#ec4899']
    let ri = 0
    ALGO_FLEET.forEach((va) => {
      const allN = va.clusters.flatMap((cid) => aTerrNodes(cid))
      const per = Math.ceil(allN.length / va.k)
      for (let v = 0; v < va.k; v++) {
        const route = allN.slice(v * per, (v + 1) * per)
        if (!route.length) continue
        const rc = vcolors[ri % vcolors.length]
        const base = 0.15 + ri * 0.45
        ri++
        route.forEach((nid, k) => e.push(<ANode key={`fn${nid}`} id={nid} r={5} fill={rc} animate delay={base + k * 0.05} />))
        e.push(<AEdge key={`fds${ri}`} a={0} b={route[0]} color={rc} w={1.4} dash="5 4" op={0.45} animate delay={base + 0.1} />)
        for (let j = 0; j < route.length - 1; j++)
          e.push(<AEdge key={`fe${ri}-${j}`} a={route[j]} b={route[j + 1]} color={rc} w={2.6} op={0.85} animate delay={base + 0.2 + j * 0.08} />)
        e.push(<AEdge key={`fde${ri}`} a={route[route.length - 1]} b={0} color={rc} w={1.4} dash="5 4" op={0.45} animate delay={base + 0.2 + route.length * 0.08} />)
      }
    })
  }

  e.push(<ADepot key="depot" />)
  return e
}

const ALGO_STEPS = [
  {
    num: 'I–II', title: 'Angular Sweep & K-Means', sub: "arctan2 sectors · Lloyd's refinement · 10 iterations.",
    caption: "Every node is keyed by θ = arctan2(y−y₀, x−x₀). The plane divides into ⌊√n⌋ angular sectors. Boundary nodes are then corrected by ten iterations of Lloyd's k-means, producing compact leaves of ≤4 nodes.",
    stats: [{ v: 'n', l: 'Nodes' }, { v: '⌊√n⌋', l: 'Sectors' }, { v: '×10', l: 'K-means iters' }, { v: '≤4', l: 'Max per leaf' }],
  },
  {
    num: 'III', title: 'Vehicle Allocation', sub: 'Proportional to cluster size.',
    caption: 'Each territory receives ⌈(|C| / n) · k⌉ vehicles — proportional to its share of all deliveries. The fleet spreads across territories in proportion to geographic density.',
    stats: [{ v: 'k', l: 'Fleet size' }, { v: '⌊√n⌋', l: 'Territories' }, { v: '⌈|C|/n·k⌉', l: 'Rule' }, { v: 'Balanced', l: 'Load' }],
  },
  {
    num: 'IV–V', title: 'Recursion Gate & Depot', sub: 'Cluster ≤4 → QAOA leaf · Depot links anchored.',
    caption: 'Every cluster is checked: ≤4 nodes → QAOA leaf. Clusters ≥5 recurse. Each confirmed leaf is anchored to the depot with in/out dashed links, forming the closed sub-tour skeleton.',
    stats: [{ v: '4', l: 'LEAF_SIZE' }, { v: '≤n', l: 'Leaves' }, { v: '√n', l: 'Fan-out' }, { v: '2', l: 'Depth' }],
  },
  {
    num: 'VI', title: 'Quantum Solve', sub: 'QAOA minimises each leaf tour.',
    caption: 'QAOA runs on every leaf — up to n² qubits each, COBYLA-tuned γ and β. The variational state collapses to the minimum-cost tour. Each solved leaf is promoted to a supernode.',
    stats: [{ v: '⌊√n⌋', l: 'QAOA runs' }, { v: 'n²', l: 'Max qubits' }, { v: 'COBYLA', l: 'Optimiser' }, { v: '100%', l: 'Optimal' }],
  },
  {
    num: 'VII', title: 'Supernode Compression', sub: 'Solved leaves → abstract nodes.',
    caption: 'Each solved leaf collapses to a supernode at its geographic centroid — a clean level of abstraction. The recursion gate now applies at this supernode level.',
    stats: [{ v: '⌊√n⌋', l: 'Supernodes' }, { v: '⌊√n⌋', l: 'Territories' }, { v: 'Centroid', l: 'Position' }, { v: 'Level 2', l: 'Abstraction' }],
  },
  {
    num: 'VIII', title: 'Supernode Routing', sub: 'Same gate · ≥5 recurse · ≤4 QAOA.',
    caption: 'The recursion gate runs at supernode level. Territories within gate size are solved with QAOA and the oriented leaf tours stitch bottom-up into full routes.',
    stats: [{ v: '⌊√n⌋', l: 'QAOA solves' }, { v: '≤4', l: 'Per territory' }, { v: 'Bottom-up', l: 'Stitching' }, { v: '100%', l: 'Optimal' }],
  },
  {
    num: 'IX', title: 'Final Routes', sub: 'k routes · vehicles evenly distributed.',
    caption: 'k complete routes emerge — each departing the depot, visiting its assigned deliveries, and returning. Vehicles are distributed evenly by proportional allocation.',
    stats: [{ v: 'k', l: 'Routes' }, { v: 'n', l: 'Visited' }, { v: '100%', l: 'Quantum optimal' }, { v: 'Even', l: 'Distribution' }],
  },
]

function SAlgoStep({ step }: { step: number }) {
  const s = ALGO_STEPS[step - 1]

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 48% 40% at 74% 48%, oklch(0.72 0.18 35 / 0.06), transparent 70%)' }} />

      {/* LEFT — editorial column */}
      <div key={`col-${step}`} className="relative z-10 flex w-[35%] min-w-[320px] shrink-0 flex-col justify-center px-12 gap-4">
        <div className="flex items-baseline gap-4" style={{ animation: 'qa-numeral 700ms cubic-bezier(0.76,0,0.24,1) 60ms both' }}>
          <span className="font-serif italic leading-none text-primary" style={{ fontSize: 'clamp(2.4rem, 4vw, 4rem)' }}>{s.num}</span>
          <div className="flex flex-col gap-1 pb-1">
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/60 font-mono">Step {step} / {ALGO_STEPS.length}</span>
            <span className="font-serif italic text-xs text-muted-foreground/75">{s.sub}</span>
          </div>
        </div>

        <span className="h-px w-16 origin-left bg-primary/70" style={{ animation: 'qa-rule 800ms cubic-bezier(0.76,0,0.24,1) 140ms both' }} />

        <h1 className="font-serif italic leading-[0.92] tracking-tight text-foreground"
          style={{ fontSize: 'clamp(2rem, 3.5vw, 3.4rem)', animation: 'qa-title 850ms cubic-bezier(0.76,0,0.24,1) 180ms both' }}>
          {s.title}.
        </h1>

        <p className="max-w-[40ch] font-serif italic text-[13px] leading-[1.7] text-foreground/75"
          style={{ animation: 'qa-soft 850ms cubic-bezier(0.76,0,0.24,1) 360ms both' }}>
          {s.caption}
        </p>

        <div className="mt-2 border-t border-border/40 pt-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {s.stats.map((st, i) => (
              <div key={i} className="flex items-baseline justify-between border-b border-border/25 pb-2"
                style={{ animation: `qa-stat 600ms cubic-bezier(0.76,0,0.24,1) ${440 + i * 70}ms both` }}>
                <span className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground/55 font-mono">{st.l}</span>
                <span className="font-serif italic text-base tabular-nums text-foreground/90">{st.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {Array.from({ length: ALGO_STEPS.length }, (_, i) => (
            <div key={i} className="transition-all duration-500 rounded-full"
              style={{ height: 3, width: i + 1 === step ? 26 : 7, background: i + 1 <= step ? 'var(--primary)' : 'oklch(0.24 0.01 250)' }} />
          ))}
        </div>
      </div>

      {/* RIGHT — the plate */}
      <div className="relative z-10 flex flex-1 flex-col pr-12 pl-4 py-8">
        <div className="flex items-end justify-between pb-4">
          <div className="flex items-baseline gap-3 font-mono">
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/50">Plate</span>
            <span className="font-serif italic text-2xl tabular-nums text-foreground/90">{String(step).padStart(2, '0')}</span>
            <span className="text-muted-foreground/30">/</span>
            <span className="font-serif italic text-sm tabular-nums text-muted-foreground/50">{String(ALGO_STEPS.length).padStart(2, '0')}</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45 font-mono">Recursive QAOA · 50 nodes</div>
        </div>

        <div key={`plate-${step}`} className="relative flex-1 min-h-0 overflow-hidden rounded-md"
          style={{
            animation: 'qa-plate 800ms cubic-bezier(0.76,0,0.24,1) both',
            background: 'radial-gradient(ellipse 70% 60% at 50% 45%, oklch(0.14 0.02 250), oklch(0.08 0.02 250) 88%)',
            boxShadow: 'inset 0 0 0 1px oklch(0.25 0.02 250 / 0.35), 0 30px 80px -40px rgba(0,0,0,0.9)',
          }}>
          <svg key={`svg-${step}`} width="100%" height="100%" viewBox={`0 0 ${A_W} ${A_H}`} preserveAspectRatio="xMidYMid meet" className="block h-full w-full">
            {buildAlgoPlate(step)}
          </svg>
          <div aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)' }} />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slides 26-27 — dispatch + mobile (adapted from demo-mode) */
const PRES_ROUTE_COLORS = [
  'oklch(0.74 0.18 35)', 'oklch(0.72 0.18 250)', 'oklch(0.74 0.18 145)',
  'oklch(0.72 0.18 290)', 'oklch(0.78 0.16 85)', 'oklch(0.7 0.2 25)', 'oklch(0.72 0.15 200)',
]

function SDispatchMobile() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  const [appOpen, setAppOpen] = useState(false)
  const [stopsShown, setStopsShown] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 3700),
      setTimeout(() => setPhase(4), 4200),
      setTimeout(() => setPhase(5), 5700),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (phase < 5) return
    const t = setTimeout(() => setAppOpen(true), 450)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (!appOpen) return
    const id = setInterval(() => setStopsShown((n) => (n >= VEC_STOPS.length ? n : n + 1)), 320)
    return () => clearInterval(id)
  }, [appOpen])

  const split = phase >= 5

  const cursorVariants = {
    hidden:  { x: 280, y: -160, opacity: 0, scale: 1 },
    arcing:  { x: [280, 60, 0], y: [-160, -40, 8], opacity: [0, 1, 1], scale: [1, 1, 0.92] },
    clicked: { x: 0, y: 8, opacity: 1, scale: 0.85 },
    done:    { x: 0, y: 8, opacity: 0, scale: 0.85 },
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden px-12">
      <motion.div className="absolute top-0 left-0 h-px" style={{ background: 'var(--primary)', opacity: 0.5 }}
        initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />

      <div className={`flex items-center w-full max-w-7xl ${split ? 'justify-between gap-10' : 'justify-center'}`}>

        {/* ── DISPATCH column ── */}
        <motion.div layout transition={{ layout: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
          className={`flex flex-col ${split ? 'items-start text-left w-[34%] shrink-0' : 'items-center text-center max-w-3xl'}`}>

          <motion.div className="text-[10px] font-mono uppercase tracking-[0.4em] mb-5" style={{ color: 'var(--primary)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            Routes optimised · Fleet ready
          </motion.div>

          <motion.h2 layout className="font-serif italic font-light leading-[1.05] tracking-[-0.04em] text-foreground"
            style={{ fontSize: split ? 'clamp(1.7rem, 2.6vw, 2.5rem)' : 'clamp(2.5rem, 5.5vw, 4.5rem)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            Dispatch all drivers.
          </motion.h2>

          {!split && (
            <motion.div className="h-px mx-auto mt-8 mb-12"
              style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', boxShadow: '0 0 12px var(--primary)' }}
              initial={{ width: 0 }} animate={{ width: 260 }}
              transition={{ duration: 0.9, delay: 1.1, ease: [0.22, 1, 0.36, 1] }} />
          )}

          {/* button + cursor */}
          {phase < 4 && (
            <div className="relative inline-block">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, scale: phase >= 3 ? 0.94 : 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-4 px-10 py-5 rounded-sm relative"
                style={{
                  background: phase >= 3 ? 'oklch(0.72 0.18 35 / 0.92)' : 'var(--card)',
                  border: '1.5px solid var(--primary)',
                  boxShadow: phase >= 3
                    ? '0 0 0 6px oklch(0.72 0.18 35 / 0.18), 0 0 40px oklch(0.72 0.18 35 / 0.5)'
                    : '0 0 24px oklch(0.72 0.18 35 / 0.15)',
                }}>
                <span className="font-mono text-sm uppercase tracking-[0.32em] font-semibold"
                  style={{ color: phase >= 3 ? 'white' : 'var(--primary)' }}>
                  DISPATCH 7 ROUTES
                </span>
                <span style={{ color: phase >= 3 ? 'white' : 'var(--primary)', fontFamily: 'monospace', fontSize: 18 }}>→</span>
              </motion.div>

              {phase >= 1 && phase < 4 && (
                <motion.div className="absolute pointer-events-none" style={{ right: -10, bottom: -10, zIndex: 5 }}
                  variants={cursorVariants} initial="hidden"
                  animate={phase === 1 ? 'hidden' : phase === 2 ? 'arcing' : 'clicked'}
                  transition={{ duration: phase === 2 ? 1.1 : 0.18, ease: phase === 2 ? [0.4, 0, 0.2, 1] : 'easeOut', times: phase === 2 ? [0, 0.7, 1] : undefined }}>
                  <svg width="28" height="32" viewBox="0 0 28 32" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}>
                    <path d="M2 2 L2 24 L8 19 L11.5 28 L15 26.5 L11.5 18 L20 18 Z" fill="white" stroke="#000" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                  {phase === 3 && (
                    <motion.div className="absolute" style={{ left: 4, top: 6, width: 4, height: 4, borderRadius: 99, border: '2px solid var(--primary)' }}
                      initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 14, opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* success — persists into the split */}
          {phase >= 4 && (
            <motion.div layout className={`flex flex-col gap-5 ${split ? 'items-start' : 'items-center'}`}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-sm"
                style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)', border: '1.5px solid var(--primary)', boxShadow: '0 0 30px oklch(0.72 0.18 35 / 0.25)' }}>
                <motion.svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.1 }} />
                </motion.svg>
                <span className="font-mono text-sm uppercase tracking-[0.32em] font-semibold" style={{ color: 'var(--primary)' }}>7 DRIVERS NOTIFIED</span>
              </motion.div>
              <div className={`flex gap-2 ${split ? 'flex-wrap' : ''}`} style={split ? { maxWidth: 280 } : undefined}>
                {PRES_ROUTE_COLORS.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 + i * 0.06 }}
                    className="px-3 py-2 rounded-sm text-center" style={{ background: 'var(--card)', border: `1px solid ${c}`, minWidth: 44 }}>
                    <div className="text-[11px] font-mono" style={{ color: c }}>{String(i + 1).padStart(2, '0')}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {split && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
              className="text-sm text-muted-foreground leading-relaxed mt-7" style={{ maxWidth: '36ch' }}>
              One <code className="font-mono text-foreground">POST /optimize/dispatch</code> writes a DriverAssignment row per vehicle —
              pushed to every driver's phone in real time over Sanctum token auth.
            </motion.p>
          )}
        </motion.div>

        {/* ── MOBILE column ── */}
        {split && (
          <motion.div layout initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-7 shrink-0">

            <IPhoneFramePres>
              <div className="absolute inset-0" style={{ background: VEC.paper }}>
                <AnimatePresence>
                  {!appOpen && (
                    <motion.div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: VEC.paper }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                      <div style={{ fontFamily: VEC_SERIF, fontStyle: 'italic', fontSize: 42, color: VEC.ink, letterSpacing: -0.6, lineHeight: 1 }}>Vectora</div>
                      <div style={{ fontFamily: VEC_MONO, fontSize: 9, marginTop: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: VEC.muted }}>Driver</div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {appOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="absolute inset-0 flex flex-col" style={{ paddingTop: 58 }}>
                    <div style={{ padding: '18px 24px 12px' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                        <span style={{ fontFamily: VEC_MONO, fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase', color: VEC.muted }}>Route 047 · 7 stops</span>
                        <span style={{ fontFamily: VEC_MONO, fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase', color: VEC.signal }}>● Dispatched</span>
                      </div>
                      <div style={{ fontFamily: VEC_SERIF, fontStyle: 'italic', fontSize: 34, color: VEC.ink, letterSpacing: -0.5, lineHeight: 0.98 }}>
                        <motion.span initial={{ opacity: 0, filter: 'blur(12px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.9, delay: 0.1 }}>Artur Nogueira.</motion.span>
                      </div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} style={{ fontFamily: VEC_SANS, fontSize: 11, color: VEC.inkSoft, marginTop: 6 }}>
                        Centro · Vila Industrial · Belvedere
                      </motion.div>
                      <motion.div className="flex gap-[3px]" style={{ marginTop: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="flex-1" style={{ height: 3, background: stopsShown > i ? (i === 0 ? VEC.signal : VEC.ink) : VEC.rule, opacity: stopsShown > i ? (i === 0 ? 1 : 0.5) : 1, transition: 'background 0.3s' }} />
                        ))}
                      </motion.div>
                    </div>
                    <div style={{ height: 1, background: VEC.rule }} />
                    <div className="flex-1 overflow-hidden">
                      {VEC_STOPS.map((s, i) => (
                        <AnimatePresence key={s.n}>
                          {stopsShown > i && (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                              style={{ padding: '11px 24px', display: 'flex', gap: 12, background: i === 0 ? 'rgba(21,20,15,0.025)' : 'transparent', borderBottom: `1px solid ${VEC.ruleSoft}` }}>
                              <div style={{ minWidth: 22, paddingTop: 2 }}>
                                <span style={{ fontFamily: VEC_MONO, fontSize: 9.5, color: i === 0 ? VEC.signal : VEC.ink, fontWeight: 500 }}>{s.n}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="flex items-baseline justify-between">
                                  <div style={{ fontFamily: VEC_SERIF, fontSize: 13, color: VEC.ink, letterSpacing: -0.2 }}>{s.addr}</div>
                                  <div style={{ fontFamily: VEC_MONO, fontSize: 9, color: VEC.muted }}>{s.t}</div>
                                </div>
                                <div style={{ fontFamily: VEC_SANS, fontSize: 10, color: VEC.inkSoft, marginTop: 2 }}>{s.area} · {s.who}</div>
                                {i === 0 && <div style={{ fontFamily: VEC_MONO, fontSize: 8.5, color: VEC.signal, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>● Next</div>}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      ))}
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 28, background: VEC.paper, borderTop: `1px solid ${VEC.rule}` }}>
                      <div className="flex justify-between items-center" style={{ padding: '12px 24px 6px' }}>
                        {[['Today', false], ['Route', false], ['Stops', true], ['Inbox', false], ['Me', false]].map(([label, on]) => (
                          <div key={label as string} className="flex flex-col items-center" style={{ gap: 5 }}>
                            <span style={{ fontFamily: VEC_SANS, fontSize: 10, fontWeight: 500, color: on ? VEC.ink : VEC.muted }}>{label as string}</span>
                            <div style={{ width: 3, height: 3, borderRadius: 99, background: on ? VEC.signal : 'transparent' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </IPhoneFramePres>

            {/* push feed */}
            <div className="w-[190px] shrink-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-muted-foreground mb-4">Sanctum Push · 7</div>
              <div className="space-y-0.5">
                {VEC_STOPS.map((s, i) => (
                  <motion.div key={s.n} initial={{ opacity: 0.18 }} animate={{ opacity: stopsShown > i ? 1 : 0.22 }} transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid oklch(0.18 0.01 250)' }}>
                    <span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: stopsShown > i ? 'var(--primary)' : 'oklch(0.22 0 0)', boxShadow: stopsShown > i ? '0 0 6px var(--primary)' : 'none' }} />
                    <span className="font-mono" style={{ color: stopsShown > i ? 'oklch(0.7 0 0)' : 'oklch(0.32 0 0)', fontSize: 9.5 }}>stop {s.n}</span>
                    <span className="ml-auto font-mono uppercase" style={{ color: stopsShown > i ? 'var(--primary)' : 'oklch(0.28 0 0)', fontSize: 8.5 }}>{stopsShown > i ? '✓ ok' : 'queued'}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div className="absolute bottom-0 right-0 h-px" style={{ background: 'var(--primary)', opacity: 0.5 }}
        initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  )
}

/* ── VEC design tokens for mobile slide ── */
const VEC = {
  paper: '#F5F2EC', paperDeep: '#EFEBE2', ink: '#15140F', inkSoft: '#3A3832',
  muted: '#8A877E', rule: 'rgba(21,20,15,0.10)', ruleSoft: 'rgba(21,20,15,0.05)',
  signal: 'oklch(0.62 0.18 28)',
}
const VEC_SERIF = '"Instrument Serif", Georgia, serif'
const VEC_SANS  = '"Geist", system-ui, sans-serif'
const VEC_MONO  = '"JetBrains Mono", ui-monospace, monospace'

const VEC_STOPS = [
  { n: '01', t: '08:00', addr: 'Voluntários da Pátria 92', area: 'Centro',         who: 'E. Lindqvist',  tag: 'Service'  },
  { n: '02', t: '08:15', addr: 'Av. Brasil 21',            area: 'Vila Industrial', who: 'A. Johansson',  tag: 'Pickup'   },
  { n: '03', t: '08:30', addr: 'Rua Bernardino 14',        area: 'Jardim Planalto', who: 'L. Eriksson',   tag: 'Service'  },
  { n: '04', t: '09:10', addr: 'R. João Pessoa 8',         area: 'Belvedere',      who: 'O. Bergström',  tag: 'Delivery' },
  { n: '05', t: '09:45', addr: 'Av. XV de Novembro 7',     area: 'Centro Sul',     who: 'S. Andersson',  tag: 'Pickup'   },
  { n: '06', t: '10:20', addr: 'R. Marechal Deodoro 116',  area: 'Vila Pinheiros', who: 'M. Nilsson',    tag: 'Service'  },
  { n: '07', t: '11:00', addr: 'R. Tiradentes 47',         area: 'Jardim Itália',  who: 'F. Lundgren',   tag: 'Service'  },
]

function IPhoneFramePres({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative shrink-0"
      style={{ width: 320, height: 648, borderRadius: 52, background: '#1a1a1a', padding: 6,
        boxShadow: '0 60px 120px -20px rgba(0,0,0,0.7), 0 0 0 1.5px #2a2a2a, inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
      <div className="absolute inset-0 rounded-[52px] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 100%)' }} />
      <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: 46, background: VEC.paper }}>
        {/* Dynamic Island */}
        <div className="absolute z-30" style={{ top: 11, left: '50%', transform: 'translateX(-50%)', width: 112, height: 33, borderRadius: 22, background: '#000' }} />
        {/* status bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between" style={{ height: 58, padding: '0 28px' }}>
          <span style={{ fontFamily: VEC_MONO, fontSize: 14, fontWeight: 600, color: VEC.ink, letterSpacing: -0.3 }}>9:41</span>
          <div style={{ width: 112 }} />
          <div className="flex items-center gap-1.5">
            <svg width="17" height="11" viewBox="0 0 19 12"><rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={VEC.ink} /><rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={VEC.ink} /><rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={VEC.ink} /><rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={VEC.ink} /></svg>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 28 — proof of delivery */
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
  const { resolvedAppearance } = useAppearance()
  const mapStyle = mapboxStyleFor(resolvedAppearance)

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
          mapStyle={mapStyle}
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
        <H size="lg">Same city. Radically different fairness.</H>
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
    { algo: 'Recursive QAOA + 2-opt',           short: 'QAOA + 2-opt',      k: 15, dist:  87_140, sd:  2_954, phi:  4_382, gap:   0.0,  win: true },
    { algo: 'Recursive QAOA (No 2-opt)',         short: 'QAOA',              k: 15, dist:  87_359, sd:  2_957, phi:  4_391, gap:   0.2  },
    { algo: 'Sweep + 2-opt',                     short: 'Sweep + 2-opt',     k: 15, dist: 102_780, sd:  2_337, phi:  4_595, gap:   4.9  },
    { algo: 'Genetic Algorithm',                 short: 'Genetic',           k: 15, dist: 103_784, sd:  2_291, phi:  4_605, gap:   5.1  },
    { algo: 'Tabu Search',                       short: 'Tabu Search',       k: 15, dist:  67_819, sd:  5_051, phi:  4_786, gap:   9.2  },
    { algo: 'Sweep',                             short: 'Sweep',             k: 15, dist: 111_370, sd:  2_741, phi:  5_083, gap:  16.0  },
    { algo: 'Clarke-Wright Par. + 2-opt',        short: 'CW-Par + 2-opt',    k: 15, dist:  60_508, sd:  6_194, phi:  5_114, gap:  16.7  },
    { algo: 'Clarke-Wright Par. + Or-opt',       short: 'CW-Par + Or-opt',   k: 15, dist:  60_508, sd:  6_194, phi:  5_114, gap:  16.7  },
    { algo: 'Iterated Local Search',             short: 'ILS',               k: 15, dist:  60_508, sd:  6_194, phi:  5_114, gap:  16.7  },
    { algo: 'OR-Tools (SAVINGS + GLS)',          short: 'OR-Tools (SAV)',     k: 15, dist:  60_412, sd:  6_328, phi:  5_178, gap:  18.2  },
    { algo: 'OR-Tools (Christofides + GLS)',     short: 'OR-Tools (CHR)',     k: 15, dist:  60_412, sd:  6_328, phi:  5_178, gap:  18.2  },
    { algo: 'OR-Tools (Par. Cheap. Ins. + GLS)', short: 'OR-Tools (PCI)',     k: 15, dist:  60_412, sd:  6_328, phi:  5_178, gap:  18.2  },
    { algo: 'Clarke-Wright Parallel',            short: 'CW-Par',            k: 15, dist:  61_275, sd:  6_383, phi:  5_234, gap:  19.5  },
    { algo: 'Simulated Annealing',               short: 'Sim. Annealing',    k: 15, dist:  61_275, sd:  6_383, phi:  5_234, gap:  19.5  },
    { algo: 'Clarke-Wright Seq. + 2-opt',        short: 'CW-Seq + 2-opt',    k:  9, dist:  72_661, sd:  3_118, phi:  5_596, gap:  27.7  },
    { algo: 'Clarke-Wright Sequential',          short: 'CW-Seq',            k:  9, dist:  73_030, sd:  3_155, phi:  5_635, gap:  28.6  },
    { algo: 'Farthest Insertion + 2-opt',        short: 'Farthest + 2-opt',  k: 15, dist: 156_770, sd:  2_059, phi:  6_255, gap:  42.8  },
    { algo: 'Nearest Insertion + 2-opt',         short: 'Nearest + 2-opt',   k: 15, dist: 156_770, sd:  2_059, phi:  6_255, gap:  42.8  },
    { algo: 'Cheapest Insertion + 2-opt',        short: 'Cheapest + 2-opt',  k: 15, dist: 156_770, sd:  2_059, phi:  6_255, gap:  42.8  },
    { algo: 'Nearest-Neighbour + 2-opt',         short: 'NN + 2-opt',        k: 15, dist: 156_770, sd:  2_059, phi:  6_255, gap:  42.8  },
    { algo: 'Nearest-Neighbour',                 short: 'NN',                k: 15, dist: 159_785, sd:  2_018, phi:  6_335, gap:  44.6  },
    { algo: "Benchmark's Optimizer",             short: 'Prior Benchmark',   k:  7, dist:  47_761, sd:  8_355, phi:  7_589, gap:  64.6  },
  ],
  '100': [
    { algo: 'Recursive QAOA + 2-opt',           short: 'QAOA + 2-opt',      k: 30, dist: 179_702, sd:  3_035, phi:  4_513, gap:   0.0,  win: true },
    { algo: 'Recursive QAOA (No 2-opt)',         short: 'QAOA',              k: 30, dist: 180_323, sd:  3_034, phi:  4_522, gap:   0.22 },
    { algo: 'Clarke-Wright Par. + Or-opt',       short: 'CW-Par + Or-opt',   k: 30, dist: 111_147, sd:  6_604, phi:  5_154, gap:  14.22 },
    { algo: 'Clarke-Wright Parallel',            short: 'CW-Par',            k: 30, dist: 111_259, sd:  6_623, phi:  5_166, gap:  14.47 },
    { algo: 'Clarke-Wright Par. + 2-opt',        short: 'CW-Par + 2-opt',    k: 30, dist: 111_259, sd:  6_623, phi:  5_166, gap:  14.47 },
    { algo: 'Genetic Algorithm',                 short: 'Genetic',           k: 30, dist: 111_259, sd:  6_623, phi:  5_166, gap:  14.47 },
    { algo: 'OR-Tools (SAVINGS + GLS)',          short: 'OR-Tools (SAV)',     k: 30, dist: 108_732, sd:  7_499, phi:  5_562, gap:  23.25 },
    { algo: 'OR-Tools (Christofides + GLS)',     short: 'OR-Tools (CHR)',     k: 30, dist: 108_732, sd:  7_499, phi:  5_562, gap:  23.25 },
    { algo: 'OR-Tools (Par. Cheap. Ins. + GLS)', short: 'OR-Tools (PCI)',     k: 30, dist: 108_732, sd:  7_499, phi:  5_562, gap:  23.25 },
    { algo: 'Clarke-Wright Seq. + 2-opt',        short: 'CW-Seq + 2-opt',    k: 14, dist: 129_147, sd:  2_089, phi:  5_657, gap:  25.36 },
    { algo: 'Clarke-Wright Sequential',          short: 'CW-Seq',            k: 14, dist: 133_871, sd:  2_054, phi:  5_808, gap:  28.70 },
    { algo: 'Iterated Local Search',             short: 'ILS',               k: 23, dist: 105_091, sd:  7_638, phi:  6_225, gap:  37.94 },
    { algo: "Benchmark's Optimizer",             short: 'Prior Benchmark',   k: 15, dist:       0, sd: 97_882, phi:  6_760, gap:  32.06 },
    { algo: 'Nearest-Neighbour + 2-opt',         short: 'NN + 2-opt',        k: 30, dist: 340_595, sd:  3_017, phi:  7_185, gap:  59.22 },
    { algo: 'Nearest Insertion + 2-opt',         short: 'Nearest + 2-opt',   k: 30, dist: 340_595, sd:  3_017, phi:  7_185, gap:  59.22 },
    { algo: 'Farthest Insertion + 2-opt',        short: 'Farthest + 2-opt',  k: 30, dist: 340_595, sd:  3_017, phi:  7_185, gap:  59.22 },
    { algo: 'Cheapest Insertion + 2-opt',        short: 'Cheapest + 2-opt',  k: 30, dist: 340_595, sd:  3_017, phi:  7_185, gap:  59.22 },
    { algo: 'Sweep + 2-opt',                     short: 'Sweep + 2-opt',     k: 30, dist: 340_595, sd:  3_017, phi:  7_185, gap:  59.22 },
    { algo: 'Nearest Insertion',                 short: 'Nearest Ins.',      k: 30, dist: 340_645, sd:  3_020, phi:  7_187, gap:  59.27 },
    { algo: 'Cheapest Insertion',                short: 'Cheapest Ins.',     k: 30, dist: 340_645, sd:  3_020, phi:  7_187, gap:  59.27 },
    { algo: 'Farthest Insertion',                short: 'Farthest Ins.',     k: 30, dist: 340_867, sd:  3_016, phi:  7_189, gap:  59.31 },
    { algo: 'Sweep',                             short: 'Sweep',             k: 30, dist: 344_486, sd:  3_055, phi:  7_269, gap:  61.08 },
    { algo: 'Nearest-Neighbour',                 short: 'NN',                k: 30, dist: 357_458, sd:  3_147, phi:  7_531, gap:  66.89 },
    { algo: 'Simulated Annealing',               short: 'Sim. Annealing',    k:  9, dist:  73_313, sd: 11_827, phi: 10_887, gap: 141.24 },
    { algo: 'Tabu Search',                       short: 'Tabu Search',       k:  5, dist:  68_016, sd: 12_724, phi: 12_163, gap: 169.52 },
  ],
  '200': [
    { algo: 'Recursive QAOA + 2-opt',           short: 'QAOA + 2-opt',      k: 30, dist: 224_555, sd:  3_899, phi:  5_692, gap:   0.0,  win: true },
    { algo: 'Recursive QAOA (No 2-opt)',         short: 'QAOA',              k: 30, dist: 230_951, sd:  4_010, phi:  5_854, gap:   2.84 },
    { algo: 'Clarke-Wright Seq. + 2-opt',        short: 'CW-Seq + 2-opt',   k: 27, dist: 278_702, sd:  2_118, phi:  6_220, gap:   9.27 },
    { algo: 'Clarke-Wright Sequential',          short: 'CW-Seq',            k: 27, dist: 283_499, sd:  2_174, phi:  6_337, gap:  11.33 },
    { algo: 'OR-Tools (SAVINGS + GLS)',          short: 'OR-Tools (SAV)',     k: 30, dist: 130_159, sd:  9_088, phi:  6_714, gap:  17.94 },
    { algo: 'OR-Tools (Christofides + GLS)',     short: 'OR-Tools (CHR)',     k: 30, dist: 130_159, sd:  9_088, phi:  6_714, gap:  17.94 },
    { algo: 'OR-Tools (Par. Cheap. Ins. + GLS)', short: 'OR-Tools (PCI)',     k: 30, dist: 130_159, sd:  9_088, phi:  6_714, gap:  17.94 },
    { algo: 'Clarke-Wright Par. + 2-opt',        short: 'CW-Par + 2-opt',    k: 30, dist: 131_394, sd:  9_263, phi:  6_821, gap:  19.83 },
    { algo: 'Clarke-Wright Par. + Or-opt',       short: 'CW-Par + Or-opt',   k: 30, dist: 131_645, sd:  9_325, phi:  6_856, gap:  20.45 },
    { algo: 'Clarke-Wright Parallel',            short: 'CW-Par',            k: 30, dist: 134_214, sd:  9_713, phi:  7_093, gap:  24.61 },
    { algo: 'Genetic Algorithm',                 short: 'Genetic',           k: 30, dist: 134_214, sd:  9_713, phi:  7_093, gap:  24.61 },
    { algo: 'Iterated Local Search',             short: 'ILS',               k: 22, dist: 126_723, sd: 10_490, phi:  8_125, gap:  42.73 },
    { algo: 'Sweep + 2-opt',                     short: 'Sweep + 2-opt',     k: 30, dist: 529_833, sd:  3_822, phi: 10_741, gap:  88.69 },
    { algo: 'Farthest Insertion + 2-opt',        short: 'Farthest + 2-opt',  k: 30, dist: 529_824, sd:  3_821, phi: 10_741, gap:  88.69 },
    { algo: 'Nearest-Neighbour + 2-opt',         short: 'NN + 2-opt',        k: 30, dist: 530_243, sd:  3_820, phi: 10_747, gap:  88.80 },
    { algo: 'Farthest Insertion',                short: 'Farthest Ins.',     k: 30, dist: 530_373, sd:  3_822, phi: 10_751, gap:  88.86 },
    { algo: 'Nearest Insertion + 2-opt',         short: 'Nearest + 2-opt',   k: 30, dist: 530_912, sd:  3_836, phi: 10_767, gap:  89.14 },
    { algo: 'Cheapest Insertion + 2-opt',        short: 'Cheapest + 2-opt',  k: 30, dist: 531_779, sd:  3_837, phi: 10_782, gap:  89.40 },
    { algo: 'Nearest Insertion',                 short: 'Nearest Ins.',      k: 30, dist: 537_098, sd:  3_937, phi: 10_920, gap:  91.83 },
    { algo: 'Cheapest Insertion',                short: 'Cheapest Ins.',     k: 30, dist: 539_033, sd:  3_937, phi: 10_952, gap:  92.40 },
    { algo: 'Sweep',                             short: 'Sweep',             k: 30, dist: 551_830, sd:  4_047, phi: 11_221, gap:  97.11 },
    { algo: 'Nearest-Neighbour',                 short: 'NN',                k: 30, dist: 594_452, sd:  4_456, phi: 12_136, gap: 113.19 },
    { algo: 'Simulated Annealing',               short: 'Sim. Annealing',    k:  8, dist: 103_332, sd: 16_303, phi: 14_610, gap: 156.66 },
    { algo: 'Tabu Search',                       short: 'Tabu Search',       k:  6, dist:  97_512, sd: 17_664, phi: 16_958, gap: 197.91 },
  ],
  '1000': [
    { algo: 'Recursive QAOA + 2-opt',           short: 'QAOA + 2-opt',      k: 45, dist: 387_653, sd:  4_268, phi:  6_441, gap:   0.0,  win: true },
    { algo: 'Clarke-Wright Seq. + 2-opt',        short: 'CW-Seq + 2-opt',    k: 45, dist: 467_485, sd:  3_030, phi:  6_709, gap:   4.16 },
    { algo: 'Clarke-Wright Sequential',          short: 'CW-Seq',            k: 45, dist: 485_505, sd:  3_212, phi:  7_001, gap:   8.68 },
    { algo: 'Recursive QAOA (No 2-opt)',         short: 'QAOA',              k: 45, dist: 438_321, sd:  4_881, phi:  7_311, gap:  13.50 },
    { algo: 'Brazil Benchmark',                  short: 'Prior Benchmark',   k: 22, dist: 509_692, sd: 14_616, phi: 18_892, gap:  65.90 },
    { algo: 'Clarke-Wright Par. + Or-opt',       short: 'CW-Par + Or-opt',   k: 45, dist: 218_560, sd: 18_258, phi: 11_557, gap:  79.42 },
    { algo: 'OR-Tools (SAVINGS + GLS)',          short: 'OR-Tools (SAV)',     k: 45, dist: 219_329, sd: 18_400, phi: 11_637, gap:  80.66 },
    { algo: 'OR-Tools (Christofides + GLS)',     short: 'OR-Tools (CHR)',     k: 45, dist: 219_329, sd: 18_400, phi: 11_637, gap:  80.66 },
    { algo: 'OR-Tools (Par. Cheap. Ins. + GLS)', short: 'OR-Tools (PCI)',     k: 45, dist: 219_329, sd: 18_400, phi: 11_637, gap:  80.66 },
    { algo: 'Clarke-Wright Par. + 2-opt',        short: 'CW-Par + 2-opt',    k: 45, dist: 219_756, sd: 18_390, phi: 11_637, gap:  80.66 },
    { algo: 'Clarke-Wright Parallel',            short: 'CW-Par',            k: 45, dist: 224_586, sd: 18_913, phi: 11_952, gap:  85.55 },
    { algo: 'Genetic Algorithm',                 short: 'Genetic',           k: 45, dist: 224_586, sd: 18_913, phi: 11_952, gap:  85.55 },
    { algo: 'Iterated Local Search',             short: 'ILS',               k: 37, dist: 215_397, sd: 20_184, phi: 13_003, gap: 101.87 },
    { algo: 'Farthest Insertion + 2-opt',        short: 'Farthest + 2-opt',  k: 45, dist: 1_249_387, sd:  3_475, phi: 15_620, gap: 142.49 },
    { algo: 'Nearest Insertion + 2-opt',         short: 'Nearest + 2-opt',   k: 45, dist: 1_250_317, sd:  3_583, phi: 15_684, gap: 143.48 },
    { algo: 'Farthest Insertion',                short: 'Farthest Ins.',     k: 45, dist: 1_262_153, sd:  3_494, phi: 15_771, gap: 144.84 },
    { algo: 'Sweep + 2-opt',                     short: 'Sweep + 2-opt',     k: 45, dist: 1_259_478, sd:  3_610, phi: 15_799, gap: 145.28 },
    { algo: 'Cheapest Insertion + 2-opt',        short: 'Cheapest + 2-opt',  k: 45, dist: 1_263_486, sd:  3_592, phi: 15_835, gap: 145.83 },
    { algo: 'Nearest-Neighbour + 2-opt',         short: 'NN + 2-opt',        k: 45, dist: 1_258_558, sd:  3_712, phi: 15_840, gap: 145.91 },
    { algo: 'Nearest Insertion',                 short: 'Nearest Ins.',      k: 45, dist: 1_309_228, sd:  3_505, phi: 16_300, gap: 153.05 },
    { algo: 'Cheapest Insertion',                short: 'Cheapest Ins.',     k: 45, dist: 1_321_267, sd:  3_857, phi: 16_609, gap: 157.85 },
    { algo: 'Nearest-Neighbour',                 short: 'NN',                k: 45, dist: 1_467_829, sd:  5_125, phi: 18_872, gap: 192.98 },
    { algo: 'Sweep',                             short: 'Sweep',             k: 45, dist: 1_581_346, sd:  5_363, phi: 20_252, gap: 214.40 },
    { algo: 'Tabu Search',                       short: 'Tabu Search',       k: 12, dist: 200_695, sd: 33_986, phi: 25_355, gap: 293.63 },
    { algo: 'Simulated Annealing',               short: 'Sim. Annealing',    k: 12, dist: 201_637, sd: 33_934, phi: 25_369, gap: 293.84 },
  ],
}

const SCALE_PANELS = [
  { key: '50',   label: 'n = 50',   sub: 'k = 15 · 1 run',              rivalGap:  4.9  },
  { key: '200',  label: 'n = 200',  sub: 'k = 30 · 1 run',              rivalGap:  9.27 },
  { key: '1000', label: 'n = 1000', sub: 'k = 45 · 1 run',              rivalGap:  4.16 },
]

const SCALE_PANELS_100 = [
  { key: '100',  label: 'n = 100',  sub: 'k = 30 · 10 independent runs', rivalGap: 14.22 },
]

function ScalePanel({ scaleKey, label, sub, rivalGap }: { scaleKey: string; label: string; sub: string; rivalGap: number }) {
  const rows = BENCH[scaleKey]
  const maxPhi = Math.max(...rows.map((r) => r.phi))
  const winner = rows.find((r) => r.win)

  return (
    <div
      className="flex flex-col min-h-0 rounded-xl p-4 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* panel header */}
      <div className="shrink-0 flex items-baseline justify-between mb-3 pb-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-mono font-semibold text-base" style={{ color: 'var(--foreground)' }}>{label}</div>
        <div className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>
      </div>

      {/* rows */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 pr-0.5">
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
              className="font-mono text-[11px] shrink-0 truncate"
              style={{ width: 112, color: win ? 'var(--primary)' : 'var(--muted-foreground)' }}
            >
              {win && <span className="mr-0.5">★</span>}{short}
            </div>
            {/* bar */}
            <div className="flex-1 h-5 rounded overflow-hidden relative" style={{ background: 'color-mix(in oklch, var(--muted-foreground) 10%, transparent)' }}>
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
                className="absolute right-1.5 inset-y-0 flex items-center font-mono text-[10px] tabular-nums"
                style={{ color: win ? 'var(--primary)' : 'var(--muted-foreground)' }}
              >
                {fmt(phi)}
              </div>
            </div>
            {/* gap */}
            <div
              className="font-mono text-[10px] tabular-nums shrink-0 text-right"
              style={{ width: 40, color: win ? 'var(--primary)' : gap > 100 ? 'var(--destructive)' : 'var(--muted-foreground)' }}
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
            <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>QAOA Φ</div>
            <div className="font-mono text-sm tabular-nums font-semibold" style={{ color: 'var(--primary)' }}>{fmt(winner.phi)}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>best rival gap</div>
            <div className="font-mono text-sm tabular-nums font-semibold" style={{ color: 'var(--destructive)' }}>
              +{rivalGap.toFixed(2)}%
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>gap</div>
            <div className="font-mono text-sm tabular-nums font-semibold" style={{ color: 'var(--chart-3)' }}>{winner.gap.toFixed(1)}%</div>
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
        <Ey>Algorithm Benchmark · Artur Nogueira Dataset · Φ = 0.5·(D/k) + 0.5·σ (lower is better)</Ey>
        <H size="lg">QAOA leads on fairness at every scale.</H>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        {SCALE_PANELS.map(({ key, label, sub, rivalGap }) => (
          <ScalePanel key={key} scaleKey={key} label={label} sub={sub} rivalGap={rivalGap} />
        ))}
      </div>
    </div>
  )
}

function S13Benchmark100() {
  return (
    <div className="absolute inset-0 flex flex-col px-8 py-5">
      <div className="shrink-0 mb-4">
        <Ey>n = 100 · 10 Independent Runs · Randomised Seeds · Φ lower is better</Ey>
        <H size="lg">Consistent across randomised seeds.</H>
        <div className="mt-3 text-base text-muted-foreground leading-relaxed max-w-[80ch]">
          Algorithms that rely on random seeds (Genetic Algorithm, Simulated Annealing, Tabu Search) were run 10 times
          with different seeds to ensure fair comparison. QAOA's deterministic QUBO formulation remains seed-independent —
          the variational angles (γ, β) are the only stochastic element, tuned by COBYLA.
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {SCALE_PANELS_100.map(({ key, label, sub, rivalGap }) => (
          <ScalePanel key={key} scaleKey={key} label={label} sub={sub} rivalGap={rivalGap} />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 14 — hardware */
function S14Hardware() {
  const coral = '#e06c3a'
  const red   = '#f43f5e'
  const green = '#4ade80'

  const attempts = [
    { nodes: 50, vehicles: 5, qubits: '~625', status: 'Failed', note: 'Noise dominates at scale', c: red },
    { nodes: 20, vehicles: 4, qubits: '~100', status: 'Failed', note: 'Gate errors compound', c: red },
    { nodes:  5, vehicles: 3, qubits: '25',   status: '7% valid', note: 'Restitched via Hungarian', c: green },
  ]

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 50% at 28% 50%, oklch(0.65 0.2 25 / 0.06), transparent 70%)' }} />

      {/* LEFT editorial */}
      <div className="relative z-10 flex w-[36%] shrink-0 flex-col justify-center px-14 gap-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground/60">Hardware Run</span>
        </motion.div>
        <span className="h-px w-16 origin-left bg-primary/70" style={{ animation: 'qa-rule 800ms cubic-bezier(0.76,0,0.24,1) 140ms both' }} />
        <motion.h1 className="font-serif italic leading-[0.92] tracking-tight text-foreground"
          style={{ fontSize: 'clamp(2.4rem, 3.8vw, 3.5rem)' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          Real Quantum<br />Hardware.
        </motion.h1>
        <motion.p className="font-serif italic text-[13.5px] leading-[1.8] text-foreground/65 max-w-[36ch]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          ibm_fez · 156 qubits in theory. In practice: noise compounds
          with every gate and the circuit collapses before it finishes.
          Running on hardware was just bad.
        </motion.p>

        {/* error formula card */}
        <motion.div className="rounded-xl p-5 flex flex-col gap-2"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'oklch(0.17 0.022 250)', border: `1px solid ${red}50` }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: red, opacity: 0.65 }}>Gate Error Model</div>
          <TexGlow latex="P(\text{success}) = (1-0.0037)^{704} \approx 7.3\%" color={red} size="0.92rem" delay={0.5} display />
          <div className="font-mono text-[10px] mt-1" style={{ color: 'oklch(0.62 0.01 250)' }}>p = 2 layers · n = 5 nodes · 704 two-qubit gates</div>
          <div className="font-mono text-[10px]" style={{ color: 'oklch(0.48 0.01 250)' }}>Excludes readout errors &amp; SWAP overhead</div>
        </motion.div>
      </div>

      {/* RIGHT */}
      <div className="relative z-10 flex flex-1 flex-col pr-12 pl-4 py-10 justify-center gap-5">
        {/* attempt table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid oklch(0.30 0.02 250)' }}>
          {/* header */}
          <div className="grid grid-cols-5 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: 'oklch(0.58 0.01 250)', background: 'oklch(0.19 0.02 250)', borderBottom: '1px solid oklch(0.26 0.02 250)' }}>
            <span>Nodes</span><span>Vehicles</span><span>Qubits</span><span>Outcome</span><span>Note</span>
          </div>
          {attempts.map(({ nodes, vehicles, qubits, status, note, c }, i) => (
            <motion.div key={nodes}
              className="grid grid-cols-5 px-5 py-4 items-center"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                borderBottom: i < attempts.length - 1 ? '1px solid oklch(0.22 0.015 250)' : 'none',
                background: i % 2 === 0 ? 'oklch(0.155 0.018 250)' : 'oklch(0.175 0.02 250)',
              }}>
              <span className="font-mono text-xl font-light tabular-nums" style={{ color: c }}>{nodes}</span>
              <span className="font-mono text-sm" style={{ color: 'oklch(0.72 0.01 250)' }}>{vehicles}</span>
              <span className="font-mono text-sm" style={{ color: 'oklch(0.72 0.01 250)' }}>{qubits}</span>
              <span className="font-mono text-sm font-semibold" style={{ color: c }}>{status}</span>
              <span className="font-mono text-[11px]" style={{ color: 'oklch(0.60 0.01 250)' }}>{note}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* bottom stat row */}
        <motion.div className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          {[
            { v: '0.37%', l: '2-qubit gate error · ibm_fez', c: red },
            { v: '7%',    l: 'Valid solutions · n=5 run', c: coral },
            { v: 'Hungarian', l: 'Post-processing · route restitching', c: '#7b9fff' },
          ].map(({ v, l, c }) => (
            <div key={l} className="rounded-xl py-5 px-5 text-center"
              style={{
                background: 'oklch(0.17 0.02 250)',
                border: `1px solid color-mix(in oklch, ${c} 38%, oklch(0.28 0.02 250))`,
              }}>
              <div className="font-mono text-2xl font-light tabular-nums mb-2" style={{ color: c }}>{v}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] leading-tight" style={{ color: 'oklch(0.58 0.01 250)' }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 33 — future work */
function S15FutureWork() {
  const coral = '#e06c3a'
  const items = [
    {
      num: '01',
      title: 'Parameter Transferability',
      body: 'Optimal QAOA angles learned on one cluster transfer zero-shot to geographically different clusters of the same size.',
      tag: 'Proved · warm-start',
      c: coral,
    },
    {
      num: '02',
      title: 'Cross-Size Generalisation',
      body: 'Can warm-start parameters transfer across structurally similar VRP instances of different sizes? A QUBO-embedding similarity measure may replace raw geography.',
      tag: 'Open problem',
      c: '#7b9fff',
    },
    {
      num: '03',
      title: 'Hardware Error Mitigation',
      body: 'Probabilistic error cancellation and dynamical decoupling on IBM Heron hardware — target sub-1% optimality gap without post-processing projection.',
      tag: 'Near-term hardware',
      c: '#4ade80',
    },
    {
      num: '04',
      title: 'Scalable Decomposition',
      body: 'Adaptive LEAF_SIZE tuning per hardware generation — as qubit counts grow, the recursion threshold rises, shrinking classical overhead asymptotically.',
      tag: 'Algorithmic',
      c: 'oklch(0.72 0.18 300)',
    },
  ]
  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 30% 50%, oklch(0.72 0.18 35 / 0.05), transparent 70%)' }} />

      {/* LEFT */}
      <div className="relative z-10 flex w-[32%] shrink-0 flex-col justify-center px-14 gap-5">
        <div style={{ animation: 'qa-numeral 700ms cubic-bezier(0.76,0,0.24,1) 60ms both' }}>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground/60">What comes next</span>
        </div>
        <span className="h-px w-16 origin-left bg-primary/70" style={{ animation: 'qa-rule 800ms cubic-bezier(0.76,0,0.24,1) 140ms both' }} />
        <h1 className="font-serif italic leading-[0.9] tracking-tight text-foreground"
          style={{ fontSize: 'clamp(2.8rem, 5vw, 4.6rem)', animation: 'qa-title 850ms cubic-bezier(0.76,0,0.24,1) 180ms both' }}>
          Future<br />Work.
        </h1>
        <p className="max-w-[36ch] font-serif italic text-[14px] leading-[1.8] text-foreground/70"
          style={{ animation: 'qa-soft 850ms cubic-bezier(0.76,0,0.24,1) 360ms both' }}>
          Four open directions that extend this work toward production-scale quantum fleet routing.
        </p>
      </div>

      {/* RIGHT — 2×2 grid */}
      <div className="relative z-10 flex flex-1 flex-col pr-12 pl-4 py-12 justify-center">
        <div className="grid grid-cols-2 gap-5 h-full">
          {items.map(({ num, title, body, tag, c }, i) => (
            <motion.div key={num}
              className="rounded-xl p-7 flex flex-col gap-3 text-left"
              style={{
                background: 'color-mix(in oklch, var(--card) 80%, transparent)',
                border: `1px solid color-mix(in oklch, ${c} 28%, var(--border) 60%)`,
                boxShadow: `0 0 40px color-mix(in oklch, ${c} 6%, transparent)`,
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-3xl font-light tabular-nums" style={{ color: c, opacity: 0.35 }}>{num}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded"
                  style={{ background: `color-mix(in oklch, ${c} 12%, transparent)`, color: c }}>{tag}</span>
              </div>
              <div className="font-serif italic text-xl leading-tight text-foreground">{title}</div>
              <div className="font-sans text-sm leading-relaxed text-muted-foreground">{body}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── slide 34 — conclusion */
function SConclusion() {
  const coral = '#e06c3a'
  const lines = [
    { text: 'VECTORA is the most capable routing algorithm tested —', accent: false },
    { text: 'outperforming every classical baseline on weighted fairness.', accent: true },
    { text: 'It eliminates sub-tours by construction, not correction.', accent: false },
    { text: 'Quantum advantage is no longer theoretical.', accent: true },
  ]
  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%, oklch(0.72 0.18 35 / 0.07), transparent 70%)' }} />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-20 gap-10">
        <motion.div className="text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <div className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: coral, opacity: 0.75 }}>Conclusion</div>
          <div className="h-px w-12 mx-auto mb-5" style={{ background: coral, animation: 'qa-rule 0.6s 0.1s both' }} />
          <div className="font-mono text-sm uppercase tracking-[0.5em] mb-4" style={{ color: coral }}>VECTORA</div>
          <h1 className="font-serif italic font-light leading-none tracking-[-0.03em] text-foreground"
            style={{ fontSize: 'clamp(2.6rem, 5.5vw, 5rem)' }}>
            A novel hybrid algorithm.<br />
            <span style={{ color: coral }}>Beats every baseline. Today.</span>
          </h1>
        </motion.div>

        <div className="flex flex-col items-center gap-3 max-w-[64ch] w-full">
          {lines.map(({ text, accent }, i) => (
            <motion.p key={i}
              className="text-center font-serif italic leading-relaxed"
              style={{
                fontSize: accent ? '1.18rem' : '1rem',
                color: accent ? 'oklch(0.92 0.01 250)' : 'oklch(0.62 0.01 250)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              {text}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
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
