"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store, StoredReceipt } from "@/lib/store";
import { haptic } from "@/lib/haptics";

interface Story { friendId: string; name: string; receipt: StoredReceipt; avatar: string | null }

const WEEK = 7 * 24 * 60 * 60 * 1000;
const seenKey = (uid: string) => `grazer_seen_${uid}`;

function readSeen(uid: string): string[] {
  try { return JSON.parse(localStorage.getItem(seenKey(uid)) ?? "[]") as string[]; } catch { return []; }
}

function Ring({ unseen, children }: { unseen: boolean; children: React.ReactNode }) {
  return (
    <div className={`w-[68px] h-[68px] rounded-full p-[3px] ${unseen ? "bg-primary" : "bg-border"}`}>
      <div className="w-full h-full rounded-full bg-page p-[2.5px]">{children}</div>
    </div>
  );
}

function Face({ name, avatar }: { name: string; avatar: string | null }) {
  return avatar
    ? <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
    : <div className="w-full h-full rounded-full bg-primary-light flex items-center justify-center text-xl font-black text-primary">{name.charAt(0).toUpperCase()}</div>;
}

/** Friends' fresh receipts of the last 7 days as a horizontal strip, Instagram-style. */
export function Stories({ onOpen }: { onOpen: (r: StoredReceipt) => void }) {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [hasFriends, setHasFriends] = useState(true);

  useEffect(() => {
    if (!user) { setStories(null); return; }
    let alive = true;
    setSeen(readSeen(user.id));
    (async () => {
      const fs = (await store.getFriendships(user.id)).filter((f) => f.status === "accepted");
      if (!alive) return;
      setHasFriends(fs.length > 0);
      if (!fs.length) { setStories([]); return; }
      const ids = fs.map((f) => (f.userId === user.id ? f.friendId : f.userId));
      const names = new Map(fs.map((f) => [f.userId === user.id ? f.friendId : f.userId, f.userId === user.id ? f.friendName : f.userName]));
      const { receipts } = await store.getFriendActivity(ids, names);
      const latest = new Map<string, StoredReceipt>();
      for (const r of receipts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
        if (Date.now() - new Date(r.createdAt).getTime() > WEEK) continue;
        if (!latest.has(r.userId)) latest.set(r.userId, r);
      }
      const list: Story[] = await Promise.all([...latest.values()].map(async (r) => ({
        friendId: r.userId, name: names.get(r.userId) ?? r.userName, receipt: r, avatar: await store.getPublicAvatar(r.userId),
      })));
      if (alive) setStories(list);
    })();
    return () => { alive = false; };
  }, [user]);

  if (!user) return null;
  if (stories === null) {
    return (
      <div className="flex gap-4 overflow-hidden px-4 pb-4" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shrink-0 w-[68px]"><div className="skeleton w-[68px] h-[68px] rounded-full" /><div className="skeleton h-2.5 w-12 rounded-full mx-auto mt-2" /></div>)}
      </div>
    );
  }

  function open(s: Story) {
    haptic("tap");
    const next = Array.from(new Set([...seen, s.receipt.id]));
    setSeen(next);
    try { localStorage.setItem(seenKey(user!.id), JSON.stringify(next)); } catch { /* ignore */ }
    onOpen(s.receipt);
  }

  const sorted = [...stories].sort((a, b) => Number(seen.includes(a.receipt.id)) - Number(seen.includes(b.receipt.id)));

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4" role="list" aria-label="Arkadaşlarının yeni paylaşımları">
      <Link href="/upload" role="listitem" className="shrink-0 w-[68px] text-center active:scale-95 transition-transform">
        <div className="relative w-[68px] h-[68px]">
          <div className="w-full h-full rounded-full border-2 border-dashed border-border p-[3px]">
            <Face name={user.name} avatar={user.avatar ?? null} />
          </div>
          <span className="absolute -right-0.5 -bottom-0.5 w-6 h-6 rounded-full bg-primary border-2 border-page flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={4} />
          </span>
        </div>
        <p className="mt-1.5 text-[11px] font-extrabold text-muted truncate">Fiş ekle</p>
      </Link>

      {sorted.map((s) => {
        const unseen = !seen.includes(s.receipt.id);
        return (
          <button key={s.receipt.id} role="listitem" onClick={() => open(s)} className="shrink-0 w-[68px] text-center active:scale-95 transition-transform">
            <Ring unseen={unseen}><Face name={s.name} avatar={s.avatar} /></Ring>
            <p className={`mt-1.5 text-[11px] truncate ${unseen ? "font-black text-charcoal" : "font-bold text-muted"}`}>{s.name.split(" ")[0]}</p>
          </button>
        );
      })}

      {stories.length === 0 && (
        <Link href="/friends" className="shrink-0 self-center ml-1 text-xs font-extrabold text-muted leading-snug max-w-[150px]">
          {hasFriends ? "Arkadaşların bu hafta fiş paylaşmadı." : "Arkadaş ekle, onların fişlerini burada gör."}
          <span className="block text-primary mt-0.5">Arkadaşlara git</span>
        </Link>
      )}
    </div>
  );
}
