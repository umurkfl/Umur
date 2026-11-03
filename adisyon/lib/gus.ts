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

const INK = "#2B2A27", C = "#FCE9C6", S = "#E6C58E", GR = "#1D9E75", GRS = "#0F6E56";
const PINK = "#FF9D95", BRW = "#5A3F2A", HOOF = "#3A3330", TONGUE = "#FF6B81", BELLY = "#FFF6E3", EYE_RIM = "#D8BE92";

function eye(type: GusEyes, x: number, y: number, dx = 0, dy = 0): string {
  switch (type) {
    case "open":
      return `<g class="gus-blink"><circle cx="${x}" cy="${y + 1.5}" r="22.5" fill="${EYE_RIM}"/><circle cx="${x}" cy="${y}" r="22" fill="#fff"/><g class="gus-look"><circle cx="${x + 2 + dx}" cy="${y + 2 + dy}" r="13.5" fill="${INK}"/><circle cx="${x + 2 + dx}" cy="${y + 3 + dy}" r="8.5" fill="#15130E"/><circle cx="${x + 7 + dx}" cy="${y - 3.5 + dy}" r="5" fill="#fff"/><circle cx="${x - 3.5 + dx}" cy="${y + 8 + dy}" r="2.4" fill="#fff"/></g></g>`;
    case "happy":
      return `<path d="M${x - 13} ${y + 5} Q${x} ${y - 14} ${x + 13} ${y + 5}" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>`;
    case "sleep":
      return `<path d="M${x - 13} ${y - 2} Q${x} ${y + 12} ${x + 13} ${y - 2}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    case "heart":
      return `<g class="gus-beat"><path d="M${x} ${y + 12} C${x - 20} ${y - 2} ${x - 10} ${y - 18} ${x} ${y - 7} C${x + 10} ${y - 18} ${x + 20} ${y - 2} ${x} ${y + 12} Z" fill="#FF4D6D"/><ellipse cx="${x - 7}" cy="${y - 5}" rx="3.4" ry="2.4" fill="#fff" opacity=".7" transform="rotate(-30 ${x - 7} ${y - 5})"/></g>`;
    case "wide":
      return `<circle cx="${x}" cy="${y}" r="21" fill="#fff" stroke="${EYE_RIM}" stroke-width="2.5"/><g class="gus-shiver"><circle cx="${x}" cy="${y}" r="6" fill="${INK}"/><circle cx="${x + 2}" cy="${y - 2}" r="1.8" fill="#fff"/></g>`;
    case "dizzy":
      return `<g class="gus-spin"><path d="M${x} ${y} m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 -1 a8.5 8.5 0 1 1 15 4" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/></g>`;
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
    if (e === "sweat") s += `<g class="gus-sweat"><path d="M150 70 q-8 14 0 20 q8 -6 0 -20z" fill="#7CC4F5"/><ellipse cx="148" cy="84" rx="1.6" ry="2.6" fill="#fff" opacity=".7"/></g>`;
    if (e === "zzz") s += `<g font-family="Nunito, sans-serif" font-weight="900" fill="#7A8CE0"><text class="gus-z" x="158" y="96" font-size="18">z</text><text class="gus-z" style="animation-delay:.8s" x="170" y="80" font-size="24">z</text><text class="gus-z" style="animation-delay:1.6s" x="182" y="62" font-size="28">Z</text></g>`;
    if (e === "hearts") s += `<g class="gus-float">${heartSm(162, 94, 1.2)}</g><g class="gus-float" style="animation-delay:.7s">${heartSm(180, 72, 0.9, "#FF8FA3")}</g><g class="gus-float" style="animation-delay:1.2s">${heartSm(34, 94, 1)}</g><g class="gus-float" style="animation-delay:.3s">${heartSm(20, 72, 0.7, "#FF8FA3")}</g>`;
    if (e === "sparks") s += `<g class="gus-twinkle">${spark(166, 92, 1)}</g><g class="gus-twinkle" style="animation-delay:.5s">${spark(34, 92, 0.8)}</g><g class="gus-twinkle" style="animation-delay:1s">${spark(180, 120, 0.6)}</g>`;
    if (e === "anger") s += `<g class="gus-throb"><g transform="translate(162 90)" stroke="#E4572E" stroke-width="3.6" fill="none" stroke-linecap="round"><path d="M-8 -8 q8 0 8 8"/><path d="M8 -8 q-8 0 -8 8"/><path d="M-8 8 q8 0 8 -8"/><path d="M8 8 q-8 0 -8 -8"/></g></g>`;
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
    case "scarf":
      g += `<path d="M34 146 Q100 182 166 146 L170 168 Q100 204 30 168 Z" fill="#E4572E"/><path d="M34 146 Q100 182 166 146 L167 153 Q100 189 33 153 Z" fill="#fff" opacity=".28"/><path d="M33 160 Q100 196 167 160 L169 168 Q100 204 31 168 Z" fill="#B8461F" opacity=".45"/>`
        + `<g transform="translate(138 168) rotate(-8)"><path d="M0 0 L26 4 L30 40 L6 44 Z" fill="#E4572E"/><path d="M2 12 L28 16 M3 24 L29 28" stroke="#fff" stroke-opacity=".45" stroke-width="4"/><path d="M6 44 L30 40 L31 48 L8 52 Z" fill="#B8461F"/></g><circle cx="140" cy="166" r="9" fill="#C94A24"/>`;
      break;
    case "bow":
      g += `<path d="M100 170 L66 152 Q58 170 66 188 Z" fill="#FF4D6D"/><path d="M100 170 L134 152 Q142 170 134 188 Z" fill="#FF4D6D"/><path d="M100 170 L66 152 L70 162 Z M100 170 L134 152 L130 162 Z" fill="#fff" opacity=".28"/><path d="M100 170 L66 188 L72 176 Z M100 170 L134 188 L128 176 Z" fill="#C92B4B" opacity=".6"/><rect x="90" y="159" width="20" height="22" rx="7" fill="#D63352"/><rect x="93" y="162" width="6" height="12" rx="3" fill="#fff" opacity=".35"/>`;
      break;
  }
  switch (look.head) {
    case "cap":
      g += `<path d="M62 70 C58 22 142 22 138 70 Z" fill="#1D9E75"/><path d="M100 30 V68 M82 36 Q78 52 76 68 M118 36 Q122 52 124 68" stroke="#0F6E56" stroke-width="2.4" fill="none" opacity=".55"/><path d="M70 40 Q86 28 104 29" stroke="#fff" stroke-opacity=".4" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M54 72 Q100 92 146 72 Q100 60 54 72 Z" fill="#0F6E56"/><path d="M60 72 Q100 86 140 72" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none"/><circle cx="100" cy="25" r="5" fill="#0F6E56"/><circle cx="99" cy="23.5" r="1.8" fill="#fff" opacity=".6"/>`;
      break;
    case "chef":
      g += `<g stroke="#E3D3B6" stroke-width="2.6" stroke-linejoin="round"><circle cx="70" cy="36" r="19" fill="#fff"/><circle cx="130" cy="36" r="19" fill="#fff"/><circle cx="100" cy="26" r="23" fill="#fff"/><path d="M68 44 H132 L128 72 H72 Z" fill="#fff"/></g><path d="M72 58 H128" stroke="#E3D3B6" stroke-width="2.6"/><path d="M82 46 V68 M100 46 V68 M118 46 V68" stroke="#EFE3CC" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="88" cy="22" rx="8" ry="4.4" fill="#fff" stroke="none" opacity=".9" transform="rotate(-25 88 22)"/>`;
      break;
    case "party":
      g += `<g transform="translate(0 10) rotate(-9 100 64)"><path d="M100 0 L136 68 Q100 80 64 68 Z" fill="#FF6B81"/><path d="M100 0 L136 68 Q120 74 108 76 Z" fill="#E0445E" opacity=".5"/><path d="M84 30 L117 36 M76 46 L124 52 M70 60 L131 64" stroke="#FFD166" stroke-width="5" stroke-linecap="round"/><circle cx="92" cy="22" r="2.6" fill="#fff"/><circle cx="108" cy="50" r="2.6" fill="#fff"/><circle cx="82" cy="58" r="2.6" fill="#fff"/><circle cx="100" cy="2" r="9" fill="#FFC800"/><circle cx="97" cy="-1" r="3" fill="#fff" opacity=".6"/></g>`;
      break;
    case "phones":
      g += `<path d="M28 112 C20 14 180 14 172 112" fill="none" stroke="#2F2B28" stroke-width="11" stroke-linecap="round"/><path d="M34 100 C32 34 168 34 166 100" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/><g><rect x="12" y="86" width="30" height="52" rx="14" fill="#2F2B28"/><rect x="17" y="90" width="26" height="44" rx="12" fill="#4DA3FF"/><rect x="21" y="95" width="7" height="22" rx="3.5" fill="#fff" opacity=".4"/></g><g><rect x="158" y="86" width="30" height="52" rx="14" fill="#2F2B28"/><rect x="157" y="90" width="26" height="44" rx="12" fill="#4DA3FF"/><rect x="161" y="95" width="7" height="22" rx="3.5" fill="#fff" opacity=".4"/></g>`;
      break;
    case "flower":
      g += `<g transform="translate(66 60) rotate(-10)"><path d="M0 0 Q-22 -4 -26 10 Q-10 16 0 0 Z M0 0 Q22 -4 26 10 Q10 16 0 0 Z" fill="#3DB66B" transform="translate(0 12)"/><g fill="#FF8FB8"><circle cx="0" cy="-15" r="10.5"/><circle cx="14.3" cy="-4.6" r="10.5"/><circle cx="8.8" cy="12.1" r="10.5"/><circle cx="-8.8" cy="12.1" r="10.5"/><circle cx="-14.3" cy="-4.6" r="10.5"/></g><g fill="#fff" opacity=".4"><ellipse cx="-3" cy="-19" rx="4" ry="2.4"/><ellipse cx="11" cy="-8" rx="4" ry="2.4"/></g><circle r="8" fill="#FFC800"/><circle cx="-2" cy="-2" r="2.6" fill="#fff" opacity=".6"/></g>`;
      break;
    case "crown":
      g += `<path d="M64 70 L60 24 L82 46 L100 14 L118 46 L140 24 L136 70 Z" fill="#C99A00" transform="translate(0 4)"/><path d="M64 70 L60 24 L82 46 L100 14 L118 46 L140 24 L136 70 Z" fill="#FFC800" stroke="#FFC800" stroke-width="5" stroke-linejoin="round"/><path d="M68 62 H132" stroke="#E0A800" stroke-width="6" stroke-linecap="round"/><path d="M70 36 L64 30 M96 22 L100 18" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="46" r="6" fill="#E4572E"/><circle cx="80" cy="56" r="4" fill="#1D9E75"/><circle cx="120" cy="56" r="4" fill="#4DA3FF"/><circle cx="60" cy="24" r="4.5" fill="#fff"/><circle cx="140" cy="24" r="4.5" fill="#fff"/><circle cx="100" cy="14" r="4.5" fill="#fff"/>`;
      break;
  }
  return g;
}

const HORN = "M76 68 C62 18 26 4 4 32 C38 28 58 50 62 90 Z";

function horn(hC: string, hS: string): string {
  return `<path d="${HORN}" fill="${hS}" transform="translate(0 4)"/><path d="${HORN}" fill="${hC}"/>`
    + `<path d="M62 36 Q54 47 57 58 M47 25 Q40 35 46 45 M29 22 Q25 29 31 35" fill="none" stroke="${hS}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`
    + `<path d="M70 62 C62 34 40 18 17 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".3"/>`;
}

export function gusInner(o: GusOpts): string {
  const hC = o.hornC ?? (o.look?.horn === "gold" ? "#FFC800" : GR), hS = o.hornS ?? (o.look?.horn === "gold" ? "#D9A400" : GRS);
  let g = "";
  // tail peeking out behind the body
  g += `<g class="gus-tail"><path d="M150 170 C170 172 184 160 186 140 C176 150 164 154 148 154 Z" fill="${S}"/><path d="M150 166 C168 167 181 157 183 142 C174 150 162 152 148 152 Z" fill="${C}"/></g>`;
  // horns (swept back, brand green) with ridges and a shine
  g += `<g class="gus-horns">${horn(hC, hS)}<g transform="translate(200 0) scale(-1 1)">${horn(hC, hS)}</g></g>`;
  // ears: big floppy ones with a pink inside
  const ear = (sx: number) => `<g transform="translate(${sx < 0 ? 200 : 0} 0) scale(${sx} 1)"><ellipse cx="27" cy="106" rx="25" ry="12.5" fill="${S}" transform="rotate(-20 27 106)"/><ellipse cx="27" cy="102.5" rx="25" ry="12.5" fill="${C}" transform="rotate(-20 27 102.5)"/><ellipse cx="30" cy="103.5" rx="14" ry="6.4" fill="${PINK}" transform="rotate(-20 30 103.5)"/><ellipse cx="33" cy="104.5" rx="7" ry="3" fill="#F0746F" transform="rotate(-20 33 104.5)"/></g>`;
  g += `<g class="gus-earL">${ear(1)}</g><g class="gus-earR">${ear(-1)}</g>`;
  // hooves: chunky dark feet with a split and a shine, little fur socks
  const foot = (x: number, cls: string) => `<g class="${cls}"><rect x="${x}" y="168" width="40" height="30" rx="15" fill="${HOOF}"/><path d="M${x + 20} 184 V196" stroke="#1C1917" stroke-width="3" stroke-linecap="round"/><ellipse cx="${x + 11}" cy="177" rx="6" ry="3" fill="#fff" opacity=".26"/></g>`;
  g += foot(50, "gus-hoofL") + foot(110, "gus-hoofR");
  g += `<g class="gus-beard"><path d="M88 164 Q100 206 112 164 Z" fill="${S}" stroke="${S}" stroke-width="8" stroke-linejoin="round"/><path d="M94 170 Q100 194 106 170" fill="none" stroke="${C}" stroke-width="3.4" stroke-linecap="round" opacity=".9"/></g>`;
  // body = head: pear-shaped, shadow underneath, warm rim on the lower right, soft shine on the upper left
  const BODY = "M100 46 C152 46 175 90 173 128 C171 162 142 182 100 182 C58 182 29 162 27 128 C25 90 48 46 100 46 Z";
  g += `<path d="${BODY}" fill="${S}" transform="translate(0 5)"/><path d="${BODY}" fill="#F1D6A2"/><path d="${BODY}" fill="${C}" transform="translate(-3 -3) scale(.985) translate(1.6 2.4)"/>`;
  g += `<path d="M84 50 Q86 32 98 42 Q104 27 112 43 Q123 36 118 53 Q100 44 84 50 Z" fill="${C}"/><path d="M98 42 Q99 47 97 51 M112 43 Q112 48 110 51" fill="none" stroke="${S}" stroke-width="2.2" stroke-linecap="round"/>`;
  g += `<ellipse cx="62" cy="72" rx="15" ry="8" fill="#fff" opacity=".75" transform="rotate(-34 62 72)"/><circle cx="80" cy="58" r="3.4" fill="#fff" opacity=".75"/>`;
  // belly and muzzle patches, lighter than the body so the face reads
  g += `<ellipse cx="100" cy="156" rx="44" ry="27" fill="${BELLY}"/><ellipse cx="100" cy="143" rx="31" ry="21" fill="#F0DDB8"/><ellipse cx="100" cy="140" rx="31" ry="21" fill="${BELLY}"/><ellipse cx="100" cy="127" rx="8" ry="5.6" fill="#B9735F"/><ellipse cx="98" cy="125.2" rx="2.8" ry="1.6" fill="#fff" opacity=".6"/>`;
  if (o.blush !== false) g += `<ellipse cx="54" cy="125" rx="11.5" ry="7.2" fill="${PINK}" opacity=".85"/><ellipse cx="146" cy="125" rx="11.5" ry="7.2" fill="${PINK}" opacity=".85"/><circle cx="50" cy="122" r="2.2" fill="#fff" opacity=".8"/><circle cx="142" cy="122" r="2.2" fill="#fff" opacity=".8"/>`;
  // arms: stubby little hooves at his sides
  const arm = (sx: number) => `<g transform="translate(${sx < 0 ? 200 : 0} 0) scale(${sx} 1)"><g class="gus-arm${sx < 0 ? "R" : "L"}"><ellipse cx="24" cy="146" rx="12.5" ry="22" fill="#F1D6A2" transform="rotate(16 24 146)"/><ellipse cx="24" cy="143" rx="12.5" ry="22" fill="${C}" transform="rotate(16 24 143)"/><path d="M14 158 Q22 150 32 158 Q32 168 23 169 Q14 168 14 158 Z" fill="#6B5240"/><ellipse cx="21" cy="158" rx="3" ry="1.8" fill="#fff" opacity=".25"/></g></g>`;
  g += arm(1) + arm(-1);
  // eyes
  if (o.shades || o.look?.face === "shades") {
    g += `<g><rect x="46" y="74" width="50" height="34" rx="14" fill="#1B1B1B"/><rect x="104" y="74" width="50" height="34" rx="14" fill="#1B1B1B"/><path d="M96 84 H104" stroke="#1B1B1B" stroke-width="5"/><g class="gus-glint"><path d="M54 84 l12 -3 M112 84 l12 -3" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".45"/><path d="M56 92 l5 -1.2 M114 92 l5 -1.2" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".3"/></g></g>`;
  } else {
    g += eye(o.eyes ?? "open", 76, 92, o.dx, o.dy) + eye(o.eyeR ?? o.eyes ?? "open", 124, 92, o.dx, o.dy);
  }
  g += `<g class="gus-brows">${brows(o.brows, 62)}</g>`;
  g += `<g transform="translate(0 14)"><g class="gus-mouth">${mouth(o.mouth ?? "smile")}</g></g>`;
  if (o.look) g += costumes(o.look);
  g += extras(o.extra);
  if (o.prop) g += prop(o.prop);
  return g;
}

export function gusSvg(o: GusOpts = {}): string {
  let s = `<svg viewBox="${o.viewBox ?? "0 0 200 200"}" role="img" aria-label="${o.label ?? "Gus"}" xmlns="http://www.w3.org/2000/svg">`;
  if (!o.noShadow) s += `<ellipse class="gus-shadow" cx="100" cy="197" rx="56" ry="4.5"/>`;
  // nested wrappers so mood motion, idle sway, breathing and the tap jump compose
  s += `<g class="gus-bob"><g${o.tilt ? ` transform="rotate(${o.tilt} 100 130)"` : ""}><g class="gus-char"><g class="gus-sway"><g class="gus-breathe">${gusInner(o)}</g></g></g></g></g></svg>`;
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
