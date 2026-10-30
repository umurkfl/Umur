// Loading placeholders: grey shapes that match the real layout, shimmering softly.
export function Skel({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function FeedSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-4 px-4" aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border-2 border-b-4 border-border overflow-hidden bg-surface">
          <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
            <Skel className="w-9 h-9 rounded-full" />
            <div className="flex-1 space-y-1.5"><Skel className="h-3 w-28 rounded-full" /><Skel className="h-2.5 w-40 rounded-full" /></div>
          </div>
          <Skel className="aspect-[4/3] w-full !rounded-none" />
          <div className="px-4 py-4 space-y-2.5"><Skel className="h-5 w-48 rounded-full" /><Skel className="h-3 w-32 rounded-full" /><Skel className="h-3 w-full rounded-full" /></div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-4" aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-surface p-3.5">
          <Skel className="w-11 h-11 rounded-full" />
          <div className="flex-1 space-y-2"><Skel className="h-3.5 w-32 rounded-full" /><Skel className="h-3 w-48 rounded-full" /></div>
        </div>
      ))}
    </div>
  );
}
