// Gus, the grazer mascot. Everything is generated from one parametric drawing so a new
// mood or prop is a few options, not a new illustration.

export type GusEyes = "open" | "happy" | "sleep" | "heart" | "wide" | "dizzy" | "star";
export type GusMouth = "smile" | "grin" | "laugh" | "o" | "oSmall" | "sad" | "smirk" | "flat" | "tongue" | "chew" | "grit" | "wavy";
export type GusBrows = "none" | "up" | "sad" | "angry" | "think";
export type GusExtra = "tears" | "sweat" | "zzz" | "hearts" | "sparks" | "anger" | "confetti";
export type GusProp = "receipt" | "trophy" | "magnifier" | "plate" | "flame";

export interface GusOpts {
  eyes?: GusEyes;
  eyeR?: GusEyes;
  mouth?: GusMouth;
  brows?: GusBrows;
  blush?: boolean;
  extra?: GusExtra[];
  prop?: GusProp;
  body?: "bust" | "full" | "none";
  tilt?: number;
  shades?: boolean;
  dx?: number;
  dy?: number;
  hornC?: string;
  hornS?: string;
  noShadow?: boolean;
  label?: string;
}

export type GusMood =
  | "happy" | "laugh" | "love" | "shock" | "sad" | "angry"
  | "sleepy" | "wink" | "cool" | "think" | "chew" | "dizzy";

export const GUS_MOODS: Record<GusMood, GusOpts> = {
  happy: { eyes: "open", mouth: "smile", brows: "up" },
  laugh: { eyes: "happy", mouth: "laugh" },
  love: { eyes: "heart", mouth: "smile", extra: ["hearts"] },
  shock: { eyes: "wide", mouth: "o", brows: "up", blush: false },
  sad: { eyes: "open", mouth: "sad", brows: "sad", extra: ["tears"], blush: false },
  angry: { eyes: "open", mouth: "grit", brows: "angry", extra: ["anger"], blush: false },
  sleepy: { eyes: "sleep", mouth: "oSmall", extra: ["zzz"] },
  wink: { eyes: "open", eyeR: "happy", mouth: "tongue" },
  cool: { shades: true, mouth: "smirk", blush: false },
  think: { eyes: "open", mouth: "flat", brows: "think", dx: 2.4, dy: -2.4, blush: false },
  chew: { eyes: "open", mouth: "chew" },
  dizzy: { eyes: "dizzy", mouth: "wavy", extra: ["sweat"], blush: false },
};

const INK = "#2B2A27", C = "#FFF8EC", S = "#E9DCC4", GR = "#1D9E75", GRS = "#0F6E56";
const PINK = "#F5A9A4", BRW = "#4A3F33", HOOF = "#5B4636", TONGUE = "#FF6B81";

function eye(type: GusEyes, x: number, y: number, dx = 0, dy = 0): string {
  switch (type) {
    case "open":
      return `<g class="gus-blink"><ellipse cx="${x}" cy="${y}" rx="7.5" ry="9.5" fill="${INK}"/><circle cx="${x + 2.6 + dx}" cy="${y - 3.6 + dy}" r="2.9" fill="#fff"/><circle cx="${x - 2.4 + dx}" cy="${y + 3.2 + dy}" r="1.3" fill="#fff"/></g>`;
    case "happy":
      return `<path d="M${x - 9} ${y + 3} Q${x} ${y - 9} ${x + 9} ${y + 3}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    case "sleep":
      return `<path d="M${x - 9} ${y - 1} Q${x} ${y + 8} ${x + 9} ${y - 1}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
    case "heart":
      return `<path d="M${x} ${y + 9} C${x - 15} ${y - 1} ${x - 7} ${y - 14} ${x} ${y - 5} C${x + 7} ${y - 14} ${x + 15} ${y - 1} ${x} ${y + 9} Z" fill="#FF4D6D"/>`;
    case "wide":
      return `<circle cx="${x}" cy="${y}" r="10.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="4.2" fill="${INK}"/>`;
    case "dizzy":
      return `<path d="M${x - 7} ${y - 7} L${x + 7} ${y + 7} M${x + 7} ${y - 7} L${x - 7} ${y + 7}" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
    case "star":
      return `<path d="M${x} ${y - 11} Q${x + 2} ${y - 2} ${x + 11} ${y} Q${x + 2} ${y + 2} ${x} ${y + 11} Q${x - 2} ${y + 2} ${x - 11} ${y} Q${x - 2} ${y - 2} ${x} ${y - 11} Z" fill="#FFC800" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
  }
}

function brows(type: GusBrows | undefined, y: number): string {
  const L = 76, R = 124;
  const p = (d: string) => `<path d="${d}" fill="none" stroke="${BRW}" stroke-width="4.5" stroke-linecap="round"/>`;
  if (type === "up") return p(`M${L - 8} ${y + 2} Q${L} ${y - 5} ${L + 8} ${y + 2}`) + p(`M${R - 8} ${y + 2} Q${R} ${y - 5} ${R + 8} ${y + 2}`);
  if (type === "sad") return p(`M${L - 8} ${y + 4} L${L + 8} ${y - 3}`) + p(`M${R - 8} ${y - 3} L${R + 8} ${y + 4}`);
  if (type === "angry") return p(`M${L - 9} ${y - 4} L${L + 8} ${y + 5}`) + p(`M${R - 8} ${y + 5} L${R + 9} ${y - 4}`);
  if (type === "think") return p(`M${L - 8} ${y + 2} Q${L} ${y - 6} ${L + 8} ${y + 1}`) + p(`M${R - 8} ${y + 3} L${R + 8} ${y + 3}`);
  return "";
}

function mouth(type: GusMouth): string {
  const st = ` fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  switch (type) {
    case "smile": return `<path d="M89 124 Q100 136 111 124"${st}`;
    case "grin": return `<path d="M86 121 Q100 146 114 121 Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="136" rx="7" ry="4.5" fill="${TONGUE}"/>`;
    case "laugh": return `<path d="M82 119 Q100 154 118 119 Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="139" rx="10" ry="6" fill="${TONGUE}"/>`;
    case "o": return `<ellipse cx="100" cy="131" rx="6" ry="8" fill="${INK}"/>`;
    case "oSmall": return `<ellipse cx="100" cy="129" rx="3.6" ry="4.4" fill="${INK}"/>`;
    case "sad": return `<path d="M90 134 Q100 123 110 134"${st}`;
    case "smirk": return `<path d="M91 128 Q104 135 112 122"${st}`;
    case "flat": return `<path d="M92 128 H108"${st}`;
    case "tongue": return `<path d="M89 124 Q100 136 111 124"${st}<ellipse cx="102" cy="137" rx="5.5" ry="7" fill="${TONGUE}"/><path d="M102 132 V140" stroke="#E2506A" stroke-width="1.6" stroke-linecap="round"/>`;
    case "chew": return `<path d="M89 124 Q100 136 111 124"${st}<g transform="translate(112 127)" fill="none" stroke="#4FA84A" stroke-width="3.6" stroke-linecap="round"><path d="M0 0 q6 -9 14 -13"/><path d="M0 0 q2 -12 8 -19"/><path d="M0 0 q9 -4 17 -4"/></g>`;
    case "grit": return `<path d="M85 134 Q100 120 115 134 L111 138 Q100 128 89 138 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    case "wavy": return `<path d="M86 128 q7 -8 14 0 t14 0"${st}`;
  }
}

const heartSm = (x: number, y: number, k: number, c = "#FF4D6D") =>
  `<path transform="translate(${x} ${y}) scale(${k})" d="M0 7 C-12 -2 -6 -12 0 -5 C6 -12 12 -2 0 7 Z" fill="${c}"/>`;
const spark = (x: number, y: number, k: number) =>
  `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -9 Q1.6 -1.6 9 0 Q1.6 1.6 0 9 Q-1.6 1.6 -9 0 Q-1.6 -1.6 0 -9 Z" fill="#FFC800"/>`;

function confetti(): string {
  const cols = ["#1D9E75", "#D85A30", "#FFC800", "#4DA3FF", "#FF6B81"];
  const pos = [[22, 44], [176, 50], [38, 100], [166, 96], [58, 26], [142, 22], [16, 132], [184, 130]];
  let s = '<g class="gus-conf">';
  pos.forEach((p, i) => {
    const d = (i * 0.22).toFixed(2) + "s", c = cols[i % 5];
    s += i % 2
      ? `<rect x="${p[0]}" y="${p[1]}" width="8" height="5" rx="1.5" fill="${c}" style="--d:${d}"/>`
      : `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${c}" style="--d:${d}"/>`;
  });
  return s + "</g>";
}

function extras(list: GusExtra[] = []): string {
  let s = "";
  for (const e of list) {
    if (e === "tears") s += `<path class="gus-tear" d="M68 104 q-6 12 0 18 q6 -6 0 -18z" fill="#7CC4F5"/><path class="gus-tear" style="animation-delay:.6s" d="M132 104 q-6 12 0 18 q6 -6 0 -18z" fill="#7CC4F5"/>`;
    if (e === "sweat") s += `<path d="M150 62 q-8 14 0 20 q8 -6 0 -20z" fill="#7CC4F5"/>`;
    if (e === "zzz") s += `<g font-family="Nunito, sans-serif" font-weight="900" fill="#7A8CE0"><text x="150" y="58" font-size="18">z</text><text x="164" y="42" font-size="24">z</text><text x="180" y="24" font-size="30">Z</text></g>`;
    if (e === "hearts") s += heartSm(150, 52, 1.2) + heartSm(172, 78, 0.9, "#FF8FA3") + heartSm(32, 60, 1) + heartSm(24, 90, 0.7, "#FF8FA3");
    if (e === "sparks") s += spark(160, 52, 1) + spark(40, 70, 0.8) + spark(176, 100, 0.6);
    if (e === "anger") s += `<g transform="translate(152 66)" stroke="#E4572E" stroke-width="3.6" fill="none" stroke-linecap="round"><path d="M-8 -8 q8 0 8 8"/><path d="M8 -8 q-8 0 -8 8"/><path d="M-8 8 q8 0 8 -8"/><path d="M8 8 q-8 0 -8 -8"/></g>`;
    if (e === "confetti") s += confetti();
  }
  return s;
}

function prop(type: GusProp): string {
  switch (type) {
    case "receipt":
      return `<g transform="translate(116 132) rotate(8)"><path d="M0 0 H48 V58 L43 62 L38 58 L33 62 L28 58 L23 62 L18 58 L13 62 L8 58 L0 62 Z" fill="#fff" stroke="${S}" stroke-width="2"/><rect width="48" height="13" fill="${GR}"/><circle cx="14" cy="6.5" r="2.5" fill="#fff"/><circle cx="24" cy="6.5" r="2.5" fill="#fff"/><circle cx="34" cy="6.5" r="2.5" fill="#fff"/><rect x="8" y="22" width="32" height="4" rx="2" fill="#D3D1C7"/><rect x="8" y="31" width="24" height="4" rx="2" fill="#D3D1C7"/><rect x="8" y="42" width="32" height="5" rx="2.5" fill="${GR}"/></g><ellipse cx="116" cy="170" rx="11" ry="9" fill="${C}" stroke="${S}" stroke-width="2.5"/>`;
    case "trophy":
      return `<g transform="translate(122 128)"><path d="M8 4 Q-6 4 -2 18 Q2 28 14 28" fill="none" stroke="#C99A00" stroke-width="5" stroke-linecap="round"/><path d="M44 4 Q58 4 54 18 Q50 28 38 28" fill="none" stroke="#C99A00" stroke-width="5" stroke-linecap="round"/><path d="M6 0 H46 V18 Q46 38 26 40 Q6 38 6 18 Z" fill="#FFC800"/><path d="M12 6 V18 Q12 30 20 34" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/><rect x="21" y="40" width="10" height="10" fill="#C99A00"/><rect x="11" y="50" width="30" height="9" rx="4" fill="#FFC800"/><path d="M26 11 l3 6 6.5 1 -4.7 4.4 1.2 6.6 -6 -3.2 -6 3.2 1.2 -6.6 -4.7 -4.4 6.5 -1 z" fill="#fff"/></g>`;
    case "magnifier":
      return `<line x1="162" y1="152" x2="186" y2="186" stroke="${HOOF}" stroke-width="9" stroke-linecap="round"/><circle cx="148" cy="132" r="24" fill="#BEE7F8" fill-opacity=".55" stroke="${GRS}" stroke-width="7"/><path d="M134 122 Q138 114 148 112" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
    case "plate":
      return `<ellipse cx="100" cy="194" rx="56" ry="13" fill="#D3D1C7"/><ellipse cx="100" cy="190" rx="56" ry="13" fill="#fff"/><ellipse cx="100" cy="190" rx="38" ry="8" fill="#EFEDE6"/><g stroke="#9C9A92" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M30 176 V196 M24 176 V184 M36 176 V184"/><path d="M172 176 V196 M172 176 q10 6 0 16"/></g>`;
    case "flame":
      return `<g transform="translate(168 156)"><path d="M0 -30 C10 -16 20 -8 20 6 C20 20 11 28 0 28 C-11 28 -20 20 -20 6 C-20 -3 -13 -8 -9 -17 C-6 -10 -2 -8 0 -4 C3 -12 1 -22 0 -30 Z" fill="#FF8A2B"/><path d="M0 -12 C6 -4 12 0 12 8 C12 16 6 22 0 22 C-6 22 -12 16 -12 8 C-12 2 -7 -2 0 -12 Z" fill="#FFD23F"/></g>`;
  }
}

export function gusInner(o: GusOpts): string {
  const full = o.body === "full", none = o.body === "none";
  const hC = o.hornC ?? GR, hS = o.hornS ?? GRS;
  let g = "";
  if (full) {
    g += `<path d="M138 214 q22 -6 26 -24" fill="none" stroke="${S}" stroke-width="12" stroke-linecap="round"/><path d="M138 214 q22 -6 26 -24" fill="none" stroke="${C}" stroke-width="9" stroke-linecap="round"/>`;
    g += `<rect x="70" y="228" width="22" height="22" rx="9" fill="${HOOF}"/><rect x="108" y="228" width="22" height="22" rx="9" fill="${HOOF}"/>`;
    g += `<rect x="52" y="172" width="17" height="42" rx="8.5" fill="${S}" transform="rotate(8 60 174)"/><rect x="52" y="170" width="17" height="42" rx="8.5" fill="${C}" transform="rotate(8 60 174)"/><ellipse cx="66" cy="214" rx="9" ry="8" fill="${HOOF}"/>`;
    g += `<ellipse cx="100" cy="196" rx="42" ry="42" fill="${S}"/><ellipse cx="100" cy="192" rx="42" ry="42" fill="${C}"/><ellipse cx="100" cy="206" rx="22" ry="26" fill="#F4E7D3"/>`;
    g += `<path d="M62 158 Q100 180 138 158 L142 172 Q100 194 58 172 Z" fill="${GR}"/><path d="M118 182 L130 204 L116 206 L108 186 Z" fill="${GRS}"/>`;
  } else if (!none) {
    g += `<ellipse cx="100" cy="200" rx="60" ry="32" fill="${S}"/><ellipse cx="100" cy="196" rx="60" ry="32" fill="${C}"/>`;
    g += `<path d="M56 160 Q100 188 144 160 L150 178 Q100 208 50 178 Z" fill="${GR}"/><path d="M122 184 L136 208 L120 210 L112 190 Z" fill="${GRS}"/>`;
  }
  g += `<rect x="91" y="148" width="18" height="32" rx="9" fill="${S}"/><path d="M100 160 V176" stroke="#D9CBB0" stroke-width="2" stroke-linecap="round"/>`;
  g += `<g class="gus-earL"><rect x="14" y="94" width="44" height="21" rx="10.5" fill="${S}" transform="rotate(-14 36 104)"/><rect x="20" y="98" width="32" height="11" rx="5.5" fill="${PINK}" transform="rotate(-14 36 104)"/></g>`;
  g += `<g class="gus-earR"><rect x="142" y="94" width="44" height="21" rx="10.5" fill="${S}" transform="rotate(14 164 104)"/><rect x="148" y="98" width="32" height="11" rx="5.5" fill="${PINK}" transform="rotate(14 164 104)"/></g>`;
  for (const d of ["M80 58 Q70 28 40 30", "M120 58 Q130 28 160 30"]) {
    g += `<path d="${d}" fill="none" stroke="${hS}" stroke-width="19" stroke-linecap="round" transform="translate(0 3)"/><path d="${d}" fill="none" stroke="${hC}" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${hS}" stroke-width="16" stroke-dasharray="1.6 13" opacity=".35"/><path d="${d}" transform="translate(0 -4.5)" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".3"/>`;
  }
  g += `<circle cx="100" cy="108" r="57" fill="${S}"/><circle cx="100" cy="102" r="57" fill="${C}"/>`;
  g += `<path d="M91 52 Q88 36 100 32 Q112 36 109 52 Z" fill="${C}" stroke="${S}" stroke-width="2.5" stroke-linejoin="round"/>`;
  g += `<path d="M58 84 Q64 60 88 52" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
  g += `<ellipse cx="100" cy="128" rx="31" ry="22" fill="#F4E7D3"/><ellipse cx="100" cy="113" rx="7.5" ry="5" fill="#C98B74"/><path d="M100 118 V123" stroke="#C98B74" stroke-width="2.4" stroke-linecap="round"/>`;
  if (o.blush !== false) g += `<ellipse cx="62" cy="112" rx="9" ry="6" fill="${PINK}" opacity=".65"/><ellipse cx="138" cy="112" rx="9" ry="6" fill="${PINK}" opacity=".65"/>`;
  if (o.shades) {
    g += `<g><rect x="56" y="76" width="39" height="25" rx="11" fill="#1B1B1B"/><rect x="105" y="76" width="39" height="25" rx="11" fill="#1B1B1B"/><path d="M95 84 H105" stroke="#1B1B1B" stroke-width="4"/><path d="M63 82 l9 -2 M112 82 l9 -2" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/></g>`;
  } else {
    g += eye(o.eyes ?? "open", 76, 90, o.dx, o.dy) + eye(o.eyeR ?? o.eyes ?? "open", 124, 90, o.dx, o.dy);
  }
  g += brows(o.brows, 70);
  g += mouth(o.mouth ?? "smile");
  g += extras(o.extra);
  if (o.prop) g += prop(o.prop);
  if (full) {
    g += `<g transform="rotate(-150 138 180)"><g class="gus-wave"><rect x="129" y="178" width="17" height="42" rx="8.5" fill="${S}" transform="translate(0 2)"/><rect x="129" y="176" width="17" height="42" rx="8.5" fill="${C}"/><ellipse cx="137.5" cy="219" rx="9" ry="8" fill="${HOOF}"/></g></g>`;
  }
  return g;
}

export function gusSvg(o: GusOpts = {}): string {
  const full = o.body === "full", h = full ? 262 : 200;
  let s = `<svg viewBox="0 0 200 ${h}" role="img" aria-label="${o.label ?? "Gus"}" xmlns="http://www.w3.org/2000/svg">`;
  if (!o.noShadow) s += `<ellipse class="gus-shadow" cx="100" cy="${h - 6}" rx="46" ry="5"/>`;
  s += `<g class="gus-bob"><g${o.tilt ? ` transform="rotate(${o.tilt} 100 130)"` : ""}><g class="gus-char">${gusInner(o)}</g></g></g></svg>`;
  return s;
}

// Rounded-square app icon: brand green with cream horns
export function gusIconSvg(px = 120): string {
  const inner = gusInner({ eyes: "open", mouth: "smile", brows: "up", body: "none", hornC: "#FFF3DE", hornS: "#D9C7A0" });
  return `<svg width="${px}" height="${px}" viewBox="0 0 200 200" role="img" aria-label="grazer"><rect width="200" height="200" rx="46" fill="${GR}"/><g transform="translate(100 108) scale(.86) translate(-100 -108)">${inner}</g></svg>`;
}
