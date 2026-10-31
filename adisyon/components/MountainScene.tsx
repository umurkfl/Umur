"use client";

import { useEffect, useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Gus } from "@/components/Gus";
import type { GusMood } from "@/lib/gus";

// One illustrated, animated scene per mountain. All scenes share the same main peak so the
// climbing trail and Gus's stops line up: the five stops zig-zag up the left face to the summit.
export const STOPS: [number, number][] = [[180, 224], [222, 184], [206, 144], [236, 102], [240, 52]];
const W = 360, H = 240;

const PEAK = "150,240 240,40 330,240";
const CAP = "240,40 219,86 231,80 240,93 250,80 262,88";
const SHADE = "240,40 330,240 262,240 250,120";

const t = (d: number, delay = 0, extra: CSSProperties = {}): CSSProperties => ({ animationDuration: `${d}s`, animationDelay: `${-delay}s`, ...extra });

function Cloud({ x, y, s = 1, d = 40, delay = 0, color = "#fff", o = 0.95 }: { x: number; y: number; s?: number; d?: number; delay?: number; color?: string; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="ms-cloud" style={t(d, delay)} fill={color} opacity={o}>
        <ellipse cx="0" cy="0" rx="26" ry="9" /><ellipse cx="-14" cy="-6" rx="14" ry="9" /><ellipse cx="8" cy="-9" rx="16" ry="11" />
      </g>
    </g>
  );
}

function Flakes({ n = 22, color = "#fff" }: { n?: number; color?: string }) {
  return (
    <g fill={color}>
      {Array.from({ length: n }).map((_, i) => (
        <circle key={i} className="ms-flake" cx={(i * 47) % W} cy="0" r={1.2 + (i % 3) * 0.7} style={t(5 + (i % 5), (i * 1.3) % 9)} />
      ))}
    </g>
  );
}

function Stars({ n = 40 }: { n?: number }) {
  return (
    <g fill="#fff">
      {Array.from({ length: n }).map((_, i) => (
        <circle key={i} className="ms-twinkle" cx={(i * 83 + 17) % W} cy={(i * 37 + 9) % 130} r={0.8 + (i % 3) * 0.5} style={t(2 + (i % 4), (i * 0.7) % 4)} />
      ))}
    </g>
  );
}

function Pine({ x, y, s = 1, c = "#1F7A58" }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.6" y="-4" width="3.2" height="8" fill="#6B4A2E" />
      <polygon points="0,-30 -10,-10 10,-10" fill={c} /><polygon points="0,-22 -12,0 12,0" fill={c} /><polygon points="0,-14 -14,10 14,10" fill={c} />
    </g>
  );
}

function Scene({ range, id }: { range: number; id: string }) {
  const sky = (a: string, b: string) => (
    <defs>
      <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      <radialGradient id={`glow-${id}`}><stop offset="0" stopColor="#FFF3B0" stopOpacity=".9" /><stop offset="1" stopColor="#FFF3B0" stopOpacity="0" /></radialGradient>
    </defs>
  );
  const bg = <rect width={W} height={H} fill={`url(#sky-${id})`} />;
  const faces = (main: string, snow: string, shade = "#000") => (
    <>
      <polygon points={PEAK} fill={main} />
      <polygon points={SHADE} fill={shade} opacity=".14" />
      <polygon points={CAP} fill={snow} />
    </>
  );
  const fg = (c: string) => <path d={`M-10 240 Q60 205 140 228 T380 222 V240 Z`} fill={c} />;

  switch (range) {
    case 0: // Uludağ: sunny alpine meadow
      return (
        <>
          {sky("#BFE6FF", "#EAF8FF")}{bg}
          <circle cx="62" cy="52" r="46" fill={`url(#glow-${id})`} /><g className="ms-ray" style={{ transformOrigin: "62px 52px" }}><circle cx="62" cy="52" r="17" fill="#FFD54A" /></g>
          <Cloud x={0} y={46} d={46} delay={10} /><Cloud x={0} y={86} s={0.7} d={62} delay={32} o={0.85} />
          <polygon points="-10,240 30,150 70,184 110,128 170,200 210,160 250,240" fill="#A8D8B9" />
          <polygon points="60,240 110,150 160,210 190,170 240,240" fill="#7CC79C" />
          {faces("#5DA07A", "#fff")}
          {fg("#3FAE7A")}
          <Pine x={52} y={216} s={1.1} /><Pine x={74} y={224} s={0.8} /><Pine x={300} y={214} s={1.2} /><Pine x={326} y={224} s={0.9} /><Pine x={128} y={226} s={0.7} />
          <g fill="#FF8FA8"><circle cx="96" cy="230" r="2.4" /><circle cx="110" cy="234" r="2.4" /><circle cx="270" cy="232" r="2.4" fill="#FFD54A" /><circle cx="290" cy="236" r="2.4" /></g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${70 + i * 90} ${150 + i * 14})`}><g className="ms-fly" style={t(7 + i * 2, i * 2)}><g className="ms-wing"><ellipse cx="-3" cy="0" rx="3.4" ry="2.4" fill={["#FFB84D", "#7BC6FF", "#FF8FA8"][i]} /><ellipse cx="3" cy="0" rx="3.4" ry="2.4" fill={["#FFB84D", "#7BC6FF", "#FF8FA8"][i]} /></g></g></g>
          ))}
        </>
      );
    case 1: // Toroslar: warm rocky dusk with an eagle
      return (
        <>
          {sky("#FFD3A0", "#FFF0DC")}{bg}
          <circle cx="300" cy="92" r="50" fill={`url(#glow-${id})`} opacity=".7" /><circle cx="300" cy="92" r="19" fill="#FF9A4D" />
          <Cloud x={0} y={54} d={52} delay={20} color="#FFF3E6" /><Cloud x={0} y={30} s={0.8} d={70} delay={4} color="#FFF3E6" o={0.8} />
          <polygon points="-10,240 30,160 70,200 120,120 170,210 230,170 290,240" fill="#D7B3A8" />
          <polygon points="40,240 100,170 150,220 200,150 260,240" fill="#B98778" />
          {faces("#8F5E52", "#fff", "#2B1A16")}
          <polygon points="170,150 190,120 200,150" fill="#6B4A44" opacity=".5" /><polygon points="270,170 292,140 308,172" fill="#6B4A44" opacity=".4" />
          <path d="M-10 240 Q70 208 150 230 T380 224 V240 Z" fill="#6B4A44" />
          <polygon points="20,236 40,212 62,236" fill="#5A3C37" /><polygon points="300,234 322,206 346,234" fill="#5A3C37" />
          <g transform="translate(0 70)"><g className="ms-bird" style={t(18, 4)}><path d="M0 0 q10 -10 20 0 q10 -10 20 0" fill="none" stroke="#3A2623" strokeWidth="3" strokeLinecap="round" /></g></g>
        </>
      );
    case 2: // Kafkaslar: icy and snowing
      return (
        <>
          {sky("#A9CCF5", "#EAF3FF")}{bg}
          <Cloud x={0} y={44} d={60} delay={12} color="#F3F8FF" /><Cloud x={0} y={80} s={0.8} d={80} delay={40} color="#F3F8FF" o={0.8} />
          <polygon points="-10,240 30,140 80,190 130,110 190,200 235,150 300,240" fill="#BFD8F2" />
          <polygon points="30,240 90,160 140,215 190,140 250,240" fill="#93B7DE" />
          {faces("#6E9ACB", "#fff", "#0B1E44")}
          <polygon points="205,118 222,150 196,156" fill="#CFE8FF" opacity=".55" /><polygon points="262,150 284,200 252,196" fill="#CFE8FF" opacity=".4" />
          <rect x="0" y="214" width={W} height="26" fill="#CFE8FF" /><ellipse cx="100" cy="224" rx="60" ry="6" fill="#fff" opacity=".6" className="ms-glint" />
          <Pine x={48} y={214} s={1} c="#3C6F8F" /><Pine x={70} y={220} s={0.7} c="#3C6F8F" /><Pine x={310} y={212} s={1.1} c="#3C6F8F" />
          <Flakes n={26} />
        </>
      );
    case 3: // Alpler: sunrise valley with a cable car
      return (
        <>
          {sky("#FFC9D6", "#FFF3DA")}{bg}
          <circle cx="70" cy="178" r="60" fill={`url(#glow-${id})`} opacity=".8" /><circle cx="70" cy="178" r="22" fill="#FFC15A" />
          <Cloud x={0} y={40} d={54} delay={6} color="#FFEFF3" /><Cloud x={0} y={72} s={0.75} d={74} delay={36} color="#FFEFF3" o={0.8} />
          <polygon points="-10,240 20,150 70,190 120,120 175,205 225,150 290,240" fill="#CBB9E8" />
          <polygon points="40,240 100,170 150,220 205,148 260,240" fill="#9DB6E0" />
          {faces("#7E9CC9", "#fff", "#1B2A66")}
          <polygon points="150,240 172,208 196,240" fill="#7FC88A" /><polygon points="258,240 290,206 330,240" fill="#7FC88A" />
          <path d="M-10 240 Q60 210 140 230 T380 224 V240 Z" fill="#5DB36F" />
          <line x1="60" y1="206" x2="226" y2="92" stroke="#6B5A66" strokeWidth="1.4" />
          <g transform="translate(60 206)"><g className="ms-tram" style={t(16)}><line x1="0" y1="0" x2="0" y2="7" stroke="#6B5A66" strokeWidth="1.4" /><rect x="-7" y="7" width="14" height="10" rx="2.5" fill="#FF5A7A" /><rect x="-4.6" y="9.4" width="9.2" height="4" rx="1" fill="#FFF3DA" /></g></g>
          <g transform="translate(300 214)"><rect x="-12" y="0" width="24" height="16" fill="#E8C79A" /><polygon points="-15,0 0,-12 15,0" fill="#B8461F" /><rect x="-3" y="6" width="6" height="10" fill="#6B4A2E" />
            {[0, 1, 2].map((i) => <circle key={i} className="ms-smoke" cx="7" cy="-10" r="3" fill="#fff" style={t(4, i * 1.3)} />)}</g>
          <Pine x={40} y={224} s={0.9} c="#2F8F5B" /><Pine x={96} y={228} s={0.7} c="#2F8F5B" /><Pine x={336} y={226} s={0.9} c="#2F8F5B" />
        </>
      );
    case 4: // Himalayalar: night, aurora, prayer flags
      return (
        <>
          {sky("#1D2160", "#6F5CB0")}{bg}<Stars n={46} />
          <g className="ms-aurora" style={t(9)}><path d="M-10 70 C60 20 120 100 190 48 S320 40 380 70 V104 C310 84 260 120 190 92 S60 130 -10 104Z" fill="#48F2B4" opacity=".28" /></g>
          <g className="ms-aurora" style={t(12, 3)}><path d="M-10 92 C70 52 130 120 210 70 S320 70 380 90 V116 C300 104 250 134 200 112 S70 142 -10 118Z" fill="#FF7BD5" opacity=".2" /></g>
          <polygon points="-10,240 20,140 70,188 118,96 178,204 226,138 300,240" fill="#4B58A0" />
          <polygon points="40,240 100,150 160,212 200,140 262,240" fill="#6B79C4" />
          {faces("#8E9BD6", "#fff", "#0B0F40")}
          <path d="M-10 240 Q60 214 140 232 T380 226 V240 Z" fill="#2C3070" />
          <line x1="20" y1="196" x2="150" y2="186" stroke="#E8DDF5" strokeWidth="1" /><line x1="20" y1="196" x2="20" y2="232" stroke="#E8DDF5" strokeWidth="1.6" /><line x1="150" y1="186" x2="150" y2="230" stroke="#E8DDF5" strokeWidth="1.6" />
          {["#FF5A7A", "#FFC800", "#4DA3FF", "#1D9E75", "#fff", "#FF8A2B", "#B05BFF"].map((c, i) => (
            <polygon key={i} className="ms-flag" style={t(1.4 + (i % 3) * 0.3, i * 0.2)} points={`${28 + i * 17},${195 - i * 1.4} ${40 + i * 17},${195.5 - i * 1.4} ${34 + i * 17},${206 - i * 1.4}`} fill={c} />
          ))}
        </>
      );
    default: // GOAT peak: golden summit above a sea of clouds
      return (
        <>
          {sky("#0E1240", "#4B2E8C")}{bg}<Stars n={60} />
          <g className="ms-shoot" style={t(7)}><line x1="30" y1="30" x2="70" y2="50" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></g>
          <g className="ms-ray" style={{ transformOrigin: "240px 70px", animationDuration: "50s" }} opacity=".18" fill="#FFD84A">
            {Array.from({ length: 12 }).map((_, i) => <polygon key={i} points="240,70 228,-90 252,-90" transform={`rotate(${i * 30} 240 70)`} />)}
          </g>
          <circle cx="240" cy="60" r="70" fill={`url(#glow-${id})`} />
          <polygon points="-10,240 50,170 110,214 150,160 200,226 260,150 330,240" fill="#3A2F7A" opacity=".7" />
          <polygon points={PEAK} fill="#FFC800" /><polygon points={SHADE} fill="#C99A00" opacity=".6" /><polygon points={CAP} fill="#FFF3B0" />
          <polygon points="196,150 214,118 224,150" fill="#FFE27A" opacity=".75" />
          <g transform="translate(240 36)"><polygon points="-10,0 -10,-12 -5,-6 0,-16 5,-6 10,-12 10,0" fill="#D85A30" stroke="#B8461F" strokeWidth="1" strokeLinejoin="round" /></g>
          <Cloud x={0} y={226} s={2.6} d={44} delay={5} color="#E8DDF8" o={0.92} /><Cloud x={0} y={210} s={2} d={60} delay={30} color="#F6EEFF" o={0.9} /><Cloud x={0} y={232} s={3} d={38} delay={16} color="#D6C8F0" o={0.95} />
          {[[70, 70], [300, 40], [180, 96]].map(([x, y], i) => <path key={i} className="ms-twinkle" style={t(2, i)} d={`M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6}Z`} fill="#FFE27A" />)}
        </>
      );
  }
}

interface Props {
  range: number;
  state: "current" | "done" | "locked";
  /** index of Gus's stop inside this range (0..4); only for state="current" */
  stop?: number;
  /** progress toward the next stop, 0..1 */
  progress?: number;
  mood?: GusMood;
  className?: string;
  children?: ReactNode;
}

export function MountainScene({ range, state, stop = 0, progress = 0, mood = "happy", className = "", children }: Props) {
  const id = useId().replace(/:/g, "");
  const nStops = range === 5 ? 1 : STOPS.length;
  const reached = state === "done" ? nStops : state === "current" ? stop + 1 : 0;

  // Gus walks from where he was to where he is: set the target after mount so the move animates
  const target = (() => {
    const a = STOPS[Math.min(stop, STOPS.length - 1)], b = STOPS[Math.min(stop + 1, STOPS.length - 1)];
    const p = stop >= STOPS.length - 1 ? 0 : progress;
    return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p] as [number, number];
  })();
  const [pos, setPos] = useState<[number, number]>(STOPS[0]);
  useEffect(() => { if (state !== "current") return; const tm = setTimeout(() => setPos(target), 350); return () => clearTimeout(tm); }, [state, target[0], target[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const gusAt = state === "current" ? pos : null;

  return (
    <div className={`relative overflow-hidden rounded-3xl border-2 border-b-4 border-border bg-surface ${className}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" style={state === "locked" ? { filter: "grayscale(.85) brightness(1.05)" } : undefined} role="img" aria-hidden>
        <Scene range={range} id={id} />
        {range !== 5 && (
          <>
            <polyline points={STOPS.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="2.4" strokeDasharray="1 6" strokeLinecap="round" />
            {STOPS.map((p, i) => (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r={i < reached ? 6 : 4.5} fill={i < reached ? "#1D9E75" : "rgba(255,255,255,.55)"} stroke="#fff" strokeWidth="2" />
                {i < reached && <path d={`M${p[0] - 2.2} ${p[1]} l2 2 l3 -4`} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
              </g>
            ))}
            {reached >= STOPS.length && (
              <g transform={`translate(${STOPS[4][0]} ${STOPS[4][1] - 6})`}>
                <line x1="0" y1="0" x2="0" y2="-24" stroke="#4A3F33" strokeWidth="2" strokeLinecap="round" />
                <polygon className="ms-flag" style={t(1.3)} points="0,-24 17,-19 0,-13" fill="#D85A30" />
              </g>
            )}
          </>
        )}
      </svg>

      {gusAt && (
        <div className="ms-gus absolute" style={{ left: `${(gusAt[0] / W) * 100}%`, top: `${(gusAt[1] / H) * 100}%`, width: "19%", transform: "translate(-50%, -88%)", transition: "left 1.2s cubic-bezier(.3,1.3,.5,1), top 1.2s cubic-bezier(.3,1.3,.5,1)" }}>
          <Gus mood={mood} size={64} />
        </div>
      )}

      {state === "locked" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/35 backdrop-blur-[1.5px]">
          <span className="rounded-2xl bg-white/90 border-2 border-b-4 border-border px-4 py-2 text-sm font-black text-muted">Kilitli dağ</span>
        </div>
      )}
      {children}
    </div>
  );
}
