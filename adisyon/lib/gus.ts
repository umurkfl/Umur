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
  /** kept for API compatibility: Gus is always the chubby full figure; "none" only affects the app icon crop */
  body?: "bust" | "full" | "none";
  tilt?: number;
  shades?: boolean;
  dx?: number;
  dy?: number;
  hornC?: string;
  hornS?: string;
  noShadow?: boolean;
  label?: string;
  viewBox?: string;
  /** equipped costume ids by slot (see lib/shop.ts) */
  look?: { head?: string; face?: string; neck?: string; horn?: string };
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
const PINK = "#F5A9A4", BRW = "#4A3F33", HOOF = "#33312D", TONGUE = "#FF6B81", BELLY = "#F4E7D3", EYE_RIM = "#E3D6BC";

function eye(type: GusEyes, x: number, y: number, dx = 0, dy = 0): string {
  switch (type) {
    case "open":
      return `<g class="gus-blink"><circle cx="${x}" cy="${y}" r="20" fill="#fff" stroke="${EYE_RIM}" stroke-width="2.5"/><circle cx="${x + 2 + dx}" cy="${y + 2 + dy}" r="10.5" fill="${INK}"/><circle cx="${x + 5.5 + dx}" cy="${y - 2 + dy}" r="3.6" fill="#fff"/><circle cx="${x - 2 + dx}" cy="${y + 6 + dy}" r="1.6" fill="#fff"/></g>`;
    case "happy":
      return `<path d="M${x - 13} ${y + 5} Q${x} ${y - 14} ${x + 13} ${y + 5}" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>`;
    case "sleep":
      return `<path d="M${x - 13} ${y - 2} Q${x} ${y + 12} ${x + 13} ${y - 2}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    case "heart":
      return `<path d="M${x} ${y + 12} C${x - 20} ${y - 2} ${x - 10} ${y - 18} ${x} ${y - 7} C${x + 10} ${y - 18} ${x + 20} ${y - 2} ${x} ${y + 12} Z" fill="#FF4D6D"/>`;
    case "wide":
      return `<circle cx="${x}" cy="${y}" r="21" fill="#fff" stroke="${EYE_RIM}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="5.5" fill="${INK}"/>`;
    case "dizzy":
      return `<path d="M${x - 10} ${y - 10} L${x + 10} ${y + 10} M${x + 10} ${y - 10} L${x - 10} ${y + 10}" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>`;
    case "star":
      return `<path d="M${x} ${y - 14} Q${x + 3} ${y - 3} ${x + 14} ${y} Q${x + 3} ${y + 3} ${x} ${y + 14} Q${x - 3} ${y + 3} ${x - 14} ${y} Q${x - 3} ${y - 3} ${x} ${y - 14} Z" fill="#FFC800" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
}

function brows(type: GusBrows | undefined, y: number): string {
  const L = 76, R = 124;
  const p = (d: string) => `<path d="${d}" fill="none" stroke="${BRW}" stroke-width="5" stroke-linecap="round"/>`;
  if (type === "up") return p(`M${L - 11} ${y + 3} Q${L} ${y - 6} ${L + 11} ${y + 3}`) + p(`M${R - 11} ${y + 3} Q${R} ${y - 6} ${R + 11} ${y + 3}`);
  if (type === "sad") return p(`M${L - 11} ${y + 5} L${L + 11} ${y - 4}`) + p(`M${R - 11} ${y - 4} L${R + 11} ${y + 5}`);
  if (type === "angry") return p(`M${L - 12} ${y - 5} L${L + 11} ${y + 7}`) + p(`M${R - 11} ${y + 7} L${R + 12} ${y - 5}`);
  if (type === "think") return p(`M${L - 11} ${y + 3} Q${L} ${y - 8} ${L + 11} ${y + 2}`) + p(`M${R - 11} ${y + 4} L${R + 11} ${y + 4}`);
  return "";
}

function mouth(type: GusMouth): string {
  const st = ` fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
  switch (type) {
    case "smile": return `<path d="M89 124 Q100 137 111 124"${st}`;
    case "grin": return `<path d="M86 121 Q100 148 114 121 Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="137" rx="7.5" ry="4.8" fill="${TONGUE}"/>`;
    case "laugh": return `<path d="M82 119 Q100 156 118 119 Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="140" rx="10" ry="6" fill="${TONGUE}"/>`;
    case "o": return `<ellipse cx="100" cy="131" rx="6.5" ry="8.5" fill="${INK}"/>`;
    case "oSmall": return `<ellipse cx="100" cy="129" rx="3.8" ry="4.6" fill="${INK}"/>`;
    case "sad": return `<path d="M90 135 Q100 123 110 135"${st}`;
    case "smirk": return `<path d="M91 128 Q104 136 113 122"${st}`;
    case "flat": return `<path d="M92 129 H108"${st}`;
    case "tongue": return `<path d="M89 124 Q100 137 111 124"${st}<ellipse cx="102" cy="138" rx="5.8" ry="7.4" fill="${TONGUE}"/><path d="M102 133 V141" stroke="#E2506A" stroke-width="1.6" stroke-linecap="round"/>`;
    case "chew": return `<path d="M89 124 Q100 137 111 124"${st}<g transform="translate(112 127)" fill="none" stroke="#4FA84A" stroke-width="3.8" stroke-linecap="round"><path d="M0 0 q6 -9 14 -13"/><path d="M0 0 q2 -12 8 -19"/><path d="M0 0 q9 -4 17 -4"/></g>`;
    case "grit": return `<path d="M85 135 Q100 120 115 135 L111 139 Q100 129 89 139 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    case "wavy": return `<path d="M86 129 q7 -8 14 0 t14 0"${st}`;
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
    if (e === "tears") s += `<path class="gus-tear" d="M62 112 q-6 13 0 19 q6 -6 0 -19z" fill="#7CC4F5"/><path class="gus-tear" style="animation-delay:.6s" d="M138 112 q-6 13 0 19 q6 -6 0 -19z" fill="#7CC4F5"/>`;
    if (e === "sweat") s += `<path d="M150 70 q-8 14 0 20 q8 -6 0 -20z" fill="#7CC4F5"/>`;
    if (e === "zzz") s += `<g font-family="Nunito, sans-serif" font-weight="900" fill="#7A8CE0"><text x="158" y="96" font-size="18">z</text><text x="170" y="80" font-size="24">z</text><text x="182" y="62" font-size="28">Z</text></g>`;
    if (e === "hearts") s += heartSm(162, 94, 1.2) + heartSm(180, 72, 0.9, "#FF8FA3") + heartSm(34, 94, 1) + heartSm(20, 72, 0.7, "#FF8FA3");
    if (e === "sparks") s += spark(166, 92, 1) + spark(34, 92, 0.8) + spark(180, 120, 0.6);
    if (e === "anger") s += `<g transform="translate(162 90)" stroke="#E4572E" stroke-width="3.6" fill="none" stroke-linecap="round"><path d="M-8 -8 q8 0 8 8"/><path d="M8 -8 q-8 0 -8 8"/><path d="M-8 8 q8 0 8 -8"/><path d="M8 8 q-8 0 -8 -8"/></g>`;
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


function costumes(look: NonNullable<GusOpts["look"]>): string {
  let g = "";
  switch (look.neck) {
    case "scarf": g += `<path d="M50 158 Q100 184 150 158 L154 172 Q100 198 46 172 Z" fill="#D85A30"/><path d="M118 180 L128 202 L112 204 L106 184 Z" fill="#B8461F"/>`; break;
    case "bow": g += `<path d="M100 164 L80 152 V176 Z M100 164 L120 152 V176 Z" fill="#FF4D6D"/><circle cx="100" cy="164" r="6" fill="#D63030"/>`; break;
  }
  switch (look.head) {
    case "cap": g += `<path d="M70 64 C70 36 130 36 130 64 Z" fill="#1D9E75"/><path d="M64 64 Q100 76 136 64 Q100 56 64 64 Z" fill="#0F6E56"/><circle cx="100" cy="40" r="3.4" fill="#0F6E56"/>`; break;
    case "chef": g += `<path d="M74 64 V52 C58 52 58 30 78 30 C80 18 122 18 124 30 C142 30 142 52 126 52 V64 Z" fill="#fff" stroke="#E3D6BC" stroke-width="2.4" stroke-linejoin="round"/>`; break;
    case "party": g += `<path d="M100 14 L126 64 H74 Z" fill="#FF6B81"/><path d="M89 38 L112 38 M82 52 L119 52" stroke="#FFD166" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="14" r="6" fill="#FFC800"/>`; break;
    case "phones": g += `<path d="M42 110 C42 40 158 40 158 110" fill="none" stroke="#33312D" stroke-width="8" stroke-linecap="round"/><rect x="30" y="94" width="20" height="34" rx="9" fill="#4DA3FF"/><rect x="150" y="94" width="20" height="34" rx="9" fill="#4DA3FF"/>`; break;
    case "flower": g += `<g transform="translate(72 54)"><g fill="#fff"><circle cx="0" cy="-8" r="6.4"/><circle cx="7.6" cy="-2.5" r="6.4"/><circle cx="4.7" cy="6.5" r="6.4"/><circle cx="-4.7" cy="6.5" r="6.4"/><circle cx="-7.6" cy="-2.5" r="6.4"/></g><circle r="5" fill="#FFC800"/></g>`; break;
    case "crown": g += `<path d="M72 64 L72 36 L87 50 L100 28 L113 50 L128 36 L128 64 Z" fill="#C99A00" transform="translate(0 3)"/><path d="M72 64 L72 36 L87 50 L100 28 L113 50 L128 36 L128 64 Z" fill="#FFC800" stroke="#FFC800" stroke-width="4" stroke-linejoin="round"/><circle cx="100" cy="46" r="4.4" fill="#E4572E"/><circle cx="84" cy="54" r="3" fill="#1D9E75"/><circle cx="116" cy="54" r="3" fill="#4DA3FF"/>`; break;
  }
  return g;
}

export function gusInner(o: GusOpts): string {
  const hC = o.hornC ?? (o.look?.horn === "gold" ? "#FFC800" : GR), hS = o.hornS ?? (o.look?.horn === "gold" ? "#D9A400" : GRS);
  let g = "";
  // horns (swept back, brand green)
  for (const d of ["M72 62 C60 24 28 10 4 30 C36 30 56 48 62 80 Z", "M128 62 C140 24 172 10 196 30 C164 30 144 48 138 80 Z"]) {
    g += `<path d="${d}" fill="${hS}" transform="translate(0 3)"/><path d="${d}" fill="${hC}"/>`;
  }
  // ears
  g += `<g class="gus-earL"><ellipse cx="28" cy="110" rx="22" ry="11" fill="${S}" transform="rotate(-22 28 110)"/><ellipse cx="28" cy="107" rx="22" ry="11" fill="${C}" transform="rotate(-22 28 107)"/><ellipse cx="31" cy="108" rx="12" ry="5.5" fill="${PINK}" transform="rotate(-22 31 108)"/></g>`;
  g += `<g class="gus-earR"><ellipse cx="172" cy="110" rx="22" ry="11" fill="${S}" transform="rotate(22 172 110)"/><ellipse cx="172" cy="107" rx="22" ry="11" fill="${C}" transform="rotate(22 172 107)"/><ellipse cx="169" cy="108" rx="12" ry="5.5" fill="${PINK}" transform="rotate(22 169 108)"/></g>`;
  // hooves + goatee
  g += `<rect x="62" y="168" width="28" height="22" rx="11" fill="${HOOF}"/><rect x="110" y="168" width="28" height="22" rx="11" fill="${HOOF}"/>`;
  g += `<path d="M91 166 Q100 202 109 166 Z" fill="${S}" stroke="${S}" stroke-width="7" stroke-linejoin="round"/>`;
  // body = head
  g += `<ellipse cx="100" cy="116" rx="66" ry="68" fill="${S}" transform="translate(0 5)"/><ellipse cx="100" cy="116" rx="66" ry="68" fill="${C}"/>`;
  g += `<ellipse cx="100" cy="158" rx="38" ry="26" fill="${BELLY}"/>`;
  g += `<ellipse cx="100" cy="136" rx="27" ry="19" fill="${BELLY}"/><ellipse cx="100" cy="126" rx="7" ry="5" fill="#C98B74"/>`;
  if (o.blush !== false) g += `<ellipse cx="56" cy="124" rx="10" ry="6.5" fill="${PINK}" opacity=".75"/><ellipse cx="144" cy="124" rx="10" ry="6.5" fill="${PINK}" opacity=".75"/>`;
  // eyes
  if (o.shades || o.look?.face === "shades") {
    g += `<g><rect x="46" y="74" width="50" height="34" rx="14" fill="#1B1B1B"/><rect x="104" y="74" width="50" height="34" rx="14" fill="#1B1B1B"/><path d="M96 84 H104" stroke="#1B1B1B" stroke-width="5"/><path d="M54 84 l12 -3 M112 84 l12 -3" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".45"/></g>`;
  } else {
    g += eye(o.eyes ?? "open", 76, 92, o.dx, o.dy) + eye(o.eyeR ?? o.eyes ?? "open", 124, 92, o.dx, o.dy);
  }
  g += brows(o.brows, 62);
  g += `<g transform="translate(0 14)">${mouth(o.mouth ?? "smile")}</g>`;
  if (o.look) g += costumes(o.look);
  g += extras(o.extra);
  if (o.prop) g += prop(o.prop);
  return g;
}

export function gusSvg(o: GusOpts = {}): string {
  let s = `<svg viewBox="${o.viewBox ?? "0 0 200 200"}" role="img" aria-label="${o.label ?? "Gus"}" xmlns="http://www.w3.org/2000/svg">`;
  if (!o.noShadow) s += `<ellipse class="gus-shadow" cx="100" cy="194" rx="52" ry="5"/>`;
  s += `<g class="gus-bob"><g${o.tilt ? ` transform="rotate(${o.tilt} 100 130)"` : ""}><g class="gus-char">${gusInner(o)}</g></g></g></svg>`;
  return s;
}

// Rounded-square app icon: brand green with a gold-horned Gus
export function gusIconSvg(px = 120): string {
  const inner = gusInner({ eyes: "open", mouth: "smile", brows: "none", blush: false, hornC: "#FFC800", hornS: "#D9A400" });
  return `<svg width="${px}" height="${px}" viewBox="0 0 200 200" role="img" aria-label="grazer"><rect width="200" height="200" rx="46" fill="${GR}"/><g transform="translate(100 104) scale(.94) translate(-100 -104)">${inner}</g></svg>`;
}

// Head-only crop used for reactions and tiny stickers
export function gusFaceSvg(o: GusOpts): string {
  return gusSvg({ ...o, noShadow: true, viewBox: "0 6 200 168" });
}
