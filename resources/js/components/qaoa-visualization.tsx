import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ── Real data from notebook QAOA log ──
const D = { id: 0, x: 5215, y: 5704 };
const ALL = [
    { id: 1, x: 5150, y: 2695 },
    { id: 2, x: 4109, y: 4550 },
    { id: 3, x: 7288, y: 4037 },
    { id: 4, x: 5752, y: 4789 },
    { id: 5, x: 6929, y: 6198 },
    { id: 6, x: 6415, y: 5207 },
    { id: 7, x: 6899, y: 3647 },
    { id: 8, x: 4848, y: 6118 },
    { id: 9, x: 8726, y: 5357 },
    { id: 10, x: 5753, y: 7314 },
    { id: 11, x: 6486, y: 4478 },
    { id: 12, x: 4625, y: 4208 },
    { id: 13, x: 9730, y: 4531 },
    { id: 14, x: 6205, y: 3288 },
    { id: 15, x: 7646, y: 4250 },
    { id: 16, x: 4977, y: 4406 },
    { id: 17, x: 5216, y: 5449 },
    { id: 18, x: 6035, y: 4479 },
    { id: 19, x: 4628, y: 4673 },
    { id: 20, x: 4109, y: 6392 },
    { id: 21, x: 8547, y: 3921 },
    { id: 22, x: 8817, y: 4205 },
    { id: 23, x: 5174, y: 4326 },
    { id: 24, x: 9751, y: 4805 },
    { id: 25, x: 5065, y: 3735 },
    { id: 26, x: 5489, y: 5252 },
    { id: 27, x: 9340, y: 4581 },
    { id: 28, x: 4857, y: 4233 },
    { id: 29, x: 6204, y: 6646 },
    { id: 30, x: 4214, y: 5714 },
    { id: 31, x: 4830, y: 5175 },
    { id: 32, x: 5203, y: 3487 },
    { id: 33, x: 7166, y: 4853 },
    { id: 34, x: 6808, y: 5478 },
    { id: 35, x: 6644, y: 3425 },
    { id: 36, x: 8002, y: 6832 },
    { id: 37, x: 7407, y: 4605 },
    { id: 38, x: 5043, y: 4509 },
    { id: 39, x: 3879, y: 4684 },
    { id: 40, x: 4052, y: 4353 },
    { id: 41, x: 4040, y: 5465 },
    { id: 42, x: 7385, y: 4592 },
    { id: 43, x: 3862, y: 4686 },
    { id: 44, x: 8766, y: 4168 },
    { id: 45, x: 6869, y: 6108 },
    { id: 46, x: 11032, y: 6436 },
    { id: 47, x: 3566, y: 5953 },
    { id: 48, x: 6263, y: 5758 },
    { id: 49, x: 4732, y: 5195 },
    { id: 50, x: 7178, y: 4853 },
];
const nm: Record<number, (typeof ALL)[0]> = {};
ALL.forEach((n) => (nm[n.id] = n));

const COLORS = [
    '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899',
    '#84cc16', '#14b8a6', '#d97706', '#6366f1', '#f43f5e', '#10b981', '#e879f9',
    '#0ea5e9', '#fb923c', '#8b5cf6', '#facc15', '#dc2626', '#2dd4bf', '#7c3aed', '#059669',
];

type Leaf = { id: string; n: number[]; k: number; q: number; out: 'OPTIMAL' | 'SINGLE'; cost: number };
const LEAVES: Leaf[] = [
    { id: 'L1',  n: [6, 26, 48], k: 1, q: 9, out: 'OPTIMAL', cost: 3636.5 },
    { id: 'L2',  n: [10, 29],    k: 1, q: 4, out: 'OPTIMAL', cost: 4060.8 },
    { id: 'L3',  n: [5, 34, 45], k: 1, q: 9, out: 'OPTIMAL', cost: 4392.1 },
    { id: 'L4',  n: [9, 36],     k: 1, q: 4, out: 'OPTIMAL', cost: 10165.8 },
    { id: 'L5',  n: [20, 47],    k: 1, q: 4, out: 'OPTIMAL', cost: 4518.4 },
    { id: 'L6',  n: [30, 41],    k: 1, q: 4, out: 'OPTIMAL', cost: 3245.4 },
    { id: 'L7',  n: [8, 17],     k: 1, q: 4, out: 'OPTIMAL', cost: 1869.8 },
    { id: 'Ls1', n: [14],        k: 1, q: 0, out: 'SINGLE',  cost: 6214.7 },
    { id: 'L8',  n: [4, 11, 18], k: 1, q: 9, out: 'OPTIMAL', cost: 4160.4 },
    { id: 'L9',  n: [7, 35],     k: 1, q: 4, out: 'OPTIMAL', cost: 6535.4 },
    { id: 'L10', n: [1, 25, 32], k: 1, q: 9, out: 'OPTIMAL', cost: 6653.2 },
    { id: 'L11', n: [12, 28],    k: 1, q: 4, out: 'OPTIMAL', cost: 3564.3 },
    { id: 'L12', n: [16, 38, 23],k: 1, q: 9, out: 'OPTIMAL', cost: 3192.8 },
    { id: 'L13', n: [19, 31, 49],k: 1, q: 9, out: 'OPTIMAL', cost: 2756.6 },
    { id: 'L14', n: [40, 2],     k: 1, q: 4, out: 'OPTIMAL', cost: 4177.0 },
    { id: 'L15', n: [39, 43],    k: 1, q: 4, out: 'OPTIMAL', cost: 4020.4 },
    { id: 'L16', n: [3, 15],     k: 1, q: 4, out: 'OPTIMAL', cost: 6037.0 },
    { id: 'L17', n: [37, 42],    k: 1, q: 4, out: 'OPTIMAL', cost: 4668.6 },
    { id: 'L18', n: [33, 50],    k: 1, q: 4, out: 'OPTIMAL', cost: 4221.2 },
    { id: 'Ls2', n: [46],        k: 1, q: 0, out: 'SINGLE',  cost: 11831.3 },
    { id: 'L19', n: [21, 22, 44],k: 1, q: 9, out: 'OPTIMAL', cost: 7619.9 },
    { id: 'L20', n: [13, 24, 27],k: 1, q: 9, out: 'OPTIMAL', cost: 9451.1 },
];

type D0Cluster = { id: string; leaves: string[]; snLog: number | null; cost: number; out: string; label: string };
const D0_CLUSTERS: D0Cluster[] = [
    { id: 'D1', leaves: ['L1', 'L2', 'L3'],    snLog: 4,  cost: 4723.4,  out: 'OPTIMAL', label: 'NE Central' },
    { id: 'D2', leaves: ['L4'],                snLog: null, cost: 10165.8, out: 'OPTIMAL', label: 'Far NE' },
    { id: 'D3', leaves: ['L5', 'L6', 'L7'],    snLog: 9,  cost: 3200.7,  out: 'OPTIMAL', label: 'NW' },
    { id: 'D4', leaves: ['Ls1', 'L8', 'L9'],   snLog: 12, cost: 5900.7,  out: 'OPTIMAL', label: 'S-Central E' },
    { id: 'D5', leaves: ['L10', 'L11', 'L12'], snLog: 16, cost: 4964.8,  out: 'OPTIMAL', label: 'S-Central' },
    { id: 'D6', leaves: ['L13', 'L14', 'L15'], snLog: 20, cost: 3703.6,  out: 'OPTIMAL', label: 'SW' },
    { id: 'D7', leaves: ['L16', 'L17', 'L18'], snLog: 24, cost: 5673.4,  out: 'OPTIMAL', label: 'East' },
    { id: 'D8', leaves: ['Ls2', 'L19', 'L20'], snLog: 27, cost: 13050.2, out: 'OPTIMAL', label: 'Far East' },
];

const FINAL_ALLOC = [
    { id: 'V1', clusters: ['D1', 'D3', 'D5', 'D6'], k: 3, log: 28, out: 'OPTIMAL', cost: 8276.1 },
    { id: 'V2', clusters: ['D4', 'D7'],              k: 2, log: 29, out: 'OPTIMAL', cost: 8913.4 },
    { id: 'V3', clusters: ['D2', 'D8'],              k: 2, log: 30, out: 'OPTIMAL', cost: 15021.6 },
];

const W = 760,
    H = 520,
    PAD = 45;
const xMin = 3300,
    xMax = 11300,
    yMin = 2300,
    yMax = 7500;
const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
const sy = (v: number) => PAD + ((yMax - v) / (yMax - yMin)) * (H - 2 * PAD);

function cent(ids: number[]) {
    const pts = ids.map((i) => nm[i]).filter(Boolean);

    if (!pts.length) {
return { x: D.x, y: D.y };
}

    return {
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
}

function leafCent(leafId: string) {
    const l = LEAVES.find((x) => x.id === leafId);

    return l ? cent(l.n) : { x: D.x, y: D.y };
}

function clusterAllNodes(cid: string) {
    const c = D0_CLUSTERS.find((x) => x.id === cid);

    if (!c) {
return [];
}

    return c.leaves.flatMap((lid) => {
        const l = LEAVES.find((x) => x.id === lid);

        return l ? l.n : [];
    });
}

function hull(pts: [number, number][], expand = 14) {
    if (pts.length < 2) {
return null;
}

    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const sorted = [...pts].sort(
        (a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)
    );

    return sorted.map((p) => {
        const dx = p[0] - cx,
            dy = p[1] - cy,
            d = Math.sqrt(dx * dx + dy * dy) || 1;

        return [p[0] + (dx / d) * expand, p[1] + (dy / d) * expand];
    });
}

function HullSVG({
    nodeIds,
    color,
    opacity = 0.12,
    expand = 14,
    dash = '',
    sw = 1.5,
}: {
    nodeIds: number[];
    color: string;
    opacity?: number;
    expand?: number;
    dash?: string;
    sw?: number;
}) {
    const pts = nodeIds
        .map((id) => nm[id])
        .filter(Boolean)
        .map((p) => [sx(p.x), sy(p.y)] as [number, number]);
    const h = hull(pts, expand);

    if (!h || h.length < 2) {
return null;
}

    const d = h.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + 'Z';

    return (
        <path
            d={d}
            fill={color}
            fillOpacity={opacity}
            stroke={color}
            strokeOpacity={0.45}
            strokeWidth={sw}
            strokeDasharray={dash}
        />
    );
}

function Dot({
    x,
    y,
    r = 4,
    fill,
    stroke = '#fff',
    sw = 1.2,
    label,
    op = 1,
    delay = 0,
}: {
    x: number;
    y: number;
    r?: number;
    fill: string;
    stroke?: string;
    sw?: number;
    label?: number | string;
    op?: number;
    delay?: number;
}) {
    const cx = sx(x), cy = sy(y);

    return (
        <g
            opacity={op}
            style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `node-pop 520ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`,
            }}
        >
            <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />
            {label != null && (
                <text
                    x={cx}
                    y={cy - r - 3}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#94a3b8"
                    fontFamily="'JetBrains Mono', monospace"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

function Edge({
    n1,
    n2,
    color,
    w = 1.8,
    dash = '',
    op = 0.75,
    delay = 0,
    draw = true,
}: {
    n1: number;
    n2: number;
    color: string;
    w?: number;
    dash?: string;
    op?: number;
    delay?: number;
    draw?: boolean;
}) {
    const a = nm[n1] || D,
        b = nm[n2] || D;
    const x1 = sx(a.x), y1 = sy(a.y), x2 = sx(b.x), y2 = sy(b.y);
    const len = Math.hypot(x2 - x1, y2 - y1);

    return (
        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={w}
            strokeLinecap="round"
            strokeDasharray={draw ? `${len} ${len}` : dash}
            style={draw ? {
                strokeDashoffset: 0,
                animation: `edge-draw 900ms cubic-bezier(0.65,0,0.35,1) ${delay}ms both`,
                ['--edge-len' as any]: `${len}`,
            } : undefined}
            opacity={op}
        />
    );
}

function CropMark({ className, rotate = 0 }: { className?: string; rotate?: number }) {
    return (
        <div aria-hidden className={cn('pointer-events-none absolute z-20', className)} style={{ transform: `rotate(${rotate}deg)` }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
                <line x1="0" y1="1" x2="10" y2="1" stroke="oklch(0.72 0.18 35 / 0.6)" strokeWidth="1" />
                <line x1="1" y1="0" x2="1" y2="10" stroke="oklch(0.72 0.18 35 / 0.6)" strokeWidth="1" />
            </svg>
        </div>
    );
}

function DepotNode() {
    return (
        <g>
            <circle cx={sx(D.x)} cy={sy(D.y)} r={10} fill="#0f172a" stroke="#facc15" strokeWidth={2.5} />
            <text
                x={sx(D.x)}
                y={sy(D.y) + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill="#facc15"
                fontWeight="800"
                fontFamily="'IBM Plex Mono', monospace"
            >
                D
            </text>
        </g>
    );
}

type Scene = {
    key: string;
    act: string;
    numeral: string;
    title: string;
    subtitle: string;
    caption: string;
    stats: { v: string; l: string }[];
};

const SCENES: Scene[] = [
    {
        key: 'raw',
        act: 'Acte I',
        numeral: 'I',
        title: 'The Landscape',
        subtitle: 'Fifty points, one depot, seven vehicles.',
        caption: 'A single depot. Fifty deliveries scattered across the terrain. Seven vehicles must each leave and return, covering every node exactly once — minimising total distance travelled.',
        stats: [{ v: '50', l: 'Nodes' }, { v: '1', l: 'Depot' }, { v: '7', l: 'Vehicles' }, { v: '∞', l: 'Configurations' }],
    },
    {
        key: 'clust',
        act: 'Acte II',
        numeral: 'II',
        title: 'The Partition',
        subtitle: 'Ward-tight carves the landscape into leaves.',
        caption: 'ward_tight(max_size=4) partitions the nodes into 20 geographic leaves of at most three points each. Each leaf becomes a tractable sub-problem — small enough for a quantum circuit to solve exactly.',
        stats: [{ v: '20', l: 'Leaves' }, { v: '≤3', l: 'Per leaf' }, { v: 'Ward', l: 'Method' }, { v: 'Depth 2', l: 'Hierarchy' }],
    },
    {
        key: 'leaf',
        act: 'Acte III',
        numeral: 'III',
        title: 'The Quantum Solve',
        subtitle: 'QAOA traces the shortest closed tour through each leaf.',
        caption: 'Each leaf becomes a closed-tour TSP: depot → nodes → depot. QAOA runs with five optimiser configurations (ADAM ×2 · COBYLA ×3). Every single one of the twenty leaves returns OPTIMAL.',
        stats: [{ v: '20', l: 'QAOA runs' }, { v: '100%', l: 'Optimal' }, { v: '5', l: 'Configs each' }, { v: '6–12', l: 'Qubits' }],
    },
    {
        key: 'super',
        act: 'Acte IV',
        numeral: 'IV',
        title: 'The Aggregation',
        subtitle: 'Leaves collapse into super-nodes; the map simplifies.',
        caption: 'Each solved leaf becomes a single super-node at its centroid. Twenty leaves become twenty super-nodes. Ward-tight clusters these once more into six depth-one groups — one territory per vehicle band.',
        stats: [{ v: '20', l: 'Super-nodes' }, { v: '6', l: 'Territories' }, { v: 'Centroid', l: 'Distance' }, { v: 'Depth 1', l: 'Hierarchy' }],
    },
    {
        key: 'sn_qaoa',
        act: 'Acte V',
        numeral: 'V',
        title: 'The Orchestration',
        subtitle: 'QAOA orders the super-nodes within each territory.',
        caption: 'Another six quantum solves — log entries #4, #9, #12, #16, #20, #24 — decide the visiting order of super-nodes within each territory. Each returns OPTIMAL. The macro-route of every vehicle is now fixed.',
        stats: [{ v: '6', l: 'QAOA runs' }, { v: '100%', l: 'Optimal' }, { v: '#4–#24', l: 'Log entries' }, { v: '3+2+2', l: 'Fleet split' }],
    },
    {
        key: 'alloc',
        act: 'Acte VI',
        numeral: 'VI',
        title: 'The Allotment',
        subtitle: 'K=7 vehicles are distributed across six territories.',
        caption: 'Depth-zero QAOA spreads seven vehicles across six territories: three take a single bundle (log #28, FEASIBLE), two pair up (log #29, #30 — both OPTIMAL). The fleet is committed.',
        stats: [{ v: '3', l: 'Bundles' }, { v: 'FEAS', l: '#28' }, { v: 'OPT', l: '#29 · #30' }, { v: '−15.5%', l: 'Duality gap' }],
    },
    {
        key: 'final',
        act: 'Acte VII',
        numeral: 'VII',
        title: 'The Finale',
        subtitle: 'Seven routes stitched, end-to-end, depot to depot.',
        caption: 'Bottom-up merge: every leaf QAOA tour is oriented and stitched via merge_super_solution. Seven complete routes emerge — each leaving the depot, visiting its assignments, and returning. The VRP is resolved.',
        stats: [{ v: '7', l: 'Routes' }, { v: '50', l: 'Visited' }, { v: '30/30', l: 'Optimal' }, { v: '100%', l: 'Success rate' }],
    },
];
const TABS = SCENES.map(s => ({ key: s.key, label: s.title }));

export default function QAOAVisualization() {
    const [tab, setTab] = useState('raw');
    const [playing, setPlaying] = useState(true);
    const tidx = TABS.findIndex((t) => t.key === tab);

    // Autoplay: advance to next tab every 4.5 seconds
    useEffect(() => {
        if (!playing) {
return;
}

        const nextIdx = tidx === TABS.length - 1 ? 0 : tidx + 1;
        const timer = setTimeout(() => {
            setTab(TABS[nextIdx].key);
        }, 6500);

        return () => clearTimeout(timer);
    }, [playing, tidx]);

    const svg = useMemo(() => {
        const els: JSX.Element[] = [];

        // Grid dots
        for (let gx = 3500; gx <= 11000; gx += 500) {
for (let gy = 2500; gy <= 7500; gy += 500) {
els.push(
                    <circle
                        key={`g${gx}_${gy}`}
                        cx={sx(gx)}
                        cy={sy(gy)}
                        r={0.6}
                        fill="#1e293b"
                        opacity={0.5}
                    />
                );
}
}

        if (tab === 'raw') {
            ALL.forEach((n, i) =>
                els.push(
                    <Dot key={n.id} x={n.x} y={n.y} r={4.5} fill="#475569" stroke="#64748b" label={n.id} delay={40 + i * 22} />
                )
            );
        }

        if (tab === 'clust') {
            LEAVES.forEach((l, i) => {
                const c = COLORS[i % COLORS.length];
                const base = 80 + i * 55;
                els.push(<HullSVG key={`h${l.id}`} nodeIds={l.n} color={c} opacity={0.15} />);
                l.n.forEach((nid, k) => {
                    const n = nm[nid];

                    if (n) {
els.push(<Dot key={nid} x={n.x} y={n.y} r={5} fill={c} stroke="#fff" label={nid} delay={base + k * 40} />);
}
                });
                const ct = cent(l.n);
                els.push(
                    <text
                        key={`t${l.id}`}
                        x={sx(ct.x)}
                        y={sy(ct.y) + 16}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="700"
                        fill={c}
                        fontFamily="'IBM Plex Mono', monospace"
                        opacity={0.8}
                    >
                        {l.id.replace('L', '')}
                    </text>
                );
            });
        }

        if (tab === 'leaf') {
            LEAVES.forEach((l, i) => {
                const c = COLORS[i % COLORS.length];
                const base = 120 + i * 35;
                els.push(<HullSVG key={`h${l.id}`} nodeIds={l.n} color={c} opacity={0.06} />);
                l.n.forEach((nid, k) => {
                    const n = nm[nid];

                    if (n) {
els.push(<Dot key={nid} x={n.x} y={n.y} r={4.5} fill={c} stroke="#fff" label={nid} delay={base + k * 60} />);
}
                });
                els.push(<Edge key={`ds${l.id}`} n1={0} n2={l.n[0]} color={c} w={1} dash="4 3" op={0.35} delay={base + 200} />);

                for (let j = 0; j < l.n.length - 1; j++) {
els.push(<Edge key={`e${l.id}${j}`} n1={l.n[j]} n2={l.n[j + 1]} color={c} w={2.2} op={0.85} delay={base + 280 + j * 110} />);
}

                els.push(
                    <Edge
                        key={`de${l.id}`}
                        n1={l.n[l.n.length - 1]}
                        n2={0}
                        color={c}
                        w={1}
                        dash="4 3"
                        op={0.35}
                        delay={base + 280 + l.n.length * 110}
                    />
                );
            });
        }

        if (tab === 'super') {
            D0_CLUSTERS.forEach((cl, ci) => {
                const mc = COLORS[ci];
                const allN = clusterAllNodes(cl.id);
                els.push(<HullSVG key={`mh${cl.id}`} nodeIds={allN} color={mc} opacity={0.08} expand={22} dash="6 3" />);
                allN.forEach((nid) => {
                    const n = nm[nid];

                    if (n) {
els.push(<Dot key={`f${nid}`} x={n.x} y={n.y} r={2} fill={mc} stroke="none" op={0.2} />);
}
                });
                cl.leaves.forEach((lid) => {
                    const lf = LEAVES.find((x) => x.id === lid);

                    if (!lf) {
return;
}

                    const ct = cent(lf.n);
                    lf.n.forEach((nid) => {
                        const n = nm[nid];

                        if (n) {
els.push(
                                <line
                                    key={`sln${lid}${nid}`}
                                    x1={sx(ct.x)}
                                    y1={sy(ct.y)}
                                    x2={sx(n.x)}
                                    y2={sy(n.y)}
                                    stroke={mc}
                                    strokeWidth={0.5}
                                    strokeDasharray="2 2"
                                    opacity={0.15}
                                />
                            );
}
                    });
                    els.push(
                        <g key={`sn${lid}`}>
                            <circle cx={sx(ct.x)} cy={sy(ct.y)} r={8} fill={mc} stroke="#fff" strokeWidth={1.8} />
                            <text
                                x={sx(ct.x)}
                                y={sy(ct.y) + 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="7"
                                fill="#fff"
                                fontWeight="700"
                                fontFamily="'IBM Plex Mono', monospace"
                            >
                                {lid.replace('L', '')}
                            </text>
                        </g>
                    );
                });
                const mct = cent(allN);
                els.push(
                    <text
                        key={`ml${cl.id}`}
                        x={sx(mct.x)}
                        y={sy(mct.y) + 28}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        fill={mc}
                        fontFamily="'IBM Plex Mono', monospace"
                        opacity={0.85}
                    >
                        {cl.label}
                    </text>
                );
            });
        }

        if (tab === 'sn_qaoa') {
            D0_CLUSTERS.forEach((cl, ci) => {
                const mc = COLORS[ci];
                const allN = clusterAllNodes(cl.id);
                els.push(<HullSVG key={`mh${cl.id}`} nodeIds={allN} color={mc} opacity={0.06} expand={22} />);
                allN.forEach((nid) => {
                    const n = nm[nid];

                    if (n) {
els.push(<Dot key={`f${nid}`} x={n.x} y={n.y} r={1.5} fill={mc} stroke="none" op={0.15} />);
}
                });
                const snCentroids = cl.leaves
                    .map((lid) => {
                        const lf = LEAVES.find((x) => x.id === lid);

                        return lf ? cent(lf.n) : null;
                    })
                    .filter(Boolean) as Array<{ x: number; y: number }>;

                if (snCentroids.length > 0) {
                    els.push(
                        <line
                            key={`sqds${cl.id}`}
                            x1={sx(D.x)}
                            y1={sy(D.y)}
                            x2={sx(snCentroids[0].x)}
                            y2={sy(snCentroids[0].y)}
                            stroke={mc}
                            strokeWidth={1.2}
                            strokeDasharray="5 4"
                            opacity={0.4}
                        />
                    );

                    for (let j = 0; j < snCentroids.length - 1; j++) {
els.push(
                            <line
                                key={`sqe${cl.id}${j}`}
                                x1={sx(snCentroids[j].x)}
                                y1={sy(snCentroids[j].y)}
                                x2={sx(snCentroids[j + 1].x)}
                                y2={sy(snCentroids[j + 1].y)}
                                stroke={mc}
                                strokeWidth={2.5}
                                opacity={0.75}
                            />
                        );
}

                    els.push(
                        <line
                            key={`sqde${cl.id}`}
                            x1={sx(snCentroids[snCentroids.length - 1].x)}
                            y1={sy(snCentroids[snCentroids.length - 1].y)}
                            x2={sx(D.x)}
                            y2={sy(D.y)}
                            stroke={mc}
                            strokeWidth={1.2}
                            strokeDasharray="5 4"
                            opacity={0.4}
                        />
                    );
                }

                cl.leaves.forEach((lid) => {
                    const lf = LEAVES.find((x) => x.id === lid);

                    if (!lf) {
return;
}

                    const ct = cent(lf.n);
                    els.push(
                        <g key={`sqn${lid}`}>
                            <circle cx={sx(ct.x)} cy={sy(ct.y)} r={9} fill={mc} stroke="#fff" strokeWidth={2} />
                            <text
                                x={sx(ct.x)}
                                y={sy(ct.y) + 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="7"
                                fill="#fff"
                                fontWeight="700"
                                fontFamily="'IBM Plex Mono', monospace"
                            >
                                {lid.replace('L', '')}
                            </text>
                        </g>
                    );
                });
                const mct = cent(allN);
                els.push(
                    <text
                        key={`sql${cl.id}`}
                        x={sx(mct.x)}
                        y={sy(mct.y) + 28}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="600"
                        fill={mc}
                        fontFamily="'IBM Plex Mono', monospace"
                    >
                        QAOA #{cl.snLog} {cl.out}
                    </text>
                );
            });
        }

        if (tab === 'alloc') {
            const vcolors = ['#ef4444', '#22c55e', '#3b82f6'];
            FINAL_ALLOC.forEach((va, vi) => {
                const vc = vcolors[vi];
                const allN = va.clusters.flatMap((cid) => clusterAllNodes(cid));
                els.push(<HullSVG key={`ah${va.id}`} nodeIds={allN} color={vc} opacity={0.12} expand={24} />);
                allN.forEach((nid) => {
                    const n = nm[nid];

                    if (n) {
els.push(<Dot key={`an${nid}`} x={n.x} y={n.y} r={3.5} fill={vc} stroke="#fff" sw={0.8} op={0.5} />);
}
                });
                const mct = cent(allN);
                const bx = sx(mct.x),
                    by = sy(mct.y);
                els.push(
                    <g key={`ab${va.id}`}>
                        <rect
                            x={bx - 36}
                            y={by - 16}
                            width={72}
                            height={32}
                            rx={6}
                            fill={vc}
                            stroke="#fff"
                            strokeWidth={1.5}
                        />
                        <text
                            x={bx}
                            y={by + 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="12"
                            fill="#fff"
                            fontWeight="800"
                            fontFamily="'IBM Plex Mono', monospace"
                        >
                            K={va.k}
                        </text>
                    </g>
                );
                els.push(
                    <text
                        key={`al${va.id}`}
                        x={sx(mct.x)}
                        y={sy(mct.y) + 28}
                        textAnchor="middle"
                        fontSize="8"
                        fill={vc}
                        fontFamily="'IBM Plex Mono', monospace"
                    >
                        Log #{va.log} {va.out}
                    </text>
                );
            });
        }

        if (tab === 'final') {
            const vcolors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4', '#ec4899'];
            let ri = 0;
            FINAL_ALLOC.forEach((va) => {
                const allN = va.clusters.flatMap((cid) => clusterAllNodes(cid));
                const perRoute = Math.ceil(allN.length / va.k);

                for (let v = 0; v < va.k; v++) {
                    const route = allN.slice(v * perRoute, (v + 1) * perRoute);

                    if (!route.length) {
continue;
}

                    const rc = vcolors[ri % vcolors.length];
                    const rbase = 200 + ri * 220;
                    ri++;
                    route.forEach((nid, k) => {
                        const n = nm[nid];

                        if (n) {
els.push(<Dot key={`fn${nid}`} x={n.x} y={n.y} r={5} fill={rc} stroke="#fff" label={nid} delay={rbase + k * 50} />);
}
                    });
                    els.push(<Edge key={`fds${ri}`} n1={0} n2={route[0]} color={rc} w={1.5} dash="5 4" op={0.45} delay={rbase + 150} />);

                    for (let j = 0; j < route.length - 1; j++) {
els.push(<Edge key={`fe${ri}_${j}`} n1={route[j]} n2={route[j + 1]} color={rc} w={2.6} op={0.85} delay={rbase + 220 + j * 90} />);
}

                    els.push(<Edge key={`fde${ri}`} n1={route[route.length - 1]} n2={0} color={rc} w={1.5} dash="5 4" op={0.45} delay={rbase + 220 + route.length * 90} />);
                }
            });
        }

        els.push(<DepotNode key="depot" />);

        return els;
    }, [tab]);

    const scene = SCENES[tidx] ?? SCENES[0];

    return (
        <>
            <style>{`
                @keyframes node-pop {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.25); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes edge-draw {
                    from { stroke-dashoffset: var(--edge-len); opacity: 0; }
                    30% { opacity: 1; }
                    to { stroke-dashoffset: 0; opacity: 1; }
                }
                @keyframes qv-bar {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                @keyframes qv-title-rise {
                    0%   { opacity: 0; transform: translateY(22px); filter: blur(6px); letter-spacing: 0.01em; }
                    60%  { filter: blur(0); }
                    100% { opacity: 1; transform: translateY(0); filter: blur(0); letter-spacing: 0; }
                }
                @keyframes qv-line-draw {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
                @keyframes qv-soft-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes qv-plate-in {
                    from { opacity: 0; transform: scale(0.985); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes qv-numeral-in {
                    from { opacity: 0; transform: translateX(-18px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes qv-stat-in {
                    from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
                    to   { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                @keyframes qv-beacon {
                    0%, 100% { opacity: 0.9; }
                    50%      { opacity: 0.3; }
                }
                .qv-film::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0.035;
                    mix-blend-mode: overlay;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
                }
            `}</style>

            {/* EDITORIAL SPREAD — left column: type · right column: plate */}
            <div className="relative flex h-full w-full overflow-hidden bg-background pl-36">

                {/* corner crop-marks — editorial motif */}
                <CropMark className="top-6 left-40" rotate={0} />
                <CropMark className="top-6 right-6" rotate={90} />
                <CropMark className="bottom-6 left-40" rotate={-90} />
                <CropMark className="bottom-6 right-6" rotate={180} />

                {/* faint background glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 50% 38% at 72% 30%, oklch(0.72 0.18 35 / 0.07), transparent 70%)' }}
                />

                {/* LEFT — editorial column */}
                <div className="relative z-10 flex w-[38%] min-w-88 shrink-0 flex-col justify-between px-14 pt-12 pb-10">

                    {/* Header slug */}
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.5em] text-muted-foreground/55 font-display">
                        <div className="flex items-center gap-3">
                            <span className="h-px w-6 bg-primary/60" />
                            <span>II · A</span>
                            <span className="text-muted-foreground/30">—</span>
                            <span>Algorithm Walkthrough</span>
                        </div>
                        <span className="tabular-nums">MMXXVI</span>
                    </div>

                    {/* Body */}
                    <div key={`col-${tab}`} className="flex flex-col gap-7">

                        {/* Numeral + act */}
                        <div className="flex items-baseline gap-5" style={{ animation: 'qv-numeral-in 700ms cubic-bezier(0.76,0,0.24,1) 80ms both' }}>
                            <span className="font-display italic text-7xl leading-none text-primary">{scene.numeral}</span>
                            <div className="flex flex-col gap-1 pb-1">
                                <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground/50 font-display">{scene.act}</span>
                                <span className="font-serif italic text-sm text-muted-foreground/70">{scene.subtitle}</span>
                            </div>
                        </div>

                        {/* Animated rule */}
                        <span
                            className="h-px w-20 origin-left bg-primary/70"
                            style={{ animation: 'qv-line-draw 900ms cubic-bezier(0.76,0,0.24,1) 140ms both' }}
                        />

                        {/* Hero title */}
                        <h1
                            className="font-display italic leading-[0.84] tracking-tight text-foreground"
                            style={{
                                fontSize: 'clamp(2.8rem, 4.8vw, 4.6rem)',
                                animation: 'qv-title-rise 900ms cubic-bezier(0.76,0,0.24,1) 180ms both',
                            }}
                        >
                            {scene.title}.
                        </h1>

                        {/* Caption */}
                        <p
                            className="max-w-136 font-serif italic text-[15px] leading-[1.75] text-foreground/75"
                            style={{ animation: 'qv-soft-in 900ms cubic-bezier(0.76,0,0.24,1) 380ms both' }}
                        >
                            {scene.caption}
                        </p>

                        {/* Dramatis personae — scene stats as editorial spec sheet */}
                        <div className="mt-4 border-t border-border/30 pt-5">
                            <div className="mb-3 text-[9px] uppercase tracking-[0.45em] text-muted-foreground/40 font-display">Dramatis personae</div>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
                                {scene.stats.map((s, i) => (
                                    <div
                                        key={`${tab}-${i}`}
                                        className="flex items-baseline justify-between border-b border-border/20 pb-2"
                                        style={{ animation: `qv-stat-in 600ms cubic-bezier(0.76,0,0.24,1) ${460 + i * 70}ms both` }}
                                    >
                                        <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/55 font-display">{s.l}</span>
                                        <span className="font-display italic text-lg tabular-nums text-foreground/90">{s.v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer — colophon */}
                    <div className="flex items-end justify-between border-t border-border/30 pt-5 text-[9px] uppercase tracking-[0.45em] text-muted-foreground/40 font-display">
                        <span>Vectora · Atelier</span>
                        <span className="font-serif italic normal-case tracking-normal text-muted-foreground/45">from the QAOA log</span>
                    </div>
                </div>

                {/* RIGHT — the plate */}
                <div className="relative z-10 flex flex-1 flex-col pr-10 pt-12 pb-10">

                    {/* Plate header: counter + status */}
                    <div className="flex items-end justify-between pb-5">
                        <div className="flex items-baseline gap-4 font-display">
                            <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground/50">Plate</span>
                            <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground/30">№</span>
                            <span className="italic text-2xl tabular-nums text-foreground/90">{String(tidx + 1).padStart(2, '0')}</span>
                            <span className="text-muted-foreground/30">/</span>
                            <span className="italic text-sm tabular-nums text-muted-foreground/50">{String(TABS.length).padStart(2, '0')}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[9px] uppercase tracking-[0.45em] text-muted-foreground/55 font-display">
                            <span className="h-1 w-1 rounded-full bg-primary" style={{ animation: playing ? 'qv-beacon 1.6s ease-in-out infinite' : undefined }} />
                            <span>{playing ? 'Autoplay' : 'Paused'}</span>
                        </div>
                    </div>

                    {/* SVG plate — no border, inset into the page */}
                    <div
                        key={`svg-${tab}`}
                        className="qv-film relative flex-1 min-h-0 overflow-hidden rounded-md"
                        style={{
                            animation: 'qv-plate-in 900ms cubic-bezier(0.76,0,0.24,1) both',
                            background: 'radial-gradient(ellipse 70% 60% at 50% 45%, oklch(0.14 0.02 250), oklch(0.09 0.02 250) 85%)',
                            boxShadow: 'inset 0 0 0 1px oklch(0.25 0.02 250 / 0.35), 0 30px 80px -40px rgba(0,0,0,0.9)',
                        }}
                    >
                        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block h-full w-full">
                            {svg}
                        </svg>

                        {/* Vignette */}
                        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />

                        {/* Autoplay bar */}
                        {playing && (
                            <div
                                key={`bar-${tab}`}
                                className="pointer-events-none absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-primary"
                                style={{ animation: 'qv-bar 7500ms linear both', boxShadow: '0 0 14px oklch(0.72 0.18 35 / 0.7)' }}
                            />
                        )}
                    </div>

                    {/* Legend + timeline below plate */}
                    <div className="flex items-center justify-between gap-8 pt-5">
                        <div className="flex items-center gap-5 text-[9px] uppercase tracking-[0.4em] text-muted-foreground/55 font-display">
                            <span className="flex items-center gap-2">
                                <svg width="10" height="10"><circle cx="5" cy="5" r="3.2" fill="transparent" stroke="#facc15" strokeWidth="1.6" /></svg>
                                Depot
                            </span>
                            <span className="flex items-center gap-2">
                                <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke="oklch(0.72 0.18 35)" strokeWidth="2" strokeLinecap="round" /></svg>
                                Route
                            </span>
                            <span className="flex items-center gap-2">
                                <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" /></svg>
                                Depot link
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => {
 const p = tidx === 0 ? TABS.length - 1 : tidx - 1; setTab(TABS[p].key); 
}}
                                className="font-display italic text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
                            >
                                ← prev
                            </button>
                            <button
                                onClick={() => setPlaying(!playing)}
                                className="group flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/5 text-primary transition-all hover:border-primary hover:bg-primary/15"
                                aria-label={playing ? 'Pause' : 'Play'}
                                style={{ boxShadow: '0 0 22px -6px oklch(0.72 0.18 35 / 0.6)' }}
                            >
                                <span className="text-sm leading-none">{playing ? '❚❚' : '▶'}</span>
                            </button>
                            <button
                                onClick={() => {
 const n = tidx === TABS.length - 1 ? 0 : tidx + 1; setTab(TABS[n].key); 
}}
                                className="font-display italic text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
                            >
                                next →
                            </button>
                        </div>
                    </div>

                    {/* Act timeline */}
                    <div className="mt-5 grid grid-cols-7 gap-2">
                        {SCENES.map((s, idx) => {
                            const active = idx === tidx;
                            const past = idx < tidx;

                            return (
                                <button
                                    key={s.key}
                                    onClick={() => {
 setTab(s.key); setPlaying(false); 
}}
                                    className="group flex flex-col items-start gap-2 text-left"
                                    title={s.title}
                                >
                                    <div className={cn(
                                        'h-px w-full transition-all duration-500',
                                        active ? 'bg-primary' : past ? 'bg-primary/40' : 'bg-border/40 group-hover:bg-border'
                                    )} />
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                            'font-display italic text-[10px] tabular-nums transition-colors',
                                            active ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground'
                                        )}>
                                            {s.numeral}
                                        </span>
                                        <span className={cn(
                                            'font-display text-[10px] uppercase tracking-[0.25em] transition-colors',
                                            active ? 'text-foreground' : 'text-muted-foreground/40 group-hover:text-muted-foreground/70'
                                        )}>
                                            {s.title}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
