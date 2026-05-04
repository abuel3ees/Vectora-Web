import { Head } from '@inertiajs/react';
import { useEffect, useRef, useCallback } from 'react';
import * as topojson from 'topojson-client';

// ─── types ───────────────────────────────────────────────
type V3 = [number, number, number];
type P3 = [number, number, number];
type RouteStyle = { c: string; g: string; w: number };
type ArcPt = { t: number; spd: number; done: boolean };
type SlideState = {
    t: number;
    s: number;
    n: number;
    r: [number, number, number, number, number];
    d: number;
    z: { sc: number; la: number; lo: number } | null;
};

// ─── data ────────────────────────────────────────────────
const CITIES: [string, number, number][] = [
    ['Rio Claro', -22.41, -47.56],
    ['Artur Nogueira', -22.57, -47.17],
    ['Campinas', -22.91, -47.06],
    ['São Paulo', -23.55, -46.63],
    ['Ribeirão Preto', -21.17, -47.81],
    ['Belo Horizonte', -19.92, -43.94],
    ['New York', 40.71, -74.01],
    ['Rome', 41.9, 12.5],
    ['London', 51.51, -0.13],
    ['Amman', 31.95, 35.93],
    ['Dubai', 25.2, 55.27],
    ['IBM Cloud', 41.14, -73.87],
    ['Marrakesh', 31.63, -7.99],
    ['Tokyo', 35.68, 139.69],
    ['Singapore', 1.35, 103.82],
    ['Sydney', -33.87, 151.21],
    ['Berlin', 52.52, 13.4],
    ['Toronto', 43.65, -79.38],
    ['Cairo', 30.04, 31.24],
    ['Nairobi', -1.29, 36.82],
];
const ROUTES = [
    { nodes: [0, 1, 2, 3, 4, 0] },
    { nodes: [0, 6, 17, 11, 16, 7, 0] },
    { nodes: [0, 18, 19, 10, 14, 15, 0] },
    { nodes: [0, 12, 8, 9, 10, 0] },
    { nodes: [0, 5, 3, 4, 1, 0] },
];
const RS: RouteStyle[] = [
    { c: '#7dd3fc', g: 'rgba(125,211,252,', w: 1.6 },
    { c: '#f472b6', g: 'rgba(244,114,182,', w: 1.4 },
    { c: '#facc15', g: 'rgba(250,204,21,', w: 1.5 },
    { c: '#34d399', g: 'rgba(52,211,153,', w: 1.2 },
    { c: '#a78bfa', g: 'rgba(167,139,250,', w: 1.4 },
];
const SS: SlideState[] = [
    { t: 0.45, s: 0.35, n: 0, r: [0, 0, 0, 0, 0], d: 1, z: null },
    { t: 0.38, s: 0.3, n: 1, r: [0, 0, 0, 0, 0], d: 1, z: null },
    { t: 0.1, s: 0.8, n: 1, r: [0, 0, 0, 0, 0], d: 1, z: null },
    { t: 0.3, s: 0.55, n: 1, r: [0, 0, 0, 0, 0], d: 1, z: null },
    { t: 0.55, s: 0.9, n: 0.5, r: [0, 0, 0, 0, 0], d: 1, z: null },
    { t: 0.75, s: 1.4, n: 0.35, r: [0, 0, 0, 0, 0], d: 1, z: null },
    { t: 0.68, s: 1.6, n: 0.25, r: [0, 0, 0, 0, 0], d: 1, z: null },
    { t: 0.42, s: 0.5, n: 1, r: [0, 0, 0, 0, 0], d: 1, z: null },
    { t: 0.45, s: 0.18, n: 0.2, r: [0, 0, 0, 0, 0], d: 0.28, z: null },
    { t: 0.35, s: 0.4, n: 1, r: [0, 0, 0, 0, 0], d: 1, z: null },
    {
        t: 0.42,
        s: 0.28,
        n: 1,
        r: [1, 0, 0, 0, 0],
        d: 1,
        z: { sc: 2.15, la: -22.5, lo: -47.3 },
    },
    {
        t: 0.32,
        s: 0.22,
        n: 1,
        r: [1, 1, 0, 0, 0],
        d: 1,
        z: { sc: 1.8, la: 36, lo: -35 },
    },
    {
        t: 0.38,
        s: 0.22,
        n: 1,
        r: [1, 1, 1, 0, 0],
        d: 1,
        z: { sc: 1.9, la: 12, lo: 45 },
    },
    { t: 0.45, s: 0.38, n: 1, r: [1, 1, 1, 1, 1], d: 1, z: null },
    { t: 0.45, s: 0.18, n: 0.15, r: [1, 1, 1, 1, 1], d: 0.22, z: null },
    { t: 0.45, s: 0.32, n: 1, r: [1, 1, 1, 1, 1], d: 1, z: null },
    { t: 0.5, s: 0.28, n: 1, r: [1, 1, 1, 1, 1], d: 1, z: null },
    { t: 0.4, s: 0.2, n: 1, r: [1, 1, 1, 1, 1], d: 1, z: null },
];

const SLIDE_LABELS = [
    '01 Title',
    '02 Logistics Pain',
    '03 Explosion',
    '04 Objective',
    '05 Quantum Primer',
    '06 QUBO Map',
    '07 QAOA Engine',
    '08 Design Choices',
    '09 Circuit Reactor',
    '10 Recursive Pipeline',
    '11 Brazil Benchmark',
    '12 Leaf Solver',
    '13 Warm Start',
    '14 System Topology',
    '15 Validation',
    '16 Results',
    '17 IBM Quantum',
    '18 Future Work',
];

const ORBIT_RINGS = [
    { inc: 28, r: 1.12, a: 0.18, phase: 0 },
    { inc: -18, r: 1.2, a: 0.1, phase: 1.1 },
];

export default function Presentation() {
    const bgRef = useRef<HTMLCanvasElement>(null);
    const gcRef = useRef<HTMLCanvasElement>(null);
    const echRef = useRef<HTMLCanvasElement>(null);
    const curRef = useRef(0);
    const rafRef = useRef(0);
    const stateRef = useRef({ initialized: false });

    // Expose goTo so event listeners can call it
    const goToRef = useRef<(i: number) => void>(() => {});

    useEffect(() => {
        const bgC = bgRef.current!;
        const gc = gcRef.current!;

        if (!bgC || !gc) {
            return;
        }

        const bgX = bgC.getContext('2d')!;
        const gx = gc.getContext('2d')!;

        let W = 0,
            H = 0;
        let stars: {
            x: number;
            y: number;
            r: number;
            a: number;
            tw: number;
        }[] = [];

        function resize() {
            W = bgC.width = gc.width = window.innerWidth;
            H = bgC.height = gc.height = window.innerHeight;
            stars = Array.from({ length: 320 }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 0.9 + 0.15,
                a: Math.random() * 0.45 + 0.06,
                tw: Math.random() * Math.PI * 2,
            }));
        }
        window.addEventListener('resize', resize);
        resize();

        // globe interpolated state
        const G = {
            t: 0.45,
            s: 0.35,
            n: 0,
            r: [0, 0, 0, 0, 0] as number[],
            d: 1,
            zsc: 1,
            zox: 0,
            zoy: 0,
        };
        let rotAngle = 0,
            lastTs = 0;

        const particles = Array.from({ length: 60 }, () => ({
            lat: ((Math.random() * 180 - 90) * Math.PI) / 180,
            lon: Math.random() * Math.PI * 2,
            r: 1.1 + Math.random() * 0.18,
            speed: (Math.random() - 0.5) * 0.0004,
            size: Math.random() * 1.2 + 0.3,
            a: Math.random() * 0.35 + 0.08,
        }));
        const vehicles = ROUTES.map(() => ({
            t: Math.random(),
            spd: 0.00006 + Math.random() * 0.00003,
        }));
        const cityFlash = new Array(CITIES.length).fill(0);
        const arcP: ArcPt[][] = ROUTES.map((r) =>
            r.nodes.slice(0, -1).map(() => ({
                t: 0,
                spd: 0.002 + Math.random() * 0.002,
                done: false,
            })),
        );

        // world data
        let landRings: number[][][] = [],
            countryLines: number[][][] = [];
        Promise.all([
            fetch(
                'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json',
            ).then((r) => r.json()),
            fetch(
                'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
            ).then((r) => r.json()),
        ])
            .then(([l, c]) => {
                topojson
                    .feature(l as any, (l as any).objects.land)
                    .features.forEach((f: any) => {
                        const p =
                            f.geometry.type === 'Polygon'
                                ? [f.geometry.coordinates]
                                : f.geometry.coordinates;
                        (p as number[][][][]).forEach((poly: number[][][]) =>
                            poly.forEach((ring: number[][]) =>
                                landRings.push(ring),
                            ),
                        );
                    });
                const m = topojson.mesh(
                    c as any,
                    (c as any).objects.countries,
                    (a: any, b: any) => a !== b,
                );
                countryLines = (m as any).coordinates;
            })
            .catch(() => {});

        // ─── math ───
        const toV = (la: number, lo: number): V3 => {
            const a = (la * Math.PI) / 180,
                b = (lo * Math.PI) / 180;

            return [
                Math.cos(a) * Math.cos(b),
                Math.sin(a),
                Math.cos(a) * Math.sin(b),
            ];
        };
        const rotY = (v: V3, a: number): V3 => [
            v[0] * Math.cos(a) + v[2] * Math.sin(a),
            v[1],
            -v[0] * Math.sin(a) + v[2] * Math.cos(a),
        ];
        const rotX = (v: V3, a: number): V3 => [
            v[0],
            v[1] * Math.cos(a) - v[2] * Math.sin(a),
            v[1] * Math.sin(a) + v[2] * Math.cos(a),
        ];
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const vw = (v: V3): V3 => rotX(rotY(v, rotAngle), (G.t * Math.PI) / 2);
        const vwFix = (v: V3): V3 => rotX(v, (G.t * Math.PI) / 2);

        function pr(v: V3, R: number, cx: number, cy: number): P3 {
            return [
                (cx + v[0] * R - G.zox) * G.zsc + G.zox,
                (cy - v[1] * R - G.zoy) * G.zsc + G.zoy,
                v[2],
            ];
        }
        function prRaw(v: V3, R: number, cx: number, cy: number): P3 {
            return [cx + v[0] * R, cy - v[1] * R, v[2]];
        }
        function slE(a: V3, b: V3, t: number, h = 0.1): V3 {
            const d = Math.max(
                -1,
                Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]),
            );
            const th = Math.acos(d);

            if (Math.abs(th) < 1e-4) {
                return a;
            }

            const s = Math.sin(th);
            const v: V3 = [
                (Math.sin((1 - t) * th) / s) * a[0] +
                    (Math.sin(t * th) / s) * b[0],
                (Math.sin((1 - t) * th) / s) * a[1] +
                    (Math.sin(t * th) / s) * b[1],
                (Math.sin((1 - t) * th) / s) * a[2] +
                    (Math.sin(t * th) / s) * b[2],
            ];
            const elev = 1 + h * Math.sin(t * Math.PI);

            return [v[0] * elev, v[1] * elev, v[2] * elev];
        }

        // ─── draw helpers ───
        function polyline(pts: P3[]) {
            if (pts.length < 2) {
                return;
            }

            gx.beginPath();
            gx.moveTo(pts[0][0], pts[0][1]);

            for (let i = 1; i < pts.length; i++) {
                gx.lineTo(pts[i][0], pts[i][1]);
            }

            gx.stroke();
        }
        function gline(pts: P3[], a: number) {
            if (pts.length < 2) {
                return;
            }

            gx.beginPath();
            gx.moveTo(pts[0][0], pts[0][1]);

            for (let i = 1; i < pts.length; i++) {
                gx.lineTo(pts[i][0], pts[i][1]);
            }

            gx.strokeStyle = `rgba(50,45,85,${a})`;
            gx.lineWidth = 0.4;
            gx.stroke();
        }
        function arcSeg(pts: P3[], st: RouteStyle) {
            if (pts.length < 2) {
                return;
            }

            gx.beginPath();
            gx.moveTo(pts[0][0], pts[0][1]);

            for (let i = 1; i < pts.length; i++) {
                gx.lineTo(pts[i][0], pts[i][1]);
            }

            gx.strokeStyle = st.g + '.09)';
            gx.lineWidth = 9;
            gx.stroke();
            gx.strokeStyle = st.g + '.12)';
            gx.lineWidth = 5;
            gx.stroke();
            gx.strokeStyle = st.c;
            gx.lineWidth = st.w;
            gx.shadowBlur = 6;
            gx.shadowColor = st.g + '.55)';
            gx.stroke();
            gx.shadowBlur = 0;
        }
        function orbitSeg(pts: [number, number][], a: number) {
            if (pts.length < 2) {
                return;
            }

            gx.beginPath();
            gx.moveTo(pts[0][0], pts[0][1]);

            for (let i = 1; i < pts.length; i++) {
                gx.lineTo(pts[i][0], pts[i][1]);
            }

            gx.strokeStyle = `rgba(201,169,110,${a})`;
            gx.lineWidth = 0.7;
            gx.stroke();
        }
        function drawOrbitRing(
            ring: (typeof ORBIT_RINGS)[0],
            R: number,
            cx: number,
            cy: number,
        ) {
            const { inc, r, a, phase } = ring;
            const incR = (inc * Math.PI) / 180;
            const SEGS = 120;
            let seg: [number, number][] = [];

            for (let i = 0; i <= SEGS; i++) {
                const lon = (i / SEGS) * Math.PI * 2 + phase,
                    x = Math.cos(lon) * r,
                    yR = Math.sin(lon) * r;
                const v = vwFix([x, yR * Math.sin(incR), yR * Math.cos(incR)]);
                const p = prRaw(v, R, cx, cy);

                if (p[2] > 0) {
                    seg.push([p[0], p[1]]);
                } else {
                    orbitSeg(seg, a);
                    seg = [];
                }
            }

            orbitSeg(seg, a);
        }

        // ─── main draw ───
        function drawBg() {
            bgX.clearRect(0, 0, W, H);
            const g = bgX.createRadialGradient(
                W / 2,
                H / 2,
                0,
                W / 2,
                H / 2,
                Math.max(W, H) * 0.65,
            );
            g.addColorStop(0, 'rgba(20,14,38,.0)');
            g.addColorStop(1, 'rgba(4,3,10,.94)');
            bgX.fillStyle = g;
            bgX.fillRect(0, 0, W, H);

            for (const s of stars) {
                s.tw += 0.007;
                bgX.beginPath();
                bgX.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                bgX.fillStyle = `rgba(215,195,155,${s.a * (0.4 + 0.6 * Math.sin(s.tw))})`;
                bgX.fill();
            }
        }

        function drawGlobe(ts: number) {
            const dt = ts - lastTs;
            lastTs = ts;
            rotAngle += 0.00025 * dt * G.s;
            const tgt = SS[curRef.current],
                k = 0.028;
            G.t = lerp(G.t, tgt.t, k);
            G.s = lerp(G.s, tgt.s, k);
            G.n = lerp(G.n, tgt.n, k);
            G.d = lerp(G.d, tgt.d, k);

            for (let i = 0; i < 5; i++) {
                G.r[i] = lerp(G.r[i], tgt.r[i], k * 0.75);

                if (G.r[i] < 0.04) {
                    arcP[i].forEach((a) => {
                        a.t = 0;
                        a.done = false;
                    });
                }
            }

            // zoom interpolation
            let targetZsc = 1,
                targetZox = W / 2,
                targetZoy = H / 2;

            if (tgt.z) {
                targetZsc = tgt.z.sc;
                const zv = toV(tgt.z.la, tgt.z.lo);
                const zr = rotX(rotY(zv, rotAngle), (G.t * Math.PI) / 2);
                const R0 = Math.min(W, H) * 0.34;
                targetZox = W / 2 + zr[0] * R0;
                targetZoy = H / 2 - zr[1] * R0;
            }

            G.zsc = lerp(G.zsc, targetZsc, 0.018);
            G.zox = lerp(G.zox, targetZox, 0.018);
            G.zoy = lerp(G.zoy, targetZoy, 0.018);

            gx.clearRect(0, 0, W, H);
            const cx = W / 2,
                cy = H / 2,
                R = Math.min(W, H) * 0.34;
            gx.globalAlpha = G.d;

            // quantum rings
            const alpha = Math.max(0, G.t - 0.4) / 0.6;

            if (alpha > 0.05) {
                for (let k2 = 0; k2 < 4; k2++) {
                    const phase = (ts * 0.0005 + k2 * 0.25) % 1;
                    gx.beginPath();
                    gx.arc(
                        cx,
                        cy,
                        R * (0.05 + phase * 0.6) * G.zsc,
                        0,
                        Math.PI * 2,
                    );
                    gx.strokeStyle = `rgba(201,169,110,${alpha * 0.15 * (1 - phase)})`;
                    gx.lineWidth = 1;
                    gx.stroke();
                }
            }

            // orbit back
            ORBIT_RINGS.forEach((ring) => {
                const { inc, r, a, phase } = ring;
                const incR = (inc * Math.PI) / 180;
                const SEGS = 120;
                let seg: [number, number][] = [];

                for (let i = 0; i <= SEGS; i++) {
                    const lon = (i / SEGS) * Math.PI * 2 + phase,
                        x = Math.cos(lon) * r,
                        yR = Math.sin(lon) * r;
                    const v = vwFix([
                        x,
                        yR * Math.sin(incR),
                        yR * Math.cos(incR),
                    ]);
                    const p = prRaw(v, R, cx, cy);

                    if (p[2] < 0) {
                        seg.push([p[0], p[1]]);
                    } else {
                        if (seg.length > 1) {
                            orbitSeg(seg, a * 0.5);
                        }

                        seg = [];
                    }
                }

                if (seg.length > 1) {
                    orbitSeg(seg, a * 0.5);
                }
            });

            // atmosphere
            const zcx = (cx - G.zox) * G.zsc + G.zox,
                zcy = (cy - G.zoy) * G.zsc + G.zoy,
                zR = R * G.zsc;

            for (const [r, c, al] of [
                [1.3, 'rgba(170,130,55,', '.08)'],
                [1.18, 'rgba(140,100,40,', '.06)'],
                [1.07, 'rgba(100,70,25,', '.05)'],
            ] as [number, string, string][]) {
                const atm = gx.createRadialGradient(
                    zcx,
                    zcy,
                    zR * 0.86,
                    zcx,
                    zcy,
                    zR * r,
                );
                atm.addColorStop(0, c + al);
                atm.addColorStop(1, 'transparent');
                gx.beginPath();
                gx.arc(zcx, zcy, zR * r, 0, Math.PI * 2);
                gx.fillStyle = atm;
                gx.fill();
            }

            // clip sphere
            gx.save();
            gx.beginPath();
            gx.arc(zcx, zcy, zR, 0, Math.PI * 2);
            gx.clip();

            // ocean
            const oc = gx.createRadialGradient(
                zcx - zR * 0.32,
                zcy - zR * 0.28,
                0,
                zcx,
                zcy,
                zR,
            );
            oc.addColorStop(0, '#14122a');
            oc.addColorStop(0.6, '#0d0b1e');
            oc.addColorStop(1, '#07060f');
            gx.fillStyle = oc;
            gx.fillRect(zcx - zR - 2, zcy - zR - 2, zR * 2 + 4, zR * 2 + 4);

            // specular
            const sp = gx.createRadialGradient(
                zcx - zR * 0.35,
                zcy - zR * 0.3,
                0,
                zcx - zR * 0.35,
                zcy - zR * 0.3,
                zR * 0.75,
            );
            sp.addColorStop(0, 'rgba(255,248,210,.06)');
            sp.addColorStop(1, 'transparent');
            gx.fillStyle = sp;
            gx.fillRect(zcx - zR - 2, zcy - zR - 2, zR * 2 + 4, zR * 2 + 4);

            // land
            gx.fillStyle = '#1d1b32';
            gx.strokeStyle = 'rgba(55,50,95,.22)';
            gx.lineWidth = 0.28;

            for (const ring of landRings) {
                let any = false;
                const pts = ring.map(([lo, la]) => {
                    const v = vw(toV(la, lo));
                    const p = pr(v, R, cx, cy);

                    if (p[2] > 0) {
                        any = true;
                    }

                    return p;
                });

                if (!any) {
                    continue;
                }

                gx.beginPath();
                let pen = false;

                for (const p of pts) {
                    if (p[2] > -0.06) {
                        if (!pen) {
                            gx.moveTo(p[0], p[1]);
                            pen = true;
                        } else {
                            gx.lineTo(p[0], p[1]);
                        }
                    } else {
                        pen = false;
                    }
                }

                gx.closePath();
                gx.fill();
                gx.stroke();
            }

            // borders
            gx.strokeStyle = 'rgba(95,85,148,.4)';
            gx.lineWidth = 0.5;

            for (const line of countryLines) {
                let seg: P3[] = [];

                for (const [lo, la] of line as [number, number][]) {
                    const v = vw(toV(la, lo));
                    const p = pr(v, R, cx, cy);

                    if (p[2] > 0) {
                        seg.push(p);
                    } else {
                        polyline(seg);
                        seg = [];
                    }
                }

                polyline(seg);
            }

            // grid
            for (let ld = -80; ld <= 80; ld += 10) {
                const la = (ld * Math.PI) / 180;
                let s: P3[] = [];

                for (let i = 0; i <= 160; i++) {
                    const lo = (i / 160) * Math.PI * 2 - Math.PI;
                    const v = vw([
                        Math.cos(la) * Math.cos(lo),
                        Math.sin(la),
                        Math.cos(la) * Math.sin(lo),
                    ]);
                    const p = pr(v, R, cx, cy);

                    if (p[2] > 0) {
                        s.push(p);
                    } else {
                        gline(s, 0.1);
                        s = [];
                    }
                }

                gline(s, 0.1);
            }

            for (let ld = -170; ld <= 180; ld += 10) {
                const lo = (ld * Math.PI) / 180;
                let s: P3[] = [];

                for (let i = 0; i <= 80; i++) {
                    const la = (i / 80) * Math.PI - Math.PI / 2;
                    const v = vw([
                        Math.cos(la) * Math.cos(lo),
                        Math.sin(la),
                        Math.cos(la) * Math.sin(lo),
                    ]);
                    const p = pr(v, R, cx, cy);

                    if (p[2] > 0) {
                        s.push(p);
                    } else {
                        gline(s, 0.1);
                        s = [];
                    }
                }

                gline(s, 0.1);
            }

            // terminator
            const lit = gx.createRadialGradient(
                zcx - zR * 0.38,
                zcy - zR * 0.3,
                0,
                zcx + zR * 0.18,
                zcy + zR * 0.28,
                zR * 1.45,
            );
            lit.addColorStop(0, 'rgba(255,245,190,.07)');
            lit.addColorStop(0.45, 'transparent');
            lit.addColorStop(1, 'rgba(0,0,20,.55)');
            gx.fillStyle = lit;
            gx.fillRect(zcx - zR - 2, zcy - zR - 2, zR * 2 + 4, zR * 2 + 4);
            gx.restore();

            // edge
            gx.beginPath();
            gx.arc(zcx, zcy, zR, 0, Math.PI * 2);
            gx.strokeStyle = 'rgba(160,130,70,.22)';
            gx.lineWidth = 1.2;
            gx.stroke();

            // orbit front
            ORBIT_RINGS.forEach((ring) => drawOrbitRing(ring, R, cx, cy));

            // particles
            for (const p of particles) {
                p.lon += p.speed;
                const x = Math.cos(p.lat) * Math.cos(p.lon) * p.r,
                    y = Math.sin(p.lat) * p.r,
                    z = Math.cos(p.lat) * Math.sin(p.lon) * p.r;
                const v = vw([x, y, z]);

                if (v[2] < 0) {
                    continue;
                }

                const s = pr(v, R, cx, cy);
                gx.beginPath();
                gx.arc(s[0], s[1], p.size, 0, Math.PI * 2);
                gx.fillStyle = `rgba(201,169,110,${p.a * (0.6 + 0.4 * Math.sin(ts * 0.002 + p.lon * 10))})`;
                gx.shadowBlur = 4;
                gx.shadowColor = 'rgba(201,169,110,.5)';
                gx.fill();
                gx.shadowBlur = 0;
            }

            // routes
            ROUTES.forEach((route, ri) => {
                const alpha = G.r[ri];

                if (alpha < 0.02) {
                    return;
                }

                const st = RS[ri];
                gx.globalAlpha = G.d * alpha;

                for (let ei = 0; ei < route.nodes.length - 1; ei++) {
                    const ap = arcP[ri][ei];

                    if (!ap.done) {
                        ap.t = Math.min(ap.t + ap.spd, 1);

                        if (ap.t >= 1) {
                            ap.done = true;
                            cityFlash[route.nodes[ei + 1]] = ts;
                        }
                    }

                    const v1 = toV(
                        CITIES[route.nodes[ei]][1],
                        CITIES[route.nodes[ei]][2],
                    );
                    const v2 = toV(
                        CITIES[route.nodes[ei + 1]][1],
                        CITIES[route.nodes[ei + 1]][2],
                    );
                    const SEGS = 100,
                        end = Math.ceil(SEGS * ap.t);
                    let seg: P3[] = [];

                    for (let i = 0; i <= end; i++) {
                        const v = vw(slE(v1, v2, i / SEGS, 0.1));
                        const p = pr(v, R, cx, cy);

                        if (p[2] > 0) {
                            seg.push(p);
                        } else {
                            arcSeg(seg, st);
                            seg = [];
                        }
                    }

                    arcSeg(seg, st);

                    if (ap.t < 1) {
                        const hv = vw(
                            slE(v1, v2, Math.floor(SEGS * ap.t) / SEGS, 0.1),
                        );
                        const hp = pr(hv, R, cx, cy);

                        if (hp[2] > 0) {
                            gx.beginPath();
                            gx.arc(hp[0], hp[1], 3, 0, Math.PI * 2);
                            gx.fillStyle = st.c;
                            gx.shadowBlur = 12;
                            gx.shadowColor = st.c;
                            gx.fill();
                            gx.shadowBlur = 0;
                        }
                    }
                }

                if (alpha > 0.8) {
                    vehicles[ri].t =
                        (vehicles[ri].t + vehicles[ri].spd * dt) % 1;
                    const totalSegs = route.nodes.length - 1,
                        segT = vehicles[ri].t * totalSegs;
                    const segIdx = Math.min(Math.floor(segT), totalSegs - 1),
                        locT = segT - segIdx;
                    const vv1 = toV(
                        CITIES[route.nodes[segIdx]][1],
                        CITIES[route.nodes[segIdx]][2],
                    );
                    const vv2 = toV(
                        CITIES[route.nodes[segIdx + 1]][1],
                        CITIES[route.nodes[segIdx + 1]][2],
                    );

                    for (let trail = 5; trail >= 0; trail--) {
                        const tt = Math.max(0, locT - trail * 0.025);
                        const tv = vw(slE(vv1, vv2, tt, 0.1));
                        const tp = pr(tv, R, cx, cy);

                        if (tp[2] > 0) {
                            const r2 = trail === 0 ? 4 : 3 - trail * 0.3,
                                a = trail === 0 ? 0.95 : 0.7 - trail * 0.1;
                            gx.beginPath();
                            gx.arc(
                                tp[0],
                                tp[1],
                                Math.max(0.5, r2),
                                0,
                                Math.PI * 2,
                            );
                            gx.fillStyle = st.g + a + ')';

                            if (trail === 0) {
                                gx.shadowBlur = 16;
                                gx.shadowColor = st.g + '.9)';
                            }

                            gx.fill();
                            gx.shadowBlur = 0;
                        }
                    }
                }

                gx.globalAlpha = 1;
            });

            // nodes
            if (G.n > 0.02) {
                gx.globalAlpha = G.d * G.n;
                CITIES.forEach((city, ci) => {
                    const v = vw(toV(city[1], city[2]));

                    if (v[2] < 0.04) {
                        return;
                    }

                    const p = pr(v, R, cx, cy);
                    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.0016 + ci * 0.85);
                    const fAge = ts - cityFlash[ci];

                    if (fAge < 1200 && cityFlash[ci] > 0) {
                        const fp = fAge / 1200;
                        gx.beginPath();
                        gx.arc(
                            p[0],
                            p[1],
                            R * 0.04 * G.zsc * (fp + 0.1),
                            0,
                            Math.PI * 2,
                        );
                        gx.strokeStyle = `rgba(232,201,138,${(1 - fp) * 0.6})`;
                        gx.lineWidth = 1.5;
                        gx.stroke();
                    }

                    gx.beginPath();
                    gx.arc(p[0], p[1], 9 * pulse, 0, Math.PI * 2);
                    gx.strokeStyle = 'rgba(201,169,110,.09)';
                    gx.lineWidth = 1;
                    gx.stroke();
                    gx.beginPath();
                    gx.arc(p[0], p[1], 2.8, 0, Math.PI * 2);
                    gx.fillStyle = '#e8c98a';
                    gx.shadowBlur = 8;
                    gx.shadowColor = 'rgba(232,201,138,.65)';
                    gx.fill();
                    gx.shadowBlur = 0;

                    if (v[2] > 0.18) {
                        gx.font = `200 ${Math.max(7, 8.5 * G.zsc)}px "DM Sans",sans-serif`;
                        gx.fillStyle = 'rgba(185,162,112,.55)';
                        gx.fillText(
                            city[0],
                            p[0] + 7 * G.zsc,
                            p[1] - 4 * G.zsc,
                        );
                    }
                });
                gx.globalAlpha = 1;
            }

            gx.globalAlpha = 1;
        }

        // ─── telemetry ───
        let eBase = -18.742,
            iterCount = 0;
        const telInterval = setInterval(() => {
            eBase += (Math.random() - 0.5) * 0.035 - 0.0015;
            iterCount = Math.min(
                iterCount + Math.floor(Math.random() * 3 + 1),
                312,
            );
            const fid = Math.min(0.999, 0.85 + (iterCount / 312) * 0.15);
            const eEl = document.getElementById('prs-telE');
            const iEl = document.getElementById('prs-telI');
            const fEl = document.getElementById('prs-telF');

            if (eEl) {
                eEl.textContent = eBase.toFixed(3);
            }

            if (iEl) {
                iEl.textContent = String(iterCount).padStart(3, '0');
            }

            if (fEl) {
                fEl.textContent = fid.toFixed(3);
            }
        }, 180);

        // ─── stat counters ───
        let statStart: number | null = null;
        const STAT_DUR = 2200;
        function animStats(ts: number) {
            if (curRef.current !== 15) {
                return;
            }

            if (!statStart) {
                return;
            }

            const p = Math.min((ts - statStart) / STAT_DUR, 1);
            const e = 1 - Math.pow(1 - p, 3);
            const qEl = document.getElementById('prs-sGap');
            const dEl = document.getElementById('prs-sFair');
            const iEl = document.getElementById('prs-sScale');

            if (qEl) {
                qEl.innerHTML = `${(0.0 * e).toFixed(1)}<sup style="font-size:.42em">%</sup>`;
            }

            if (dEl) {
                dEl.innerHTML = `${Math.round(6441 * e).toLocaleString()}`;
            }

            if (iEl) {
                iEl.textContent = String(Math.round(1000 * e).toLocaleString());
            }
        }

        // ─── energy chart ───
        function drawEnergyChart() {
            const canvas = echRef.current;

            if (!canvas) {
                return;
            }

            const W2 = Math.min(800, window.innerWidth - 120),
                H2 = 240;
            canvas.width = W2;
            canvas.height = H2;
            const ctx = canvas.getContext('2d')!;
            ctx.clearRect(0, 0, W2, H2);
            const N = 312,
                pad = 40;
            const pts: number[] = [];
            let e = -5;

            for (let i = 0; i < N; i++) {
                e +=
                    -0.065 * (e + 18.742) +
                    (Math.random() - 0.5) * 0.4 * (1 / (1 + i * 0.02));
                pts.push(e);
            }

            const minE = Math.min(...pts),
                maxE = Math.max(...pts);
            const mapX = (i: number) => pad + (i / N) * (W2 - pad * 2);
            const mapY = (v: number) =>
                H2 - pad - ((v - minE) / (maxE - minE)) * (H2 - pad * 2);
            ctx.strokeStyle = 'rgba(201,169,110,.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad, pad * 0.5);
            ctx.lineTo(pad, H2 - pad);
            ctx.lineTo(W2 - pad, H2 - pad);
            ctx.stroke();
            const gr = ctx.createLinearGradient(0, 0, 0, H2);
            gr.addColorStop(0, 'rgba(201,169,110,.18)');
            gr.addColorStop(1, 'rgba(201,169,110,.0)');
            ctx.beginPath();
            ctx.moveTo(mapX(0), mapY(pts[0]));

            for (let i = 1; i < N; i++) {
                ctx.lineTo(mapX(i), mapY(pts[i]));
            }

            ctx.lineTo(mapX(N - 1), H2 - pad);
            ctx.lineTo(mapX(0), H2 - pad);
            ctx.closePath();
            ctx.fillStyle = gr;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(mapX(0), mapY(pts[0]));

            for (let i = 1; i < N; i++) {
                ctx.lineTo(mapX(i), mapY(pts[i]));
            }

            ctx.strokeStyle = 'rgba(201,169,110,.75)';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(201,169,110,.4)';
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(mapX(N - 1), mapY(pts[N - 1]), 4, 0, Math.PI * 2);
            ctx.fillStyle = '#e8c98a';
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(232,201,138,.8)';
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.font = '200 8px "DM Sans",sans-serif';
            ctx.fillStyle = 'rgba(80,80,74,.8)';
            ctx.fillText('ITERATION', W2 / 2, H2 - 8);
            ctx.save();
            ctx.translate(12, H2 / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('ENERGY ⟨H꜀⟩', 0, 0);
            ctx.restore();
        }

        // ─── slides ───
        const N_SLIDES = SS.length;
        function goTo(i: number) {
            const prev = curRef.current;
            curRef.current = Math.max(0, Math.min(N_SLIDES - 1, i));

            if (curRef.current === prev) {
                return;
            }

            document.querySelectorAll('.prs-slide').forEach((el, idx) => {
                el.classList.toggle('prs-active', idx === curRef.current);
            });
            const ctrEl = document.getElementById('prs-ctr');
            const slblEl = document.getElementById('prs-slbl');
            const plEl = document.getElementById('prs-pl');
            const telEl = document.getElementById('prs-telemetry');
            const flashEl = document.getElementById('prs-flash');

            if (ctrEl) {
                ctrEl.textContent = `${String(curRef.current + 1).padStart(2, '0')} / ${String(N_SLIDES).padStart(2, '0')}`;
            }

            if (slblEl) {
                slblEl.textContent = SLIDE_LABELS[curRef.current] || '';
            }

            if (plEl) {
                plEl.style.width =
                    ((curRef.current + 1) / N_SLIDES) * 100 + '%';
            }

            if (telEl) {
                telEl.classList.toggle(
                    'prs-visible',
                    curRef.current >= 8 && curRef.current <= 16,
                );
            }

            if (curRef.current === 15) {
                statStart = performance.now();
                iterCount = 0;
                eBase = -18.742;
            }

            if (curRef.current === 14) {
                drawEnergyChart();
            }

            // flash
            if (flashEl) {
                flashEl.style.opacity = '1';
                setTimeout(() => {
                    if (flashEl) {
                        flashEl.style.opacity = '0';
                    }
                }, 150);
            }

            // zoom badge
            const slideEl = document.querySelectorAll('.prs-slide')[
                curRef.current
            ] as HTMLElement;
            const zk = slideEl?.dataset?.zoom;
            const zbEl = document.getElementById('prs-zoom-badge');

            if (zbEl && zk) {
                const labels: Record<string, string> = {
                    'brazil-benchmark': 'Zooming — RioClaroPostToy',
                    'cloud-proof': 'Zooming — IBM Quantum proof',
                    'topology-benchmarks': 'Zooming — topology transfer',
                };
                zbEl.textContent = labels[zk] || '';
                zbEl.style.opacity = '1';
                setTimeout(() => {
                    if (zbEl) {
                        zbEl.style.opacity = '0';
                    }
                }, 2200);
            }

            try {
                localStorage.setItem('vrp-slide', String(curRef.current));
            } catch (_) {}
        }
        goToRef.current = goTo;

        // keyboard
        function onKey(e: KeyboardEvent) {
            if (
                /INPUT|TEXTAREA/.test((e.target as HTMLElement)?.tagName || '')
            ) {
                return;
            }

            if (
                e.key === 'ArrowRight' ||
                e.key === ' ' ||
                e.key === 'PageDown'
            ) {
                goTo(curRef.current + 1);
            }

            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                goTo(curRef.current - 1);
            }

            if (e.key === 'Home') {
                goTo(0);
            }

            if (e.key === 'End') {
                goTo(N_SLIDES - 1);
            }
        }
        window.addEventListener('keydown', onKey);

        // restore saved slide
        const saved = +(localStorage.getItem('vrp-slide') || 0);
        goTo(Math.min(saved, N_SLIDES - 1));

        // ─── loop ───
        function loop(ts: number) {
            drawBg();
            drawGlobe(ts);
            animStats(ts);
            rafRef.current = requestAnimationFrame(loop);
        }
        rafRef.current = requestAnimationFrame(loop);

        // ─── circuit ───
        (function buildCircuit() {
            const NQUBITS = 6,
                CTRL_ROWS = [0, 2, 4];
            const LAYER_LABELS = [
                { l: 'Init', span: 3 },
                { l: 'Cost  γ₁', span: 4 },
                { l: 'Mix  β₁', span: 2 },
                { l: 'Cost  γ₂', span: 4 },
                { l: 'Mix  β₂', span: 2 },
                { l: 'Measure', span: 1 },
            ];
            const GATE_SEQ = [
                'wseg',
                'gH',
                'wseg',
                'gRz',
                'wseg',
                'ctrl',
                'wseg',
                'gRx',
                'wseg',
                'gRz',
                'wseg',
                'ctrl',
                'wseg',
                'gRx',
                'wseg',
                'gM',
            ];
            const container = document.getElementById('prs-qcDiagram');

            if (!container) {
                return;
            }

            const bar = document.createElement('div');
            bar.className = 'prs-layer-bar';
            LAYER_LABELS.forEach(({ l, span }) => {
                const d = document.createElement('div');
                d.className = 'prs-layer-lbl';
                d.style.flex = String(span);
                d.textContent = l;
                bar.appendChild(d);
            });
            container.appendChild(bar);

            for (let q = 0; q < NQUBITS; q++) {
                const row = document.createElement('div');
                row.className = 'prs-qrow';
                const lbl = document.createElement('div');
                lbl.className = 'prs-qlbl';
                lbl.textContent = `|q${q}⟩`;
                row.appendChild(lbl);
                const wire = document.createElement('div');
                wire.className = 'prs-qwire';
                GATE_SEQ.forEach((g) => {
                    const el = document.createElement('div');

                    if (g === 'wseg') {
                        el.className = 'prs-wseg';
                    } else if (g === 'gH') {
                        el.className = 'prs-g prs-gH';
                        el.textContent = 'H';
                    } else if (g === 'gRz') {
                        el.className = 'prs-g prs-gRz';
                        el.textContent = 'Rz(γ)';
                    } else if (g === 'gRx') {
                        el.className = 'prs-g prs-gRx';
                        el.textContent = 'Rx(β)';
                    } else if (g === 'gM') {
                        el.className = 'prs-g prs-gM';
                        el.innerHTML = '⊙';
                    } else if (g === 'ctrl') {
                        el.className = CTRL_ROWS.includes(q)
                            ? 'prs-ctrl'
                            : 'prs-tgt2';

                        if (!CTRL_ROWS.includes(q)) {
                            el.textContent = '⊕';
                        }
                    }

                    wire.appendChild(el);
                });
                wire.appendChild(
                    Object.assign(document.createElement('div'), {
                        className: 'prs-pulse',
                    }),
                );
                row.appendChild(wire);
                container.appendChild(row);
            }

            setTimeout(() => {
                if (!container) {
                    return;
                }

                const rows = [...container.querySelectorAll('.prs-qrow')];
                rows.forEach((row, ri) => {
                    if (!CTRL_ROWS.includes(ri)) {
                        return;
                    }

                    row.querySelectorAll('.prs-ctrl').forEach((el) => {
                        const r1 = el.getBoundingClientRect();
                        const r2 = (rows[ri + 1] as HTMLElement)
                            ?.querySelector('.prs-tgt2')
                            ?.getBoundingClientRect();

                        if (!r2) {
                            return;
                        }

                        const cr = container.getBoundingClientRect();
                        const vert = Object.assign(
                            document.createElement('div'),
                            { className: 'prs-vert' },
                        );
                        vert.style.left =
                            r1.left + r1.width / 2 - cr.left + 'px';
                        vert.style.top = r1.bottom - cr.top + 'px';
                        vert.style.height = r2.top - r1.bottom + 'px';
                        container.style.position = 'relative';
                        container.appendChild(vert);
                    });
                });
            }, 500);
        })();

        return () => {
            cancelAnimationFrame(rafRef.current);
            clearInterval(telInterval);
            window.removeEventListener('resize', resize);
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    const goTo = useCallback((i: number) => goToRef.current(i), []);

    const N_SLIDES = SS.length;

    return (
        <>
            <Head title="Presentation · Quantum VRP">
                <link
                    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@200;300;400&family=Space+Mono:wght@400&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                /* ── reset for presentation ── */
                #prs-root *, #prs-root *::before, #prs-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
                #prs-root { --gold:#facc15; --gold2:#fde68a; --cyan:#7dd3fc; --rose:#f472b6; --mint:#34d399; --violet:#a78bfa; --iv:#f2f5ef; --dim:#8b8a7f; --bg:#05060d; position:fixed; inset:0; background:#05060d; overflow:hidden; z-index:9999; }
                #prs-root canvas { position:fixed; inset:0; }
                #prs-bg { z-index:0; } #prs-globe { z-index:1; }

                /* slides */
                #prs-deck { position:fixed; inset:0; z-index:10; pointer-events:none; }
                .prs-slide { position:absolute; inset:0; display:flex; opacity:0; pointer-events:none; transition:opacity 1.1s ease; }
                .prs-slide.prs-active { opacity:1; pointer-events:auto; }
                .prs-txt { display:flex; flex-direction:column; justify-content:center; padding:clamp(40px,5vh,80px) clamp(48px,5vw,88px); transform:translateY(18px) scale(.99); transition:transform 1.2s cubic-bezier(.16,1,.3,1); }
                .prs-slide.prs-active .prs-txt { transform:none; }
                .prs-ey { font-family:'DM Sans',sans-serif; font-weight:200; font-size:10px; letter-spacing:.42em; text-transform:uppercase; color:#50504a; margin-bottom:18px; }
                .prs-hd { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:64px; line-height:.93; color:#f2f5ef; letter-spacing:0; }
                .prs-hd em { font-style:italic; color:#facc15; }
                .prs-hr { width:36px; height:1px; background:linear-gradient(90deg,var(--cyan),var(--rose),var(--gold)); margin:24px 0; opacity:.55; }
                .prs-bd { font-family:'DM Sans',sans-serif; font-weight:200; font-size:16px; line-height:1.8; color:#aaa69a; max-width:420px; }
                .prs-tg { display:flex; align-items:center; gap:9px; margin-top:22px; }
                .prs-tgd { width:5px; height:5px; border-radius:50%; background:#c9a96e; opacity:.55; flex-shrink:0; }
                .prs-tgt { font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.28em; text-transform:uppercase; color:#50504a; }
                .prs-nbig { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:38px; color:#facc15; margin-top:22px; letter-spacing:0; }

                /* layouts */
                .prs-lc { align-items:center; justify-content:center; }
                .prs-lr { align-items:center; justify-content:flex-end; }
                .prs-ll { align-items:center; justify-content:flex-start; }
                .prs-lb { align-items:flex-end; justify-content:center; }
                .prs-lc .prs-txt, .prs-lb .prs-txt { align-items:center; text-align:center; }
                .prs-lc .prs-bd, .prs-lb .prs-bd { text-align:center; margin:0 auto; }
                .prs-lc .prs-hr, .prs-lb .prs-hr { margin-left:auto; margin-right:auto; }
                .prs-lc .prs-tg, .prs-lb .prs-tg { justify-content:center; }
                .prs-glass { background:linear-gradient(145deg,rgba(5,6,13,.76),rgba(12,19,28,.58)); border:1px solid rgba(125,211,252,.13); backdrop-filter:blur(22px); padding:52px 68px!important; max-width:620px; }

                /* stat grid */
                .prs-sgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:0 56px; }
                .prs-sv { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:78px; line-height:.9; color:#fde68a; text-shadow:0 0 50px rgba(125,211,252,.18); letter-spacing:0; }
                .prs-sl { font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.3em; text-transform:uppercase; color:#50504a; margin-top:8px; }

                /* report-native visuals */
                .prs-kicker-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:26px; max-width:620px; }
                .prs-pill { border:1px solid rgba(125,211,252,.18); color:rgba(242,245,239,.72); background:rgba(125,211,252,.05); padding:8px 11px; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.06em; text-transform:uppercase; }
                .prs-pill:nth-child(2n) { border-color:rgba(244,114,182,.18); background:rgba(244,114,182,.05); }
                .prs-pill:nth-child(3n) { border-color:rgba(52,211,153,.18); background:rgba(52,211,153,.05); }
                .prs-equation { margin-top:24px; padding:20px 24px; border-left:2px solid var(--cyan); background:rgba(125,211,252,.045); color:#e8fbff; font-family:'Space Mono',monospace; font-size:18px; line-height:1.7; max-width:620px; box-shadow:0 0 42px rgba(125,211,252,.05) inset; }
                .prs-equation small { display:block; margin-top:8px; color:#8b8a7f; font-family:'DM Sans',sans-serif; font-size:11px; letter-spacing:.12em; text-transform:uppercase; }
                .prs-matrix { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:28px; max-width:620px; }
                .prs-mcell { border:1px solid rgba(242,245,239,.08); background:rgba(242,245,239,.035); padding:16px; min-height:98px; }
                .prs-mcell b { display:block; color:#f2f5ef; font-family:'DM Sans',sans-serif; font-weight:300; font-size:12px; letter-spacing:.18em; text-transform:uppercase; margin-bottom:8px; }
                .prs-mcell span { display:block; color:#99968b; font-family:'DM Sans',sans-serif; font-size:13px; line-height:1.55; }
                .prs-pipeline { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; width:min(980px,82vw); margin-top:34px; }
                .prs-step { min-height:150px; border:1px solid rgba(125,211,252,.13); background:linear-gradient(180deg,rgba(125,211,252,.06),rgba(5,6,13,.2)); padding:16px; position:relative; overflow:hidden; }
                .prs-step::before { content:''; position:absolute; inset:0 0 auto 0; height:2px; background:linear-gradient(90deg,var(--cyan),var(--rose),var(--mint)); opacity:.55; }
                .prs-step-num { font-family:'Space Mono',monospace; color:#facc15; font-size:12px; margin-bottom:18px; }
                .prs-step-title { font-family:'DM Sans',sans-serif; font-weight:300; color:#f2f5ef; font-size:12px; letter-spacing:.15em; text-transform:uppercase; margin-bottom:8px; }
                .prs-step-copy { font-family:'DM Sans',sans-serif; color:#9d998e; font-size:12px; line-height:1.55; }
                .prs-bench { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:30px; width:min(980px,82vw); }
                .prs-bench-card { border:1px solid rgba(242,245,239,.08); background:rgba(5,6,13,.58); padding:18px; min-height:128px; backdrop-filter:blur(14px); }
                .prs-bench-value { color:#fde68a; font-family:'Cormorant Garamond',serif; font-size:38px; line-height:.9; margin-bottom:12px; }
                .prs-bench-label { color:#f2f5ef; font-family:'DM Sans',sans-serif; font-size:11px; letter-spacing:.18em; text-transform:uppercase; margin-bottom:8px; }
                .prs-bench-copy { color:#918d84; font-family:'DM Sans',sans-serif; font-size:12px; line-height:1.5; }
                .prs-system { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-top:30px; max-width:740px; }
                .prs-system-card { border:1px solid rgba(125,211,252,.12); background:rgba(5,6,13,.65); padding:20px; min-height:150px; }
                .prs-system-card:nth-child(2) { border-color:rgba(52,211,153,.14); }
                .prs-system-card:nth-child(3) { border-color:rgba(244,114,182,.14); }
                .prs-system-top { color:#facc15; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; margin-bottom:16px; }
                .prs-system-title { color:#f2f5ef; font-family:'Cormorant Garamond',serif; font-size:30px; margin-bottom:8px; }
                .prs-system-copy { color:#9d998e; font-family:'DM Sans',sans-serif; font-size:12px; line-height:1.55; }
                .prs-warning { margin-top:22px; border:1px solid rgba(244,114,182,.18); background:rgba(244,114,182,.05); color:#f7c7df; font-family:'DM Sans',sans-serif; font-size:13px; line-height:1.6; padding:16px 18px; max-width:560px; }
                @media (max-width: 800px) {
                    .prs-hd { font-size:42px; }
                    .prs-bd { font-size:14px; }
                    .prs-txt { padding:34px 28px; }
                    .prs-glass { padding:34px 30px!important; }
                    .prs-sgrid, .prs-matrix, .prs-bench, .prs-system, .prs-pipeline { grid-template-columns:1fr; width:auto; max-width:86vw; gap:8px; }
                    .prs-step, .prs-bench-card, .prs-system-card { min-height:auto; }
                    .prs-sv { font-size:48px; }
                }

                /* circuit */
                .prs-circuit-wrap { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:44px 60px; gap:28px; transform:translateY(18px); transition:transform 1.2s cubic-bezier(.16,1,.3,1); }
                .prs-slide.prs-active .prs-circuit-wrap { transform:none; }
                .prs-qc { width:100%; max-width:920px; display:flex; flex-direction:column; gap:0; position:relative; }
                .prs-layer-bar { display:flex; padding-left:56px; margin-bottom:6px; gap:0; }
                .prs-layer-lbl { font-family:'DM Sans',sans-serif; font-weight:200; font-size:8px; letter-spacing:.2em; text-transform:uppercase; color:rgba(201,169,110,.35); text-align:center; border-left:1px solid rgba(201,169,110,.1); padding:0 8px; }
                .prs-qrow { display:flex; align-items:center; height:44px; position:relative; }
                .prs-qlbl { font-family:'Space Mono',monospace; font-size:11px; color:rgba(201,169,110,.65); width:52px; flex-shrink:0; text-align:right; padding-right:8px; }
                .prs-qwire { flex:1; height:1px; background:rgba(201,169,110,.2); position:relative; display:flex; align-items:center; }
                .prs-g { flex-shrink:0; height:22px; border:1px solid; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-weight:300; font-size:8.5px; letter-spacing:.04em; background:rgba(7,6,13,.9); position:relative; z-index:2; }
                .prs-gH { width:26px; border-color:rgba(201,169,110,.7); color:#c9a96e; box-shadow:0 0 8px rgba(201,169,110,.15); }
                .prs-gRz { width:34px; border-color:rgba(180,140,80,.45); color:#b08858; }
                .prs-gRx { width:34px; border-color:rgba(160,120,60,.45); color:#9a7848; }
                .prs-gM { width:26px; border-color:rgba(201,169,110,.25); color:rgba(201,169,110,.45); }
                .prs-wseg { flex:1; height:1px; background:rgba(201,169,110,.18); }
                .prs-ctrl { width:10px; height:10px; border-radius:50%; background:rgba(201,169,110,.7); flex-shrink:0; z-index:2; box-shadow:0 0 6px rgba(201,169,110,.4); }
                .prs-tgt2 { width:16px; height:16px; border-radius:50%; border:1px solid rgba(201,169,110,.55); display:flex; align-items:center; justify-content:center; font-size:11px; color:rgba(201,169,110,.55); flex-shrink:0; z-index:2; background:rgba(7,6,13,.9); }
                .prs-vert { position:absolute; width:1px; background:rgba(201,169,110,.3); z-index:1; pointer-events:none; }
                @keyframes prs-cpulse { 0%{left:0;opacity:0;width:40px} 8%{opacity:1} 85%{opacity:1} 100%{left:100%;opacity:0;width:80px} }
                .prs-pulse { position:absolute; top:0; height:1px; background:linear-gradient(90deg,transparent,rgba(232,201,138,.95),rgba(201,169,110,.6),transparent); pointer-events:none; animation:prs-cpulse 5s ease-in-out infinite; }
                .prs-qrow:nth-child(2) .prs-pulse{animation-delay:-.5s}
                .prs-qrow:nth-child(3) .prs-pulse{animation-delay:-1s}
                .prs-qrow:nth-child(4) .prs-pulse{animation-delay:-1.5s}
                .prs-qrow:nth-child(5) .prs-pulse{animation-delay:-2s}
                .prs-qrow:nth-child(6) .prs-pulse{animation-delay:-2.5s}
                .prs-circuit-foot { font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.3em; text-transform:uppercase; color:#50504a; text-align:center; }

                /* energy chart wrap */
                .prs-echart-wrap { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:44px 60px; gap:20px; transform:translateY(18px); transition:transform 1.2s cubic-bezier(.16,1,.3,1); }
                .prs-slide.prs-active .prs-echart-wrap { transform:none; }

                /* app panel */
                .prs-app-panel { width:100%; height:100%; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; padding:clamp(40px,5vh,80px) clamp(48px,5vw,88px); transform:translateY(18px); transition:transform 1.2s cubic-bezier(.16,1,.3,1); }
                .prs-slide.prs-active .prs-app-panel { transform:none; }
                .prs-app-mockup { margin-top:28px; display:flex; gap:14px; flex-wrap:wrap; max-width:500px; }
                .prs-app-card { background:rgba(7,6,13,.7); border:1px solid rgba(201,169,110,.08); backdrop-filter:blur(16px); padding:18px 22px; flex:1; min-width:130px; }
                .prs-app-card-label { font-family:'DM Sans',sans-serif; font-weight:200; font-size:8px; letter-spacing:.3em; text-transform:uppercase; color:#50504a; margin-bottom:8px; }
                .prs-app-card-val { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:clamp(22px,2.4vw,36px); color:#e8c98a; }
                .prs-app-stack { display:flex; flex-direction:column; gap:7px; margin-top:28px; }
                .prs-app-stack-row { display:flex; align-items:center; gap:12px; }
                .prs-app-stack-dot { width:4px; height:4px; border-radius:50%; background:#c9a96e; opacity:.5; flex-shrink:0; }
                .prs-app-stack-text { font-family:'DM Sans',sans-serif; font-weight:200; font-size:11px; letter-spacing:.15em; color:#696560; }

                /* nav */
                #prs-nav { position:fixed; bottom:28px; left:50%; transform:translateX(-50%); z-index:50; display:flex; align-items:center; gap:20px; }
                .prs-nb { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:22px; background:none; border:none; cursor:pointer; color:rgba(201,169,110,.28); padding:6px 10px; transition:color .3s; line-height:1; }
                .prs-nb:hover { color:#c9a96e; }
                #prs-ctr { font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.35em; color:#50504a; min-width:55px; text-align:center; }
                #prs-pl { position:fixed; bottom:0; left:0; height:1px; background:rgba(201,169,110,.22); transition:width .7s cubic-bezier(.4,0,.2,1); }
                #prs-wm { position:fixed; top:36px; left:54px; z-index:20; pointer-events:none; font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.4em; text-transform:uppercase; color:#50504a; }
                #prs-slbl { position:fixed; top:36px; right:54px; z-index:20; pointer-events:none; font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.35em; text-transform:uppercase; color:#50504a; }
                #prs-telemetry { position:fixed; bottom:70px; right:54px; z-index:20; pointer-events:none; text-align:right; opacity:0; transition:opacity .8s; }
                #prs-telemetry.prs-visible { opacity:1; }
                .prs-tel-row { font-family:'Space Mono',monospace; font-size:9px; color:rgba(201,169,110,.4); letter-spacing:.08em; margin-bottom:3px; }
                .prs-tel-val { color:rgba(201,169,110,.7); }
                #prs-flash { position:fixed; inset:0; z-index:100; background:rgba(201,169,110,.04); opacity:0; pointer-events:none; transition:opacity .15s ease; }
                #prs-zoom-badge { position:fixed; top:36px; left:50%; transform:translateX(-50%); z-index:30; font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.4em; text-transform:uppercase; color:#50504a; pointer-events:none; opacity:0; transition:opacity .8s; }
                /* esc button */
                #prs-esc { position:fixed; top:28px; left:28px; z-index:200; font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.3em; text-transform:uppercase; color:rgba(80,80,74,.5); background:none; border:none; cursor:pointer; padding:4px 8px; transition:color .3s; }
                #prs-esc:hover { color:#c9a96e; }
            `}</style>

            <div id="prs-root">
                <canvas ref={bgRef} id="prs-bg" />
                <canvas ref={gcRef} id="prs-globe" />
                <div id="prs-wm">
                    VRPFR &ensp;·&ensp; Quantum Optimization &ensp;·&ensp; 2026
                </div>
                <div id="prs-slbl"></div>
                <div id="prs-pl" style={{ width: 0 }}></div>
                <div id="prs-flash"></div>
                <div id="prs-zoom-badge"></div>

                <div id="prs-telemetry">
                    <div className="prs-tel-row">
                        ENERGY &ensp;
                        <span className="prs-tel-val" id="prs-telE">
                            −18.742
                        </span>
                    </div>
                    <div className="prs-tel-row">
                        ITERATION &ensp;
                        <span className="prs-tel-val" id="prs-telI">
                            000
                        </span>
                    </div>
                    <div className="prs-tel-row">
                        FIDELITY &ensp;
                        <span className="prs-tel-val" id="prs-telF">
                            0.000
                        </span>
                    </div>
                </div>

                <div id="prs-deck">
                    {/* 01 */}
                    <section className="prs-slide prs-lc" data-label="01 Title">
                        <div className="prs-txt prs-glass">
                            <div className="prs-ey">
                                Senior Design Project · Spring 2026
                            </div>
                            <div className="prs-hd">
                                Optimal delivery routes
                                <br />
                                using <em>quantum</em>
                                <br />
                                optimization.
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                Design and Implementation of Optimal Delivery
                                Routes Using Quantum Optimization Algorithms.
                            </div>
                            <div className="prs-kicker-row">
                                <div className="prs-pill">Leen Almousa</div>
                                <div className="prs-pill">
                                    Abdulrahman Al-Essa
                                </div>
                                <div className="prs-pill">Malak Alshawish</div>
                                <div className="prs-pill">
                                    Supervisor: Prof. Awos Kanan
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 02 */}
                    <section
                        className="prs-slide prs-lr"
                        data-label="02 Logistics Pain"
                    >
                        <div className="prs-txt" style={{ maxWidth: 560 }}>
                            <div className="prs-ey">The Logistics Monster</div>
                            <div className="prs-hd">
                                Every extra stop
                                <br />
                                opens a <em>new universe.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                VRP is the engine underneath delivery fleets:
                                assign customers to vehicles, order the stops,
                                return to depot, and keep drivers from
                                inheriting wildly uneven routes.
                            </div>
                            <div className="prs-kicker-row">
                                <div className="prs-pill">Distance</div>
                                <div className="prs-pill">Fairness</div>
                                <div className="prs-pill">Dispatch</div>
                                <div className="prs-pill">Telemetry</div>
                            </div>
                        </div>
                    </section>

                    {/* 03 */}
                    <section
                        className="prs-slide prs-ll"
                        data-label="03 Explosion"
                    >
                        <div className="prs-txt" style={{ maxWidth: 620 }}>
                            <div className="prs-ey">NP-Hard, With Teeth</div>
                            <div className="prs-hd">
                                <em>10¹⁶⁵</em>
                                <br />
                                possible worlds.
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                For 100 customers and 10 vehicles, the report
                                estimates customer assignment and per-vehicle
                                ordering at roughly 10¹⁶⁵ combinations.
                                Exhaustive search is not a strategy; it is a
                                bonfire.
                            </div>
                            <div className="prs-equation">
                                kⁿ × ∏(nᵢ!)
                                <small>
                                    assignment explosion × route ordering
                                    explosion
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* 04 */}
                    <section
                        className="prs-slide prs-lr"
                        data-label="04 Objective"
                    >
                        <div className="prs-txt" style={{ maxWidth: 640 }}>
                            <div className="prs-ey">The Project's Twist</div>
                            <div className="prs-hd">
                                Shortest route is not
                                <br />
                                the same as <em>best fleet.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                The document treats fairness as operational
                                reality: a route plan that saves distance by
                                overloading one driver is mathematically neat
                                and logistically broken.
                            </div>
                            <div className="prs-equation">
                                Score = 0.5 · D/k + 0.5 · σ
                                <small>
                                    average distance per vehicle plus workload
                                    standard deviation
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* 05 */}
                    <section
                        className="prs-slide prs-lc"
                        data-label="05 Quantum Primer"
                    >
                        <div className="prs-txt prs-glass">
                            <div className="prs-ey">Quantum Ingredients</div>
                            <div className="prs-hd">
                                Superposition.
                                <br />
                                <em>Entanglement.</em>
                                <br />
                                Interference.
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                Qubits explore probability amplitudes, entangle
                                route decisions, and use interference to amplify
                                better outcomes while measurement collapses the
                                circuit into a candidate bitstring.
                            </div>
                            <div className="prs-matrix">
                                <div className="prs-mcell">
                                    <b>Superposition</b>
                                    <span>
                                        All candidate states are represented
                                        before measurement.
                                    </span>
                                </div>
                                <div className="prs-mcell">
                                    <b>Entanglement</b>
                                    <span>
                                        Route constraints become linked
                                        decisions across qubits.
                                    </span>
                                </div>
                                <div className="prs-mcell">
                                    <b>Interference</b>
                                    <span>
                                        Good states get amplified; bad states
                                        are suppressed.
                                    </span>
                                </div>
                                <div className="prs-mcell">
                                    <b>NISQ Reality</b>
                                    <span>
                                        Noise and decoherence limit the depth of
                                        useful circuits.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 06 */}
                    <section
                        className="prs-slide prs-ll"
                        data-label="06 QUBO Map"
                    >
                        <div className="prs-txt" style={{ maxWidth: 680 }}>
                            <div className="prs-ey">Encoding The Problem</div>
                            <div className="prs-hd">
                                Routes become
                                <br />
                                <em>energy.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                Each leaf subproblem is translated into QUBO
                                form, then mapped to an Ising Hamiltonian. The
                                lowest-energy state corresponds to the best
                                feasible route decoded from the bitstring.
                            </div>
                            <div className="prs-equation">
                                f(x) = xᵀQx + cᵀx
                                <br />x = (1 - Z) / 2
                                <small>
                                    binary routing variables to Pauli-Z
                                    operators
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* 07 */}
                    <section
                        className="prs-slide prs-lc"
                        data-label="07 QAOA Engine"
                    >
                        <div className="prs-txt prs-glass">
                            <div className="prs-ey">
                                Hybrid Quantum-Classical Loop
                            </div>
                            <div className="prs-hd">
                                QAOA is the
                                <br />
                                <em>leaf engine.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                The selected solver uses QAOA with cost and
                                mixer layers. A classical optimizer tunes γ and
                                β, then the circuit is sampled and decoded into
                                feasible routes.
                            </div>
                            <div className="prs-kicker-row">
                                <div className="prs-pill">p = 2</div>
                                <div className="prs-pill">COBYLA</div>
                                <div className="prs-pill">maxiter = 50</div>
                                <div className="prs-pill">3 restarts</div>
                                <div className="prs-pill">penalty = 2N</div>
                            </div>
                        </div>
                    </section>

                    {/* 08 */}
                    <section
                        className="prs-slide prs-lr"
                        data-label="08 Design Choices"
                    >
                        <div className="prs-txt" style={{ maxWidth: 660 }}>
                            <div className="prs-ey">Chosen Stack</div>
                            <div className="prs-hd">
                                Every constraint
                                <br />
                                gets a <em>home.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-matrix">
                                <div className="prs-mcell">
                                    <b>Framework</b>
                                    <span>
                                        Qiskit for QUBO conversion, QAOA ansatz,
                                        Aer simulation, IBM runtime access.
                                    </span>
                                </div>
                                <div className="prs-mcell">
                                    <b>QUBO</b>
                                    <span>
                                        Position-indexed for k=1 leaves;
                                        edge-based plus filtering for k&gt;1
                                        leaves.
                                    </span>
                                </div>
                                <div className="prs-mcell">
                                    <b>Solver</b>
                                    <span>
                                        Qiskit Aer statevector for reliable
                                        expectation values under local memory
                                        limits.
                                    </span>
                                </div>
                                <div className="prs-mcell">
                                    <b>Product</b>
                                    <span>
                                        Laravel backend, React/Inertia
                                        dashboard, Flutter driver edge app.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 09 Circuit */}
                    <section
                        className="prs-slide"
                        data-label="09 Circuit Reactor"
                    >
                        <div className="prs-circuit-wrap">
                            <div style={{ textAlign: 'center' }}>
                                <div
                                    className="prs-ey"
                                    style={{ textAlign: 'center' }}
                                >
                                    QAOA Layer Structure
                                </div>
                                <div
                                    className="prs-hd"
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '52px',
                                    }}
                                >
                                    The <em>circuit reactor</em>
                                </div>
                            </div>
                            <div className="prs-qc" id="prs-qcDiagram" />
                            <div className="prs-circuit-foot">
                                Representative wires · cost rotations γ · mixer
                                rotations β · measurement to candidate
                                bitstrings
                            </div>
                        </div>
                    </section>

                    {/* 10 */}
                    <section
                        className="prs-slide prs-lc"
                        data-label="10 Recursive Pipeline"
                    >
                        <div
                            className="prs-txt"
                            style={{
                                alignItems: 'center',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                className="prs-ey"
                                style={{ textAlign: 'center' }}
                            >
                                Divide, Solve, Merge
                            </div>
                            <div
                                className="prs-hd"
                                style={{ textAlign: 'center' }}
                            >
                                A classical shell around
                                <br />
                                <em>quantum sparks.</em>
                            </div>
                            <div className="prs-pipeline">
                                <div className="prs-step">
                                    <div className="prs-step-num">01</div>
                                    <div className="prs-step-title">
                                        Load Matrix
                                    </div>
                                    <div className="prs-step-copy">
                                        Brazil benchmark coordinates and
                                        distances enter the solver.
                                    </div>
                                </div>
                                <div className="prs-step">
                                    <div className="prs-step-num">02</div>
                                    <div className="prs-step-title">
                                        Cluster
                                    </div>
                                    <div className="prs-step-copy">
                                        Angular-sweep k-means partitions nodes
                                        with √n recursion.
                                    </div>
                                </div>
                                <div className="prs-step">
                                    <div className="prs-step-num">03</div>
                                    <div className="prs-step-title">
                                        Leaf QAOA
                                    </div>
                                    <div className="prs-step-copy">
                                        Subproblems are capped so quantum solves
                                        stay within qubit limits.
                                    </div>
                                </div>
                                <div className="prs-step">
                                    <div className="prs-step-num">04</div>
                                    <div className="prs-step-title">
                                        Supernodes
                                    </div>
                                    <div className="prs-step-copy">
                                        Cluster centroids are routed at the
                                        macro level.
                                    </div>
                                </div>
                                <div className="prs-step">
                                    <div className="prs-step-num">05</div>
                                    <div className="prs-step-title">
                                        Dispatch
                                    </div>
                                    <div className="prs-step-copy">
                                        2-opt refinement feeds the dashboard and
                                        driver app.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 11 */}
                    <section
                        className="prs-slide prs-lr"
                        data-label="11 Brazil Benchmark"
                        data-zoom="brazil-benchmark"
                    >
                        <div className="prs-txt" style={{ maxWidth: 560 }}>
                            <div className="prs-ey">RioClaroPostToy</div>
                            <div className="prs-hd">
                                Real streets,
                                <br />
                                <em>not toy stars.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                The benchmark is built from Brazilian postal
                                delivery geometry: non-uniform delivery
                                probabilities, street-side penalties, and route
                                limits equivalent to a six-hour working day.
                            </div>
                            <div className="prs-bench">
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">50</div>
                                    <div className="prs-bench-label">Nodes</div>
                                    <div className="prs-bench-copy">
                                        baseline with 15 vehicles
                                    </div>
                                </div>
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">100</div>
                                    <div className="prs-bench-label">Nodes</div>
                                    <div className="prs-bench-copy">
                                        10-run averaged stress test
                                    </div>
                                </div>
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">200</div>
                                    <div className="prs-bench-label">Nodes</div>
                                    <div className="prs-bench-copy">
                                        expanded fleet pressure
                                    </div>
                                </div>
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">1000</div>
                                    <div className="prs-bench-label">Nodes</div>
                                    <div className="prs-bench-copy">
                                        macro-scale decomposition
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 12 */}
                    <section
                        className="prs-slide prs-ll"
                        data-label="12 Leaf Solver"
                        data-zoom="cloud-proof"
                    >
                        <div className="prs-txt" style={{ maxWidth: 590 }}>
                            <div className="prs-ey">
                                Near-Term Quantum Limits
                            </div>
                            <div className="prs-hd">
                                The leaf size is
                                <br />
                                <em>physics-shaped.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                Statevector memory grows as 2^qubits × 16 bytes.
                                The report keeps leaf subproblems tiny so Aer
                                remains reliable and IBM hardware runs stay
                                meaningful instead of theatrical noise.
                            </div>
                            <div className="prs-warning">
                                For a 5-node p=2 QAOA circuit on IBM Marrakesh,
                                704 two-qubit gates at a 0.0037 error rate imply
                                roughly 7.3% success before readout error. That
                                is why decomposition matters.
                            </div>
                        </div>
                    </section>

                    {/* 13 */}
                    <section
                        className="prs-slide prs-lr"
                        data-label="13 Warm Start"
                        data-zoom="topology-benchmarks"
                    >
                        <div className="prs-txt" style={{ maxWidth: 620 }}>
                            <div className="prs-ey">Parameter Transfer</div>
                            <div className="prs-hd">
                                Reuse the angles.
                                <br />
                                <em>Save the run.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                Warm-start experiments test whether optimized
                                QAOA parameters can transfer across similar
                                sub-instances. At 25 qubits, direct transfer
                                improved several cold-start failures with
                                effectively zero extra optimization cost.
                            </div>
                            <div className="prs-equation">
                                θ = (γ₁, β₁, γ₂, β₂)
                                <small>
                                    source angles become the target's launchpad
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* 14 */}
                    <section
                        className="prs-slide prs-ll"
                        data-label="14 System Topology"
                    >
                        <div className="prs-app-panel">
                            <div className="prs-ey">
                                From Algorithm To Asphalt
                            </div>
                            <div className="prs-hd">
                                VRPFR.
                                <br />
                                <em>End-to-end.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd" style={{ maxWidth: 520 }}>
                                The report is not just math. It ships the solver
                                into a Laravel orchestration layer, React
                                dispatcher dashboard, and Flutter driver app
                                with assignment lifecycle, GPS telemetry, and
                                proof-of-delivery state.
                            </div>
                            <div className="prs-system">
                                <div className="prs-system-card">
                                    <div className="prs-system-top">
                                        01 Backend
                                    </div>
                                    <div className="prs-system-title">
                                        Laravel
                                    </div>
                                    <div className="prs-system-copy">
                                        Queues long quantum jobs, stores
                                        optimization histories, protects access
                                        with Sanctum, RBAC, and WebAuthn.
                                    </div>
                                </div>
                                <div className="prs-system-card">
                                    <div className="prs-system-top">
                                        02 Command
                                    </div>
                                    <div className="prs-system-title">
                                        React
                                    </div>
                                    <div className="prs-system-copy">
                                        Inertia dashboard renders routes, fleet
                                        status, telemetry, and dispatcher
                                        controls without redundant API ceremony.
                                    </div>
                                </div>
                                <div className="prs-system-card">
                                    <div className="prs-system-top">
                                        03 Edge
                                    </div>
                                    <div className="prs-system-title">
                                        Flutter
                                    </div>
                                    <div className="prs-system-copy">
                                        Driver app receives scoped assignments,
                                        tracks GPS, and uploads delivery proof
                                        with stop-level lifecycle state.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 15 energy chart */}
                    <section className="prs-slide" data-label="15 Validation">
                        <div className="prs-echart-wrap">
                            <div style={{ textAlign: 'center' }}>
                                <div
                                    className="prs-ey"
                                    style={{ textAlign: 'center' }}
                                >
                                    Testing Matrix
                                </div>
                                <div
                                    className="prs-hd"
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '52px',
                                    }}
                                >
                                    Energy, routes,
                                    <br />
                                    <em>and real users.</em>
                                </div>
                            </div>
                            <canvas ref={echRef} id="prs-eChart" />
                            <div className="prs-bench">
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">1,728</div>
                                    <div className="prs-bench-label">
                                        Circuits
                                    </div>
                                    <div className="prs-bench-copy">
                                        optimizer, p, penalty, k, maxiter,
                                        restarts
                                    </div>
                                </div>
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">0%</div>
                                    <div className="prs-bench-label">
                                        COBYLA p=2
                                    </div>
                                    <div className="prs-bench-copy">
                                        observed failure rate in the selected
                                        layer setting
                                    </div>
                                </div>
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">60fps</div>
                                    <div className="prs-bench-label">
                                        Dashboard
                                    </div>
                                    <div className="prs-bench-copy">
                                        rendering stress test with 1,000-node
                                        payloads
                                    </div>
                                </div>
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">RBAC</div>
                                    <div className="prs-bench-label">
                                        Security
                                    </div>
                                    <div className="prs-bench-copy">
                                        dispatcher and driver permissions
                                        verified
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 16 results */}
                    <section
                        className="prs-slide prs-lc"
                        data-label="16 Results"
                    >
                        <div className="prs-txt">
                            <div
                                className="prs-ey"
                                style={{ marginBottom: 38 }}
                            >
                                Best Combined Objective
                            </div>
                            <div className="prs-sgrid">
                                <div>
                                    <div className="prs-sv" id="prs-sGap">
                                        0.0
                                        <sup style={{ fontSize: '.42em' }}>
                                            %
                                        </sup>
                                    </div>
                                    <div className="prs-sl">
                                        Gap at 1,000 nodes
                                    </div>
                                </div>
                                <div>
                                    <div className="prs-sv" id="prs-sFair">
                                        6,441
                                    </div>
                                    <div className="prs-sl">
                                        Weighted Fairness
                                    </div>
                                </div>
                                <div>
                                    <div className="prs-sv" id="prs-sScale">
                                        1,000
                                    </div>
                                    <div className="prs-sl">
                                        Nodes, 45 vehicles
                                    </div>
                                </div>
                            </div>
                            <div
                                className="prs-bd"
                                style={{
                                    textAlign: 'center',
                                    marginTop: 32,
                                    maxWidth: 620,
                                }}
                            >
                                Recursive QAOA + 2-opt ranked first on the
                                combined cost-fairness objective at 50, 100,
                                200, and 1,000 nodes.
                            </div>
                        </div>
                    </section>

                    {/* 17 */}
                    <section
                        className="prs-slide prs-lr"
                        data-label="17 IBM Quantum"
                    >
                        <div className="prs-txt" style={{ maxWidth: 620 }}>
                            <div className="prs-ey">
                                Physical Hardware Proof
                            </div>
                            <div className="prs-hd">
                                The cloud QPU
                                <br />
                                <em>actually ran.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                A k=3 subset ran through IBM Quantum. It took
                                about 2.5 hours wall-clock, returned valid
                                subtour-free routes, and beat classical
                                baselines on operational equity.
                            </div>
                            <div
                                className="prs-bench"
                                style={{ width: 'min(720px,82vw)' }}
                            >
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">3,493</div>
                                    <div className="prs-bench-label">
                                        Fairness
                                    </div>
                                    <div className="prs-bench-copy">
                                        Recursive QAOA + 2-opt on IBM Quantum
                                    </div>
                                </div>
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">5.6%</div>
                                    <div className="prs-bench-label">
                                        Advantage
                                    </div>
                                    <div className="prs-bench-copy">
                                        over OR-Tools fairness score on the same
                                        subset
                                    </div>
                                </div>
                                <div className="prs-bench-card">
                                    <div className="prs-bench-value">2.5h</div>
                                    <div className="prs-bench-label">
                                        Wall Time
                                    </div>
                                    <div className="prs-bench-copy">
                                        queueing, transpilation, and execution
                                        reality included
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 18 */}
                    <section
                        className="prs-slide prs-lb"
                        data-label="18 Future Work"
                    >
                        <div className="prs-txt" style={{ paddingBottom: 100 }}>
                            <div className="prs-ey">Future Work</div>
                            <div className="prs-hd">
                                Make the leaves bigger.
                                <br />
                                Make the quantum
                                <br />
                                <em>less fragile.</em>
                            </div>
                            <div className="prs-hr" />
                            <div className="prs-bd">
                                The next leap is hardware-aware compilation,
                                noise mitigation, richer constraints like
                                capacity and time windows, and comparative
                                quantum primitives such as VQE, quantum
                                annealing, and quantum walks inside the same
                                recursive framework.
                            </div>
                            <div
                                className="prs-kicker-row"
                                style={{ justifyContent: 'center' }}
                            >
                                <div className="prs-pill">noise mitigation</div>
                                <div className="prs-pill">capacity QUBO</div>
                                <div className="prs-pill">time windows</div>
                                <div className="prs-pill">larger leaves</div>
                            </div>
                        </div>
                    </section>
                </div>

                <nav id="prs-nav">
                    <button
                        className="prs-nb"
                        onClick={() => goTo(curRef.current - 1)}
                    >
                        ←
                    </button>
                    <span id="prs-ctr">
                        01 / {N_SLIDES.toString().padStart(2, '0')}
                    </span>
                    <button
                        className="prs-nb"
                        onClick={() => goTo(curRef.current + 1)}
                    >
                        →
                    </button>
                </nav>
            </div>
        </>
    );
}

// bypass app layout — presentation is full-screen
Presentation.layout = () => null;
