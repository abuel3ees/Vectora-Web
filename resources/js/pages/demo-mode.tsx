import { router } from '@inertiajs/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

/* ─────────────────────────────────────────── types */
type Stat = { value: number; suffix?: string; label: string }

type Slide =
  | { type: 'logo' }
  | { type: 'intro' }
  | { type: 'section'; number: string; title: string; sub: string; stats: Stat[]; tag: string }
  | { type: 'live'; path: string; label: string; sub: string; endpoint: string; autoClick?: string }
  | { type: 'optimize' }
  | { type: 'dispatch' }
  | { type: 'mobile' }
  | { type: 'outro' }

const PRIMARY = 'oklch(0.72 0.18 35)'
const BG = 'oklch(0.055 0.012 250)'

const SLIDES: Slide[] = [
  { type: 'logo' },
  { type: 'intro' },
  {
    type: 'section',
    tag: 'Chapter One',
    number: '01',
    title: 'The Command Center',
    sub: 'A live overview of your entire fleet — assignments, routes, and the live map.',
    stats: [
      { value: 1000, label: 'Active Nodes' },
      { value: 15, label: 'Routes' },
      { value: 24, suffix: '/7', label: 'Uptime' },
    ],
  },
  {
    type: 'live',
    path: '/',
    label: 'Dispatch Dashboard',
    sub: 'Real-time fleet overview',
    endpoint: 'GET  /',
  },
  {
    type: 'section',
    tag: 'Chapter Two',
    number: '02',
    title: 'The Quantum Engine',
    sub: 'One thousand delivery nodes. QAOA-optimised routes on real São Paulo streets.',
    stats: [
      { value: 1000, label: 'Delivery Nodes' },
      { value: 156, label: 'Qubits Available' },
      { value: 0, suffix: '%', label: 'Optimal Gap' },
    ],
  },
  { type: 'optimize' },
  { type: 'dispatch' },
  { type: 'mobile' },
  {
    type: 'section',
    tag: 'Chapter Three',
    number: '03',
    title: 'Route Management',
    sub: 'Every dispatch route, versioned and ready for assignment.',
    stats: [
      { value: 15, label: 'Saved Routes' },
      { value: 1000, label: 'Total Stops' },
      { value: 15, label: 'Drivers' },
    ],
  },
  {
    type: 'live',
    path: '/routes',
    label: 'Route Library',
    sub: 'Named dispatch routes',
    endpoint: 'GET  /routes',
    autoClick: 'a[href^="/routes/"]:not([href$="/create"]):not([href$="/edit"])',
  },
  {
    type: 'section',
    tag: 'Chapter Four',
    number: '04',
    title: 'Live Operations',
    sub: 'Real-time fleet activity — from dispatch to the final delivery.',
    stats: [
      { value: 15, label: 'Active Assignments' },
      { value: 412, label: 'GPS Pings/min' },
      { value: 98, suffix: '%', label: 'On-Time' },
    ],
  },
  {
    type: 'live',
    path: '/operations',
    label: 'Operations Console',
    sub: 'Active fleet · live map',
    endpoint: 'GET  /operations',
    autoClick: '.cursor-pointer',
  },
  {
    type: 'section',
    tag: 'Chapter Five',
    number: '05',
    title: 'Proof of Delivery',
    sub: 'Every stop logged. Every package photographed. Every signature captured.',
    stats: [
      { value: 312, label: 'Photos Logged' },
      { value: 189, label: 'Signatures' },
      { value: 100, suffix: '%', label: 'Verified' },
    ],
  },
  {
    type: 'live',
    path: '/delivery-proofs',
    label: 'Delivery Proofs',
    sub: 'Photo · signature audit trail',
    endpoint: 'GET  /delivery-proofs',
    autoClick: '.cursor-pointer',
  },
  { type: 'outro' },
]

const TOTAL = SLIDES.length

/* ─────────────────────────────────────────── css */
function InjectStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300;1,6..72,400&family=Geist+Mono:wght@400;500&display=swap');
      @keyframes dm-ping     { 0%,100% { opacity:1; transform:scale(1);   } 60% { opacity:.25; transform:scale(1.5); } }
      @keyframes dm-radar    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes dm-shimmer  { from { background-position:-200% center; } to { background-position:200% center; } }
      @keyframes dm-blink    { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
      @keyframes dm-scan     { 0% { transform:translateY(-10vh); } 100% { transform:translateY(110vh); } }
      @keyframes dm-grain    { 0%,100% { transform:translate(0,0);} 10% { transform:translate(-5%,-3%);} 20% { transform:translate(3%,2%);} 30% { transform:translate(-2%,4%);} 40% { transform:translate(4%,-2%);} 50% { transform:translate(-3%,3%);} 60% { transform:translate(2%,-4%);} 70% { transform:translate(-4%,1%);} 80% { transform:translate(3%,3%);} 90% { transform:translate(-2%,-2%);} }
      @keyframes dm-loadbar  { 0% { width:0%; opacity:1;} 90%{width:100%; opacity:1;} 100% { width:100%; opacity:0;} }
      @keyframes dm-pulse-glow { 0%,100% { box-shadow:0 0 0 0 oklch(0.72 0.18 35 / 0.6); } 70% { box-shadow:0 0 0 8px oklch(0.72 0.18 35 / 0); } }
      .dm-ping      { animation: dm-ping       2.4s ease-in-out infinite; will-change: opacity, transform; transform: translateZ(0); }
      .dm-radar     { animation: dm-radar       12s linear        infinite; will-change: transform; transform: translateZ(0); backface-visibility: hidden; }
      .dm-shimmer   { animation: dm-shimmer    4.5s linear        infinite; background-size: 200% auto; will-change: background-position; transform: translateZ(0); }
      .dm-blink     { animation: dm-blink     1.05s steps(1)     infinite; }
      .dm-scan      { animation: dm-scan         9s linear        infinite; will-change: transform; transform: translateZ(0); backface-visibility: hidden; }
      .dm-grain     { animation: dm-grain      1.2s steps(8)     infinite; will-change: transform; transform: translateZ(0); }
      .dm-loadbar   { animation: dm-loadbar    1.6s cubic-bezier(.2,1,.3,1) forwards; will-change: width, opacity; transform: translateZ(0); }
      .dm-pulse-glow{ animation: dm-pulse-glow 2.4s ease-in-out infinite; will-change: box-shadow; transform: translateZ(0); }
      .gpu          { transform: translateZ(0); backface-visibility: hidden; -webkit-backface-visibility: hidden; perspective: 1000px; will-change: transform, opacity; }
      .gpu-blur     { transform: translateZ(0); backface-visibility: hidden; will-change: filter, opacity, transform; }
      * { cursor: none !important; }
      iframe { color-scheme: dark; transform: translateZ(0); backface-visibility: hidden; }
      svg, canvas { transform: translateZ(0); }
    `}</style>
  )
}

/* ─────────────────────────────────────────── cursor */
function CursorDot() {
  const [pos, setPos] = useState({ x: -20, y: -20 })
  const [vis, setVis] = useState(true)
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      setVis(true)
      if (tRef.current) clearTimeout(tRef.current)
      tRef.current = setTimeout(() => setVis(false), 1000)
    }
    window.addEventListener('mousemove', h)
    return () => {
      window.removeEventListener('mousemove', h)
      if (tRef.current) clearTimeout(tRef.current)
    }
  }, [])

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full transition-opacity duration-500"
      style={{
        width: 8, height: 8,
        background: PRIMARY,
        boxShadow: `0 0 12px ${PRIMARY}, 0 0 2px ${PRIMARY}`,
        transform: `translate(${pos.x - 4}px, ${pos.y - 4}px)`,
        opacity: vis ? 1 : 0,
      }}
    />
  )
}

/* ─────────────────────────────────────────── grain overlay */
function Grain() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[60] dm-grain mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        opacity: 0.08,
        inset: '-10%',
        width: '120%',
        height: '120%',
      }}
    />
  )
}

/* ─────────────────────────────────────────── animated grid bg */
function GridBg({ fade = true }: { fade?: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.45 }}>
      <defs>
        <pattern id="dm-grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 64 0 L 0 0 0 64" fill="none" stroke="oklch(0.18 0.015 250)" strokeWidth="1" />
        </pattern>
        <radialGradient id="dm-grid-fade" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="dm-grid-mask">
          <rect width="100%" height="100%" fill={fade ? 'url(#dm-grid-fade)' : 'white'} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#dm-grid)" mask="url(#dm-grid-mask)" />
    </svg>
  )
}

/* ─────────────────────────────────────────── floating particles */
function Particles({ count = 26 }: { count?: number }) {
  // Generate on the client only — Math.random() would otherwise cause SSR/client mismatch.
  const [items, setItems] = useState<
    { i: number; x: number; y: number; delay: number; duration: number; size: number; opacity: number }[]
  >([])

  useEffect(() => {
    setItems(
      Array.from({ length: count }, (_, i) => ({
        i,
        x: Math.random() * 100,
        y: 70 + Math.random() * 40,
        delay: Math.random() * 8,
        duration: 10 + Math.random() * 14,
        size: 1 + Math.random() * 1.8,
        opacity: 0.25 + Math.random() * 0.5,
      })),
    )
  }, [count])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((p) => (
        <motion.div
          key={p.i}
          className="absolute rounded-full gpu"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: PRIMARY,
            boxShadow: `0 0 ${p.size * 2}px ${PRIMARY}`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -700, opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.1, 0.85, 1],
          }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────── typewriter */
function TypeWriter({
  text,
  delay = 0,
  speed = 38,
  cursor = true,
  className,
  style,
  onDone,
}: {
  text: string
  delay?: number
  speed?: number
  cursor?: boolean
  className?: string
  style?: React.CSSProperties
  onDone?: () => void
}) {
  const [n, setN] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setN(0)
    setDone(false)
    let interval: ReturnType<typeof setInterval> | null = null
    const start = setTimeout(() => {
      let i = 0
      interval = setInterval(() => {
        i++
        setN(i)
        if (i >= text.length) {
          if (interval) clearInterval(interval)
          setDone(true)
          onDone?.()
        }
      }, speed)
    }, delay)
    return () => {
      clearTimeout(start)
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay, speed])

  return (
    <span className={className} style={style}>
      {text.slice(0, n)}
      {cursor && (
        <span
          className={done ? 'dm-blink' : ''}
          style={{
            display: 'inline-block',
            marginLeft: '0.05em',
            transform: 'translateY(-0.05em)',
            width: '0.55em',
            height: '0.78em',
            background: PRIMARY,
            verticalAlign: 'baseline',
            opacity: done ? 1 : 0.95,
          }}
        />
      )}
    </span>
  )
}

/* ─────────────────────────────────────────── mask slide-up (text rises from clipped mask, per line) */
function MaskReveal({
  lines,
  delay = 0,
  stagger = 0.12,
  duration = 0.95,
  className,
  style,
}: {
  lines: string[]
  delay?: number
  stagger?: number
  duration?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span className={className} style={{ ...style, display: 'block' }}>
      {lines.map((line, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            overflow: 'hidden',
            lineHeight: (style?.lineHeight as number | string) ?? 1.02,
            paddingBottom: '0.06em',
          }}
        >
          <motion.span
            style={{
              display: 'block',
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
            initial={{ y: '105%' }}
            animate={{ y: '0%' }}
            transition={{
              duration,
              delay: delay + i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* ─────────────────────────────────────────── blur focus-in */
function BlurReveal({
  text,
  delay = 0,
  duration = 1.1,
  className,
  style,
}: {
  text: string
  delay?: number
  duration?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <motion.span
      className={`gpu-blur ${className ?? ''}`}
      style={{ ...style, display: 'inline-block' }}
      initial={{ opacity: 0, filter: 'blur(22px)', y: 14, scale: 1.02 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      {text}
    </motion.span>
  )
}

/* ─────────────────────────────────────────── letter stagger (per-char fade + drift) */
function LetterReveal({
  text,
  delay = 0,
  charStagger = 0.022,
  duration = 0.6,
  className,
  style,
}: {
  text: string
  delay?: number
  charStagger?: number
  duration?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span className={className} style={style}>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          className="gpu-blur"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration,
            delay: delay + i * charStagger,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

/* ─────────────────────────────────────────── horizontal slide-in (per word, left → right) */
function SlideHReveal({
  text,
  delay = 0,
  stagger = 0.06,
  duration = 0.8,
  distance = 40,
  className,
  style,
}: {
  text: string
  delay?: number
  stagger?: number
  duration?: number
  distance?: number
  className?: string
  style?: React.CSSProperties
}) {
  const words = text.split(' ')
  return (
    <span className={className} style={style}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'top',
            // Italic side bearings can lean past the glyph box; give them breathing room
            // on both sides so 'all', 'l', and ligature pairs don't get clipped.
            paddingTop: '0.08em',
            paddingBottom: '0.14em',
            paddingLeft: '0.06em',
            paddingRight: '0.18em',
            marginLeft: '-0.06em',
            marginRight: '0.10em',
          }}
        >
          <motion.span
            className="gpu"
            style={{ display: 'inline-block' }}
            initial={{ x: -distance, opacity: 0, filter: 'blur(6px)' }}
            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{
              duration,
              delay: delay + i * stagger,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* ─────────────────────────────────────────── word reveal */
function WordReveal({
  text,
  delay = 0,
  stagger = 0.045,
  className,
  style,
}: {
  text: string
  delay?: number
  stagger?: number
  className?: string
  style?: React.CSSProperties
}) {
  const words = text.split(' ')
  return (
    <span className={className} style={style}>
      {words.map((w, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
          <motion.span
            className="gpu"
            style={{ display: 'inline-block', marginRight: '0.28em' }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.55,
              delay: delay / 1000 + i * stagger,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* ─────────────────────────────────────────── count up */
function CountUp({
  to,
  duration = 1.4,
  delay = 0,
  suffix = '',
}: {
  to: number
  duration?: number
  delay?: number
  suffix?: string
}) {
  const [v, setV] = useState(0)

  useEffect(() => {
    setV(0)
    let raf: number
    const startTime = performance.now() + delay
    const tick = (t: number) => {
      const elapsed = t - startTime
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const p = Math.min(1, elapsed / (duration * 1000))
      const eased = 1 - Math.pow(1 - p, 3)
      setV(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration, delay])

  return (
    <span className="tabular-nums">
      {v}
      {suffix}
    </span>
  )
}

/* ─────────────────────────────────────────── live clock (client-only to avoid SSR mismatch) */
function LiveClock() {
  const [time, setTime] = useState<string>('--:--:--')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="tabular-nums">{time}</span>
}

/* ─────────────────────────────────────────── REC indicator */
function RecIndicator() {
  return (
    <div className="fixed top-5 left-8 z-[55] flex items-center gap-2.5">
      <span
        className="w-2 h-2 rounded-full dm-pulse-glow"
        style={{ background: PRIMARY }}
      />
      <span
        className="text-[10px] font-mono uppercase tracking-[0.35em]"
        style={{ color: PRIMARY }}
      >
        REC
      </span>
      <span
        className="text-[10px] font-mono"
        style={{ color: 'oklch(0.32 0 0)' }}
      >
        <LiveClock />
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────── load bar (top) */
function LoadBar({ k }: { k: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[58] h-[2px]" style={{ background: 'transparent' }}>
      <div
        key={k}
        className="dm-loadbar h-full"
        style={{ background: `linear-gradient(90deg, transparent, ${PRIMARY}, transparent)` }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────── scanline */
function ScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute left-0 right-0 h-[140px] dm-scan"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${PRIMARY} 50%, transparent 100%)`,
          opacity: 0.04,
          filter: 'blur(8px)',
        }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────── corner brackets */
function CornerBrackets() {
  const c = 'oklch(0.22 0 0)'
  const sz = 28
  const wb = 1.5
  const off = 22
  const Bracket = ({
    side,
  }: {
    side: 'tl' | 'tr' | 'bl' | 'br'
  }) => {
    const v: React.CSSProperties = {
      position: 'absolute',
      width: sz,
      height: sz,
      borderColor: c,
      borderStyle: 'solid',
      borderWidth: 0,
    }
    if (side === 'tl') Object.assign(v, { top: off, left: off, borderTopWidth: wb, borderLeftWidth: wb })
    if (side === 'tr') Object.assign(v, { top: off, right: off, borderTopWidth: wb, borderRightWidth: wb })
    if (side === 'bl') Object.assign(v, { bottom: off, left: off, borderBottomWidth: wb, borderLeftWidth: wb })
    if (side === 'br') Object.assign(v, { bottom: off, right: off, borderBottomWidth: wb, borderRightWidth: wb })
    return <div style={v} />
  }
  return (
    <>
      <Bracket side="tl" />
      <Bracket side="tr" />
      <Bracket side="bl" />
      <Bracket side="br" />
    </>
  )
}

/* ─────────────────────────────────────────── LOGO (cold-open wordmark) */
function LogoSlide() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      <GridBg />
      <Particles count={20} />

      {/* concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[420, 700, 1000, 1320].map((r, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border"
            style={{ width: r, height: r, borderColor: `oklch(1 0 0 / ${0.04 - i * 0.008})` }}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
        <div className="absolute w-[720px] h-[720px] rounded-full overflow-hidden" style={{ opacity: 0.06 }}>
          <div
            className="absolute inset-0 dm-radar"
            style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${PRIMARY} 48deg, transparent 48deg)` }}
          />
        </div>
      </div>

      <div className="relative text-center px-10" style={{ maxWidth: 1400, width: '100%' }}>
        {/* tiny crest above */}
        <motion.div
          className="font-mono text-[10px] uppercase tracking-[0.5em] mb-10"
          style={{ color: PRIMARY, opacity: 0.75 }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 0.75, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          · MMXXVI ·
        </motion.div>

        {/* the wordmark */}
        <motion.h1
          className="dm-shimmer font-serif italic font-light gpu-blur"
          style={{
            fontSize: 'clamp(5rem, 18vw, 18rem)',
            lineHeight: 0.92,
            letterSpacing: '-0.05em',
            background: `linear-gradient(90deg, ${PRIMARY} 0%, oklch(0.96 0 0) 50%, ${PRIMARY} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            display: 'block',
          }}
          initial={{ opacity: 0, filter: 'blur(30px)', scale: 1.04, y: 22 }}
          animate={{ opacity: 1, filter: 'blur(0px)',  scale: 1,    y: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          Vectora
        </motion.h1>

        {/* underline draws in */}
        <motion.div
          className="h-[2px] mx-auto mt-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${PRIMARY}, transparent)`,
            boxShadow: `0 0 16px ${PRIMARY}`,
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          transition={{ duration: 1.1, delay: 1.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        />

        {/* tagline */}
        <motion.div
          className="mt-9 font-mono uppercase"
          style={{ color: 'oklch(0.55 0 0)', fontSize: 12, letterSpacing: '0.55em' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 2.0 }}
        >
          QUANTUM&nbsp;&nbsp;LOGISTICS
        </motion.div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── INTRO */
function IntroSlide() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      <GridBg />
      <Particles count={28} />

      {/* radar rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[300, 500, 720, 960, 1200].map((r, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border"
            style={{ width: r, height: r, borderColor: `oklch(1 0 0 / ${0.04 - i * 0.006})` }}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          />
        ))}
        <div className="absolute w-[640px] h-[640px] rounded-full overflow-hidden" style={{ opacity: 0.08 }}>
          <div
            className="absolute inset-0 dm-radar"
            style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${PRIMARY} 52deg, transparent 52deg)` }}
          />
        </div>
      </div>

      <div className="relative text-center px-10" style={{ maxWidth: 1100, width: '100%' }}>
        {/* badges row — full VECTORA branding */}
        <div className="mb-10 flex justify-center gap-3">
          <motion.span
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm"
            style={{
              background: 'oklch(0.72 0.18 35 / 0.1)',
              color: PRIMARY,
              border: `1px solid oklch(0.72 0.18 35 / 0.32)`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full dm-ping" style={{ background: PRIMARY }} />
            VECTORA · LIVE
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            className="inline-flex items-center text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm"
            style={{ color: 'oklch(0.4 0 0)', border: '1px solid oklch(0.2 0 0)' }}
          >
            Quantum Logistics
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.4 }}
            className="inline-flex items-center text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm"
            style={{ color: 'oklch(0.4 0 0)', border: '1px solid oklch(0.2 0 0)' }}
          >
            v1.0
          </motion.span>
        </div>

        {/* eyebrow with drawing line */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <motion.div
            className="h-px"
            style={{ background: 'oklch(0.3 0 0)' }}
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.45em]"
            style={{ color: 'oklch(0.5 0 0)' }}
          >
            VECTORA · MMXXVI
          </span>
          <motion.div
            className="h-px"
            style={{ background: 'oklch(0.3 0 0)' }}
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          />
        </motion.div>

        {/* main title — blur focus-in (animated on the h1 itself so the shimmer
            gradient + background-clip:text keep working) */}
        <motion.h1
          className="dm-shimmer font-serif italic font-light"
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 6rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.045em',
            background: `linear-gradient(90deg, ${PRIMARY} 0%, oklch(0.95 0 0) 45%, ${PRIMARY} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            display: 'block',
            willChange: 'filter, opacity, transform',
          }}
          initial={{ opacity: 0, filter: 'blur(24px)', y: 18, scale: 1.03 }}
          animate={{ opacity: 1, filter: 'blur(0px)',  y: 0,  scale: 1 }}
          transition={{ duration: 1.2, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          Quantum Fleet
          <br />
          Dispatch.
        </motion.h1>

        {/* subtitle — letter stagger */}
        <motion.div
          className="mt-9 font-mono text-[11px] tracking-wider"
          style={{ color: 'oklch(0.55 0 0)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.0 }}
        >
          <span style={{ color: PRIMARY }}>▸ </span>
          <LetterReveal
            text="Real streets. Real data. Real routes."
            delay={2.05}
            charStagger={0.022}
            style={{ color: 'oklch(0.65 0 0)' }}
          />
        </motion.div>

      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── SECTION */
// "The Command Center" → ["The Command", "Center"]  (line-wrap on the natural break)
function splitTitle(t: string): string[] {
  const words = t.split(' ')
  if (words.length <= 2) return [t]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

function SectionSlide({
  number,
  title,
  sub,
  stats,
  tag,
}: {
  number: string
  title: string
  sub: string
  stats: Stat[]
  tag: string
}) {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      <GridBg />
      <Particles count={18} />

      {/* top line draws from left */}
      <motion.div
        className="absolute top-0 left-0 h-px"
        style={{ background: `${PRIMARY}` , opacity: 0.5 }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      />

      {/* giant background numeral */}
      <motion.div
        className="absolute font-mono pointer-events-none select-none tabular-nums"
        initial={{ opacity: 0, scale: 1.08, letterSpacing: '0em' }}
        animate={{ opacity: 1, scale: 1, letterSpacing: '-0.06em' }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        style={{
          fontSize: 'clamp(26rem, 52vw, 46rem)',
          lineHeight: 1,
          color: 'oklch(0.72 0.18 35 / 0.035)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -54%)',
        }}
      >
        {number}
      </motion.div>

      <div className="relative text-center px-10" style={{ maxWidth: 1240, width: '100%' }}>
        {/* tag — letter stagger */}
        <div
          className="font-mono text-[10px] uppercase tracking-[0.5em] mb-2"
          style={{ color: PRIMARY, opacity: 0.85 }}
        >
          <LetterReveal text={tag.toUpperCase()} delay={0.15} charStagger={0.028} />
        </div>

        {/* chapter number */}
        <motion.div
          className="font-mono text-[10px] mb-9"
          style={{ color: 'oklch(0.4 0 0)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          [ {number} / 05 ]
        </motion.div>

        {/* big title — mask slide-up (per line) */}
        <h2
          className="font-serif italic font-light leading-[1.02] tracking-[-0.04em] text-white"
          style={{ fontSize: 'clamp(3rem, 7vw, 6.5rem)' }}
        >
          <MaskReveal lines={title.split(' ').length > 2 ? splitTitle(title) : [title]} delay={0.75} stagger={0.13} duration={1.0} />
        </h2>

        {/* animated underline */}
        <motion.div
          className="h-[2px] mx-auto my-9"
          style={{
            background: `linear-gradient(90deg, transparent, ${PRIMARY}, transparent)`,
            boxShadow: `0 0 12px ${PRIMARY}`,
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.95, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        />

        {/* subtitle — word reveal */}
        <p
          className="text-base font-light leading-relaxed"
          style={{ color: 'oklch(0.50 0 0)', maxWidth: '46ch', margin: '0 auto' }}
        >
          <WordReveal text={sub} delay={2300} stagger={0.04} />
        </p>

        {/* stats grid */}
        <motion.div
          className="mt-12 grid grid-cols-3 gap-3 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.95 }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="px-4 py-5 rounded-sm relative"
              style={{
                background: 'oklch(0.085 0.015 250 / 0.6)',
                border: '1px solid oklch(0.16 0.015 250)',
                backdropFilter: 'blur(8px)',
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 3.05 + i * 0.1 }}
            >
              <div
                className="font-serif italic font-light text-3xl"
                style={{ color: PRIMARY, letterSpacing: '-0.02em' }}
              >
                <CountUp
                  to={s.value}
                  suffix={s.suffix ?? ''}
                  duration={1.4}
                  delay={3150 + i * 100}
                />
              </div>
              <div
                className="mt-2 text-[9px] uppercase tracking-[0.25em] font-mono"
                style={{ color: 'oklch(0.45 0 0)' }}
              >
                {s.label}
              </div>
              {/* corner accent */}
              <div
                className="absolute top-2 right-2 w-1 h-1 rounded-full"
                style={{ background: PRIMARY, opacity: 0.5 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* bottom line draws from right */}
      <motion.div
        className="absolute bottom-0 right-0 h-px"
        style={{ background: `${PRIMARY}`, opacity: 0.5 }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      />

      <CornerBrackets />
    </div>
  )
}

/* ─────────────────────────────────────────── IFRAME CURSOR (animated cursor that arcs into an iframe and clicks an element) */
function IframeCursor({
  iframeRef,
  selector,
  ready,
  startDelay = 1000,
  arcDuration = 1.15,
  label,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  selector: string
  ready: boolean
  startDelay?: number
  arcDuration?: number
  label?: string
}) {
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null)
  const [phase, setPhase] = useState<'hidden' | 'arcing' | 'clicked' | 'done'>('hidden')

  useEffect(() => {
    if (!ready || !iframeRef.current) return
    let raf: number
    let killed = false
    let arcT: ReturnType<typeof setTimeout> | null = null
    let clickT: ReturnType<typeof setTimeout> | null = null
    let doneT: ReturnType<typeof setTimeout> | null = null

    const tryResolve = (attempt = 0) => {
      if (killed) return
      try {
        const doc = iframeRef.current?.contentDocument
        const el = doc?.querySelector<HTMLElement>(selector)
        if (!el || !iframeRef.current) {
          if (attempt < 25) {
            raf = window.setTimeout(() => tryResolve(attempt + 1), 200) as unknown as number
          }
          return
        }
        const r = el.getBoundingClientRect()
        const ir = iframeRef.current.getBoundingClientRect()
        setTarget({
          x: ir.left + r.left + r.width / 2,
          y: ir.top + r.top + r.height / 2,
        })
        setPhase('arcing')
        clickT = setTimeout(() => {
          if (killed) return
          setPhase('clicked')
          try { el.click() } catch { /* noop */ }
        }, arcDuration * 1000)
        doneT = setTimeout(() => {
          if (killed) return
          setPhase('done')
        }, arcDuration * 1000 + 700)
      } catch {
        /* cross-origin */
      }
    }

    arcT = setTimeout(tryResolve, startDelay)
    return () => {
      killed = true
      if (arcT) clearTimeout(arcT)
      if (clickT) clearTimeout(clickT)
      if (doneT) clearTimeout(doneT)
      if (raf) clearTimeout(raf)
    }
  }, [iframeRef, selector, ready, startDelay, arcDuration])

  if (!target || phase === 'hidden' || phase === 'done') return null

  const startX = target.x + 240
  const startY = target.y - 180
  const midX   = target.x + 100
  const midY   = target.y - 60

  return (
    <motion.div
      className="fixed pointer-events-none gpu"
      style={{ left: 0, top: 0, zIndex: 40 }}
      initial={{ x: startX, y: startY, opacity: 0, scale: 1 }}
      animate={
        phase === 'arcing'
          ? { x: [startX, midX, target.x], y: [startY, midY, target.y], opacity: [0, 1, 1], scale: [1, 1, 0.92] }
          : { x: target.x, y: target.y, opacity: 1, scale: 0.84 }
      }
      transition={
        phase === 'arcing'
          ? { duration: arcDuration, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], times: [0, 0.65, 1] }
          : { duration: 0.15, ease: 'easeOut' }
      }
    >
      {/* macOS arrow */}
      <svg width="28" height="32" viewBox="0 0 28 32" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.55))' }}>
        <path
          d="M2 2 L2 24 L8 19 L11.5 28 L15 26.5 L11.5 18 L20 18 Z"
          fill="white"
          stroke="#000"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>

      {/* optional label tag while arcing */}
      {label && phase === 'arcing' && (
        <motion.span
          className="absolute font-mono uppercase"
          style={{
            left: 36, top: 6,
            fontSize: 9, letterSpacing: '0.3em',
            color: PRIMARY,
            background: 'oklch(0.06 0.012 250 / 0.9)',
            border: `1px solid oklch(0.72 0.18 35 / 0.4)`,
            padding: '3px 7px',
            borderRadius: 2,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(6px)',
          }}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: arcDuration * 0.5 }}
        >
          {label}
        </motion.span>
      )}

      {/* click ripple */}
      {phase === 'clicked' && (
        <motion.div
          className="absolute"
          style={{
            left: 4, top: 6,
            width: 4, height: 4,
            borderRadius: 99,
            border: `2px solid ${PRIMARY}`,
          }}
          initial={{ scale: 0, opacity: 0.85 }}
          animate={{ scale: 16, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  )
}

/* ─────────────────────────────────────────── LIVE */
function LiveSlide({
  path,
  label,
  sub,
  endpoint,
  autoClick,
}: {
  path: string
  label: string
  sub: string
  endpoint: string
  autoClick?: string
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const [loaded, setLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <div className="absolute inset-0">
      {/* iframe */}
      <iframe
        ref={iframeRef}
        src={`${origin}${path}?embed=1`}
        title={label}
        onLoad={() => setLoaded(true)}
        className="absolute left-0 right-0 bottom-0 w-full border-0"
        style={{ top: 52, height: 'calc(100% - 52px)' }}
      />

      {autoClick && (
        <IframeCursor
          iframeRef={iframeRef}
          selector={autoClick}
          ready={loaded}
          startDelay={1100}
          arcDuration={1.15}
          label="click"
        />
      )}

      {/* loading shimmer over iframe until loaded */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-[6] flex items-center justify-center"
            style={{ top: 52, background: BG }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  border: `2px solid oklch(0.2 0.02 250)`,
                  borderTopColor: PRIMARY,
                  animation: 'dm-radar 0.8s linear infinite',
                }}
              />
              <div
                className="font-mono text-[10px] uppercase tracking-[0.35em]"
                style={{ color: 'oklch(0.45 0 0)' }}
              >
                Loading {endpoint}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* glass header bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center px-8"
        style={{
          height: 52,
          background: 'oklch(0.06 0.012 250 / 0.95)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          borderBottom: `1px solid oklch(0.16 0.02 250 / 0.9)`,
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* LEFT — live + label */}
        <div className="flex items-center gap-3 flex-1">
          <span
            className="relative flex h-2 w-2"
          >
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-50 dm-ping"
              style={{ background: PRIMARY }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: PRIMARY, boxShadow: `0 0 6px ${PRIMARY}` }}
            />
          </span>
          <div className="flex items-baseline gap-3">
            <span
              className="text-[11px] uppercase tracking-[0.3em] font-mono font-semibold"
              style={{ color: PRIMARY }}
            >
              LIVE
            </span>
            <span
              className="text-[11px] font-mono"
              style={{ color: 'oklch(0.75 0 0)' }}
            >
              {label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'oklch(0.35 0 0)' }}>
              · {sub}
            </span>
          </div>
        </div>

        {/* CENTER — endpoint URL */}
        <div
          className="px-3 py-1 rounded-sm font-mono text-[10px] tabular-nums"
          style={{
            background: 'oklch(0.10 0.015 250)',
            border: '1px solid oklch(0.18 0.02 250)',
            color: 'oklch(0.6 0 0)',
          }}
        >
          <span style={{ color: PRIMARY }}>{endpoint.split(' ')[0]}</span>
          <span style={{ color: 'oklch(0.45 0 0)' }}> {endpoint.split(' ').slice(1).join(' ')}</span>
        </div>

        {/* RIGHT — latency + status */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'oklch(0.5 0 0)' }}>
            <span style={{ color: 'oklch(0.7 0.2 145)' }}>●</span>
            <CountUp to={42} duration={1.2} suffix="ms" />
          </div>
          <div className="text-[10px] font-mono" style={{ color: 'oklch(0.4 0 0)' }}>
            200 OK
          </div>
        </div>
      </motion.div>

      {/* edge vignette (kept — static, no per-frame cost) */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{ boxShadow: 'inset 0 0 100px oklch(0.04 0.01 250 / 0.55)' }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────── OPTIMIZE (auto-running QAOA on 50 Brazil nodes) */
function seededRng(s: number) {
  let n = s
  return () => {
    n = (n * 16807) % 2147483647
    return (n - 1) / 2147483646
  }
}

const ROUTE_COLORS = [
  'oklch(0.74 0.18 35)',   // coral
  'oklch(0.72 0.18 250)',  // blue
  'oklch(0.74 0.18 145)',  // green
  'oklch(0.72 0.18 290)',  // purple
  'oklch(0.78 0.16 85)',   // yellow
  'oklch(0.7 0.2 25)',     // red
  'oklch(0.72 0.15 200)',  // teal
]

type OptNode = { x: number; y: number; cluster: number }

const OPT_DATA = (() => {
  const rng = seededRng(1337)
  const DEPOT = { x: 50, y: 50 }
  const clusterCenters = Array.from({ length: 7 }, (_, i) => {
    const ang = (i / 7) * Math.PI * 2 - Math.PI / 2
    return { x: 50 + Math.cos(ang) * 26, y: 50 + Math.sin(ang) * 22 }
  })
  const nodes: OptNode[] = []
  for (let i = 0; i < 50; i++) {
    const c = i % 7
    const center = clusterCenters[c]
    const spread = 8 + rng() * 4
    nodes.push({
      x: center.x + (rng() - 0.5) * spread,
      y: center.y + (rng() - 0.5) * spread,
      cluster: c,
    })
  }
  // Build routes: each cluster gets nearest-neighbour path from depot
  const routes = clusterCenters.map((_, ci) => {
    const pts = nodes.filter((n) => n.cluster === ci)
    // NN order from depot
    const visited: boolean[] = pts.map(() => false)
    const order: OptNode[] = []
    let cur = DEPOT
    for (let k = 0; k < pts.length; k++) {
      let best = -1
      let bd = Infinity
      for (let j = 0; j < pts.length; j++) {
        if (visited[j]) continue
        const dx = pts[j].x - cur.x
        const dy = pts[j].y - cur.y
        const d = dx * dx + dy * dy
        if (d < bd) {
          bd = d
          best = j
        }
      }
      visited[best] = true
      order.push(pts[best])
      cur = pts[best]
    }
    return { color: ROUTE_COLORS[ci], stops: order, ci }
  })
  return { DEPOT, nodes, routes }
})()

// Embeds the actual /optimize page with the cached 50-node Brazil QAOA solve preselected.
// The page auto-clicks Solve (?auto=1) and the sidebar is hidden (?embed=1).
function OptimizeSlide() {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const src = `${origin}/optimize?instance=50&algo=recursive_qaoa_2opt&k=15&embed=1`
  const [loaded, setLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <div className="absolute inset-0">
      <iframe
        ref={iframeRef}
        src={src}
        title="Quantum Optimizer · 50-node Brazil QAOA"
        onLoad={() => setLoaded(true)}
        className="absolute left-0 right-0 bottom-0 w-full border-0"
        style={{ top: 52, height: 'calc(100% - 52px)' }}
      />

      {/* Animated cursor arcs over and clicks the Compose button */}
      <IframeCursor
        iframeRef={iframeRef}
        selector='[data-test="optimize-compose"]'
        ready={loaded}
        startDelay={1400}
        arcDuration={1.3}
        label="compose routes"
      />

      <AnimatePresence>
        {!loaded && (
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-[6] flex items-center justify-center"
            style={{ top: 52, background: BG }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  border: `2px solid oklch(0.2 0.02 250)`,
                  borderTopColor: PRIMARY,
                  animation: 'dm-radar 0.8s linear infinite',
                }}
              />
              <div
                className="font-mono text-[10px] uppercase tracking-[0.35em]"
                style={{ color: 'oklch(0.45 0 0)' }}
              >
                Booting QAOA · 1,000 nodes · k=15
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* glass header bar — same chrome as live slides */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center px-8"
        style={{
          height: 52,
          background: 'oklch(0.06 0.012 250 / 0.95)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          borderBottom: `1px solid oklch(0.16 0.02 250 / 0.9)`,
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-50 dm-ping"
              style={{ background: PRIMARY }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: PRIMARY, boxShadow: `0 0 6px ${PRIMARY}` }}
            />
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-[11px] uppercase tracking-[0.3em] font-mono font-semibold" style={{ color: PRIMARY }}>
              LIVE
            </span>
            <span className="text-[11px] font-mono" style={{ color: 'oklch(0.75 0 0)' }}>
              Quantum Optimizer
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'oklch(0.35 0 0)' }}>
              · 1,000 nodes · Recursive QAOA + 2-opt
            </span>
          </div>
        </div>

        <div
          className="px-3 py-1 rounded-sm font-mono text-[10px] tabular-nums"
          style={{
            background: 'oklch(0.10 0.015 250)',
            border: '1px solid oklch(0.18 0.02 250)',
            color: 'oklch(0.6 0 0)',
          }}
        >
          <span style={{ color: PRIMARY }}>POST</span>
          <span style={{ color: 'oklch(0.45 0 0)' }}> /optimize/solve</span>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'oklch(0.5 0 0)' }}>
            <span style={{ color: 'oklch(0.7 0.2 145)' }}>●</span>
            cache hit
          </div>
          <div className="text-[10px] font-mono" style={{ color: 'oklch(0.4 0 0)' }}>
            200 OK
          </div>
        </div>
      </motion.div>

      {/* edge vignette only — scan line was burning CPU over the iframe */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{ boxShadow: 'inset 0 0 100px oklch(0.04 0.01 250 / 0.55)' }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────── DISPATCH */
function DispatchSlide() {
  // 0: title in
  // 1: button + cursor in (cursor offscreen)
  // 2: cursor arcing toward button
  // 3: cursor lands → button "clicks" (depressed + glow)
  // 4: success state
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2600),
      setTimeout(() => setPhase(2), 3300),
      setTimeout(() => setPhase(3), 4500),
      setTimeout(() => setPhase(4), 5000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Cursor trajectory keyframes — relative to button center
  // (cursor lives in a top-positioned absolute container above the button)
  const cursorVariants = {
    hidden:  { x: 280, y: -160, opacity: 0, scale: 1 },
    arcing:  { x: [280, 60, 0], y: [-160, -40, 8], opacity: [0, 1, 1], scale: [1, 1, 0.92] },
    clicked: { x: 0, y: 8, opacity: 1, scale: 0.85 },
    done:    { x: 0, y: 8, opacity: 0, scale: 0.85 },
  }

  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      <GridBg />
      {/* fewer particles — perf */}
      <Particles count={12} />

      {/* top line */}
      <motion.div
        className="absolute top-0 left-0 h-px gpu"
        style={{ background: PRIMARY, opacity: 0.5 }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      />

      <div className="relative text-center px-10" style={{ maxWidth: 1100, width: '100%' }}>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.4em] mb-7"
          style={{ color: PRIMARY, opacity: 0.85 }}
        >
          <LetterReveal text="ROUTES OPTIMISED · FLEET READY" delay={0.15} charStagger={0.025} />
        </div>

        <h2
          className="font-serif italic font-light leading-[1.05] tracking-[-0.04em] text-white"
          style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}
        >
          <SlideHReveal text="Dispatch all drivers." delay={0.85} stagger={0.09} duration={0.9} distance={40} />
        </h2>

        <motion.div
          className="h-[2px] mx-auto mt-9 mb-12 gpu"
          style={{
            background: `linear-gradient(90deg, transparent, ${PRIMARY}, transparent)`,
            boxShadow: `0 0 12px ${PRIMARY}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: 260 }}
          transition={{ duration: 0.9, delay: 1.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        />

        {/* button + cursor stage */}
        <div className="relative inline-block">
          {/* The button — single motion.div, no infinite shimmer */}
          {phase < 4 && (
            <motion.div
              key="btn"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: phase >= 3 ? 0.94 : 1,
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="gpu inline-flex items-center gap-4 px-10 py-5 rounded-sm relative"
              style={{
                background: phase >= 3 ? `oklch(0.72 0.18 35 / 0.92)` : 'oklch(0.10 0.02 250)',
                border: `1.5px solid ${PRIMARY}`,
                boxShadow: phase >= 3
                  ? `0 0 0 6px oklch(0.72 0.18 35 / 0.18), 0 0 40px oklch(0.72 0.18 35 / 0.5)`
                  : `0 0 24px oklch(0.72 0.18 35 / 0.15)`,
                transition: 'box-shadow 0.18s ease, background 0.18s ease',
              }}
            >
              <span
                className="relative font-mono text-sm uppercase tracking-[0.32em] font-semibold"
                style={{ color: phase >= 3 ? 'white' : PRIMARY, transition: 'color 0.18s' }}
              >
                DISPATCH 7 ROUTES
              </span>
              <span
                className="relative font-mono text-base"
                style={{ color: phase >= 3 ? 'white' : PRIMARY, transition: 'color 0.18s' }}
              >
                →
              </span>
            </motion.div>
          )}

          {/* Animated cursor — arcs in from upper-right, lands on button, clicks */}
          {phase >= 1 && phase < 4 && (
            <motion.div
              className="absolute pointer-events-none gpu"
              style={{ right: -10, bottom: -10, zIndex: 5 }}
              variants={cursorVariants}
              initial="hidden"
              animate={
                phase === 1 ? 'hidden'
                : phase === 2 ? 'arcing'
                : phase === 3 ? 'clicked'
                : 'done'
              }
              transition={{
                duration: phase === 2 ? 1.1 : 0.18,
                ease: phase === 2 ? [0.4, 0.0, 0.2, 1] : 'easeOut',
                times: phase === 2 ? [0, 0.7, 1] : undefined,
              }}
            >
              {/* macOS-style arrow cursor */}
              <svg width="28" height="32" viewBox="0 0 28 32" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}>
                <path
                  d="M2 2 L2 24 L8 19 L11.5 28 L15 26.5 L11.5 18 L20 18 Z"
                  fill="white"
                  stroke="#000"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>

              {/* click ripple */}
              {phase === 3 && (
                <motion.div
                  className="absolute"
                  style={{
                    left: 4, top: 6,
                    width: 4, height: 4,
                    borderRadius: 99,
                    border: `2px solid ${PRIMARY}`,
                  }}
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 14, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              )}
            </motion.div>
          )}
        </div>

        {/* Success state */}
        {phase >= 4 && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="inline-flex flex-col items-center gap-5 gpu"
          >
            <div
              className="inline-flex items-center gap-3 px-10 py-5 rounded-sm"
              style={{
                background: `oklch(0.72 0.18 35 / 0.08)`,
                border: `1.5px solid ${PRIMARY}`,
                boxShadow: `0 0 30px oklch(0.72 0.18 35 / 0.25)`,
              }}
            >
              <motion.svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={PRIMARY}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                />
              </motion.svg>
              <span
                className="font-mono text-sm uppercase tracking-[0.32em] font-semibold"
                style={{ color: PRIMARY }}
              >
                7 DRIVERS NOTIFIED
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 max-w-[560px]">
              {ROUTE_COLORS.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.3 + i * 0.06 }}
                  className="px-2 py-1.5 rounded-sm text-center gpu"
                  style={{ background: 'oklch(0.10 0.015 250)', border: `1px solid ${c}` }}
                >
                  <div className="text-[10px] font-mono" style={{ color: c }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* bottom line */}
      <motion.div
        className="absolute bottom-0 right-0 h-px gpu"
        style={{ background: PRIMARY, opacity: 0.5 }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      />

      <CornerBrackets />
    </div>
  )
}

/* ─────────────────────────────────────────── MOBILE (Vectora editorial iPhone) */
const VEC = {
  paper: '#F5F2EC',
  paperDeep: '#EFEBE2',
  ink: '#15140F',
  inkSoft: '#3A3832',
  muted: '#8A877E',
  rule: 'rgba(21, 20, 15, 0.10)',
  ruleSoft: 'rgba(21, 20, 15, 0.05)',
  signal: 'oklch(0.62 0.18 28)',
}
const VEC_SERIF = '"Newsreader", "Source Serif 4", Georgia, serif'
const VEC_SANS  = '"Geist", -apple-system, system-ui, sans-serif'
const VEC_MONO  = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace'

type VecStop = {
  n: string
  t: string
  addr: string
  area: string
  who: string
  tag: string
}
const VEC_STOPS: VecStop[] = [
  { n: '01', t: '08:00', addr: 'Voluntários da Pátria 92', area: 'Centro',        who: 'E. Lindqvist',  tag: 'Service'  },
  { n: '02', t: '08:15', addr: 'Av. Brasil 21',            area: 'Vila Industrial', who: 'A. Johansson',  tag: 'Pickup'   },
  { n: '03', t: '08:30', addr: 'Rua Bernardino 14',        area: 'Jardim Planalto', who: 'L. Eriksson',   tag: 'Service'  },
  { n: '04', t: '09:10', addr: 'R. João Pessoa 8',         area: 'Belvedere',     who: 'O. Bergström',  tag: 'Delivery' },
  { n: '05', t: '09:45', addr: 'Av. XV de Novembro 7',     area: 'Centro Sul',    who: 'S. Andersson',  tag: 'Pickup'   },
  { n: '06', t: '10:20', addr: 'R. Marechal Deodoro 116',  area: 'Vila Pinheiros', who: 'M. Nilsson',    tag: 'Service'  },
  { n: '07', t: '11:00', addr: 'R. Tiradentes 47',         area: 'Jardim Itália', who: 'F. Lundgren',   tag: 'Service'  },
]

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  const W = 360
  const H = 736
  return (
    <div
      className="relative shrink-0"
      style={{
        width: W,
        height: H,
        borderRadius: 58,
        background: '#1a1a1a',
        padding: 6,
        boxShadow:
          '0 60px 120px -20px rgba(0,0,0,0.7), 0 30px 60px -30px rgba(0,0,0,0.55), 0 0 0 1.5px #2a2a2a, inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {/* outer ring sheen */}
      <div
        className="absolute inset-0 rounded-[58px] pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 100%)',
        }}
      />

      {/* inner screen */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: 52,
          background: VEC.paper,
        }}
      >
        {/* Dynamic Island */}
        <div
          className="absolute z-30"
          style={{
            top: 13,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 126,
            height: 37,
            borderRadius: 24,
            background: '#000',
          }}
        />

        {/* status bar */}
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between"
          style={{ height: 64, padding: '0 32px' }}
        >
          <span
            style={{
              fontFamily: VEC_MONO,
              fontSize: 16,
              fontWeight: 600,
              color: VEC.ink,
              letterSpacing: -0.4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            9:41
          </span>
          <div style={{ width: 126 }} />
          <div className="flex items-center gap-1.5">
            {/* signal */}
            <svg width="19" height="12" viewBox="0 0 19 12">
              <rect x="0"    y="7.5" width="3.2" height="4.5" rx="0.7" fill={VEC.ink} />
              <rect x="4.8"  y="5"   width="3.2" height="7"   rx="0.7" fill={VEC.ink} />
              <rect x="9.6"  y="2.5" width="3.2" height="9.5" rx="0.7" fill={VEC.ink} />
              <rect x="14.4" y="0"   width="3.2" height="12"  rx="0.7" fill={VEC.ink} />
            </svg>
            {/* wifi */}
            <svg width="17" height="12" viewBox="0 0 17 12">
              <path d="M8.5 2 C 4 2 1 4.5 1 4.5" stroke={VEC.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M8.5 5 C 5.5 5 3.5 6.5 3.5 6.5" stroke={VEC.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M8.5 2 C 13 2 16 4.5 16 4.5" stroke={VEC.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M8.5 5 C 11.5 5 13.5 6.5 13.5 6.5" stroke={VEC.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="8.5" cy="9.5" r="1.4" fill={VEC.ink} />
            </svg>
            {/* battery */}
            <svg width="27" height="13" viewBox="0 0 27 13">
              <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={VEC.ink} strokeOpacity="0.35" fill="none" />
              <rect x="2" y="2" width="20" height="9" rx="2" fill={VEC.ink} />
              <rect x="24.5" y="4" width="1.6" height="5" rx="0.5" fill={VEC.ink} opacity="0.4" />
            </svg>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

export function IPhoneShell({ appOpen, stopsShown }: { appOpen: boolean; stopsShown: number }) {
  return (
    <IPhoneFrame>
      {/* App canvas */}
      <div className="absolute inset-0" style={{ background: VEC.paper }}>
        {/* Loader before app opens */}
        <AnimatePresence>
          {!appOpen && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: VEC.paper }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div
                style={{
                  fontFamily: VEC_SERIF,
                  fontStyle: 'italic',
                  fontSize: 48,
                  color: VEC.ink,
                  letterSpacing: -0.8,
                  lineHeight: 1,
                }}
              >
                Vectora
              </div>
              <div
                style={{
                  fontFamily: VEC_MONO,
                  fontSize: 9,
                  marginTop: 14,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                  color: VEC.muted,
                }}
              >
                Driver
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {appOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col"
            style={{ paddingTop: 64 }}
          >
            {/* Hero header */}
            <div style={{ padding: '22px 28px 16px' }}>
              {/* eyebrow row */}
              <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
                <span
                  style={{
                    fontFamily: VEC_MONO,
                    fontSize: 10.5,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: VEC.muted,
                  }}
                >
                  Route 047 · 7 stops
                </span>
                <span
                  style={{
                    fontFamily: VEC_MONO,
                    fontSize: 10.5,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: VEC.signal,
                  }}
                >
                  ● Dispatched
                </span>
              </div>

              {/* Display title — typewriter */}
              <div
                style={{
                  fontFamily: VEC_SERIF,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 40,
                  color: VEC.ink,
                  letterSpacing: -0.6,
                  lineHeight: 0.98,
                }}
              >
                <BlurReveal text="Artur Nogueira." delay={0.15} duration={1.1} />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                style={{
                  fontFamily: VEC_SANS,
                  fontSize: 13,
                  color: VEC.inkSoft,
                  marginTop: 8,
                  letterSpacing: -0.1,
                }}
              >
                Centro · Vila Industrial · Belvedere
              </motion.div>

              {/* progress bar — 7 segments */}
              <motion.div
                className="flex gap-[3px]"
                style={{ marginTop: 22 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{
                      height: 3,
                      background:
                        stopsShown > i
                          ? (i === 0 ? VEC.signal : VEC.ink)
                          : VEC.rule,
                      opacity: stopsShown > i ? (i === 0 ? 1 : 0.5) : 1,
                      transition: 'background 0.3s, opacity 0.3s',
                    }}
                  />
                ))}
              </motion.div>
              <motion.div
                className="flex items-center justify-between"
                style={{ marginTop: 6 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
              >
                <span style={{ fontFamily: VEC_MONO, fontSize: 9.5, color: VEC.muted, letterSpacing: 0.5 }}>
                  {stopsShown >= VEC_STOPS.length ? '0 done' : '— pending'}
                </span>
                <span style={{ fontFamily: VEC_MONO, fontSize: 9.5, color: VEC.signal, letterSpacing: 0.5 }}>
                  {stopsShown >= VEC_STOPS.length ? '1 next' : `${stopsShown} of 7 received`}
                </span>
                <span style={{ fontFamily: VEC_MONO, fontSize: 9.5, color: VEC.muted, letterSpacing: 0.5 }}>
                  7 to go
                </span>
              </motion.div>
            </div>

            {/* Hairline */}
            <div style={{ height: 1, background: VEC.rule, marginTop: 6 }} />

            {/* Stops list */}
            <div className="flex-1 overflow-hidden">
              {VEC_STOPS.map((s, i) => (
                <AnimatePresence key={s.n}>
                  {stopsShown > i && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                      style={{
                        padding: '14px 28px',
                        display: 'flex',
                        gap: 14,
                        alignItems: 'flex-start',
                        background: i === 0 ? 'rgba(21,20,15,0.025)' : 'transparent',
                        borderBottom: `1px solid ${VEC.ruleSoft}`,
                      }}
                    >
                      <div style={{ minWidth: 26, paddingTop: 3 }}>
                        <span
                          style={{
                            fontFamily: VEC_MONO,
                            fontSize: 10.5,
                            letterSpacing: 0.5,
                            color: i === 0 ? VEC.signal : VEC.ink,
                            fontWeight: 500,
                          }}
                        >
                          {s.n}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="flex items-baseline justify-between">
                          <div
                            style={{
                              fontFamily: VEC_SERIF,
                              fontSize: 15,
                              color: VEC.ink,
                              letterSpacing: -0.2,
                              lineHeight: 1.2,
                            }}
                          >
                            {s.addr}
                          </div>
                          <div style={{ fontFamily: VEC_MONO, fontSize: 10, color: VEC.muted }}>
                            {s.t}
                          </div>
                        </div>
                        <div
                          style={{
                            fontFamily: VEC_SANS,
                            fontSize: 11,
                            color: VEC.inkSoft,
                            marginTop: 3,
                            letterSpacing: -0.1,
                          }}
                        >
                          {s.area} · {s.who}
                        </div>
                        {i === 0 && (
                          <div
                            style={{
                              fontFamily: VEC_MONO,
                              fontSize: 9.5,
                              color: VEC.signal,
                              marginTop: 6,
                              letterSpacing: 0.6,
                              textTransform: 'uppercase',
                              fontWeight: 500,
                            }}
                          >
                            ● Next
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {/* Begin route CTA — appears when all stops loaded */}
            <AnimatePresence>
              {stopsShown >= VEC_STOPS.length && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                  style={{ padding: '0 28px', marginBottom: 90 }}
                >
                  <div style={{ height: 1, background: VEC.rule }} />
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: '18px 0' }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: VEC_SERIF,
                          fontStyle: 'italic',
                          fontSize: 22,
                          color: VEC.ink,
                          letterSpacing: -0.3,
                          lineHeight: 1,
                        }}
                      >
                        Begin route
                      </div>
                      <div
                        style={{
                          fontFamily: VEC_MONO,
                          fontSize: 10.5,
                          color: VEC.muted,
                          marginTop: 5,
                          letterSpacing: 0.4,
                        }}
                      >
                        route 047 · northern loop
                      </div>
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 99,
                        background: VEC.ink,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={VEC.paper} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingBottom: 34,
                background: VEC.paper,
                borderTop: `1px solid ${VEC.rule}`,
              }}
            >
              <div
                className="flex justify-between items-center"
                style={{ padding: '14px 28px 8px' }}
              >
                {[
                  { id: 'today', label: 'Today', on: false },
                  { id: 'route', label: 'Route', on: false },
                  { id: 'stops', label: 'Stops', on: true },
                  { id: 'inbox', label: 'Inbox', on: false },
                  { id: 'me',    label: 'Me',    on: false },
                ].map((t) => (
                  <div key={t.id} className="flex flex-col items-center" style={{ gap: 6 }}>
                    <span
                      style={{
                        fontFamily: VEC_SANS,
                        fontSize: 11,
                        fontWeight: 500,
                        color: t.on ? VEC.ink : VEC.muted,
                        letterSpacing: 0.2,
                      }}
                    >
                      {t.label}
                    </span>
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 99,
                        background: t.on ? VEC.signal : 'transparent',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </IPhoneFrame>
  )
}

function MobileSlide() {
  const [stopsShown, setStopsShown] = useState(0)
  const [appOpen, setAppOpen] = useState(false)

  useEffect(() => {
    const open = setTimeout(() => setAppOpen(true), 800)
    const start = setTimeout(() => {
      const id = setInterval(() => {
        setStopsShown((n) => (n >= VEC_STOPS.length ? n : n + 1))
      }, 360)
      return () => clearInterval(id)
    }, 2200)
    return () => {
      clearTimeout(open)
      clearTimeout(start)
    }
  }, [])

  // separate interval cleanup
  useEffect(() => {
    if (!appOpen) return
    const id = setInterval(() => {
      setStopsShown((n) => (n >= VEC_STOPS.length ? n : n + 1))
    }, 360)
    return () => clearInterval(id)
  }, [appOpen])

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <GridBg />
      <Particles count={14} />

      <div className="relative grid grid-cols-[1fr_auto_1fr] gap-20 items-center w-full max-w-7xl px-16">
        {/* LEFT — copy */}
        <div className="text-right">
          <div
            className="font-mono uppercase mb-5"
            style={{ color: PRIMARY, opacity: 0.9, fontSize: 10, letterSpacing: '0.45em' }}
          >
            <LetterReveal text="VECTORA · DRIVER" delay={0.25} charStagger={0.03} />
          </div>

          <h2
            className="text-white mb-7"
            style={{
              fontFamily: VEC_SERIF,
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)',
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
            }}
          >
            <MaskReveal
              lines={['The route,', "in the driver's hand."]}
              delay={0.7}
              stagger={0.14}
              duration={1}
            />
          </h2>

          <motion.div
            className="h-px ml-auto mb-6"
            style={{ background: PRIMARY }}
            initial={{ width: 0 }}
            animate={{ width: 56 }}
            transition={{ duration: 0.7, delay: 1.1 }}
          />

          <p
            className="text-sm font-light leading-relaxed"
            style={{ color: 'oklch(0.5 0 0)', maxWidth: '32ch', marginLeft: 'auto' }}
          >
            <WordReveal
              text="The instant dispatch fires, the route lands on every driver's phone — quiet, editorial, present-tense."
              delay={1400}
              stagger={0.04}
            />
          </p>
        </div>

        {/* CENTER — iPhone */}
        <motion.div
          initial={{ opacity: 0, y: 36, rotateY: -8 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <IPhoneShell appOpen={appOpen} stopsShown={stopsShown} />
        </motion.div>

        {/* RIGHT — push status feed */}
        <div className="text-left">
          <motion.div
            className="font-mono uppercase mb-5"
            style={{ color: 'oklch(0.45 0 0)', fontSize: 10, letterSpacing: '0.3em' }}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            ▸ Sanctum Push · 7 devices
          </motion.div>

          <div className="space-y-1">
            {VEC_STOPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0.18 }}
                animate={{ opacity: stopsShown > i ? 1 : 0.22 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-3 py-2"
                style={{
                  borderBottom: `1px solid oklch(0.16 0.018 250)`,
                }}
              >
                <span
                  className="rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    background: stopsShown > i ? PRIMARY : 'oklch(0.22 0 0)',
                    boxShadow: stopsShown > i ? `0 0 6px ${PRIMARY}` : 'none',
                  }}
                />
                <span
                  className="font-mono"
                  style={{ color: stopsShown > i ? 'oklch(0.7 0 0)' : 'oklch(0.32 0 0)', fontSize: 10, letterSpacing: 0.4 }}
                >
                  stop {s.n} → driver{(i % 7) + 1}
                </span>
                <span
                  className="ml-auto font-mono uppercase"
                  style={{
                    color: stopsShown > i ? PRIMARY : 'oklch(0.28 0 0)',
                    fontSize: 9,
                    letterSpacing: 0.5,
                  }}
                >
                  {stopsShown > i ? '✓ 200' : 'queued'}
                </span>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {stopsShown >= VEC_STOPS.length && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="mt-6 px-4 py-3 rounded-sm flex items-baseline justify-between"
                style={{
                  background: 'oklch(0.72 0.18 35 / 0.08)',
                  border: `1px solid ${PRIMARY}`,
                }}
              >
                <span className="font-mono uppercase" style={{ color: PRIMARY, fontSize: 9, letterSpacing: '0.3em' }}>
                  All routes synced
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: VEC_SERIF,
                    fontStyle: 'italic',
                    fontSize: 24,
                    color: 'white',
                    letterSpacing: -0.4,
                  }}
                >
                  <CountUp to={7} duration={1} />
                  <span style={{ color: 'oklch(0.4 0 0)', fontSize: '0.6em', marginLeft: 6 }}>/ 7</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CornerBrackets />
    </div>
  )
}

/* ─────────────────────────────────────────── FULLSCREEN BUTTON */
function FullscreenButton() {
  const [isFs, setIsFs] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  return (
    <button
      onClick={toggle}
      className="fixed bottom-5 right-8 z-[58] flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-all hover:opacity-100"
      style={{
        background: 'oklch(0.08 0.012 250 / 0.7)',
        border: '1px solid oklch(0.18 0.02 250)',
        opacity: 0.35,
        backdropFilter: 'blur(8px)',
      }}
      title={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'oklch(0.6 0 0)' }}>
        {isFs ? (
          <>
            <path d="M9 3v6H3M21 9h-6V3M9 21v-6H3M21 15h-6v6" />
          </>
        ) : (
          <>
            <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
          </>
        )}
      </svg>
      <span className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: 'oklch(0.55 0 0)' }}>
        {isFs ? 'EXIT' : 'FULL'}
      </span>
    </button>
  )
}

/* ─────────────────────────────────────────── AUTOPLAY BUTTON */
function AutoplayButton({ on, toggle }: { on: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="fixed bottom-5 z-[58] flex items-center gap-2 px-2.5 py-1.5 rounded-sm transition-all hover:opacity-100"
      style={{
        right: 110,
        background: on ? 'oklch(0.72 0.18 35 / 0.15)' : 'oklch(0.08 0.012 250 / 0.7)',
        border: `1px solid ${on ? 'oklch(0.72 0.18 35 / 0.5)' : 'oklch(0.18 0.02 250)'}`,
        opacity: on ? 1 : 0.35,
        backdropFilter: 'blur(8px)',
      }}
      title={on ? 'Stop autoplay' : 'Start autoplay'}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={on ? PRIMARY : 'oklch(0.6 0 0)'} strokeWidth="2.5">
        {on ? (
          <>
            <rect x="5" y="4" width="5" height="16" fill={PRIMARY} stroke="none" rx="1" />
            <rect x="14" y="4" width="5" height="16" fill={PRIMARY} stroke="none" rx="1" />
          </>
        ) : (
          <path d="M5 3l16 9-16 9V3z" fill="oklch(0.6 0 0)" stroke="none" />
        )}
      </svg>
      <span className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: on ? PRIMARY : 'oklch(0.55 0 0)' }}>
        {on ? 'AUTOPLAY' : 'AUTOPLAY'}
      </span>
      {on && (
        <span className="w-1 h-1 rounded-full dm-ping" style={{ background: PRIMARY }} />
      )}
    </button>
  )
}

/* ─────────────────────────────────────────── OUTRO */
function OutroSlide() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      <GridBg />
      <Particles count={32} />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[380, 620, 900, 1200].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{ width: r, height: r, borderColor: `oklch(1 0 0 / ${0.03 - i * 0.006})` }}
          />
        ))}
        <div className="absolute w-[680px] h-[680px] rounded-full overflow-hidden" style={{ opacity: 0.06 }}>
          <div
            className="absolute inset-0 dm-radar"
            style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${PRIMARY} 46deg, transparent 46deg)` }}
          />
        </div>
      </div>

      <div className="relative text-center px-10" style={{ maxWidth: 1100, width: '100%' }}>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.32em] mb-10"
          style={{ color: PRIMARY, opacity: 0.75 }}
        >
          <LetterReveal text="VECTORA · QUANTUM LOGISTICS · MMXXVI" delay={0.2} charStagger={0.022} />
        </div>

        <h1
          className="font-serif italic font-light leading-[1.04] tracking-[-0.04em] text-white mb-10"
          style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}
        >
          <MaskReveal
            lines={['Built for the', 'real world.']}
            delay={0.95}
            stagger={0.13}
            duration={1.0}
          />
        </h1>

        <motion.div
          className="h-[2px] mx-auto mb-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${PRIMARY}, transparent)`,
            boxShadow: `0 0 12px ${PRIMARY}`,
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 220, opacity: 1 }}
          transition={{ duration: 0.9, delay: 2.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        />

        <p
          className="text-base font-light leading-relaxed mb-12"
          style={{ color: 'oklch(0.45 0 0)', maxWidth: '40ch', margin: '0 auto 3rem' }}
        >
          <WordReveal
            text="Quantum superposition evaluates exponentially many routes simultaneously. Real streets. Real drivers. Real deliveries."
            delay={3000}
            stagger={0.035}
          />
        </p>

        {/* big stats row */}
        <motion.div
          className="grid grid-cols-4 gap-4 mt-14 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 4.6 }}
        >
          {[
            { v: 1000, l: 'Nodes', s: '' },
            { v: 156, l: 'Qubits', s: '' },
            { v: 0, l: 'Optimal Gap', s: '%' },
            { v: 100, l: 'Verified', s: '%' },
          ].map((s, i) => (
            <div
              key={s.l}
              className="text-center px-3 py-4 rounded-sm"
              style={{
                background: 'oklch(0.08 0.012 250 / 0.6)',
                border: '1px solid oklch(0.15 0.015 250)',
              }}
            >
              <div
                className="font-serif italic font-light text-2xl"
                style={{ color: PRIMARY, letterSpacing: '-0.02em' }}
              >
                <CountUp to={s.v} suffix={s.s} duration={1.4} delay={4700 + i * 120} />
              </div>
              <div
                className="mt-1.5 text-[9px] uppercase tracking-[0.25em] font-mono"
                style={{ color: 'oklch(0.42 0 0)' }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  )
}

/* ─────────────────────────────────────────── HUD */
function Hud({ cur, go }: { cur: number; go: (n: number) => void }) {
  const slide = SLIDES[cur]
  let chapterLabel: string | null = null
  if (slide.type === 'section') chapterLabel = slide.tag
  else if (slide.type === 'live') {
    const prev = SLIDES.slice(0, cur).reverse().find((s) => s.type === 'section')
    if (prev && prev.type === 'section') chapterLabel = prev.tag
  }

  return (
    <>
      {/* top-right counter */}
      <div
        className="fixed top-5 right-8 z-50 flex items-center gap-3"
      >
        {chapterLabel && (
          <span
            className="text-[10px] font-mono uppercase tracking-[0.32em]"
            style={{ color: 'oklch(0.4 0 0)' }}
          >
            {chapterLabel}
          </span>
        )}
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: 'oklch(0.35 0 0)' }}
        >
          {String(cur + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
        </span>
      </div>

      {/* bottom dots */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-50">
        {SLIDES.map((s, idx) => {
          const active = idx === cur
          const isSection = s.type === 'section'
          const isLive = s.type === 'live'

          return (
            <button
              key={idx}
              onClick={() => go(idx)}
              className="transition-all duration-300 group relative"
              style={{
                width: active ? 28 : isSection ? 6 : 4,
                height: isLive && !active ? 5 : 4,
                borderRadius: isLive && !active ? 2 : 999,
                background: active
                  ? PRIMARY
                  : isLive
                  ? 'oklch(0.22 0 0)'
                  : 'oklch(0.18 0 0)',
                boxShadow: active ? `0 0 8px ${PRIMARY}` : 'none',
              }}
            />
          )
        })}
      </div>

    </>
  )
}

/* ─────────────────────────────────────────── PRESHOW CURTAIN */
function PreshowCurtain() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: BG }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(24px)' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      {/* faint radar */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[420, 700, 1000].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{ width: r, height: r, borderColor: `oklch(1 0 0 / ${0.025 - i * 0.005})` }}
          />
        ))}
      </div>

      <div className="relative text-center">
        {/* wordmark — quieter than the full LogoSlide */}
        <motion.div
          className="font-serif italic font-light"
          style={{
            fontSize: 'clamp(3rem, 9vw, 8rem)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: 'oklch(0.92 0 0)',
          }}
          initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          Vectora
        </motion.div>

        {/* breathing prompt */}
        <motion.div
          className="mt-12 inline-flex items-center gap-3 px-5 py-2.5 rounded-sm"
          style={{
            border: `1px solid oklch(0.72 0.18 35 / 0.4)`,
            background: 'oklch(0.10 0.02 250)',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ opacity: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }, delay: 0.8 }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.32em]" style={{ color: 'oklch(0.7 0 0)' }}>
            Press
          </span>
          <kbd
            className="px-2.5 py-0.5 text-[10px] font-mono rounded"
            style={{ background: 'oklch(0.18 0.02 250)', color: PRIMARY, border: '1px solid oklch(0.28 0.02 250)' }}
          >
            SPACE
          </kbd>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em]" style={{ color: 'oklch(0.7 0 0)' }}>
            to begin
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Per-slide-type autoplay duration (ms)
const AUTOPLAY_MS: Record<Slide['type'], number> = {
  logo: 5500,
  intro: 6500,
  section: 6500,
  live: 9500,
  optimize: 11000,
  dispatch: 9000,
  mobile: 11000,
  outro: 9000,
}

/* ─────────────────────────────────────────── ROOT */
export default function DemoMode() {
  const [started, setStarted] = useState(false)
  const [cur, setCur] = useState(0)
  const [autoplay, setAutoplay] = useState(false)

  const go = useCallback((n: number) => {
    if (n < 0 || n >= TOTAL) return
    setCur(n)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!started) {
        // Only Space starts the show. Arrows do nothing pre-start.
        if (e.key === ' ' || e.key === 'Enter') setStarted(true)
        if (e.key === 'Escape') router.visit('/')
        return
      }
      // Any manual nav cancels autoplay
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { setAutoplay(false); go(cur + 1) }
      if (e.key === 'ArrowLeft'  || e.key === 'PageUp')                    { setAutoplay(false); go(cur - 1) }
      if (e.key === 'p' || e.key === 'P') setAutoplay((v) => !v)
      if (e.key === 'Escape') router.visit('/')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [cur, go, started])

  // Auto-advance through slides when autoplay is on
  useEffect(() => {
    if (!started || !autoplay) return
    const ms = AUTOPLAY_MS[SLIDES[cur].type]
    const t = setTimeout(() => {
      if (cur + 1 >= TOTAL) {
        setAutoplay(false)
        return
      }
      setCur(cur + 1)
    }, ms)
    return () => clearTimeout(t)
  }, [cur, autoplay, started])

  const slide = SLIDES[cur]
  const transition = getSlideTransition(slide.type)
  const isHeavySlide = slide.type === 'live' || slide.type === 'optimize'

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none font-sans"
      style={{ background: BG, color: 'oklch(0.92 0 0)' }}
    >
      <InjectStyles />
      <CursorDot />
      {/* Heavy overlays are skipped on iframe slides — Grain (animated SVG noise + mix-blend)
          and the rolling LoadBar both repaint every frame and tank fps over Mapbox/Recharts. */}
      {!isHeavySlide && <Grain />}
      {started && <RecIndicator />}
      {started && <FullscreenButton />}
      {started && <AutoplayButton on={autoplay} toggle={() => setAutoplay((v) => !v)} />}
      {started && !isHeavySlide && <LoadBar k={cur} />}

      <AnimatePresence mode="wait">
        {started && (
          <motion.div
            key={cur}
            initial={transition.initial}
            animate={transition.animate}
            exit={transition.exit}
            transition={transition.transition}
            className={`absolute inset-0 flex items-center justify-center ${isHeavySlide ? 'gpu' : 'gpu-blur'}`}
          >
            {slide.type === 'logo'     && <LogoSlide />}
            {slide.type === 'intro'    && <IntroSlide />}
            {slide.type === 'section'  && <SectionSlide {...slide} />}
            {slide.type === 'live'     && <LiveSlide    {...slide} />}
            {slide.type === 'optimize' && <OptimizeSlide />}
            {slide.type === 'dispatch' && <DispatchSlide />}
            {slide.type === 'mobile'   && <MobileSlide />}
            {slide.type === 'outro'    && <OutroSlide />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{!started && <PreshowCurtain />}</AnimatePresence>

      {started && <Hud cur={cur} go={go} />}
    </div>
  )
}

/* ─────────────────────────────────────────── per-slide transition variants */
function getSlideTransition(type: Slide['type']) {
  // Each slide type uses a different transition style — interchanged for variety.
  switch (type) {
    case 'logo':
      // Slow majestic fade — sets the tone
      return {
        initial: { opacity: 0, scale: 1.05 },
        animate: { opacity: 1, scale: 1 },
        exit:    { opacity: 0, scale: 0.96, filter: 'blur(20px)' },
        transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      }
    case 'intro':
    case 'outro':
      // Cinematic crossfade with subtle scale
      return {
        initial: { opacity: 0, scale: 1.03 },
        animate: { opacity: 1, scale: 1 },
        exit:    { opacity: 0, scale: 0.97 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      }
    case 'section':
      // Blur dissolve — premium, atmospheric
      return {
        initial: { opacity: 0, filter: 'blur(18px)', scale: 1.02 },
        animate: { opacity: 1, filter: 'blur(0px)',  scale: 1    },
        exit:    { opacity: 0, filter: 'blur(18px)', scale: 0.98 },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      }
    case 'live':
    case 'optimize':
      // Vertical wipe — slides up from below
      return {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0  },
        exit:    { opacity: 0, y: -40 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      }
    case 'dispatch':
      // Horizontal slide — energetic punch
      return {
        initial: { opacity: 0, x: 80 },
        animate: { opacity: 1, x: 0  },
        exit:    { opacity: 0, x: -80 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      }
    case 'mobile':
      // Blur dissolve again but with slight downward drift
      return {
        initial: { opacity: 0, filter: 'blur(14px)', y: 20 },
        animate: { opacity: 1, filter: 'blur(0px)',  y: 0  },
        exit:    { opacity: 0, filter: 'blur(14px)', y: -20 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      }
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit:    { opacity: 0 },
        transition: { duration: 0.4 },
      }
  }
}
