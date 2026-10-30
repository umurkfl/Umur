// Chunky filled tab icons in grazer's style. They paint with currentColor, so the active tab
// is brand green and the rest is quiet grey; a darker copy underneath gives the 3D base.
interface P { size?: number; active?: boolean; className?: string }

function Base({ size = 30, className = "", children }: { size?: number; className?: string; children: (dy: number) => React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <g opacity=".28">{children(2)}</g>
      <g>{children(0)}</g>
    </svg>
  );
}

export function HomeNavIcon(p: P) {
  return (
    <Base {...p}>
      {(dy) => (
        <g transform={`translate(0 ${dy})`} fill="currentColor">
          <path d="M16 3.6 3.2 14.2a1.6 1.6 0 0 0 1 2.8H6v9a2 2 0 0 0 2 2h4.4v-7h7.2v7H24a2 2 0 0 0 2-2v-9h1.8a1.6 1.6 0 0 0 1-2.8L16 3.6Z" />
        </g>
      )}
    </Base>
  );
}

export function SearchNavIcon(p: P) {
  return (
    <Base {...p}>
      {(dy) => (
        <g transform={`translate(0 ${dy})`} fill="none" stroke="currentColor" strokeLinecap="round">
          <circle cx="14" cy="14" r="8.4" strokeWidth="4.2" />
          <path d="m20.6 20.6 6.2 6.2" strokeWidth="4.6" />
        </g>
      )}
    </Base>
  );
}

export function FriendsNavIcon(p: P) {
  return (
    <Base {...p}>
      {(dy) => (
        <g transform={`translate(0 ${dy})`} fill="currentColor">
          <circle cx="12" cy="10.2" r="5.2" />
          <path d="M2.6 26.2c0-5.2 4.2-9 9.4-9s9.4 3.8 9.4 9a1.6 1.6 0 0 1-1.6 1.6H4.2a1.6 1.6 0 0 1-1.6-1.6Z" />
          <circle cx="22.8" cy="11.4" r="4" />
          <path d="M23.4 18.2c3.6.4 6 3 6 6.6 0 1.6-1 2.6-2.4 2.6h-4.2c.8-1 1.1-2.2 1.1-3.6 0-2-.6-4-1.7-5.4a8 8 0 0 1 1.2-.2Z" />
        </g>
      )}
    </Base>
  );
}

export function ProfileNavIcon(p: P) {
  return (
    <Base {...p}>
      {(dy) => (
        <g transform={`translate(0 ${dy})`} fill="currentColor">
          <circle cx="16" cy="10.4" r="6.2" />
          <path d="M4.8 27.2c0-6 5-10.2 11.2-10.2s11.2 4.2 11.2 10.2a1.6 1.6 0 0 1-1.6 1.6H6.4a1.6 1.6 0 0 1-1.6-1.6Z" />
        </g>
      )}
    </Base>
  );
}

export function PlusNavIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 5v22M5 16h22" stroke="#fff" strokeWidth="5.4" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden fill="currentColor">
      <path d="M16 3.4c-5 0-8.8 3.8-8.8 8.8v4.3c0 1-.4 2-1.1 2.8l-1.7 1.9c-.9 1-.2 2.6 1.2 2.6h20.8c1.4 0 2.1-1.6 1.2-2.6l-1.7-1.9a4.2 4.2 0 0 1-1.1-2.8v-4.3c0-5-3.8-8.8-8.8-8.8Z" />
      <path d="M12.2 26.4a3.9 3.9 0 0 0 7.6 0Z" />
    </svg>
  );
}

export function ChatIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden fill="currentColor">
      <path d="M16 4C8.8 4 3.2 8.8 3.2 14.9c0 3.2 1.5 6 4 8l-.9 4.3c-.2.9.7 1.6 1.5 1.2l5-2.5c1 .2 2 .3 3.2.3 7.2 0 12.8-4.8 12.8-10.9S23.2 4 16 4Z" />
    </svg>
  );
}
