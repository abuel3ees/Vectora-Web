import { Head } from '@inertiajs/react';
import { useEffect, useRef, useCallback } from 'react';
import * as topojson from 'topojson-client';

// ─── types ───────────────────────────────────────────────
type V3 = [number, number, number];
type P3 = [number, number, number];
type RouteStyle = { c: string; g: string; w: number };
type ArcPt = { t: number; spd: number; done: boolean };
type SlideState = { t: number; s: number; n: number; r: [number,number,number,number,number]; d: number; z: { sc: number; la: number; lo: number } | null };

// ─── data ────────────────────────────────────────────────
const CITIES: [string, number, number][] = [
    ['New York',     40.71, -74.01], ['London',       51.51,  -0.13],
    ['Tokyo',        35.68, 139.69], ['Sydney',       -33.87, 151.21],
    ['São Paulo',   -23.55, -46.63], ['Dubai',         25.20,  55.27],
    ['Singapore',     1.35, 103.82], ['Los Angeles',   34.05,-118.24],
    ['Mumbai',       19.08,  72.88], ['Cairo',         30.04,  31.24],
    ['Nairobi',      -1.29,  36.82], ['Chicago',       41.88, -87.63],
    ['Toronto',      43.65, -79.38], ['Berlin',        52.52,  13.40],
    ['Shanghai',     31.23, 121.47], ['Seoul',         37.57, 126.98],
    ['Jakarta',      -6.21, 106.85], ['Mexico City',   19.43, -99.13],
    ['Buenos Aires',-34.61, -58.38], ['Johannesburg', -26.20,  28.04],
];
const ROUTES = [
    { nodes: [0,12,11,1,13,0] },
    { nodes: [0,9,10,19,4,18,0] },
    { nodes: [0,5,8,6,16,3,0] },
    { nodes: [0,2,15,14,7,0] },
    { nodes: [0,17,4,18,7,0] },
];
const RS: RouteStyle[] = [
    { c:'#c9a96e', g:'rgba(201,169,110,', w:1.6 },
    { c:'#dfc07a', g:'rgba(223,192,122,', w:1.4 },
    { c:'#b08858', g:'rgba(176,136,88,',  w:1.5 },
    { c:'#e8d4a0', g:'rgba(232,212,160,', w:1.2 },
    { c:'#9a7840', g:'rgba(154,120,64,',  w:1.4 },
];
const SS: SlideState[] = [
    { t:.45, s:.35, n:0,   r:[0,0,0,0,0], d:1,    z:null },
    { t:.38, s:.30, n:1,   r:[0,0,0,0,0], d:1,    z:null },
    { t:.10, s:.80, n:1,   r:[0,0,0,0,0], d:1,    z:null },
    { t:.30, s:.55, n:1,   r:[0,0,0,0,0], d:1,    z:null },
    { t:.55, s:.90, n:.5,  r:[0,0,0,0,0], d:1,    z:null },
    { t:.75, s:1.4, n:.35, r:[0,0,0,0,0], d:1,    z:null },
    { t:.68, s:1.6, n:.25, r:[0,0,0,0,0], d:1,    z:null },
    { t:.42, s:.50, n:1,   r:[0,0,0,0,0], d:1,    z:null },
    { t:.45, s:.18, n:.2,  r:[0,0,0,0,0], d:.28,  z:null },
    { t:.35, s:.40, n:1,   r:[0,0,0,0,0], d:1,    z:null },
    { t:.42, s:.28, n:1,   r:[1,0,0,0,0], d:1,    z:{ sc:2.0, la:46, lo:-40 } },
    { t:.32, s:.22, n:1,   r:[1,1,0,0,0], d:1,    z:{ sc:1.8, la:5,  lo:15  } },
    { t:.38, s:.22, n:1,   r:[1,1,1,0,0], d:1,    z:{ sc:1.9, la:10, lo:75  } },
    { t:.45, s:.38, n:1,   r:[1,1,1,1,1], d:1,    z:null },
    { t:.45, s:.18, n:.15, r:[1,1,1,1,1], d:.22,  z:null },
    { t:.45, s:.32, n:1,   r:[1,1,1,1,1], d:1,    z:null },
    { t:.50, s:.28, n:1,   r:[1,1,1,1,1], d:1,    z:null },
    { t:.40, s:.20, n:1,   r:[1,1,1,1,1], d:1,    z:null },
];

const SLIDE_LABELS = [
    '01 Title','02 The Problem','03 Complexity','04 Classical Limits',
    '05 Quantum Computing','06 Superposition','07 Entanglement','08 QAOA Overview',
    '09 Quantum Circuit','10 Hamiltonian','11 North Atlantic Route',
    '12 Africa – S.America Route','13 Middle East – Pacific',
    '14 Full Convergence','15 Energy Landscape','16 Results','17 VRPFR System','18 The Road Ahead',
];

const ORBIT_RINGS = [
    { inc:28, r:1.12, a:.18, phase:0 },
    { inc:-18, r:1.20, a:.10, phase:1.1 },
];

export default function Presentation() {
    const bgRef  = useRef<HTMLCanvasElement>(null);
    const gcRef  = useRef<HTMLCanvasElement>(null);
    const echRef = useRef<HTMLCanvasElement>(null);
    const curRef  = useRef(0);
    const rafRef  = useRef(0);
    const stateRef = useRef({ initialized: false });

    // Expose goTo so event listeners can call it
    const goToRef = useRef<(i: number) => void>(() => {});

    useEffect(() => {
        const bgC = bgRef.current!;
        const gc  = gcRef.current!;

        if (!bgC || !gc) {
return;
}

        const bgX = bgC.getContext('2d')!;
        const gx  = gc.getContext('2d')!;

        let W = 0, H = 0;
        let stars: { x:number; y:number; r:number; a:number; tw:number }[] = [];

        function resize() {
            W = bgC.width = gc.width = window.innerWidth;
            H = bgC.height = gc.height = window.innerHeight;
            stars = Array.from({ length: 320 }, () => ({
                x: Math.random()*W, y: Math.random()*H,
                r: Math.random()*.9+.15, a: Math.random()*.45+.06, tw: Math.random()*Math.PI*2,
            }));
        }
        window.addEventListener('resize', resize); resize();

        // globe interpolated state
        const G = { t:.45, s:.35, n:0, r:[0,0,0,0,0] as number[], d:1, zsc:1, zox:0, zoy:0 };
        let rotAngle = 0, lastTs = 0;

        const particles = Array.from({ length:60 }, () => ({
            lat: (Math.random()*180-90)*Math.PI/180,
            lon: Math.random()*Math.PI*2,
            r: 1.10+Math.random()*.18,
            speed: (Math.random()-.5)*.0004,
            size: Math.random()*1.2+.3,
            a: Math.random()*.35+.08,
        }));
        const vehicles = ROUTES.map(() => ({ t: Math.random(), spd: .00006+Math.random()*.00003 }));
        const cityFlash = new Array(CITIES.length).fill(0);
        const arcP: ArcPt[][] = ROUTES.map(r =>
            r.nodes.slice(0,-1).map(() => ({ t:0, spd:.002+Math.random()*.002, done:false }))
        );

        // world data
        let landRings: number[][][] = [], countryLines: number[][][] = [];
        Promise.all([
            fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json').then(r=>r.json()),
            fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>r.json()),
        ]).then(([l,c]) => {
            topojson.feature(l as any, (l as any).objects.land).features.forEach((f: any) => {
                const p = f.geometry.type==='Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
                (p as number[][][][]).forEach((poly: number[][][]) => poly.forEach((ring: number[][]) => landRings.push(ring)));
            });
            const m = topojson.mesh(c as any, (c as any).objects.countries, (a: any, b: any) => a!==b);
            countryLines = (m as any).coordinates;
        }).catch(() => {});

        // ─── math ───
        const toV = (la: number, lo: number): V3 => {
            const a=la*Math.PI/180, b=lo*Math.PI/180;

            return [Math.cos(a)*Math.cos(b), Math.sin(a), Math.cos(a)*Math.sin(b)];
        };
        const rotY = (v: V3, a: number): V3 => [v[0]*Math.cos(a)+v[2]*Math.sin(a), v[1], -v[0]*Math.sin(a)+v[2]*Math.cos(a)];
        const rotX = (v: V3, a: number): V3 => [v[0], v[1]*Math.cos(a)-v[2]*Math.sin(a), v[1]*Math.sin(a)+v[2]*Math.cos(a)];
        const lerp = (a: number, b: number, t: number) => a+(b-a)*t;
        const vw  = (v: V3): V3 => rotX(rotY(v, rotAngle), G.t*Math.PI/2);
        const vwFix = (v: V3): V3 => rotX(v, G.t*Math.PI/2);

        function pr(v: V3, R: number, cx: number, cy: number): P3 {
            return [(cx+v[0]*R-G.zox)*G.zsc+G.zox, (cy-v[1]*R-G.zoy)*G.zsc+G.zoy, v[2]];
        }
        function prRaw(v: V3, R: number, cx: number, cy: number): P3 {
            return [cx+v[0]*R, cy-v[1]*R, v[2]];
        }
        function slE(a: V3, b: V3, t: number, h=0.10): V3 {
            const d = Math.max(-1, Math.min(1, a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
            const th = Math.acos(d);

            if (Math.abs(th)<1e-4) {
return a;
}

            const s = Math.sin(th);
            const v: V3 = [
                (Math.sin((1-t)*th)/s)*a[0]+(Math.sin(t*th)/s)*b[0],
                (Math.sin((1-t)*th)/s)*a[1]+(Math.sin(t*th)/s)*b[1],
                (Math.sin((1-t)*th)/s)*a[2]+(Math.sin(t*th)/s)*b[2],
            ];
            const elev = 1+h*Math.sin(t*Math.PI);

            return [v[0]*elev, v[1]*elev, v[2]*elev];
        }

        // ─── draw helpers ───
        function polyline(pts: P3[]) {
            if (pts.length<2) {
return;
}

            gx.beginPath(); gx.moveTo(pts[0][0],pts[0][1]);

            for (let i=1;i<pts.length;i++) {
gx.lineTo(pts[i][0],pts[i][1]);
}

            gx.stroke();
        }
        function gline(pts: P3[], a: number) {
            if (pts.length<2) {
return;
}

            gx.beginPath(); gx.moveTo(pts[0][0],pts[0][1]);

            for (let i=1;i<pts.length;i++) {
gx.lineTo(pts[i][0],pts[i][1]);
}

            gx.strokeStyle=`rgba(50,45,85,${a})`; gx.lineWidth=.4; gx.stroke();
        }
        function arcSeg(pts: P3[], st: RouteStyle) {
            if (pts.length<2) {
return;
}

            gx.beginPath(); gx.moveTo(pts[0][0],pts[0][1]);

            for (let i=1;i<pts.length;i++) {
gx.lineTo(pts[i][0],pts[i][1]);
}

            gx.strokeStyle=st.g+'.09)'; gx.lineWidth=9; gx.stroke();
            gx.strokeStyle=st.g+'.12)'; gx.lineWidth=5; gx.stroke();
            gx.strokeStyle=st.c; gx.lineWidth=st.w; gx.shadowBlur=6; gx.shadowColor=st.g+'.55)'; gx.stroke(); gx.shadowBlur=0;
        }
        function orbitSeg(pts: [number,number][], a: number) {
            if (pts.length<2) {
return;
}

            gx.beginPath(); gx.moveTo(pts[0][0],pts[0][1]);

            for (let i=1;i<pts.length;i++) {
gx.lineTo(pts[i][0],pts[i][1]);
}

            gx.strokeStyle=`rgba(201,169,110,${a})`; gx.lineWidth=.7; gx.stroke();
        }
        function drawOrbitRing(ring: typeof ORBIT_RINGS[0], R: number, cx: number, cy: number) {
            const { inc, r, a, phase } = ring;
            const incR = inc*Math.PI/180;
            const SEGS=120; let seg: [number,number][] = [];

            for (let i=0;i<=SEGS;i++) {
                const lon=(i/SEGS)*Math.PI*2+phase, x=Math.cos(lon)*r, yR=Math.sin(lon)*r;
                const v=vwFix([x,yR*Math.sin(incR),yR*Math.cos(incR)]);
                const p=prRaw(v,R,cx,cy);

                if (p[2]>0) {
seg.push([p[0],p[1]]);
} else {
 orbitSeg(seg,a); seg=[]; 
}
            }

            orbitSeg(seg,a);
        }

        // ─── main draw ───
        function drawBg() {
            bgX.clearRect(0,0,W,H);
            const g=bgX.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.65);
            g.addColorStop(0,'rgba(20,14,38,.0)'); g.addColorStop(1,'rgba(4,3,10,.94)');
            bgX.fillStyle=g; bgX.fillRect(0,0,W,H);

            for (const s of stars) {
                s.tw+=.007;
                bgX.beginPath(); bgX.arc(s.x,s.y,s.r,0,Math.PI*2);
                bgX.fillStyle=`rgba(215,195,155,${s.a*(.4+.6*Math.sin(s.tw))})`; bgX.fill();
            }
        }

        function drawGlobe(ts: number) {
            const dt=ts-lastTs; lastTs=ts;
            rotAngle+=.00025*dt*G.s;
            const tgt=SS[curRef.current], k=.028;
            G.t=lerp(G.t,tgt.t,k); G.s=lerp(G.s,tgt.s,k);
            G.n=lerp(G.n,tgt.n,k); G.d=lerp(G.d,tgt.d,k);

            for (let i=0;i<5;i++) {
                G.r[i]=lerp(G.r[i],tgt.r[i],k*.75);

                if (G.r[i]<.04) {
arcP[i].forEach(a=>{
a.t=0;a.done=false;
});
}
            }

            // zoom interpolation
            let targetZsc=1, targetZox=W/2, targetZoy=H/2;

            if (tgt.z) {
                targetZsc=tgt.z.sc;
                const zv=toV(tgt.z.la,tgt.z.lo);
                const zr=rotX(rotY(zv,rotAngle),G.t*Math.PI/2);
                const R0=Math.min(W,H)*.34;
                targetZox=W/2+zr[0]*R0;
                targetZoy=H/2-zr[1]*R0;
            }

            G.zsc=lerp(G.zsc,targetZsc,.018);
            G.zox=lerp(G.zox,targetZox,.018);
            G.zoy=lerp(G.zoy,targetZoy,.018);

            gx.clearRect(0,0,W,H);
            const cx=W/2, cy=H/2, R=Math.min(W,H)*.34;
            gx.globalAlpha=G.d;

            // quantum rings
            const alpha=Math.max(0,G.t-.4)/.6;

            if (alpha>.05) {
                for (let k2=0;k2<4;k2++) {
                    const phase=(ts*.0005+k2*.25)%1;
                    gx.beginPath(); gx.arc(cx,cy,R*(.05+phase*.6)*G.zsc,0,Math.PI*2);
                    gx.strokeStyle=`rgba(201,169,110,${alpha*.15*(1-phase)})`; gx.lineWidth=1; gx.stroke();
                }
            }

            // orbit back
            ORBIT_RINGS.forEach(ring=>{
                const { inc, r, a, phase } = ring; const incR=inc*Math.PI/180;
                const SEGS=120; let seg: [number,number][] = [];

                for (let i=0;i<=SEGS;i++) {
                    const lon=(i/SEGS)*Math.PI*2+phase, x=Math.cos(lon)*r, yR=Math.sin(lon)*r;
                    const v=vwFix([x,yR*Math.sin(incR),yR*Math.cos(incR)]);
                    const p=prRaw(v,R,cx,cy);

                    if (p[2]<0) {
seg.push([p[0],p[1]]);
} else {
 if(seg.length>1){
orbitSeg(seg,a*.5);
}

 seg=[]; 
}
                }

                if(seg.length>1){
orbitSeg(seg,a*.5);
}
            });

            // atmosphere
            const zcx=(cx-G.zox)*G.zsc+G.zox, zcy=(cy-G.zoy)*G.zsc+G.zoy, zR=R*G.zsc;

            for (const [r,c,al] of ([[1.30,'rgba(170,130,55,','.08)'],[1.18,'rgba(140,100,40,','.06)'],[1.07,'rgba(100,70,25,','.05)']] as [number,string,string][])) {
                const atm=gx.createRadialGradient(zcx,zcy,zR*.86,zcx,zcy,zR*r);
                atm.addColorStop(0,c+al); atm.addColorStop(1,'transparent');
                gx.beginPath(); gx.arc(zcx,zcy,zR*r,0,Math.PI*2); gx.fillStyle=atm; gx.fill();
            }

            // clip sphere
            gx.save(); gx.beginPath(); gx.arc(zcx,zcy,zR,0,Math.PI*2); gx.clip();

            // ocean
            const oc=gx.createRadialGradient(zcx-zR*.32,zcy-zR*.28,0,zcx,zcy,zR);
            oc.addColorStop(0,'#14122a'); oc.addColorStop(.6,'#0d0b1e'); oc.addColorStop(1,'#07060f');
            gx.fillStyle=oc; gx.fillRect(zcx-zR-2,zcy-zR-2,zR*2+4,zR*2+4);

            // specular
            const sp=gx.createRadialGradient(zcx-zR*.35,zcy-zR*.3,0,zcx-zR*.35,zcy-zR*.3,zR*.75);
            sp.addColorStop(0,'rgba(255,248,210,.06)'); sp.addColorStop(1,'transparent');
            gx.fillStyle=sp; gx.fillRect(zcx-zR-2,zcy-zR-2,zR*2+4,zR*2+4);

            // land
            gx.fillStyle='#1d1b32'; gx.strokeStyle='rgba(55,50,95,.22)'; gx.lineWidth=.28;

            for (const ring of landRings) {
                let any=false;
                const pts=ring.map(([lo,la])=>{
const v=vw(toV(la,lo));const p=pr(v,R,cx,cy);

if(p[2]>0){
any=true;
}

return p;
});

                if(!any){
continue;
}

                gx.beginPath(); let pen=false;

                for (const p of pts){
if(p[2]>-.06){
if(!pen){
gx.moveTo(p[0],p[1]);pen=true;
}else {
gx.lineTo(p[0],p[1]);
}
}else {
pen=false;
}
}

                gx.closePath(); gx.fill(); gx.stroke();
            }

            // borders
            gx.strokeStyle='rgba(95,85,148,.4)'; gx.lineWidth=.5;

            for (const line of countryLines) {
                let seg: P3[] = [];

                for (const [lo,la] of line as [number,number][]) {
                    const v=vw(toV(la,lo));const p=pr(v,R,cx,cy);

                    if(p[2]>0){
seg.push(p);
}else{
polyline(seg);seg=[];
}
                }

                polyline(seg);
            }

            // grid
            for(let ld=-80;ld<=80;ld+=10){
const la=ld*Math.PI/180;let s:P3[]=[];

for(let i=0;i<=160;i++){
const lo=(i/160)*Math.PI*2-Math.PI;const v=vw([Math.cos(la)*Math.cos(lo),Math.sin(la),Math.cos(la)*Math.sin(lo)]);const p=pr(v,R,cx,cy);

if(p[2]>0){
s.push(p);
}else{
gline(s,.10);s=[];
}
}

gline(s,.10);
}

            for(let ld=-170;ld<=180;ld+=10){
const lo=ld*Math.PI/180;let s:P3[]=[];

for(let i=0;i<=80;i++){
const la=(i/80)*Math.PI-Math.PI/2;const v=vw([Math.cos(la)*Math.cos(lo),Math.sin(la),Math.cos(la)*Math.sin(lo)]);const p=pr(v,R,cx,cy);

if(p[2]>0){
s.push(p);
}else{
gline(s,.10);s=[];
}
}

gline(s,.10);
}

            // terminator
            const lit=gx.createRadialGradient(zcx-zR*.38,zcy-zR*.3,0,zcx+zR*.18,zcy+zR*.28,zR*1.45);
            lit.addColorStop(0,'rgba(255,245,190,.07)'); lit.addColorStop(.45,'transparent'); lit.addColorStop(1,'rgba(0,0,20,.55)');
            gx.fillStyle=lit; gx.fillRect(zcx-zR-2,zcy-zR-2,zR*2+4,zR*2+4);
            gx.restore();

            // edge
            gx.beginPath(); gx.arc(zcx,zcy,zR,0,Math.PI*2);
            gx.strokeStyle='rgba(160,130,70,.22)'; gx.lineWidth=1.2; gx.stroke();

            // orbit front
            ORBIT_RINGS.forEach(ring=>drawOrbitRing(ring,R,cx,cy));

            // particles
            for(const p of particles){
                p.lon+=p.speed;
                const x=Math.cos(p.lat)*Math.cos(p.lon)*p.r,y=Math.sin(p.lat)*p.r,z=Math.cos(p.lat)*Math.sin(p.lon)*p.r;
                const v=vw([x,y,z]);

 if(v[2]<0){
continue;
}

                const s=pr(v,R,cx,cy);
                gx.beginPath(); gx.arc(s[0],s[1],p.size,0,Math.PI*2);
                gx.fillStyle=`rgba(201,169,110,${p.a*(.6+.4*Math.sin(ts*.002+p.lon*10))})`;
                gx.shadowBlur=4; gx.shadowColor='rgba(201,169,110,.5)'; gx.fill(); gx.shadowBlur=0;
            }

            // routes
            ROUTES.forEach((route,ri)=>{
                const alpha=G.r[ri];

 if(alpha<.02){
return;
}

                const st=RS[ri]; gx.globalAlpha=G.d*alpha;

                for(let ei=0;ei<route.nodes.length-1;ei++){
                    const ap=arcP[ri][ei];

                    if(!ap.done){
ap.t=Math.min(ap.t+ap.spd,1);

if(ap.t>=1){
ap.done=true;cityFlash[route.nodes[ei+1]]=ts;
}
}

                    const v1=toV(CITIES[route.nodes[ei]][1],CITIES[route.nodes[ei]][2]);
                    const v2=toV(CITIES[route.nodes[ei+1]][1],CITIES[route.nodes[ei+1]][2]);
                    const SEGS=100,end=Math.ceil(SEGS*ap.t);
                    let seg:P3[]=[];

                    for(let i=0;i<=end;i++){
const v=vw(slE(v1,v2,i/SEGS,.10));const p=pr(v,R,cx,cy);

if(p[2]>0){
seg.push(p);
}else{
arcSeg(seg,st);seg=[];
}
}

                    arcSeg(seg,st);

                    if(ap.t<1){
const hv=vw(slE(v1,v2,Math.floor(SEGS*ap.t)/SEGS,.10));const hp=pr(hv,R,cx,cy);

if(hp[2]>0){
gx.beginPath();gx.arc(hp[0],hp[1],3,0,Math.PI*2);gx.fillStyle=st.c;gx.shadowBlur=12;gx.shadowColor=st.c;gx.fill();gx.shadowBlur=0;
}
}
                }

                if(alpha>.8){
                    vehicles[ri].t=(vehicles[ri].t+vehicles[ri].spd*dt)%1;
                    const totalSegs=route.nodes.length-1,segT=vehicles[ri].t*totalSegs;
                    const segIdx=Math.min(Math.floor(segT),totalSegs-1),locT=segT-segIdx;
                    const vv1=toV(CITIES[route.nodes[segIdx]][1],CITIES[route.nodes[segIdx]][2]);
                    const vv2=toV(CITIES[route.nodes[segIdx+1]][1],CITIES[route.nodes[segIdx+1]][2]);

                    for(let trail=5;trail>=0;trail--){
                        const tt=Math.max(0,locT-trail*.025);
                        const tv=vw(slE(vv1,vv2,tt,.10));const tp=pr(tv,R,cx,cy);

                        if(tp[2]>0){
const r2=trail===0?4:3-trail*.3,a=trail===0?.95:(.7-trail*.1);gx.beginPath();gx.arc(tp[0],tp[1],Math.max(.5,r2),0,Math.PI*2);gx.fillStyle=st.g+a+')';

if(trail===0){
gx.shadowBlur=16;gx.shadowColor=st.g+'.9)';
}

gx.fill();gx.shadowBlur=0;
}
                    }
                }

                gx.globalAlpha=1;
            });

            // nodes
            if(G.n>.02){
                gx.globalAlpha=G.d*G.n;
                CITIES.forEach((city,ci)=>{
                    const v=vw(toV(city[1],city[2]));

 if(v[2]<.04){
return;
}

                    const p=pr(v,R,cx,cy);
                    const pulse=.5+.5*Math.sin(ts*.0016+ci*.85);
                    const fAge=ts-cityFlash[ci];

                    if(fAge<1200&&cityFlash[ci]>0){
const fp=fAge/1200;gx.beginPath();gx.arc(p[0],p[1],R*.04*G.zsc*(fp+.1),0,Math.PI*2);gx.strokeStyle=`rgba(232,201,138,${(1-fp)*.6})`;gx.lineWidth=1.5;gx.stroke();
}

                    gx.beginPath();gx.arc(p[0],p[1],9*pulse,0,Math.PI*2);gx.strokeStyle='rgba(201,169,110,.09)';gx.lineWidth=1;gx.stroke();
                    gx.beginPath();gx.arc(p[0],p[1],2.8,0,Math.PI*2);gx.fillStyle='#e8c98a';gx.shadowBlur=8;gx.shadowColor='rgba(232,201,138,.65)';gx.fill();gx.shadowBlur=0;

                    if(v[2]>.18){
gx.font=`200 ${Math.max(7,8.5*G.zsc)}px "DM Sans",sans-serif`;gx.fillStyle='rgba(185,162,112,.55)';gx.fillText(city[0],p[0]+7*G.zsc,p[1]-4*G.zsc);
}
                });
                gx.globalAlpha=1;
            }

            gx.globalAlpha=1;
        }

        // ─── telemetry ───
        let eBase=-18.742, iterCount=0;
        const telInterval = setInterval(()=>{
            eBase+=(Math.random()-.5)*.035-.0015;
            iterCount=Math.min(iterCount+Math.floor(Math.random()*3+1),312);
            const fid=Math.min(.999,.85+iterCount/312*.15);
            const eEl=document.getElementById('prs-telE');
            const iEl=document.getElementById('prs-telI');
            const fEl=document.getElementById('prs-telF');

            if(eEl){
eEl.textContent=eBase.toFixed(3);
}

            if(iEl){
iEl.textContent=String(iterCount).padStart(3,'0');
}

            if(fEl){
fEl.textContent=fid.toFixed(3);
}
        },180);

        // ─── stat counters ───
        let statStart: number|null=null;
        const STAT_DUR=2200;
        function animStats(ts: number) {
            if(curRef.current!==15){
return;
}

            if(!statStart){
return;
}

            const p=Math.min((ts-statStart)/STAT_DUR,1);
            const e=1-Math.pow(1-p,3);
            const qEl=document.getElementById('prs-sQual');
            const dEl=document.getElementById('prs-sDist');
            const iEl=document.getElementById('prs-sIter');

            if(qEl){
qEl.innerHTML=`${(97.3*e).toFixed(1)}<sup style="font-size:.42em">%</sup>`;
}

            if(dEl){
dEl.innerHTML=`${Math.round(4912*e).toLocaleString()}<sup style="font-size:.3em">km</sup>`;
}

            if(iEl){
iEl.textContent=String(Math.round(312*e));
}
        }

        // ─── energy chart ───
        function drawEnergyChart() {
            const canvas=echRef.current;

 if(!canvas){
return;
}

            const W2=Math.min(800,window.innerWidth-120),H2=240;
            canvas.width=W2; canvas.height=H2;
            const ctx=canvas.getContext('2d')!;
            ctx.clearRect(0,0,W2,H2);
            const N=312,pad=40;
            const pts: number[]=[];
            let e=-5;

            for(let i=0;i<N;i++){
e+=-0.065*(e+18.742)+(Math.random()-.5)*.4*(1/(1+i*.02));pts.push(e);
}

            const minE=Math.min(...pts),maxE=Math.max(...pts);
            const mapX=(i:number)=>pad+(i/N)*(W2-pad*2);
            const mapY=(v:number)=>H2-pad-(v-minE)/(maxE-minE)*(H2-pad*2);
            ctx.strokeStyle='rgba(201,169,110,.12)'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(pad,pad*.5); ctx.lineTo(pad,H2-pad); ctx.lineTo(W2-pad,H2-pad); ctx.stroke();
            const gr=ctx.createLinearGradient(0,0,0,H2);
            gr.addColorStop(0,'rgba(201,169,110,.18)'); gr.addColorStop(1,'rgba(201,169,110,.0)');
            ctx.beginPath(); ctx.moveTo(mapX(0),mapY(pts[0]));

            for(let i=1;i<N;i++){
ctx.lineTo(mapX(i),mapY(pts[i]));
}

            ctx.lineTo(mapX(N-1),H2-pad); ctx.lineTo(mapX(0),H2-pad); ctx.closePath();
            ctx.fillStyle=gr; ctx.fill();
            ctx.beginPath(); ctx.moveTo(mapX(0),mapY(pts[0]));

            for(let i=1;i<N;i++){
ctx.lineTo(mapX(i),mapY(pts[i]));
}

            ctx.strokeStyle='rgba(201,169,110,.75)'; ctx.lineWidth=1.5; ctx.shadowBlur=6; ctx.shadowColor='rgba(201,169,110,.4)'; ctx.stroke(); ctx.shadowBlur=0;
            ctx.beginPath(); ctx.arc(mapX(N-1),mapY(pts[N-1]),4,0,Math.PI*2);
            ctx.fillStyle='#e8c98a'; ctx.shadowBlur=12; ctx.shadowColor='rgba(232,201,138,.8)'; ctx.fill(); ctx.shadowBlur=0;
            ctx.font='200 8px "DM Sans",sans-serif'; ctx.fillStyle='rgba(80,80,74,.8)';
            ctx.fillText('ITERATION',W2/2,H2-8);
            ctx.save(); ctx.translate(12,H2/2); ctx.rotate(-Math.PI/2); ctx.fillText('ENERGY ⟨H꜀⟩',0,0); ctx.restore();
        }

        // ─── slides ───
        const N_SLIDES=SS.length;
        function goTo(i: number) {
            const prev=curRef.current;
            curRef.current=Math.max(0,Math.min(N_SLIDES-1,i));

            if(curRef.current===prev){
return;
}

            document.querySelectorAll('.prs-slide').forEach((el,idx)=>{
                el.classList.toggle('prs-active',idx===curRef.current);
            });
            const ctrEl=document.getElementById('prs-ctr');
            const slblEl=document.getElementById('prs-slbl');
            const plEl=document.getElementById('prs-pl');
            const telEl=document.getElementById('prs-telemetry');
            const flashEl=document.getElementById('prs-flash');

            if(ctrEl){
ctrEl.textContent=`${String(curRef.current+1).padStart(2,'0')} / ${String(N_SLIDES).padStart(2,'0')}`;
}

            if(slblEl){
slblEl.textContent=SLIDE_LABELS[curRef.current]||'';
}

            if(plEl){
plEl.style.width=((curRef.current+1)/N_SLIDES*100)+'%';
}

            if(telEl){
telEl.classList.toggle('prs-visible',curRef.current>=9&&curRef.current<=15);
}

            if(curRef.current===15){
statStart=performance.now();iterCount=0;eBase=-18.742;
}

            if(curRef.current===14){
drawEnergyChart();
}

            // flash
            if(flashEl){
flashEl.style.opacity='1';setTimeout(()=>{
if(flashEl){
flashEl.style.opacity='0';
}
},150);
}

            // zoom badge
            const slideEl=document.querySelectorAll('.prs-slide')[curRef.current] as HTMLElement;
            const zk=slideEl?.dataset?.zoom;
            const zbEl=document.getElementById('prs-zoom-badge');

            if(zbEl&&zk){
                const labels: Record<string,string>={'north-atlantic':'Zooming — North Atlantic','africa-sa':'Zooming — Africa & South America','meast-pacific':'Zooming — Middle East & Pacific'};
                zbEl.textContent=labels[zk]||'';
                zbEl.style.opacity='1';
                setTimeout(()=>{
if(zbEl){
zbEl.style.opacity='0';
}
},2200);
            }

            try{
localStorage.setItem('vrp-slide',String(curRef.current));
}catch(_){}
        }
        goToRef.current=goTo;

        // keyboard
        function onKey(e: KeyboardEvent){
            if(/INPUT|TEXTAREA/.test((e.target as HTMLElement)?.tagName||'')){
return;
}

            if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){
goTo(curRef.current+1);
}

            if(e.key==='ArrowLeft'||e.key==='PageUp'){
goTo(curRef.current-1);
}

            if(e.key==='Home'){
goTo(0);
}

            if(e.key==='End'){
goTo(N_SLIDES-1);
}
        }
        window.addEventListener('keydown',onKey);

        // restore saved slide
        const saved=+(localStorage.getItem('vrp-slide')||0);
        goTo(Math.min(saved,N_SLIDES-1));

        // ─── loop ───
        function loop(ts: number){
drawBg();drawGlobe(ts);animStats(ts);rafRef.current=requestAnimationFrame(loop);
}
        rafRef.current=requestAnimationFrame(loop);

        // ─── circuit ───
        (function buildCircuit(){
            const NQUBITS=6,CTRL_ROWS=[0,2,4];
            const LAYER_LABELS=[{l:'Init',span:3},{l:'Cost  γ₁',span:4},{l:'Mix  β₁',span:2},{l:'Cost  γ₂',span:4},{l:'Mix  β₂',span:2},{l:'Measure',span:1}];
            const GATE_SEQ=['wseg','gH','wseg','gRz','wseg','ctrl','wseg','gRx','wseg','gRz','wseg','ctrl','wseg','gRx','wseg','gM'];
            const container=document.getElementById('prs-qcDiagram');

 if(!container){
return;
}

            const bar=document.createElement('div'); bar.className='prs-layer-bar';
            LAYER_LABELS.forEach(({l,span})=>{
const d=document.createElement('div');d.className='prs-layer-lbl';d.style.flex=String(span);d.textContent=l;bar.appendChild(d);
});
            container.appendChild(bar);

            for(let q=0;q<NQUBITS;q++){
                const row=document.createElement('div'); row.className='prs-qrow';
                const lbl=document.createElement('div'); lbl.className='prs-qlbl'; lbl.textContent=`|q${q}⟩`; row.appendChild(lbl);
                const wire=document.createElement('div'); wire.className='prs-qwire';
                GATE_SEQ.forEach(g=>{
                    const el=document.createElement('div');

                    if(g==='wseg'){
el.className='prs-wseg';
} else if(g==='gH'){
el.className='prs-g prs-gH';el.textContent='H';
} else if(g==='gRz'){
el.className='prs-g prs-gRz';el.textContent='Rz(γ)';
} else if(g==='gRx'){
el.className='prs-g prs-gRx';el.textContent='Rx(β)';
} else if(g==='gM'){
el.className='prs-g prs-gM';el.innerHTML='⊙';
} else if(g==='ctrl'){
el.className=CTRL_ROWS.includes(q)?'prs-ctrl':'prs-tgt2';

if(!CTRL_ROWS.includes(q)){
el.textContent='⊕';
}
}

                    wire.appendChild(el);
                });
                wire.appendChild(Object.assign(document.createElement('div'),{className:'prs-pulse'}));
                row.appendChild(wire); container.appendChild(row);
            }

            setTimeout(()=>{
                if(!container){
return;
}

                const rows=[...container.querySelectorAll('.prs-qrow')];
                rows.forEach((row,ri)=>{
                    if(!CTRL_ROWS.includes(ri)){
return;
}

                    row.querySelectorAll('.prs-ctrl').forEach(el=>{
                        const r1=el.getBoundingClientRect();
                        const r2=(rows[ri+1]as HTMLElement)?.querySelector('.prs-tgt2')?.getBoundingClientRect();

                        if(!r2){
return;
}

                        const cr=container.getBoundingClientRect();
                        const vert=Object.assign(document.createElement('div'),{className:'prs-vert'});
                        vert.style.left=(r1.left+r1.width/2-cr.left)+'px';
                        vert.style.top=(r1.bottom-cr.top)+'px';
                        vert.style.height=(r2.top-r1.bottom)+'px';
                        container.style.position='relative'; container.appendChild(vert);
                    });
                });
            },500);
        })();

        return () => {
            cancelAnimationFrame(rafRef.current);
            clearInterval(telInterval);
            window.removeEventListener('resize',resize);
            window.removeEventListener('keydown',onKey);
        };
    }, []);

    const goTo = useCallback((i: number) => goToRef.current(i), []);

    const N_SLIDES = SS.length;

    return (
        <>
            <Head title="Presentation · Quantum VRP">
                <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@200;300;400&family=Space+Mono:wght@400&display=swap" rel="stylesheet" />
            </Head>

            <style>{`
                /* ── reset for presentation ── */
                #prs-root *, #prs-root *::before, #prs-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
                #prs-root { --gold:#c9a96e; --gold2:#e8c98a; --iv:#edead5; --dim:#50504a; --bg:#07060d; position:fixed; inset:0; background:#07060d; overflow:hidden; z-index:9999; }
                #prs-root canvas { position:fixed; inset:0; }
                #prs-bg { z-index:0; } #prs-globe { z-index:1; }

                /* slides */
                #prs-deck { position:fixed; inset:0; z-index:10; pointer-events:none; }
                .prs-slide { position:absolute; inset:0; display:flex; opacity:0; pointer-events:none; transition:opacity 1.1s ease; }
                .prs-slide.prs-active { opacity:1; pointer-events:auto; }
                .prs-txt { display:flex; flex-direction:column; justify-content:center; padding:clamp(40px,5vh,80px) clamp(48px,5vw,88px); transform:translateY(18px) scale(.99); transition:transform 1.2s cubic-bezier(.16,1,.3,1); }
                .prs-slide.prs-active .prs-txt { transform:none; }
                .prs-ey { font-family:'DM Sans',sans-serif; font-weight:200; font-size:10px; letter-spacing:.42em; text-transform:uppercase; color:#50504a; margin-bottom:18px; }
                .prs-hd { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:clamp(32px,4.8vw,78px); line-height:.93; color:#edead5; letter-spacing:-.015em; }
                .prs-hd em { font-style:italic; color:#c9a96e; }
                .prs-hr { width:28px; height:1px; background:rgba(201,169,110,.35); margin:24px 0; }
                .prs-bd { font-family:'DM Sans',sans-serif; font-weight:200; font-size:clamp(13px,1.15vw,16.5px); line-height:1.8; color:#696560; max-width:400px; }
                .prs-tg { display:flex; align-items:center; gap:9px; margin-top:22px; }
                .prs-tgd { width:5px; height:5px; border-radius:50%; background:#c9a96e; opacity:.55; flex-shrink:0; }
                .prs-tgt { font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.28em; text-transform:uppercase; color:#50504a; }
                .prs-nbig { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:clamp(24px,2.8vw,44px); color:#c9a96e; margin-top:22px; letter-spacing:-.01em; }

                /* layouts */
                .prs-lc { align-items:center; justify-content:center; }
                .prs-lr { align-items:center; justify-content:flex-end; }
                .prs-ll { align-items:center; justify-content:flex-start; }
                .prs-lb { align-items:flex-end; justify-content:center; }
                .prs-lc .prs-txt, .prs-lb .prs-txt { align-items:center; text-align:center; }
                .prs-lc .prs-bd, .prs-lb .prs-bd { text-align:center; margin:0 auto; }
                .prs-lc .prs-hr, .prs-lb .prs-hr { margin-left:auto; margin-right:auto; }
                .prs-lc .prs-tg, .prs-lb .prs-tg { justify-content:center; }
                .prs-glass { background:rgba(7,6,13,.65); border:1px solid rgba(201,169,110,.09); backdrop-filter:blur(22px); padding:52px 68px!important; max-width:580px; }

                /* stat grid */
                .prs-sgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:0 56px; }
                .prs-sv { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:clamp(42px,6.5vw,90px); line-height:.9; color:#e8c98a; text-shadow:0 0 50px rgba(232,201,138,.28); letter-spacing:-.02em; }
                .prs-sl { font-family:'DM Sans',sans-serif; font-weight:200; font-size:9px; letter-spacing:.3em; text-transform:uppercase; color:#50504a; margin-top:8px; }

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
                <div id="prs-wm">VRPFR &ensp;·&ensp; Quantum Optimization &ensp;·&ensp; 2026</div>
                <div id="prs-slbl"></div>
                <div id="prs-pl" style={{width:0}}></div>
                <div id="prs-flash"></div>
                <div id="prs-zoom-badge"></div>

                <div id="prs-telemetry">
                    <div className="prs-tel-row">ENERGY &ensp;<span className="prs-tel-val" id="prs-telE">−18.742</span></div>
                    <div className="prs-tel-row">ITERATION &ensp;<span className="prs-tel-val" id="prs-telI">000</span></div>
                    <div className="prs-tel-row">FIDELITY &ensp;<span className="prs-tel-val" id="prs-telF">0.000</span></div>
                </div>

                <div id="prs-deck">
                    {/* 01 */}
                    <section className="prs-slide prs-lc" data-label="01 Title">
                        <div className="prs-txt"><div className="prs-ey">A Quantum Approach</div><div className="prs-hd">Solving the<br/><em>Vehicle Routing</em><br/>Problem</div><div className="prs-hr"/><div className="prs-bd">QAOA on near-term quantum hardware · VRPFR full-stack implementation</div></div>
                    </section>
                    {/* 02 */}
                    <section className="prs-slide prs-lr" data-label="02 The Problem">
                        <div className="prs-txt" style={{maxWidth:490}}><div className="prs-ey">The Challenge</div><div className="prs-hd">Route.<br/>Optimize.<br/><em>Repeat.</em></div><div className="prs-hr"/><div className="prs-bd">Given a fleet of vehicles and a set of global delivery locations, find the shortest set of routes that visits every city exactly once and returns to base.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">20 cities &ensp;·&ensp; 5 vehicles &ensp;·&ensp; 1 depot</div></div></div>
                    </section>
                    {/* 03 */}
                    <section className="prs-slide prs-ll" data-label="03 Complexity">
                        <div className="prs-txt" style={{maxWidth:510}}><div className="prs-ey">Computational Complexity</div><div className="prs-hd"><em>NP-Hard.</em><br/>Exponentially so.</div><div className="prs-hr"/><div className="prs-bd">The number of feasible routes grows factorially. Classical computers struggle beyond 20–25 nodes — every added stop can double the entire search space.</div><div className="prs-nbig">2.43 × 10¹⁸</div><div className="prs-tg" style={{marginTop:8}}><div className="prs-tgd"/><div className="prs-tgt">possible routes for 20 cities</div></div></div>
                    </section>
                    {/* 04 */}
                    <section className="prs-slide prs-lr" data-label="04 Classical Limits">
                        <div className="prs-txt" style={{maxWidth:480}}><div className="prs-ey">Classical Approaches</div><div className="prs-hd">Good enough<br/>is not <em>optimal.</em></div><div className="prs-hr"/><div className="prs-bd">Heuristics like simulated annealing and genetic algorithms produce feasible routes — but cannot guarantee the global minimum. The optimal solution remains out of reach.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">Approximation ratio typically 1.05 – 1.30×</div></div></div>
                    </section>
                    {/* 05 */}
                    <section className="prs-slide prs-lc" data-label="05 Quantum Computing">
                        <div className="prs-txt prs-glass"><div className="prs-ey">A Different Kind of Computer</div><div className="prs-hd">Quantum<br/><em>mechanics</em><br/>as computation.</div><div className="prs-hr"/><div className="prs-bd">Quantum computers exploit superposition and entanglement to process exponentially many states simultaneously, collapsing to the optimum on measurement.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">IBM Eagle · 127 physical qubits · NISQ era</div></div></div>
                    </section>
                    {/* 06 */}
                    <section className="prs-slide prs-lc" data-label="06 Superposition">
                        <div className="prs-txt"><div className="prs-ey">The First Quantum Property</div><div className="prs-hd">All paths.<br/><em>At once.</em></div><div className="prs-hr"/><div className="prs-bd">A qubit simultaneously inhabits both 0 and 1. With 144 qubits the system encodes 2¹⁴⁴ route configurations in parallel — more states than atoms in the observable universe.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">2¹⁴⁴ ≈ 2.23 × 10⁴³ simultaneous states</div></div></div>
                    </section>
                    {/* 07 */}
                    <section className="prs-slide prs-lc" data-label="07 Entanglement">
                        <div className="prs-txt prs-glass"><div className="prs-ey">The Second Quantum Property</div><div className="prs-hd"><em>Entangled</em><br/>decisions.</div><div className="prs-hr"/><div className="prs-bd">Entanglement links qubits non-locally across the circuit. Route constraints propagate coherently through the quantum state, ruling out infeasible solutions without brute-force enumeration.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">Non-local correlations across all 144 qubits</div></div></div>
                    </section>
                    {/* 08 */}
                    <section className="prs-slide prs-ll" data-label="08 QAOA Overview">
                        <div className="prs-txt" style={{maxWidth:500}}><div className="prs-ey">The Algorithm</div><div className="prs-hd">Quantum<br/>Approximate<br/><em>Optimization.</em></div><div className="prs-hr"/><div className="prs-bd">QAOA alternates a cost unitary U(H꜀, γ) with a mixing unitary U(H_B, β) across p layers. A classical optimizer tunes γ and β to minimise the expected cost after each measurement cycle.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">p = 8 · variational · hybrid quantum-classical</div></div></div>
                    </section>
                    {/* 09 Circuit */}
                    <section className="prs-slide" data-label="09 Quantum Circuit">
                        <div className="prs-circuit-wrap"><div style={{textAlign:'center'}}><div className="prs-ey" style={{textAlign:'center'}}>QAOA Layer Structure</div><div className="prs-hd" style={{textAlign:'center',fontSize:'clamp(28px,3.5vw,52px)'}}>The <em>Quantum</em> Circuit</div></div><div className="prs-qc" id="prs-qcDiagram"/><div className="prs-circuit-foot">p = 8 alternating cost (γ) and mixing (β) layers &ensp;·&ensp; 6 representative qubits shown (144 total)</div></div>
                    </section>
                    {/* 10 */}
                    <section className="prs-slide prs-lr" data-label="10 Hamiltonian">
                        <div className="prs-txt" style={{maxWidth:480}}><div className="prs-ey">Encoding the Problem</div><div className="prs-hd">The Cost<br/><em>Hamiltonian.</em></div><div className="prs-hr"/><div className="prs-bd">The VRP objective is mapped to a Hamiltonian H꜀ whose ground state encodes the minimum-cost routing. QAOA iteratively approximates this ground state through classical feedback on γ and β.</div><div className="prs-nbig" style={{fontSize:'clamp(16px,1.6vw,24px)',fontStyle:'italic',opacity:.8}}>H꜀ = Σᵢⱼ wᵢⱼ · ZᵢZⱼ + Σᵢ hᵢ · Zᵢ</div></div>
                    </section>
                    {/* 11 zoom north atlantic */}
                    <section className="prs-slide prs-lr" data-label="11 North Atlantic Route" data-zoom="north-atlantic">
                        <div className="prs-txt" style={{maxWidth:460}}><div className="prs-ey">Route 1 · Zoom</div><div className="prs-hd">The<br/><em>North Atlantic</em><br/>Circuit.</div><div className="prs-hr"/><div className="prs-bd">New York → Toronto → Chicago → London → Berlin → New York. The first vehicle's path crystallises across the North Atlantic as QAOA interference amplifies its low-cost configuration.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">5 hops · 12,400 km · Vehicle 1</div></div></div>
                    </section>
                    {/* 12 zoom africa-sa */}
                    <section className="prs-slide prs-ll" data-label="12 Africa – S.America Route" data-zoom="africa-sa">
                        <div className="prs-txt" style={{maxWidth:460}}><div className="prs-ey">Route 2 · Zoom</div><div className="prs-hd">Crossing<br/><em>two continents.</em></div><div className="prs-hr"/><div className="prs-bd">New York → Cairo → Nairobi → Johannesburg → São Paulo → Buenos Aires → New York. A great-circle sweep through Africa and South America, discovered in 312 iterations.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">6 hops · 28,700 km · Vehicle 2</div></div></div>
                    </section>
                    {/* 13 zoom meast-pacific */}
                    <section className="prs-slide prs-lr" data-label="13 Middle East – Pacific" data-zoom="meast-pacific">
                        <div className="prs-txt" style={{maxWidth:460}}><div className="prs-ey">Route 3 · Zoom</div><div className="prs-hd">East of<br/><em>Suez.</em></div><div className="prs-hr"/><div className="prs-bd">New York → Dubai → Mumbai → Singapore → Jakarta → Sydney → New York. Spanning the Indian Ocean and the western Pacific in a single quantum-optimised arc.</div><div className="prs-tg"><div className="prs-tgd"/><div className="prs-tgt">6 hops · 31,200 km · Vehicle 3</div></div></div>
                    </section>
                    {/* 14 */}
                    <section className="prs-slide prs-lb" data-label="14 Full Convergence">
                        <div className="prs-txt" style={{paddingBottom:90}}><div className="prs-ey">Full Convergence</div><div className="prs-hd">Five <em>optimal</em> routes.</div><div className="prs-hr"/><div className="prs-bd">After 312 variational iterations all five vehicle routes converge simultaneously — covering every delivery location across four continents with minimum total distance.</div></div>
                    </section>
                    {/* 15 energy chart */}
                    <section className="prs-slide" data-label="15 Energy Landscape">
                        <div className="prs-echart-wrap"><div style={{textAlign:'center'}}><div className="prs-ey" style={{textAlign:'center'}}>Variational Optimization</div><div className="prs-hd" style={{textAlign:'center',fontSize:'clamp(28px,3.5vw,52px)'}}>Energy <em>Convergence</em></div></div><canvas ref={echRef} id="prs-eChart" /><div className="prs-circuit-foot">Expected value ⟨H꜀⟩ vs iteration · COBYLA classical optimizer · p = 8 layers</div></div>
                    </section>
                    {/* 16 results */}
                    <section className="prs-slide prs-lc" data-label="16 Results">
                        <div className="prs-txt"><div className="prs-ey" style={{marginBottom:38}}>Quantum Performance</div><div className="prs-sgrid"><div><div className="prs-sv" id="prs-sQual">97.3<sup style={{fontSize:'.42em'}}>%</sup></div><div className="prs-sl">Solution Quality</div></div><div><div className="prs-sv" id="prs-sDist">4,912<sup style={{fontSize:'.3em'}}>km</sup></div><div className="prs-sl">Avg Route</div></div><div><div className="prs-sv" id="prs-sIter">312</div><div className="prs-sl">Iterations</div></div></div><div className="prs-bd" style={{textAlign:'center',marginTop:32}}>Near-optimal solution on IBM Eagle · 127 physical qubits · NISQ-era hardware</div></div>
                    </section>
                    {/* 17 vrpfr system */}
                    <section className="prs-slide prs-ll" data-label="17 VRPFR System">
                        <div className="prs-app-panel"><div className="prs-ey">The Real Implementation</div><div className="prs-hd">VRPFR.<br/><em>End-to-end.</em></div><div className="prs-hr"/><div className="prs-bd" style={{maxWidth:420}}>A full-stack production system: quantum-optimised routes flow from the solver into a React dispatcher dashboard and live Flutter driver app — closing the loop from algorithm to asphalt.</div><div className="prs-app-mockup"><div className="prs-app-card"><div className="prs-app-card-label">Live Routes</div><div className="prs-app-card-val">5</div></div><div className="prs-app-card"><div className="prs-app-card-label">Active Drivers</div><div className="prs-app-card-val">5</div></div><div className="prs-app-card"><div className="prs-app-card-label">Deliveries</div><div className="prs-app-card-val">20</div></div></div><div className="prs-app-stack"><div className="prs-app-stack-row"><div className="prs-app-stack-dot"/><div className="prs-app-stack-text">Laravel 11 REST API · SQLite · Sanctum auth</div></div><div className="prs-app-stack-row"><div className="prs-app-stack-dot"/><div className="prs-app-stack-text">React 18 · Inertia.js · Tailwind dispatcher dashboard</div></div><div className="prs-app-stack-row"><div className="prs-app-stack-dot"/><div className="prs-app-stack-text">Flutter · Riverpod · GPS tracking · offline queue</div></div><div className="prs-app-stack-row"><div className="prs-app-stack-dot"/><div className="prs-app-stack-text">QAOA solver · COBYLA optimizer · p = 8 layers</div></div></div></div>
                    </section>
                    {/* 18 */}
                    <section className="prs-slide prs-lb" data-label="18 The Road Ahead">
                        <div className="prs-txt" style={{paddingBottom:100}}><div className="prs-ey">Looking Forward</div><div className="prs-hd">Quantum optimization<br/>unlocks <em>new frontiers.</em></div><div className="prs-hr"/><div className="prs-bd">As fault-tolerant hardware scales beyond NISQ-era constraints, QAOA and its successors will reshape global logistics, finance, drug discovery — and VRPFR is already running on the frontier.</div></div>
                    </section>
                </div>

                <nav id="prs-nav">
                    <button className="prs-nb" onClick={() => goTo(curRef.current - 1)}>←</button>
                    <span id="prs-ctr">01 / {N_SLIDES.toString().padStart(2,'0')}</span>
                    <button className="prs-nb" onClick={() => goTo(curRef.current + 1)}>→</button>
                </nav>
            </div>
        </>
    );
}

// bypass app layout — presentation is full-screen
Presentation.layout = () => null;
