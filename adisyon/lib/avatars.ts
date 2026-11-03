// Ten ready-made Gus portraits to use as a profile picture. A portrait is turned into an SVG data URL
// so it travels exactly like an uploaded photo (same field, same <img>, same Supabase column).
import { gusInner, GUS_MOODS, GusOpts, GusMood } from "./gus";

export interface GusAvatar { id: string; name: string; bg: string; mood: GusMood; look?: GusOpts["look"]; extra?: GusOpts["extra"] }

export const GUS_AVATARS: GusAvatar[] = [
  { id: "klasik", name: "Klasik", bg: "#BFEBDD", mood: "happy" },
  { id: "sef", name: "Şef", bg: "#FFD9B8", mood: "laugh", look: { head: "chef" } },
  { id: "havali", name: "Havalı", bg: "#BFDDFF", mood: "cool" },
  { id: "parti", name: "Partici", bg: "#FFC9D9", mood: "laugh", look: { head: "party" }, extra: ["confetti"] },
  { id: "cicek", name: "Çiçekli", bg: "#E1D4FF", mood: "love", look: { head: "flower" } },
  { id: "kulaklik", name: "Müzikli", bg: "#B8EFEA", mood: "happy", look: { head: "phones" } },
  { id: "fular", name: "Fularlı", bg: "#FFCFC0", mood: "wink", look: { neck: "scarf" } },
  { id: "kasket", name: "Kasketli", bg: "#FFEFA8", mood: "chew", look: { head: "cap" } },
  { id: "papyon", name: "Şık", bg: "#FFD0E4", mood: "happy", look: { neck: "bow" } },
  { id: "uykucu", name: "Uykucu", bg: "#CBD2F7", mood: "sleepy" },
];

const cache = new Map<string, string>();

export function gusAvatarUrl(id: string): string {
  const hit = cache.get(id);
  if (hit) return hit;
  const a = GUS_AVATARS.find((x) => x.id === id) ?? GUS_AVATARS[0];
  const inner = gusInner({ ...GUS_MOODS[a.mood], look: a.look, extra: a.extra });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${a.bg}"/><g transform="translate(100 100) scale(1.08) translate(-100 -98)">${inner}</g></svg>`;
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(id, url);
  return url;
}

/** Everyone gets a stable Gus until they pick their own: derived from the user id */
export function defaultAvatarFor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return gusAvatarUrl(GUS_AVATARS[h % GUS_AVATARS.length].id);
}
