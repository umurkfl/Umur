"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { store, StoredReceipt } from "@/lib/store";
import { computeStats, weeklyPoints } from "@/lib/gamify";
import { timeAgo } from "@/lib/mock";
import { CloverIcon, FlameIcon, LevelIcon, MedalIcon } from "@/components/Icons";
import { ChatIcon } from "@/components/NavIcons";

export interface Person { id: string; name: string; receipts: StoredReceipt[]; isMe?: boolean }

export function PersonAvatar({ id, name, size = 44 }: { id: string; name: string; size?: number }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => { let live = true; store.getPublicAvatar(id).then((a) => { if (live) setAvatar(a); }); return () => { live = false; }; }, [id]);
  const dim = { width: size, height: size };
  return avatar
    ? <img src={avatar} alt={name} style={dim} className="rounded-full object-cover shrink-0" />
    : <div style={{ ...dim, fontSize: size * 0.42 }} className="rounded-full bg-primary-light flex items-center justify-center font-black text-primary shrink-0">{name.charAt(0).toUpperCase()}</div>;
}

/** Friends ranked by yonca earned this week. Resets every Monday. */
export function Leaderboard({ people }: { people: Person[] }) {
  const rows = people
    .map((p) => ({ ...p, pts: weeklyPoints(p.receipts), stats: computeStats(p.receipts) }))
    .sort((a, b) => b.pts - a.pts || Number(!!b.isMe) - Number(!!a.isMe) || a.name.localeCompare(b.name, "tr"));
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7);
  const quiet = rows.every((r) => r.pts === 0);

  return (
    <section className="rounded-3xl border-2 border-b-4 border-border bg-surface overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-charcoal leading-tight">Haftalık tırmanış</h2>
          <p className="text-xs font-bold text-muted">Arkadaşların arasında yonca sıralaması</p>
        </div>
        <span className="rounded-full bg-gold/25 text-gold-shade text-xs font-black px-2.5 py-1 whitespace-nowrap">{daysLeft} gün kaldı</span>
      </div>
      {quiet && <p className="mx-4 mb-3 rounded-2xl bg-background px-3.5 py-2.5 text-sm font-bold text-muted">Bu hafta henüz fiş yok. İlk paylaşan öne geçer.</p>}
      <div>
        {rows.map((r, i) => (
          <Link
            key={r.id}
            href={r.isMe ? "/profile" : `/users?id=${r.id}&n=${encodeURIComponent(r.name)}`}
            className={`flex items-center gap-3 px-4 py-3 border-t-2 border-border/70 active:bg-background transition-colors ${r.isMe ? "bg-primary-light" : ""}`}
          >
            <div className="w-8 flex justify-center">{i < 3 && r.pts > 0 ? <MedalIcon rank={(i + 1) as 1 | 2 | 3} size={28} /> : <span className="text-base font-black text-muted">{i + 1}</span>}</div>
            <PersonAvatar id={r.id} name={r.name} size={40} />
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-base font-black text-charcoal truncate">{r.isMe ? "Sen" : r.name}</p>
              <p className="text-xs font-bold text-muted flex items-center gap-1"><LevelIcon index={r.stats.levelIcon} size={14} />{r.stats.levelName}</p>
            </div>
            <p className="flex items-center gap-1 text-base font-black text-primary"><CloverIcon size={18} />{r.pts}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** "Ayşe ile ikiniz Çiya Sofrası'ndaydınız": same place, same day */
export function TogetherCards({ my, friends, meId, meName }: { my: StoredReceipt[]; friends: Person[]; meId: string; meName: string }) {
  const seen = new Set<string>();
  const pairs: { friend: Person; place: string; at: string }[] = [];
  for (const f of friends) {
    for (const fr of f.receipts) {
      for (const r of my) {
        if (r.restaurantName.toLowerCase() !== fr.restaurantName.toLowerCase()) continue;
        if (new Date(r.createdAt).toDateString() !== new Date(fr.createdAt).toDateString()) continue;
        const k = `${f.id}|${fr.restaurantName.toLowerCase()}|${new Date(r.createdAt).toDateString()}`;
        if (seen.has(k)) continue;
        seen.add(k);
        pairs.push({ friend: f, place: fr.restaurantName, at: r.createdAt });
      }
    }
  }
  pairs.sort((a, b) => b.at.localeCompare(a.at));
  if (!pairs.length) return null;
  return (
    <section>
      <h2 className="text-xl font-black text-charcoal mb-2.5">Birlikte yedik</h2>
      <div className="space-y-2.5">
        {pairs.slice(0, 3).map((p) => (
          <div key={p.friend.id + p.place + p.at} className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-surface px-3.5 py-3">
            <div className="flex -space-x-3 shrink-0">
              <PersonAvatar id={p.friend.id} name={p.friend.name} size={40} />
              <div className="rounded-full border-2 border-surface"><PersonAvatar id={meId} name={meName} size={40} /></div>
            </div>
            <p className="flex-1 min-w-0 text-sm font-bold text-ink leading-snug">
              <span className="font-black text-charcoal">{p.friend.name.split(" ")[0]}</span> ile ikiniz <span className="font-black text-primary">{p.place}</span> mekanındaydınız
              <span className="block text-xs font-bold text-muted mt-0.5">{timeAgo(p.at)}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export interface Suggestion { id: string; name: string; shared: string[] }

/** People who went to the same places as you */
export function Suggestions({ items, onAdd, sent }: { items: Suggestion[]; onAdd: (id: string, name: string) => void; sent: Set<string> }) {
  if (!items.length) return null;
  return (
    <section className="mb-5">
      <h2 className="text-xl font-black text-charcoal mb-2.5">Tanıyor olabilirsin</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {items.map((s) => (
          <div key={s.id} className="shrink-0 w-[168px] rounded-3xl border-2 border-b-4 border-border bg-surface p-3.5 text-center">
            <Link href={`/users?id=${s.id}&n=${encodeURIComponent(s.name)}`} className="block">
              <div className="mx-auto w-14"><PersonAvatar id={s.id} name={s.name} size={56} /></div>
              <p className="mt-2 text-base font-black text-charcoal truncate">{s.name}</p>
            </Link>
            <p className="text-xs font-bold text-muted mt-0.5 line-clamp-2 min-h-[2rem]">{s.shared[0]}{s.shared.length > 1 ? ` ve ${s.shared.length - 1} mekan daha` : ""}</p>
            <button onClick={() => onAdd(s.id, s.name)} disabled={sent.has(s.id)} className={`btn btn-sm btn-block mt-2 ${sent.has(s.id) ? "btn-ghost !text-muted" : "btn-primary"}`}>
              {sent.has(s.id) ? "İstek gitti" : "Ekle"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FriendRich({ person, place, placeAt, confirming, onMessage, onAskRemove, onConfirmRemove, onCancelRemove }: {
  person: Person; place?: string; placeAt?: string; confirming: boolean;
  onMessage: () => void; onAskRemove: () => void; onConfirmRemove: () => void; onCancelRemove: () => void;
}) {
  const s = computeStats(person.receipts);
  const last = person.receipts[0];
  return (
    <div className="rounded-3xl border-2 border-b-4 border-border bg-surface p-3.5">
      <div className="flex items-center gap-3.5">
        <Link href={`/users?id=${person.id}&n=${encodeURIComponent(person.name)}`} className="shrink-0"><PersonAvatar id={person.id} name={person.name} size={56} /></Link>
        <Link href={`/users?id=${person.id}&n=${encodeURIComponent(person.name)}`} className="flex-1 min-w-0 leading-tight">
          <p className="text-lg font-black text-charcoal truncate">{person.name}</p>
          <p className="mt-0.5 flex items-center gap-2 text-xs font-extrabold text-muted">
            <span className="flex items-center gap-1"><LevelIcon index={s.levelIcon} size={15} />{s.levelName}</span>
            {s.weekStreak > 0 && <span className="flex items-center gap-0.5 text-flame"><FlameIcon size={13} />{s.weekStreak} hafta</span>}
          </p>
          <p className="mt-1 text-xs font-bold text-muted truncate">
            {place ? `${place}${placeAt ? ` · ${timeAgo(placeAt)}` : ""}` : last ? `${last.restaurantName} · ${timeAgo(last.createdAt)}` : "Henüz fiş paylaşmadı"}
          </p>
        </Link>
        <button onClick={onMessage} aria-label="Mesaj gönder" className="btn btn-ghost !p-0 w-11 h-11 !rounded-2xl !text-primary shrink-0"><ChatIcon size={22} /></button>
      </div>
      {confirming ? (
        <div className="mt-3 flex gap-2">
          <button onClick={onConfirmRemove} className="btn btn-ghost btn-sm flex-1 !text-red-500">Evet, çıkar</button>
          <button onClick={onCancelRemove} className="btn btn-ghost btn-sm flex-1 !text-muted">Vazgeç</button>
        </div>
      ) : (
        <button onClick={onAskRemove} className="mt-2 text-[11px] font-extrabold text-muted/80 underline underline-offset-2">Arkadaşlıktan çıkar</button>
      )}
    </div>
  );
}
