import { Link } from '@inertiajs/react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { useState } from 'react'

/* ─── palette ─────────────────────────────────────────── */
const C = {
  canvas:    '#111110',
  surface:   '#1B1B19',
  border:    '#2C2C29',
  charcoal:  '#F0EFE9',  // foreground (off-white on dark)
  muted:     '#6B6B68',
  accent:    '#D97045',  // warm coral readable on dark
  accentBg:  '#2A1810',
  greenBg:   '#0F1F0E',
  greenText: '#5A9B5D',
  navBg:     'rgba(17,17,16,0.92)',
  btnText:   '#111110',  // dark text on light-bg primary button
  btnHover:  '#D4D3CD',  // hover shade for primary button
} as const

/* ─── root ─────────────────────────────────────────────── */

export default function Welcome() {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 20))

  return (
    <div
      className="min-h-screen antialiased"
      style={{ background: C.canvas, color: C.charcoal }}
    >
      <DotGrid />
      <Nav scrolled={scrolled} />
      <Hero />
      <Figures />
      <Instruments />
      <Method />
      <Closing />
      <Foot />
    </div>
  )
}

/* ─── ambient dot grid ─────────────────────────────────── */

function DotGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `radial-gradient(circle, ${C.charcoal} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
        opacity: 0.07,
      }}
    />
  )
}

/* ─── nav ──────────────────────────────────────────────── */

function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? C.navBg : 'transparent',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
      }}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-display text-xl tracking-tight" style={{ color: C.charcoal }}>
          Vectora
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: C.muted }}>
          <NavLink href="#instruments">Instruments</NavLink>
          <NavLink href="#method">Method</NavLink>
          <NavLink href="#figures">Figures</NavLink>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm transition-colors"
            style={{ color: C.muted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.charcoal)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm transition-colors"
            style={{
              background: C.charcoal,
              color: C.btnText,
              borderRadius: 5,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.btnHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.charcoal)}
          >
            Open atlas
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="transition-colors"
      style={{ color: C.muted }}
      onMouseEnter={(e) => (e.currentTarget.style.color = C.charcoal)}
      onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
    >
      {children}
    </Link>
  )
}

/* ─── hero ─────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative z-10 pt-36 pb-28 md:pt-44 md:pb-36">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-16 items-center">

          {/* Left: text */}
          <FadeIn>
            <div
              className="inline-flex items-center gap-2 mb-8 px-3 py-1 text-xs uppercase tracking-[0.08em] font-medium"
              style={{
                background: C.accentBg,
                color: C.accent,
                borderRadius: 9999,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />
              Fleet routing platform
            </div>

            <h1
              className="font-display leading-[1.08] tracking-[-0.03em] mb-6"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.2rem)', color: C.charcoal }}
            >
              The quiet art of<br />
              <span className="italic" style={{ color: C.muted }}>arriving on time</span>
            </h1>

            <p
              className="text-base leading-relaxed mb-10"
              style={{ color: C.muted, maxWidth: '50ch' }}
            >
              Vectora composes routes the way a maison composes a season — with restraint,
              consideration, and an eye on every interval.
            </p>

            <div className="flex items-center gap-5">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm transition-all active:scale-[0.98]"
                style={{ background: C.charcoal, color: C.btnText, borderRadius: 5 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.btnHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.charcoal)}
              >
                Open the atlas
                <ArrowRight size={13} />
              </Link>
              <Link
                href="#instruments"
                className="text-sm transition-colors"
                style={{ color: C.muted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.charcoal)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
              >
                See instruments
              </Link>
            </div>
          </FadeIn>

          {/* Right: faux-OS route map */}
          <FadeIn delay={0.15} className="hidden md:block">
            <RouteCard />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* minimal SVG route illustration inside a faux-OS window */
type Pt = { x: number; y: number }

const HERO_NODES: Pt[] = [
  { x: 50, y: 18 }, // 0 depot
  { x: 18, y: 38 }, // 1
  { x: 78, y: 32 }, // 2
  { x: 26, y: 62 }, // 3
  { x: 68, y: 68 }, // 4
  { x: 42, y: 80 }, // 5
  { x: 84, y: 52 }, // 6
  { x: 14, y: 74 }, // 7
  { x: 54, y: 50 }, // 8
]

const HERO_ROUTES: { path: number[]; primary: boolean }[] = [
  { path: [0, 1, 7, 5, 3], primary: true },
  { path: [0, 2, 6, 4, 8], primary: false },
  { path: [0, 8, 4, 5],    primary: false },
]

function RouteCard() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
      }}
    >
      {/* window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        {['#EAEAEA', '#EAEAEA', '#EAEAEA'].map((c, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
        ))}
        <span className="ml-3 text-xs font-mono" style={{ color: C.muted }}>atlas · dispatch view</span>
      </div>

      {/* SVG map */}
      <div className="p-4">
        <svg viewBox="0 0 100 100" className="w-full" style={{ aspectRatio: '1' }}>
          <defs>
            <pattern id="hgrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke={C.border} strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#hgrid)" opacity="0.7" />

          {HERO_ROUTES.map((route, ri) =>
            route.path.slice(1).map((toIdx, i) => {
              const from = HERO_NODES[route.path[i]]
              const to   = HERO_NODES[toIdx]

              return (
                <motion.line
                  key={`${ri}-${i}`}
                  x1={from.x} y1={from.y}
                  x2={to.x}   y2={to.y}
                  stroke={route.primary ? C.accent : C.border}
                  strokeWidth={route.primary ? 0.8 : 0.5}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.4, delay: ri * 0.35 + i * 0.18, ease: 'easeInOut' }}
                />
              )
            }),
          )}

          {HERO_NODES.map((n, i) => (
            <g key={i}>
              {i === 0 ? (
                <>
                  <circle cx={n.x} cy={n.y} r="2.8" fill={C.charcoal} />
                  <motion.circle
                    cx={n.x} cy={n.y} r="4.5"
                    fill="none"
                    stroke={C.charcoal}
                    strokeWidth="0.4"
                    animate={{ r: [4.5, 7], opacity: [0.4, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                </>
              ) : (
                <circle cx={n.x} cy={n.y} r="1.8" fill={C.surface} stroke={C.border} strokeWidth="0.7" />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* status bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 text-[11px] font-mono"
        style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}
      >
        <span>9 stops · 3 vehicles</span>
        <span
          className="px-2 py-0.5 uppercase tracking-wider text-[9px]"
          style={{ background: C.greenBg, color: C.greenText, borderRadius: 9999 }}
        >
          Optimised
        </span>
      </div>
    </div>
  )
}

/* ─── figures ──────────────────────────────────────────── */

const FIGURES = [
  { value: '47%',   label: 'Cost reduction',   note: 'Across observed seasons' },
  { value: '3.2M',  label: 'Routes composed',  note: 'Quietly, since inception' },
  { value: '<50ms', label: 'Response time',     note: 'Per dispatch interval' },
  { value: '24/7',  label: 'Attendance',        note: 'Always open' },
] as const

function Figures() {
  return (
    <section
      id="figures"
      className="relative z-10 py-14"
      style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 0 }}>
          {FIGURES.map((f, i) => (
            <FadeIn
              key={f.label}
              delay={i * 0.07}
              className="px-8 py-4"
              style={{
                borderLeft: i > 0 ? `1px solid ${C.border}` : undefined,
              }}
            >
              <div
                className="font-display text-4xl tracking-tight"
                style={{ color: C.charcoal }}
              >
                {f.value}
              </div>
              <div className="mt-2 text-sm font-medium" style={{ color: C.charcoal }}>
                {f.label}
              </div>
              <div className="mt-0.5 text-xs italic" style={{ color: C.muted }}>
                {f.note}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── instruments bento ────────────────────────────────── */

const INSTRUMENTS = [
  {
    n: '01',
    name: 'The Atlas',
    descriptor: 'A live map of the day',
    body: 'Every vehicle in motion, every stop in waiting — laid out as a single legible plate. Composition over clutter.',
    wide: true,
  },
  {
    n: '02',
    name: 'The Composer',
    descriptor: 'Routes, drawn with intent',
    body: 'A solver that respects time windows, capacity, and care. Quantum-ready when conditions invite it; classical when they do not.',
    wide: false,
  },
  {
    n: '03',
    name: 'The Ledger',
    descriptor: 'Proof of delivery, attended',
    body: 'Photographs, signatures, GPS — gathered in one quiet record. No part of the day is unaccounted for.',
    wide: false,
  },
  {
    n: '04',
    name: 'The Dispatch',
    descriptor: 'A correspondence with the field',
    body: 'Messages that move at the pace of work — never urgent, always present, and always within arm\'s reach.',
    wide: true,
  },
] as const

function Instruments() {
  return (
    <section id="instruments" className="relative z-10 py-28">
      <div className="mx-auto max-w-5xl px-6">
        <SectionLabel numeral="IV" title="Instruments" />

        {/* Bento grid: row1 → [wide | narrow], row2 → [narrow | wide] */}
        <div
          className="mt-12 grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto auto',
          }}
        >
          {INSTRUMENTS.map((it, i) => (
            <FadeIn
              key={it.n}
              delay={i * 0.07}
              style={{
                gridColumn: it.wide ? 'span 2' : 'span 1',
              }}
            >
              <InstrumentCard item={it} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function InstrumentCard({ item }: { item: (typeof INSTRUMENTS)[number] }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="h-full p-8 transition-all duration-200 cursor-default"
      style={{
        background: hovered ? C.surface : C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        boxShadow: hovered ? '0 2px 12px rgba(0,0,0,0.04)' : '0 0 0 rgba(0,0,0,0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between mb-6">
        <span className="font-mono text-xs" style={{ color: C.muted }}>{item.n}</span>
        <span
          className="text-[10px] uppercase tracking-[0.08em] px-2 py-0.5"
          style={{ background: C.accentBg, color: C.accent, borderRadius: 9999 }}
        >
          {item.descriptor}
        </span>
      </div>
      <h3
        className="font-display text-2xl tracking-tight mb-3"
        style={{ color: C.charcoal }}
      >
        {item.name}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: C.muted, maxWidth: '42ch' }}>
        {item.body}
      </p>
    </div>
  )
}

/* ─── method ───────────────────────────────────────────── */

const METHOD = [
  { n: 'i',   verb: 'Observe',  body: 'Stops, vehicles, time windows — gathered into a single view.' },
  { n: 'ii',  verb: 'Compose',  body: 'Routes are drawn in service of every constraint, quietly.' },
  { n: 'iii', verb: 'Dispatch', body: 'The plan reaches the field at the pace of work, never faster.' },
  { n: 'iv',  verb: 'Attend',   body: 'Each delivery observed, recorded, and confirmed with care.' },
] as const

function Method() {
  return (
    <section
      id="method"
      className="relative z-10 py-28"
      style={{ borderTop: `1px solid ${C.border}` }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <SectionLabel numeral="V" title="Method" suffix="in four movements" />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-0">
          {METHOD.map((m, i) => (
            <FadeIn
              key={m.n}
              delay={i * 0.08}
              className="py-8 pr-8"
              style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 28 }}
            >
              <span className="font-mono text-xs italic" style={{ color: C.muted }}>
                {m.n}.
              </span>
              <h3
                className="mt-4 font-display text-2xl tracking-tight"
                style={{ color: C.charcoal }}
              >
                {m.verb}
              </h3>
              <p className="mt-3 text-sm leading-relaxed italic" style={{ color: C.muted }}>
                {m.body}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── closing ──────────────────────────────────────────── */

function Closing() {
  return (
    <section
      className="relative z-10 py-36 text-center"
      style={{ borderTop: `1px solid ${C.border}` }}
    >
      {/* ambient warm blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 55% at 50% 100%, ${C.accentBg} 0%, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      <div className="relative mx-auto max-w-2xl px-6">
        <FadeIn>
          <div
            className="inline-block mb-6 text-[10px] uppercase tracking-[0.1em]"
            style={{ color: C.muted }}
          >
            An invitation
          </div>
          <h2
            className="font-display leading-[1.06] tracking-[-0.03em] mb-6"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', color: C.charcoal }}
          >
            The atlas<br />
            <span className="italic" style={{ color: C.muted }}>is open</span>
          </h2>
          <p className="text-base italic mb-10" style={{ color: C.muted }}>
            Step inside, and compose your first day with the studio.
          </p>
          <div className="flex items-center justify-center gap-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm transition-all active:scale-[0.98]"
              style={{ background: C.charcoal, color: C.btnText, borderRadius: 5 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.btnHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.charcoal)}
            >
              Enter the atlas
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/login"
              className="text-sm transition-colors"
              style={{ color: C.muted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.charcoal)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              Sign in
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ─── footer ───────────────────────────────────────────── */

function Foot() {
  return (
    <footer
      className="relative z-10 py-14"
      style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 md:col-span-5">
            <div className="font-display text-2xl tracking-tight" style={{ color: C.charcoal }}>
              Vectora
            </div>
            <p className="mt-2 text-sm italic" style={{ color: C.muted, maxWidth: '34ch' }}>
              A studio of vehicle routing. Composed quietly, in the manner of a house.
            </p>
          </div>

          <div className="col-span-6 md:col-span-2">
            <FootCol heading="House" links={[['Instruments', '#instruments'], ['Method', '#method']]} />
          </div>
          <div className="col-span-6 md:col-span-2">
            <FootCol heading="Figures" links={[['Figures', '#figures'], ['Enter', '/dashboard']]} />
          </div>

          <div className="col-span-12 md:col-span-3 md:text-right">
            <div className="text-[10px] uppercase tracking-[0.08em]" style={{ color: C.muted }}>
              Correspond
            </div>
            <a
              href="mailto:hello@vectora.house"
              className="mt-2 inline-block text-sm italic transition-colors"
              style={{ color: C.charcoal }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.charcoal)}
            >
              hello@vectora.house
            </a>
          </div>
        </div>

        <div
          className="mt-12 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[11px]"
          style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}
        >
          <span>© {new Date().getFullYear()} · Vectora · Established MMXXVI</span>
          <span className="font-mono">Set in Geist &amp; Instrument Serif</span>
        </div>
      </div>
    </footer>
  )
}

function FootCol({ heading, links }: { heading: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.08em] mb-3" style={{ color: C.muted }}>
        {heading}
      </div>
      <ul className="space-y-2">
        {links.map(([name, href]) => (
          <li key={name}>
            <Link
              href={href}
              className="text-sm transition-colors"
              style={{ color: C.muted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.charcoal)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── section label ────────────────────────────────────── */

function SectionLabel({ numeral, title, suffix }: { numeral: string; title: string; suffix?: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-mono text-xs italic" style={{ color: C.muted }}>{numeral}</span>
      <span
        className="flex-1 h-px"
        style={{ background: C.border }}
      />
      <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: C.muted }}>
        {title}
        {suffix && <span className="italic normal-case tracking-normal"> · {suffix}</span>}
      </span>
    </div>
  )
}

/* ─── fade-in ──────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className = '',
  style,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ─── arrow svg ────────────────────────────────────────── */

function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 7h10M8 3l4 4-4 4" />
    </svg>
  )
}
