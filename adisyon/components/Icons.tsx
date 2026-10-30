// grazer's own icon set for rewards: same rounded, two-tone style as Gus. No system emoji.
interface IconProps { size?: number; className?: string }

export function FlameIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 1.8c.9 3.6 6.2 6 6.2 12.2a6.2 6.2 0 0 1-12.4 0c0-3 1.7-4.6 3.1-6.8.9.9 1.8 1.7 2 3.2C11.9 8 12 4.6 12 1.8Z" fill="#F97316" stroke="#F97316" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12 11.2c1.2 1.9 3.2 3 3.2 5.2a3.2 3.2 0 0 1-6.4 0c0-1.7 1.7-2.6 3.2-5.2Z" fill="#FFD23F" />
    </svg>
  );
}

export function StarIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 3.2l2.5 5.3 5.8.8-4.2 4.1 1 5.8-5.1-2.8-5.1 2.8 1-5.8-4.2-4.1 5.8-.8L12 3.2Z" fill="#FFC800" stroke="#D9A400" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.2 9.6l1-2" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function GoalIcon({ size = 20, done = false, className = "" }: IconProps & { done?: boolean }) {
  return done ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12.8" r="9.4" fill="#16825F" />
      <circle cx="12" cy="11.8" r="9.4" fill="#1D9E75" />
      <path d="M7.6 12l3 3 5.8-6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="#B4B2A9" strokeWidth="2.6" strokeDasharray="4 3.4" />
    </svg>
  );
}

/** The point currency: a four-leaf clover (yonca) */
export function CloverIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 13.2c.4 3 1.6 5 3.6 7" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" />
      <g fill="#16825F"><circle cx="8.2" cy="9.3" r="4.1" /><circle cx="15.8" cy="9.3" r="4.1" /><circle cx="8.2" cy="16" r="0" /></g>
      <g fill="#1D9E75"><circle cx="8.4" cy="8.2" r="4" /><circle cx="15.6" cy="8.2" r="4" /><circle cx="8.4" cy="14.6" r="4" /><circle cx="15.6" cy="14.6" r="4" /></g>
      <circle cx="12" cy="11.4" r="2" fill="#16825F" />
      <path d="M7.2 6.6a2.6 2.6 0 0 1 2.4-1.4" stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** One icon per stop on Gus's climb. index 0..6 */
export function LevelIcon({ index, size = 40, locked = false, className = "" }: { index: number; size?: number; locked?: boolean; className?: string }) {
  const g = locked ? "grayscale opacity-50" : "";
  const common = { width: size, height: size, viewBox: "0 0 48 48", className: `${g} ${className}`, "aria-hidden": true } as const;
  switch (index) {
    case 0: // sprout
      return (
        <svg {...common}>
          <ellipse cx="24" cy="40" rx="17" ry="5" fill="#B88A55" /><ellipse cx="24" cy="38.5" rx="17" ry="5" fill="#D2A66B" />
          <path d="M24 38V22" stroke="#0F6E56" strokeWidth="4" strokeLinecap="round" />
          <path d="M24 24c-9 0-12-7-11-12 8-1 12 4 11 12Z" fill="#1D9E75" /><path d="M24 20c8-1 11-6 10-11-7 0-11 4-10 11Z" fill="#4FC79B" />
        </svg>
      );
    case 1: // meadow
      return (
        <svg {...common}>
          <ellipse cx="24" cy="40" rx="19" ry="5" fill="#16825F" /><ellipse cx="24" cy="38.6" rx="19" ry="5" fill="#1D9E75" />
          <path d="M12 38c0-9 2-13 3-17 2 5 3 9 2 17ZM21 38c-1-11 1-17 3-23 2 6 4 12 3 23ZM31 38c-1-8 0-13 3-18 1 4 2 10 1 18Z" fill="#4FC79B" />
          <circle cx="34" cy="17" r="3.4" fill="#FFC800" /><circle cx="34" cy="17" r="1.4" fill="#D9A400" /><circle cx="14" cy="19" r="2.6" fill="#F5A9A4" />
        </svg>
      );
    case 2: // hill
      return (
        <svg {...common}>
          <circle cx="36" cy="13" r="6.5" fill="#FFC800" /><circle cx="36" cy="14.4" r="6.5" fill="#D9A400" opacity=".35" />
          <path d="M3 42c4-15 12-23 20-23s17 8 22 23Z" fill="#16825F" /><path d="M3 40c4-14 12-22 20-22s17 8 22 22Z" fill="#1D9E75" />
          <path d="M14 33c3-5 7-8 10-8" stroke="#4FC79B" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 3: // slope with trail
      return (
        <svg {...common}>
          <path d="M2 42 24 8l22 34Z" fill="#7C8C6B" /><path d="M2 40 24 6l22 34Z" fill="#94A583" />
          <path d="M24 6 34 22l-6 3 8 15H46Z" fill="#7C8C6B" opacity=".55" />
          <path d="M17 38c10-2 12-7 6-10s-4-8 3-10" stroke="#F3E3BD" strokeWidth="3.4" strokeLinecap="round" fill="none" strokeDasharray="1 5.6" />
        </svg>
      );
    case 4: // rocks
      return (
        <svg {...common}>
          <path d="M3 42 17 14l11 15 6-9 12 22Z" fill="#6E6C65" /><path d="M3 40 17 12l11 15 6-9 12 22Z" fill="#9C9A92" />
          <path d="M17 12l-4 14 9-3-3-5Z" fill="#CFCDC4" />
          <path d="M34 18l3 9-7-1Z" fill="#CFCDC4" />
        </svg>
      );
    case 5: // peak with flag
      return (
        <svg {...common}>
          <path d="M2 43 24 12l22 31Z" fill="#6E6C65" /><path d="M2 41 24 10l22 31Z" fill="#9C9A92" />
          <path d="M24 10l7 10-4-2-3 4-3-4-4 2Z" fill="#fff" />
          <path d="M24 10V2" stroke="#4A3F33" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M24 2.4h10l-3.4 3.2L34 9H24Z" fill="#D85A30" />
        </svg>
      );
    default: // GOAT: golden peak with crown
      return (
        <svg {...common}>
          <path d="M2 43 24 14l22 29Z" fill="#C99A00" /><path d="M2 41 24 12l22 29Z" fill="#FFC800" />
          <path d="M24 12l8 11-5-2.4-3 4-3-4-5 2.4Z" fill="#FFF3C4" />
          <path d="M14 9 17 2l5 4 2-6 2 6 5-4 3 7v3H14Z" fill="#D85A30" stroke="#B8461F" strokeWidth="1" strokeLinejoin="round" transform="translate(0 4) scale(1)" />
          <circle cx="24" cy="9.4" r="1.6" fill="#FFF3C4" />
        </svg>
      );
  }
}

export function SavedIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M6.5 3.6h11a2 2 0 0 1 2 2V21l-7.5-4.6L4.5 21V5.6a2 2 0 0 1 2-2Z" fill="#16825F" transform="translate(0 1)" />
      <path d="M6.5 3.6h11a2 2 0 0 1 2 2V21l-7.5-4.6L4.5 21V5.6a2 2 0 0 1 2-2Z" fill="#1D9E75" />
      <path d="M8 6.4h5" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function GearIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M13.4 2.4h-2.8l-.5 2.4a7.6 7.6 0 0 0-1.7.7L6.3 4.2 4.3 6.2l1.3 2.1c-.3.5-.5 1.1-.7 1.7l-2.4.5v2.8l2.4.5c.2.6.4 1.2.7 1.7l-1.3 2.1 2 2 2.1-1.3c.5.3 1.1.5 1.7.7l.5 2.4h2.8l.5-2.4c.6-.2 1.2-.4 1.7-.7l2.1 1.3 2-2-1.3-2.1c.3-.5.5-1.1.7-1.7l2.4-.5V10.7l-2.4-.5a7.6 7.6 0 0 0-.7-1.7l1.3-2.1-2-2-2.1 1.3a7.6 7.6 0 0 0-1.7-.7ZM12 8.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Z" fillRule="evenodd" />
    </svg>
  );
}

export function CrownIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3.5 18.5 2.8 7.6l5 4.2L12 4.6l4.2 7.2 5-4.2-.7 10.9Z" fill="#C99A00" transform="translate(0 1.2)" />
      <path d="M3.5 18.5 2.8 7.6l5 4.2L12 4.6l4.2 7.2 5-4.2-.7 10.9Z" fill="#FFC800" stroke="#FFC800" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="13.8" r="1.6" fill="#E4572E" />
    </svg>
  );
}

/** rank 1..3 get gold, silver, bronze */
export function MedalIcon({ rank, size = 26, className = "" }: { rank: 1 | 2 | 3; size?: number; className?: string }) {
  const t = rank === 1 ? { b: "#FFC800", s: "#C99A00" } : rank === 2 ? { b: "#C8CED6", s: "#9BA3AE" } : { b: "#E0955A", s: "#B26A33" };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 2.5h3.4L12 6l1.6-3.5H17L14.2 9H9.8Z" fill="#4DA3FF" />
      <circle cx="12" cy="15" r="7" fill={t.s} transform="translate(0 1)" />
      <circle cx="12" cy="15" r="7" fill={t.b} />
      <text x="12" y="18.6" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="9.5" fill="#fff">{rank}</text>
    </svg>
  );
}
