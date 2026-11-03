"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Gus } from "@/components/Gus";
import type { GusMood } from "@/lib/gus";
import { CloverIcon } from "@/components/Icons";

// One illustrated, animated scene per mountain. All scenes share the same main peak so the
// climbing trail and Gus's stops line up: the five stops zig-zag up the left face to the summit.
export const STOPS: [number, number][] = [[180, 224], [222, 184], [206, 144], [236, 102], [240, 52]];
const W = 360, H = 240;

const PEAK = "150,240 240,40 330,240";
const CAP = "240,40 219,86 231,80 240,93 250,80 262,88";
const CAP_SHADE = "240,40 240,93 250,80 262,88";
const SHADE = "240,40 330,240 262,240 250,120";

const t = (d: number, delay = 0, extra: CSSProperties = {}): CSSProperties => ({ animationDuration: `${d}s`, animationDelay: `${-delay}s`, ...extra });

/** a small two-stop vertical gradient */
function VGrad({ id, stops }: { id: string; stops: [number, string, number?][] }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([o, c, op], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />)}
    </linearGradient>
  );
}

function Cloud({ x, y, s = 1, d = 40, delay = 0, color = "#fff", shade = "#E4EEF8", o = 1 }: { x: number; y: number; s?: number; d?: number; delay?: number; color?: string; shade?: string; o?: number }) {
  return (
    <g className="ms-cloud" style={t(d, delay)} opacity={o}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M-30 4 Q-32 -6 -20 -7 Q-18 -18 -6 -16 Q2 -26 14 -18 Q26 -20 26 -8 Q36 -6 32 4 Z" fill={shade} />
        <path d="M-28 1 Q-30 -8 -19 -9 Q-17 -19 -6 -17.5 Q2 -27 13 -19.5 Q25 -21 24.5 -10 Q33 -8 30 1 Z" fill={color} />
        <ellipse cx="-4" cy="-14" rx="7" ry="3" fill="#fff" opacity=".7" />
      </g>
    </g>
  );
}

/** a seamless band of cloud bumps that loops sideways (sea of clouds, valley fog) */
function CloudBand({ y, color, d, h = 14, period = 60, o = 1, reverse = false }: { y: number; color: string; d: number; h?: number; period?: number; o?: number; reverse?: boolean }) {
  let p = `M-${period * 2} ${y + 40} V${y}`;
  for (let x = -period * 2; x < W + period * 2; x += period / 2) p += ` q${period / 4} -${h} ${period / 2} 0`;
  p += ` V${y + 40} Z`;
  return (
    <g className="ms-band" style={{ ...t(d), animationDirection: reverse ? "reverse" : "normal", ["--p" as string]: `${-period}px` }} opacity={o}>
      <path d={p} fill={color} />
    </g>
  );
}

function Flakes({ n = 22, color = "#fff", big = false }: { n?: number; color?: string; big?: boolean }) {
  return (
    <g fill={color} opacity={big ? 0.95 : 0.7}>
      {Array.from({ length: n }).map((_, i) => (
        <circle key={i} className={big ? "ms-flake2" : "ms-flake"} cx={(i * 47 + (big ? 23 : 0)) % W} cy="-6" r={big ? 2 + (i % 2) * 0.8 : 0.9 + (i % 3) * 0.5} style={t(big ? 3.6 + (i % 4) * 0.6 : 7 + (i % 5), (i * 1.37) % 9)} />
      ))}
    </g>
  );
}

/** stars twinkle in four groups (one animation per group keeps it cheap) */
function Stars({ n = 40, maxY = 130 }: { n?: number; maxY?: number }) {
  return (
    <g fill="#fff">
      {[0, 1, 2, 3].map((k) => (
        <g key={k} className="ms-twinkle" style={t(2.2 + k * 0.7, k * 0.9)}>
          {Array.from({ length: Math.ceil(n / 4) }).map((_, j) => {
            const i = j * 4 + k;
            return <circle key={i} cx={(i * 83 + 17) % W} cy={(i * 37 + 9) % maxY} r={0.6 + (i % 3) * 0.45} />;
          })}
        </g>
      ))}
    </g>
  );
}

const sparkD = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;

function Sparkles({ pts, color = "#FFE27A" }: { pts: [number, number, number][]; color?: string }) {
  return <>{pts.map(([x, y, r], i) => <path key={i} className="ms-sparkle" style={t(1.8 + (i % 3) * 0.5, i * 0.6)} d={sparkD(x, y, r)} fill={color} />)}</>;
}

function Sun({ id, x, y, r, color, glow, rays = true }: { id: string; x: number; y: number; r: number; color: string; glow: string; rays?: boolean }) {
  return (
    <g>
      <defs>
        <radialGradient id={`sun-${id}`}><stop offset="0" stopColor={glow} stopOpacity=".85" /><stop offset=".45" stopColor={glow} stopOpacity=".35" /><stop offset="1" stopColor={glow} stopOpacity="0" /></radialGradient>
      </defs>
      {rays && (
        <g transform={`translate(${x} ${y})`}>
          <g className="ms-ray" style={t(60)} fill={glow} opacity=".2">
            {Array.from({ length: 12 }).map((_, i) => <polygon key={i} points={`0,0 -${r * 0.32},-${r * (i % 2 ? 3.2 : 4.4)} ${r * 0.32},-${r * (i % 2 ? 3.2 : 4.4)}`} transform={`rotate(${i * 30})`} />)}
          </g>
        </g>
      )}
      <circle className="ms-pulse" cx={x} cy={y} r={r * 3.2} fill={`url(#sun-${id})`} style={t(4)} />
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.55} fill="#fff" opacity=".28" />
    </g>
  );
}

function Birds({ y, d = 20, delay = 0, color = "#3A3A55", s = 1 }: { y: number; d?: number; delay?: number; color?: string; s?: number }) {
  return (
    <g className="ms-bird" style={t(d, delay)}>
      <g transform={`translate(0 ${y}) scale(${s})`}>
        {[[0, 0, 1], [14, 6, 0.8], [-10, 9, 0.7]].map(([bx, by, k], i) => (
          <g key={i} transform={`translate(${bx} ${by}) scale(${k})`}>
            <path className="ms-flapb" style={t(0.5 + i * 0.07, i * 0.2)} d="M-7 0 Q-3.5 -4 0 0 Q3.5 -4 7 0" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </g>
    </g>
  );
}

function Pine({ x, y, s = 1, c = "#1F7A58", snow = false, d = 5 }: { x: number; y: number; s?: number; c?: string; snow?: boolean; d?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="10" rx="12" ry="2.6" fill="#000" opacity=".12" />
      <g className="ms-sway" style={t(d, x % 3)}>
        <rect x="-1.8" y="2" width="3.6" height="9" rx="1" fill="#6B4A2E" />
        {([["0,-30 -10,-10 10,-10", "0,-30 0,-10 10,-10", "0,-30 -5,-20 -2.5,-21.5 0,-19 2.5,-21.5 5,-20"], ["0,-22 -12,0 12,0", "0,-22 0,0 12,0", "0,-22 -6.5,-10 -3,-12 0,-9 3,-12 6.5,-10"], ["0,-14 -14,8 14,8", "0,-14 0,8 14,8", "0,-14 -7.5,-2 -3.5,-4 0,-1 3.5,-4 7.5,-2"]] as const).map(([a, b, cap], i) => (
          <g key={i}><polygon points={a} fill={c} /><polygon points={b} fill="#000" opacity=".16" />{snow && <polygon points={cap} fill="#fff" strokeLinejoin="round" />}</g>
        ))}
      </g>
    </g>
  );
}

function Tufts({ pts, c = "#2E9A5E" }: { pts: [number, number][]; c?: string }) {
  return (
    <g fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round">
      {pts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path className="ms-grass" style={t(2.4 + (i % 3) * 0.6, i * 0.4)} d="M0 0 Q-2 -4 -5 -7 M0 0 Q0 -5 1 -9 M0 0 Q2 -4 5 -6" />
        </g>
      ))}
    </g>
  );
}

function Flowers({ pts }: { pts: [number, number, string][] }) {
  return <>{pts.map(([x, y, c], i) => (
    <g key={i} transform={`translate(${x} ${y})`}>
      <g className="ms-nod" style={t(3 + (i % 3), i * 0.5)}>
        <path d="M0 0 V5" stroke="#2E8F57" strokeWidth="1.2" />
        <circle r="2.6" fill={c} /><circle r="1" fill="#FFF3B0" />
      </g>
    </g>
  ))}</>;
}

function Butterfly({ x, y, c, d, delay }: { x: number; y: number; c: string; d: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ms-fly" style={t(d, delay)}>
        <g className="ms-wing" style={t(0.32, delay)}>
          <path d="M0 0 Q-6 -7 -6 -1 Q-6 3 0 1 Z M0 0 Q6 -7 6 -1 Q6 3 0 1 Z" fill={c} />
          <path d="M0 1 Q-4 5 -2 6 Q0 5 0 2 Z M0 1 Q4 5 2 6 Q0 5 0 2 Z" fill={c} opacity=".75" />
        </g>
        <rect x="-.6" y="-2" width="1.2" height="5" rx=".6" fill="#3A2A20" />
      </g>
    </g>
  );
}

/** the shared main peak: lit face, shaded face, cracks, snow cap */
function Peak({ id, top, base, shade, crack, snow = "#fff", snowShade = "#D6E4F2", cap = CAP, capShade = CAP_SHADE }: { id: string; top: string; base: string; shade: string; crack: string; snow?: string; snowShade?: string; cap?: string; capShade?: string }) {
  return (
    <g>
      <defs><VGrad id={`peak-${id}`} stops={[[0, top], [1, base]]} /></defs>
      <polygon points={PEAK} fill={`url(#peak-${id})`} />
      <polygon points="240,40 150,240 166,240 236,58" fill="#fff" opacity=".14" />
      <polygon points={SHADE} fill={shade} opacity=".38" />
      <polygon points="250,120 262,240 246,240 247,160" fill={shade} opacity=".18" />
      <g fill="none" stroke={crack} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".35">
        <path d="M212 112 L206 126 L211 134" /><path d="M192 168 L186 184 L190 192" /><path d="M268 128 L274 148 L270 160" /><path d="M286 184 L294 206" /><path d="M230 210 L226 228" />
      </g>
      <polygon points={cap} fill={snow} strokeLinejoin="round" />
      <polygon points={capShade} fill={snowShade} />
    </g>
  );
}

function Scene({ range, id, summitGus }: { range: number; id: string; summitGus: boolean }) {
  const sky = (stops: [number, string][]) => (
    <>
      <defs><VGrad id={`sky-${id}`} stops={stops} /></defs>
      <rect width={W} height={H} fill={`url(#sky-${id})`} />
    </>
  );
  // far and mid ranges fade into a soft haze at their feet
  const ridge = (points: string, c: string, haze: string, cls: string, key: string, hazeOp = 0.7) => (
    <g className={cls}>
      <defs><VGrad id={`r${key}-${id}`} stops={[[0, c], [0.55, c], [1, haze, hazeOp]]} /></defs>
      <polygon points={points} fill={`url(#r${key}-${id})`} />
    </g>
  );

  switch (range) {
    case 0: // Uludağ: sunny alpine meadow
      return (
        <>
          {sky([[0, "#7CC8F8"], [0.6, "#C4E9FF"], [1, "#EFFAFF"]])}
          <Sun id={id} x={62} y={50} r={15} color="#FFD54A" glow="#FFF0A0" />
          <Cloud x={0} y={40} s={1.1} d={58} delay={12} /><Cloud x={0} y={78} s={0.7} d={84} delay={48} o={0.9} /><Cloud x={0} y={28} s={0.55} d={110} delay={80} o={0.8} />
          <Birds y={70} d={26} delay={6} color="#3B5A78" s={0.8} />
          {ridge("-20,240 -20,170 30,140 70,170 110,120 160,180 200,150 260,240", "#A6D9C8", "#E6F6EE", "ms-par-far", "a")}
          {ridge("40,240 90,160 130,196 170,150 230,240", "#7CC79C", "#CDEBD7", "ms-par-mid", "b", 0.9)}
          <Pine x={96} y={176} s={0.45} c="#3E9B6A" /><Pine x={110} y={182} s={0.4} c="#3E9B6A" /><Pine x={150} y={174} s={0.42} c="#3E9B6A" />
          <Peak id={id} top="#78B98F" base="#4F9670" shade="#1D4A35" crack="#1D4A35" />
          <g fill="#8FD19F" opacity=".55"><path d="M168 214 Q186 200 204 212 Q190 220 168 214 Z" /><path d="M196 166 Q210 156 222 166 Q210 172 196 166 Z" /><path d="M262 196 Q280 186 296 198 Q280 204 262 196 Z" /></g>
          <Pine x={276} y={168} s={0.4} c="#2A7A52" /><Pine x={286} y={176} s={0.34} c="#2A7A52" /><Pine x={196} y={200} s={0.36} c="#2A7A52" />
          <g className="ms-par-fg">
            <defs><VGrad id={`fg-${id}`} stops={[[0, "#58C186"], [1, "#2F9A60"]]} /></defs>
            <path d="M-20 240 V218 Q50 196 130 222 T300 214 Q350 210 380 220 V240 Z" fill="#46B074" />
            <path d="M-20 240 V230 Q60 210 150 232 T380 226 V240 Z" fill={`url(#fg-${id})`} />
            <Pine x={44} y={214} s={1.15} c="#1F7A58" /><Pine x={68} y={222} s={0.82} c="#24875F" d={6} /><Pine x={302} y={210} s={1.25} c="#1F7A58" d={5.6} /><Pine x={330} y={222} s={0.9} c="#24875F" /><Pine x={130} y={228} s={0.66} c="#24875F" d={4.6} />
            <Tufts pts={[[20, 234], [98, 232], [118, 236], [160, 236], [258, 232], [280, 236], [350, 236], [200, 238]]} c="#24875F" />
            <Flowers pts={[[90, 230, "#FF8FA8"], [106, 235, "#FFD54A"], [266, 231, "#FFFFFF"], [288, 235, "#FF8FA8"], [24, 228, "#B98BFF"], [346, 230, "#FFD54A"]]} />
          </g>
          <g transform="scale(1.35)"><Butterfly x={64} y={142} c="#FFB84D" d={8} delay={1} /><Butterfly x={110} y={152} c="#7BC6FF" d={10} delay={4} /><Butterfly x={214} y={130} c="#FF8FA8" d={9} delay={7} /></g>
        </>
      );
    case 1: // Toroslar: warm rocky dusk, cedars and a circling eagle
      return (
        <>
          {sky([[0, "#FF9F6E"], [0.5, "#FFC896"], [1, "#FFEBD2"]])}
          <Sun id={id} x={306} y={96} r={18} color="#FF8A3D" glow="#FFD27A" />
          <Cloud x={0} y={50} d={64} delay={20} color="#FFE7D6" shade="#F6B9A0" /><Cloud x={0} y={28} s={0.7} d={90} delay={4} color="#FFE7D6" shade="#F6B9A0" o={0.85} /><Cloud x={0} y={84} s={0.5} d={120} delay={60} color="#FFDCC8" shade="#F0A88E" o={0.7} />
          {ridge("-20,240 -20,180 30,150 60,176 110,110 150,170 190,140 250,240", "#D6A29A", "#FFE2C8", "ms-par-far", "a")}
          {ridge("30,240 80,170 110,190 150,140 200,200 230,240", "#B37A6C", "#E9BFA6", "ms-par-mid", "b", 0.9)}
          <polygon points="150,140 140,160 156,158" fill="#8C574B" opacity=".5" />
          <Peak id={id} top="#A86A57" base="#7A4A3F" shade="#2B1410" crack="#3C1F18" snow="#FFF4EA" snowShade="#F2CDB8" />
          <g fill="none" stroke="#5A3027" strokeWidth="1" opacity=".22"><path d="M196 140 Q230 132 252 142" /><path d="M176 186 Q226 176 290 188" /></g>
          {/* eagle circling the summit: two offset sine motions draw an ellipse */}
          <g transform="translate(240 58)">
            <g className="ms-orbx" style={t(5)}><g className="ms-orby" style={t(5, 2.5)}>
              <g className="ms-glide" style={t(1.6)}>
                <path d="M0 0 C-6 -4 -13 -4 -20 1 C-13 -1 -7 1 -2 3 L0 6 L2 3 C7 1 13 -1 20 1 C13 -4 6 -4 0 0 Z" fill="#3A2320" />
                <circle cx="0" cy="-1" r="2" fill="#F5EDE0" /><path d="M-2 6 L0 9 L2 6 Z" fill="#3A2320" />
              </g>
            </g></g>
          </g>
          <Birds y={40} d={30} delay={14} color="#6B3A30" s={0.6} />
          <g className="ms-par-fg">
            <path d="M-20 240 V222 Q70 200 150 228 T380 218 V240 Z" fill="#7A4A40" />
            <path d="M-20 240 V232 Q80 216 170 234 T380 230 V240 Z" fill="#5E3832" />
            <g fill="#4A2C27"><path d="M14 236 L30 214 L40 220 L56 236 Z" /><path d="M296 234 L312 210 L324 216 L346 234 Z" /></g>
            <g fill="#fff" opacity=".12"><path d="M30 214 L34 222 L24 228 Z" /><path d="M312 210 L316 220 L304 226 Z" /></g>
            {/* Toros cedars: flat, tiered crowns */}
            {[[84, 228, 1], [116, 232, 0.7], [270, 226, 0.9]].map(([x, y, s], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                <rect x="-1.6" y="-14" width="3.2" height="16" fill="#4A2E20" />
                <g className="ms-sway" style={t(5 + i)}>
                  <ellipse cx="0" cy="-14" rx="16" ry="4" fill="#3F6B4A" /><ellipse cx="0" cy="-21" rx="12" ry="3.6" fill="#4A7A55" /><ellipse cx="0" cy="-27" rx="7" ry="3" fill="#568A60" />
                  <ellipse cx="4" cy="-13" rx="10" ry="2.2" fill="#000" opacity=".15" />
                </g>
              </g>
            ))}
            <Tufts pts={[[150, 236], [186, 238], [226, 236], [250, 238]]} c="#8C6A3A" />
          </g>
        </>
      );
    case 2: // Kafkaslar: icy, windy and snowing
      return (
        <>
          {sky([[0, "#6FA6EA"], [0.55, "#B6D5F7"], [1, "#EEF6FF"]])}
          <Sun id={id} x={84} y={44} r={11} color="#FFF8E0" glow="#FFFFFF" rays={false} />
          <Cloud x={0} y={44} d={70} delay={12} color="#F3F8FF" shade="#CADCF2" /><Cloud x={0} y={80} s={0.8} d={96} delay={40} color="#F3F8FF" shade="#CADCF2" o={0.85} />
          <Flakes n={18} />
          {ridge("-20,240 -20,160 20,130 60,160 100,100 150,170 190,130 250,240", "#C3D9F2", "#F0F7FF", "ms-par-far", "a")}
          <g className="ms-par-far"><polygon points="100,100 88,124 98,118 106,128 114,118" fill="#fff" opacity=".9" /><polygon points="20,130 10,148 20,142 30,150" fill="#fff" opacity=".9" /></g>
          {ridge("20,240 80,150 120,196 170,130 230,240", "#90B4DE", "#D4E6F8", "ms-par-mid", "b", 0.95)}
          <polygon points="170,130 156,156 168,150 176,160 184,150" fill="#fff" opacity=".9" />
          <Peak id={id} top="#7FA8D8" base="#5480B8" shade="#0B2350" crack="#163A70" cap="240,40 210,104 224,96 232,108 244,94 256,104 272,112" capShade="240,40 244,94 256,104 272,112" snowShade="#C8DCF2" />
          <g fill="#fff" opacity=".55"><polygon points="196,150 206,134 210,152" /><polygon points="270,150 282,176 264,172" /></g>
          <g transform="translate(244 44)"><g className="ms-plume" style={t(4)}><ellipse cx="14" cy="0" rx="16" ry="4" fill="#fff" opacity=".8" /><ellipse cx="30" cy="-2" rx="10" ry="3" fill="#fff" opacity=".6" /></g></g>
          <Sparkles pts={[[210, 100, 4], [268, 116, 3], [196, 160, 3.4]]} color="#fff" />
          <g className="ms-par-fg">
            <defs><VGrad id={`fg-${id}`} stops={[[0, "#FFFFFF"], [1, "#D6E7FA"]]} /></defs>
            <path d="M-20 240 V214 Q60 200 150 222 T380 212 V240 Z" fill="#CFE2F8" />
            <path d="M-20 240 V226 Q70 210 160 230 T380 224 V240 Z" fill={`url(#fg-${id})`} />
            <path d="M40 232 Q90 224 140 232" fill="none" stroke="#B8D2F0" strokeWidth="2" strokeLinecap="round" />
            <Pine x={44} y={212} s={1.05} c="#2F607F" snow /><Pine x={68} y={220} s={0.72} c="#386E8F" snow d={6} /><Pine x={310} y={208} s={1.15} c="#2F607F" snow d={5.4} /><Pine x={336} y={220} s={0.8} c="#386E8F" snow />
            {/* snowman */}
            <g transform="translate(118 222)">
              <ellipse cx="0" cy="8" rx="10" ry="2.4" fill="#9DBCE0" opacity=".5" />
              <circle cx="0" cy="2" r="7" fill="#fff" /><circle cx="0" cy="-8" r="5" fill="#fff" />
              <circle cx="-1.6" cy="-9" r=".9" fill="#2B2A27" /><circle cx="1.8" cy="-9" r=".9" fill="#2B2A27" /><path d="M0 -7.4 L4.6 -6.6 L0 -6 Z" fill="#FF8A2B" />
              <path d="M-4.6 -4 Q0 -2 4.6 -4 L4 -2 Q0 -.6 -4 -2 Z" fill="#D85A30" />
              <path d="M5 -1 L11 -5 M-5 -1 L-11 -4" stroke="#6B4A2E" strokeWidth="1" strokeLinecap="round" />
            </g>
          </g>
          <Flakes n={14} big />
        </>
      );
    case 3: // Alpler: sunrise valley with a chalet and a cable car
      return (
        <>
          {sky([[0, "#FFA6BE"], [0.5, "#FFCFC4"], [1, "#FFF2D8"]])}
          <Sun id={id} x={70} y={150} r={20} color="#FFBE55" glow="#FFE3A0" />
          <Cloud x={0} y={40} d={62} delay={6} color="#FFEFF3" shade="#F8C6D4" /><Cloud x={0} y={72} s={0.75} d={88} delay={36} color="#FFEFF3" shade="#F8C6D4" o={0.85} /><Cloud x={0} y={24} s={0.5} d={120} delay={70} color="#FFF5F7" shade="#F8C6D4" o={0.75} />
          <Birds y={58} d={24} delay={2} color="#7A4A66" s={0.75} />
          {ridge("-20,240 -20,170 20,140 60,176 110,110 160,180 200,150 260,240", "#C6B2E4", "#FFE6E4", "ms-par-far", "a")}
          <g className="ms-par-far"><polygon points="110,110 98,132 108,126 116,136 124,126" fill="#fff" opacity=".85" /></g>
          {ridge("30,240 90,166 130,200 175,146 240,240", "#98AEDC", "#E2DFF2", "ms-par-mid", "b", 0.9)}
          <Peak id={id} top="#8EA8D6" base="#6582B6" shade="#18235A" crack="#26346E" snowShade="#E8D2E2" />
          <polygon points="240,40 219,86 226,82 240,48" fill="#FFE6C8" opacity=".55" />
          <g className="ms-par-fg">
            <defs><VGrad id={`fg-${id}`} stops={[[0, "#72C67E"], [1, "#46A35E"]]} /></defs>
            <path d="M-20 240 V214 Q60 200 140 224 T380 214 V240 Z" fill="#62B872" />
            <path d="M-20 240 V228 Q70 212 150 232 T380 226 V240 Z" fill={`url(#fg-${id})`} />
            {/* cable car: towers, cable, a gondola that rides up and back */}
            <line x1="20" y1="208" x2="150" y2="128" stroke="#5A4A58" strokeWidth="1.3" />
            <g fill="#6B5A66"><path d="M18 214 L20 206 L22 214 Z" /><rect x="144" y="126" width="12" height="9" rx="1.5" /></g>
            <g transform="translate(20 208)"><g className="ms-tram" style={t(14)}>
              <line x1="0" y1="0" x2="0" y2="6" stroke="#5A4A58" strokeWidth="1.3" /><circle cx="0" cy="0" r="1.6" fill="#5A4A58" />
              <rect x="-7.5" y="6" width="15" height="11" rx="3" fill="#E8435E" /><rect x="-7.5" y="6" width="15" height="3" rx="1.5" fill="#B82E48" />
              <rect x="-5.2" y="10" width="4.4" height="4" rx="1" fill="#FFF3DA" /><rect x=".8" y="10" width="4.4" height="4" rx="1" fill="#FFF3DA" />
            </g></g>
            {/* chalet */}
            <g transform="translate(300 214)">
              <ellipse cx="0" cy="17" rx="20" ry="3" fill="#000" opacity=".12" />
              <rect x="-13" y="0" width="26" height="17" fill="#D9A46A" />
              <g stroke="#B5804A" strokeWidth=".8"><line x1="-13" y1="5" x2="13" y2="5" /><line x1="-13" y1="10" x2="13" y2="10" /></g>
              <polygon points="-17,1 0,-13 17,1" fill="#B8461F" /><polygon points="0,-13 17,1 11,1" fill="#8E3416" />
              <path d="M-15 -1 L0 -11 L15 -1" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
              <rect x="-3" y="7" width="6" height="10" rx="1" fill="#6B4A2E" />
              <rect x="-10" y="5" width="5" height="4.6" rx="1" className="ms-window" fill="#FFE08A" /><rect x="5" y="5" width="5" height="4.6" rx="1" className="ms-window" style={t(5, 2)} fill="#FFE08A" />
              <rect x="6" y="-12" width="4" height="7" fill="#7A5A44" />
              {[0, 1, 2].map((i) => <circle key={i} className="ms-smoke" cx="8" cy="-13" r="3" fill="#fff" style={t(4, i * 1.33)} />)}
            </g>
            <Pine x={40} y={226} s={0.85} c="#2F8F5B" /><Pine x={92} y={230} s={0.66} c="#2F8F5B" d={6} /><Pine x={340} y={226} s={0.9} c="#2F8F5B" d={5.5} />
            <Tufts pts={[[120, 234], [160, 236], [214, 236], [252, 234], [272, 238]]} c="#3A9358" />
            <Flowers pts={[[132, 234, "#FFFFFF"], [176, 236, "#FFD54A"], [240, 236, "#FF8FA8"], [262, 233, "#B98BFF"]]} />
          </g>
        </>
      );
    case 4: // Himalayalar: night, moon, aurora, prayer flags
      return (
        <>
          {sky([[0, "#0C1248"], [0.55, "#2A2C7A"], [1, "#6A55B0"]])}
          <Stars n={52} />
          <g className="ms-shoot" style={t(9, 2)}><line x1="40" y1="24" x2="62" y2="35" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></g>
          <defs>
            <VGrad id={`au1-${id}`} stops={[[0, "#48F2B4", 0], [0.5, "#48F2B4", 0.35], [0.85, "#7DFFD0", 0.75], [1, "#D8FFF0", 0.9]]} />
            <VGrad id={`au2-${id}`} stops={[[0, "#FF7BD5", 0], [0.6, "#C88BFF", 0.35], [1, "#FFC6F0", 0.7]]} />
            <VGrad id={`au3-${id}`} stops={[[0, "#8BFFD8", 0], [1, "#8BFFD8", 0.5]]} />
            <radialGradient id={`moon-${id}`}><stop offset="0" stopColor="#FFF6D6" stopOpacity=".6" /><stop offset="1" stopColor="#FFF6D6" stopOpacity="0" /></radialGradient>
          </defs>
          <g className="ms-aurora2" style={t(13, 3)}><path d="M-50 56 C70 30 130 96 210 56 S320 52 410 68 V104 C300 92 250 124 200 102 S70 130 -50 108 Z" fill={`url(#au2-${id})`} /></g>
          <g className="ms-aurora" style={t(9)}>
            <path d="M-50 30 C60 10 120 70 190 30 S320 20 410 40 V84 C310 66 260 104 190 76 S60 110 -50 88 Z" fill={`url(#au1-${id})`} />
          </g>
          <g className="ms-aurora2" style={t(7, 1)}><path d="M-50 20 C40 4 110 44 180 18 S300 6 410 26 V40 C320 24 250 56 180 36 S60 40 -50 36 Z" fill={`url(#au3-${id})`} /></g>
          <circle className="ms-pulse" cx="70" cy="56" r="34" fill={`url(#moon-${id})`} style={t(5)} />
          <circle cx="70" cy="56" r="12" fill="#FFF6D6" /><circle cx="66" cy="53" r="2.6" fill="#E8DDB4" /><circle cx="74" cy="60" r="1.8" fill="#E8DDB4" /><circle cx="73" cy="50" r="1.2" fill="#E8DDB4" />
          {ridge("-20,240 -20,170 20,130 70,170 118,90 178,190 226,130 290,240", "#3E4A98", "#7464B8", "ms-par-far", "a", 0.8)}
          <g className="ms-par-far"><polygon points="118,90 106,114 116,108 124,118 132,108" fill="#DDE2FF" opacity=".85" /><polygon points="20,130 12,146 22,140 30,148" fill="#DDE2FF" opacity=".8" /></g>
          {ridge("30,240 90,150 140,206 190,140 250,240", "#5866B8", "#8C7CC8", "ms-par-mid", "b", 0.8)}
          <Peak id={id} top="#9AA6E4" base="#6874C0" shade="#0A0E3E" crack="#1A1F60" snowShade="#B7C0F0" />
          <Sparkles pts={[[226, 70, 3], [254, 96, 2.6]]} color="#fff" />
          <CloudBand y={208} color="#8C7CC8" d={30} o={0.5} />
          <g className="ms-par-fg">
            <path d="M-20 240 V218 Q60 204 140 228 T380 220 V240 Z" fill="#2C3072" />
            <path d="M-20 240 V230 Q80 216 160 234 T380 228 V240 Z" fill="#20245E" />
            {/* stupa */}
            <g transform="translate(306 214)">
              <rect x="-14" y="6" width="28" height="8" rx="1" fill="#E8E4F5" /><path d="M-10 6 Q-10 -6 0 -6 Q10 -6 10 6 Z" fill="#F4F1FB" />
              <rect x="-4" y="-12" width="8" height="6" fill="#E8E4F5" /><polygon points="-3,-12 0,-24 3,-12" fill="#FFC800" />
              <circle cx="0" cy="0" r="2" fill="#FFC800" /><rect x="-14" y="6" width="28" height="8" fill="#0A0E3E" opacity=".12" />
            </g>
            {/* prayer flags on two lines */}
            {[{ x1: 14, y1: 194, x2: 150, y2: 180, n: 8 }, { x1: 258, y1: 186, x2: 356, y2: 198, n: 6 }].map((L, li) => (
              <g key={li}>
                <path d={`M${L.x1} ${L.y1} Q${(L.x1 + L.x2) / 2} ${(L.y1 + L.y2) / 2 + 8} ${L.x2} ${L.y2}`} fill="none" stroke="#E8DDF5" strokeWidth=".9" />
                <line x1={L.x1} y1={L.y1} x2={L.x1} y2={240} stroke="#E8DDF5" strokeWidth="1.6" /><line x1={L.x2} y1={L.y2} x2={L.x2} y2={240} stroke="#E8DDF5" strokeWidth="1.6" />
                {Array.from({ length: L.n }).map((_, i) => {
                  const k = (i + 0.5) / L.n, x = L.x1 + (L.x2 - L.x1) * k, y = L.y1 + (L.y2 - L.y1) * k + 8 * 4 * k * (1 - k) * 0.5 + 1;
                  return <rect key={i} className="ms-flag" style={t(1.2 + (i % 3) * 0.3, i * 0.2)} x={x - 4} y={y} width="8" height="10" rx="1" fill={["#4DA3FF", "#FFFFFF", "#FF5A5A", "#2BBE7E", "#FFC800"][(i + li) % 5]} />;
                })}
              </g>
            ))}
          </g>
        </>
      );
    default: // GOAT peak: golden summit above a sea of clouds
      return (
        <>
          {sky([[0, "#0B0E3A"], [0.5, "#3A2580"], [1, "#B55A9C"]])}
          <Stars n={60} maxY={150} />
          <g className="ms-shoot" style={t(7)}><line x1="30" y1="30" x2="60" y2="45" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></g>
          <g transform="translate(240 60)">
            <g className="ms-ray" style={t(50)} fill="#FFD84A" opacity=".09">
              {Array.from({ length: 12 }).map((_, i) => <polygon key={i} points="0,0 -12,-170 12,-170" transform={`rotate(${i * 30})`} />)}
            </g>
          </g>
          <defs>
            <radialGradient id={`glow-${id}`}><stop offset="0" stopColor="#FFF3B0" stopOpacity=".9" /><stop offset="1" stopColor="#FFF3B0" stopOpacity="0" /></radialGradient>
            <VGrad id={`gold-${id}`} stops={[[0, "#FFE680"], [0.5, "#FFC800"], [1, "#E0A000"]]} />
          </defs>
          <circle className="ms-pulse" cx="240" cy="60" r="80" fill={`url(#glow-${id})`} style={t(4)} />
          {ridge("-20,240 -20,190 40,160 100,206 150,150 200,220 270,140 380,200 380,240", "#4A3290", "#B55A9C", "ms-par-far", "a", 0.6)}
          <polygon points={PEAK} fill={`url(#gold-${id})`} />
          <polygon points="240,40 150,240 168,240 236,60" fill="#FFF6C8" opacity=".5" />
          <polygon points={SHADE} fill="#B07800" opacity=".55" />
          <g fill="#FFF3B0" opacity=".55"><polygon points="196,150 214,118 224,150" /><polygon points="222,200 232,176 240,204" /></g>
          <g fill="#A06A00" opacity=".25"><polygon points="276,150 290,180 270,186" /><polygon points="296,200 310,226 288,230" /></g>
          <polygon points={CAP} fill="#FFFBE0" /><polygon points={CAP_SHADE} fill="#FFE68A" />
          {!summitGus && (
            <g transform="translate(240 36)"><g className="ms-crown" style={t(2.6)}>
              <polygon points="-11,0 -11,-12 -5.5,-6 0,-16 5.5,-6 11,-12 11,0" fill="#FF6B3D" stroke="#C8461F" strokeWidth="1" strokeLinejoin="round" /><circle cx="0" cy="-5" r="1.8" fill="#FFF3B0" />
            </g></g>
          )}
          <Sparkles pts={[[70, 70, 5], [300, 40, 5], [180, 96, 4], [214, 130, 3.4], [276, 120, 3], [330, 90, 4]]} />
          <CloudBand y={196} color="#9A7AD8" d={40} h={16} period={80} o={0.75} />
          <CloudBand y={208} color="#D8C6F4" d={26} h={14} period={64} reverse />
          <CloudBand y={222} color="#F4ECFF" d={18} h={12} period={52} />
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
  /** yonca needed to reach this mountain; shown on the lock ribbon */
  unlockAt?: number;
  /** yonca still missing; shown under the ribbon */
  missing?: number;
  children?: ReactNode;
}

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
// near the summit Gus stands a little lower so his horns stay inside the frame
const stand = ([x, y]: [number, number]): [number, number] => [x, y + Math.max(0, 70 - y) * 0.45];

export function MountainScene({ range, state, stop = 0, progress = 0, mood = "happy", className = "", unlockAt, missing, children }: Props) {
  const id = useId().replace(/:/g, "");
  const nStops = range === 5 ? 1 : STOPS.length;
  const reached = state === "done" ? nStops : state === "current" ? stop + 1 : 0;
  const current = state === "current";

  // where Gus ends up: between his stop and the next one; on the GOAT peak, the summit
  const target = ((): [number, number] => {
    if (range === 5) return STOPS[4];
    const s = Math.min(stop, STOPS.length - 1);
    const a = STOPS[s], b = STOPS[Math.min(s + 1, STOPS.length - 1)];
    const p = s >= STOPS.length - 1 ? 0 : progress;
    return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
  })();
  const gusStop = range === 5 ? 4 : Math.min(stop, STOPS.length - 1);

  const box = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") { setOnScreen(true); setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { setOnScreen(e.isIntersecting); if (e.intersectionRatio >= 0.5) setSeen(true); }, { threshold: [0, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Gus climbs stop by stop once the scene is in view: a few bouncy hops per leg, then a happy landing
  const [pos, setPos] = useState<[number, number]>(STOPS[0]);
  const [leg, setLeg] = useState(0);
  const [lit, setLit] = useState(current ? 1 : reached);
  const [phase, setPhase] = useState<"wait" | "walk" | "here">("wait");
  const [dir, setDir] = useState(1);
  useEffect(() => {
    if (!current || !seen) return;
    const path: [number, number][] = [...STOPS.slice(0, gusStop + 1), target];
    if (reduceMotion()) { setPos(target); setLit(reached); setPhase("here"); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 450;
    setPos(path[0]); setLit(1); setPhase("wait");
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1], [bx, by] = path[i];
      const dist = Math.hypot(bx - ax, by - ay);
      if (dist < 1) continue;
      const ms = Math.max(420, dist * 13);
      timers.push(setTimeout(() => { setLeg(ms); setPos(path[i]); setDir(bx >= ax ? 1 : -1); setPhase("walk"); }, at));
      at += ms;
      if (i <= gusStop) timers.push(setTimeout(() => setLit(i + 1), at));
      at += 120;
    }
    timers.push(setTimeout(() => { setLit(reached); setPhase("here"); }, at));
    return () => timers.forEach(clearTimeout);
  }, [current, seen, gusStop, target[0], target[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = current ? lit : reached;
  const gusAt = current ? stand(pos) : null;
  const ring = current && range !== 5 ? STOPS[gusStop] : null;
  const next = current && range !== 5 && gusStop < STOPS.length - 1 ? STOPS[gusStop + 1] : null;
  const trailDone = STOPS.slice(0, Math.max(shown, 0));

  return (
    <div ref={box} className={`ms-scene relative overflow-hidden rounded-3xl border-2 border-b-4 border-border bg-surface ${onScreen ? "" : "ms-paused"} ${className}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-hidden>
        <Scene range={range} id={id} summitGus={current && range === 5} />
        {range !== 5 && (
          <>
            <polyline points={STOPS.map((p) => p.join(",")).join(" ")} fill="none" stroke="#3A2A20" strokeOpacity=".16" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={STOPS.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2.4" strokeDasharray="1 6" strokeLinecap="round" />
            {trailDone.length > 1 && <polyline points={trailDone.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {next && <circle className="ms-beckon" cx={next[0]} cy={next[1]} r="7" fill="#fff" />}
            {ring && phase === "here" && <><circle className="ms-ring" cx={ring[0]} cy={ring[1]} r="7" fill="none" stroke="#fff" strokeWidth="2.4" /><circle className="ms-ring" style={{ animationDelay: "-1s" }} cx={ring[0]} cy={ring[1]} r="7" fill="none" stroke="#FFE27A" strokeWidth="2" /></>}
            {STOPS.map((p, i) => {
              const on = i < shown;
              return (
                <g key={i + (on ? "on" : "off")} className={on && current ? "ms-pop" : undefined}>
                  <circle cx={p[0]} cy={p[1] + 1.6} r={on ? 6.4 : 4.8} fill="#000" opacity=".18" />
                  <circle cx={p[0]} cy={p[1]} r={on ? 6.4 : 4.8} fill={on ? "#1D9E75" : state === "locked" ? "rgba(40,36,60,.55)" : "rgba(255,255,255,.7)"} stroke="#fff" strokeWidth="2" />
                  {on && <path d={`M${p[0] - 2.4} ${p[1]} l2 2.2 l3.4 -4.2`} fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />}
                </g>
              );
            })}
            {shown >= STOPS.length && (
              <g transform={`translate(${STOPS[4][0]} ${STOPS[4][1] - 6})`}>
                <line x1="0" y1="0" x2="0" y2="-24" stroke="#4A3F33" strokeWidth="2" strokeLinecap="round" />
                <path className="ms-flag" style={t(1.3)} d="M0 -24 Q9 -24 18 -19 Q9 -15 0 -13 Z" fill="#D85A30" />
              </g>
            )}
          </>
        )}
        {gusAt && phase === "here" && (
          <Sparkles pts={[[gusAt[0] - 30, gusAt[1] - 34, 4.5], [gusAt[0] + 28, gusAt[1] - 46, 3.6], [gusAt[0] + 32, gusAt[1] - 10, 3], [gusAt[0] - 26, gusAt[1] - 4, 2.6]]} color={range >= 4 ? "#FFE27A" : "#FFF3A6"} />
        )}
      </svg>

      {gusAt && (
        <div
          className={`ms-gus absolute ${phase === "walk" ? "ms-walking" : ""} ${phase === "here" ? "ms-arrived" : ""}`}
          style={{ left: `${(gusAt[0] / W) * 100}%`, top: `${(gusAt[1] / H) * 100}%`, width: "17%", transform: "translate(-50%, -86%)", transition: `left ${leg}ms cubic-bezier(.45,.05,.4,1), top ${leg}ms cubic-bezier(.45,.05,.4,1)`, ["--dir" as string]: dir }}
        >
          <div className="ms-step"><Gus mood={mood} size={64} /></div>
        </div>
      )}

      {state === "locked" && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(30,27,70,.18) 0%, rgba(30,27,70,.12) 40%, rgba(30,27,56,.6) 100%)" }}>
          <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <svg width="62" height="70" viewBox="0 0 62 70" className="ms-lock drop-shadow-[0_4px_0_rgba(0,0,0,.25)]" aria-hidden>
              <path d="M16 32V22a15 15 0 0 1 30 0v10" fill="none" stroke="#B9BFCC" strokeWidth="8" strokeLinecap="round" />
              <path d="M16 32V22a15 15 0 0 1 30 0v10" fill="none" stroke="#EEF1F6" strokeWidth="3" strokeLinecap="round" />
              <rect x="6" y="30" width="50" height="36" rx="10" fill="#F5B82E" stroke="#B8860B" strokeWidth="3" />
              <rect x="10" y="33" width="42" height="8" rx="4" fill="#FFE08A" opacity=".7" />
              <circle cx="31" cy="46" r="5" fill="#8A5A00" /><rect x="29" y="47" width="4" height="10" rx="2" fill="#8A5A00" />
            </svg>
          </div>
          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1">
            {unlockAt != null && (
              <span className="flex items-center gap-1.5 rounded-full bg-white border-2 border-b-4 border-gold-shade px-3.5 py-1 text-sm font-black text-charcoal shadow">
                <CloverIcon size={18} />{unlockAt.toLocaleString("tr-TR")} yonca
              </span>
            )}
            {missing != null && missing > 0 && <span className="text-[11px] font-extrabold text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,.5)]">{missing.toLocaleString("tr-TR")} yonca kaldı</span>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
