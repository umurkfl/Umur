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
