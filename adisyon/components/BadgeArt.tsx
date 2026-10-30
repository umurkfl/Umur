// Filled, two-tone badge medallions (Duolingo-style achievements): a coloured coin with a darker
// base for depth and a white glyph. Locked badges go grey. One component for every badge id.
interface Tone { bg: string; shade: string }

const TONES: Record<string, Tone> = {
  newbie: { bg: "#4DA3FF", shade: "#2F7FD6" },
  first: { bg: "#1D9E75", shade: "#0F6E56" },
  katkilci: { bg: "#FFC800", shade: "#C99A00" },
  aktif: { bg: "#FF8A2B", shade: "#D9661A" },
  sampiyion: { bg: "#F5B400", shade: "#C98B00" },
  gezgin: { bg: "#17B3A3", shade: "#0E8A7D" },
  gurme: { bg: "#9B6BFF", shade: "#7048D6" },
  muhtar: { bg: "#5B6EE1", shade: "#4A57B8" },
  grup: { bg: "#28B7E8", shade: "#1B90BA" },
  luks: { bg: "#B05BFF", shade: "#8A3FD6" },
  ekonomik: { bg: "#7BC62D", shade: "#5A9A1A" },
  zirve: { bg: "#FF5A7A", shade: "#D63A5A" },
  fotograf: { bg: "#FF9F43", shade: "#D97A1F" },
  hafta_sonu: { bg: "#FF6FB1", shade: "#D94F8E" },
  sadik: { bg: "#FF4D4D", shade: "#D63030" },
  tatli: { bg: "#FFC800", shade: "#C99A00" },
};

const W = "#fff";

function Glyph({ id, d }: { id: string; d: string }) {
  switch (id) {
    case "newbie":
      return (<><circle cx="22" cy="16" r="7" fill={W} /><path d="M8 37c0-8 6-12 14-12s14 4 14 12z" fill={W} /><circle cx="36" cy="33" r="8.5" fill={d} /><path d="M32 33l3 3 5-6" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></>);
    case "first":
      return (<><path d="M13 6h22v34l-3.7-2.8L27.6 40 24 37.2 20.4 40l-3.7-2.8L13 40z" fill={W} /><rect x="18" y="13" width="12" height="3" rx="1.5" fill={d} /><rect x="18" y="20" width="12" height="3" rx="1.5" fill={d} opacity=".6" /><rect x="18" y="27" width="8" height="3" rx="1.5" fill={d} opacity=".6" /></>);
    case "katkilci":
      return (<><rect x="10" y="9" width="28" height="33" rx="5" fill={W} /><rect x="17" y="5" width="14" height="9" rx="3" fill={d} /><rect x="16" y="22" width="16" height="3" rx="1.5" fill={d} opacity=".7" /><rect x="16" y="29" width="16" height="3" rx="1.5" fill={d} opacity=".7" /><rect x="16" y="36" width="9" height="3" rx="1.5" fill={d} opacity=".7" /></>);
    case "aktif":
      return <polygon points="24,5 29.4,17.4 43,18.7 32.8,27.6 35.8,41 24,34 12.2,41 15.2,27.6 5,18.7 18.6,17.4" fill={W} stroke={W} strokeWidth="2.4" strokeLinejoin="round" />;
    case "sampiyion":
      return (<><path d="M14 7h20v12c0 7-4.5 11-10 11S14 26 14 19z" fill={W} /><path d="M14 11H8c0 6 2.5 9 7 10M34 11h6c0 6-2.5 9-7 10" stroke={W} strokeWidth="3" fill="none" strokeLinecap="round" /><rect x="21" y="30" width="6" height="7" fill={W} /><rect x="14" y="36" width="20" height="6" rx="2.5" fill={W} /><path d="M24 13l2 4 4.4.6-3.2 3 .8 4.4-4-2.1-4 2.1.8-4.4-3.2-3 4.4-.6z" fill={d} /></>);
    case "gezgin":
      return (<><circle cx="24" cy="24" r="18" fill={W} /><circle cx="24" cy="24" r="13.5" fill={d} /><path d="M24 11l5.4 14L24 22.6 18.6 25z" fill={W} /><path d="M24 37l-5.4-14L24 25.4 29.4 23z" fill={W} opacity=".55" /></>);
    case "gurme":
      return (<><path d="M13 5v11a4.5 4.5 0 0 0 3.3 4.3V43h3.4V20.3A4.5 4.5 0 0 0 23 16V5h-2.6v9h-1.4V5h-2.6v9h-1.4V5z" fill={W} /><path d="M34 5c-4.6 3.2-5.8 9.6-5.2 16.2H32.6V43H36z" fill={W} /></>);
    case "muhtar":
      return (<><path d="M24 6 5 22h5.6v19h26.8V22H43z" fill={W} /><rect x="19.5" y="28" width="9" height="13" rx="2" fill={d} /></>);
    case "grup":
      return (<><circle cx="24" cy="15" r="6.4" fill={W} /><path d="M12 36c0-6.6 5.4-10 12-10s12 3.4 12 10z" fill={W} /><circle cx="10.4" cy="19" r="4.4" fill={W} opacity=".7" /><path d="M2 36c0-5 3.4-8 8.4-8 1.6 0 3 .3 4.2.9-1.8 1.7-3 4.2-3 7.1z" fill={W} opacity=".7" /><circle cx="37.6" cy="19" r="4.4" fill={W} opacity=".7" /><path d="M46 36c0-5-3.4-8-8.4-8-1.6 0-3 .3-4.2.9 1.8 1.7 3 4.2 3 7.1z" fill={W} opacity=".7" /></>);
    case "luks":
      return (<><path d="M13 8h22l8.5 11L24 41 4.5 19z" fill={W} /><path d="M4.5 19h39M17 8l-5 11 12 22 12-22-5-11" fill="none" stroke={d} strokeWidth="2.2" strokeLinejoin="round" opacity=".55" /></>);
    case "ekonomik":
      return (<><circle cx="24" cy="24" r="18" fill={W} /><circle cx="24" cy="24" r="13" fill="none" stroke={d} strokeWidth="2.6" opacity=".5" /><text x="24" y="31.5" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="21" fill={d}>₺</text></>);
    case "zirve":
      return (<><path d="M24 3c7.4 5 10.6 13.4 8.4 25H15.6C13.4 16.4 16.6 8 24 3z" fill={W} /><circle cx="24" cy="17" r="4.4" fill={d} /><path d="M15.6 27 8 37l9.4-2.6zM32.4 27 40 37l-9.4-2.6z" fill={W} /><path d="M19.6 32h8.8L24 44z" fill="#FFC800" /></>);
    case "fotograf":
      return (<><path d="M6 16a5 5 0 0 1 5-5h5l2.6-4h10.8L32 11h5a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z" fill={W} /><circle cx="24" cy="25.5" r="9" fill={d} /><circle cx="24" cy="25.5" r="5" fill={W} /></>);
    case "hafta_sonu":
      return (<><rect x="6" y="10" width="36" height="32" rx="6.5" fill={W} /><path d="M6 17a6.5 6.5 0 0 1 6.5-6.5h23A6.5 6.5 0 0 1 42 17v3H6z" fill={d} /><rect x="14" y="5" width="4.6" height="10" rx="2.3" fill={W} /><rect x="29.4" y="5" width="4.6" height="10" rx="2.3" fill={W} /><circle cx="16" cy="29" r="2.8" fill={d} opacity=".7" /><circle cx="24" cy="29" r="2.8" fill={d} /><circle cx="32" cy="29" r="2.8" fill={d} opacity=".7" /><circle cx="16" cy="36" r="2.8" fill={d} opacity=".7" /></>);
    case "sadik":
      return <path d="M24 42C8 31 4 22 4 15.4a9.6 9.6 0 0 1 20-2.4 9.6 9.6 0 0 1 20 2.4C44 22 40 31 24 42z" fill={W} />;
    case "tatli":
      return (<><rect x="4" y="21" width="10" height="21" rx="3" fill={W} /><path d="M17 21l6-14.5c3.4-.4 5.6 2.2 5 5.4L26.6 19H38a4.5 4.5 0 0 1 4.4 5.6l-3.6 14.6a4.5 4.5 0 0 1-4.4 3.4H17z" fill={W} /></>);
    default:
      return <polygon points="24,5 29.4,17.4 43,18.7 32.8,27.6 35.8,41 24,34 12.2,41 15.2,27.6 5,18.7 18.6,17.4" fill={W} />;
  }
}

export function BadgeArt({ id, size = 72, locked = false, className = "" }: { id: string; size?: number; locked?: boolean; className?: string }) {
  const t = locked ? { bg: "#D9D6CC", shade: "#BDBAAE" } : TONES[id] ?? TONES.aktif;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-hidden>
      <circle cx="32" cy="36" r="28" fill={t.shade} />
      <circle cx="32" cy="32" r="28" fill={t.bg} />
      <circle cx="32" cy="32" r="22.5" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2" />
      <path d="M12.5 24.5A22 22 0 0 1 30 10" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3.4" strokeLinecap="round" />
      <g transform="translate(8.6 8) scale(.97)" opacity={locked ? 0.9 : 1}><Glyph id={id} d={t.shade} /></g>
    </svg>
  );
}
