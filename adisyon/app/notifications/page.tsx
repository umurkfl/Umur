"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, MessageCircle, ThumbsUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store, StoredFriendship, StoredNotification, StoredReceipt } from "@/lib/store";
import { Gus } from "@/components/Gus";
import { ListSkeleton } from "@/components/Skeleton";
import { ReceiptPopup } from "@/app/page";
import { haptic } from "@/lib/haptics";

const DAY = 24 * 60 * 60 * 1000;

function group(notifs: StoredNotification[]) {
  const now = Date.now();
  const groups: { title: string; items: StoredNotification[] }[] = [
    { title: "Bugün", items: [] }, { title: "Bu hafta", items: [] }, { title: "Daha önce", items: [] },
  ];
  for (const n of notifs) {
    const age = now - new Date(n.createdAt).getTime();
    groups[age < DAY ? 0 : age < 7 * DAY ? 1 : 2].items.push(n);
  }
  return groups.filter((g) => g.items.length > 0);
}

export default function NotificationsPage() {
  const { user, ready } = useAuth();
  const [requests, setRequests] = useState<StoredFriendship[]>([]);
  const [notifs, setNotifs] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<StoredReceipt | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([store.getFriendships(user.id), store.getNotifications(user.id)]).then(([fs, ns]) => {
      setRequests(fs.filter((f) => f.status === "pending" && f.friendId === user.id));
      setNotifs(ns.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
      store.markNotificationsRead(user.id);
      window.dispatchEvent(new CustomEvent("adisyon:messages-read")); // refresh the bell badge
    });
  }, [user]);

  async function respond(f: StoredFriendship, accept: boolean) {
    haptic(accept ? "success" : "tap");
    if (accept) await store.acceptFriendRequest(f.id); else await store.removeFriendship(f.id);
    setRequests((prev) => prev.filter((r) => r.id !== f.id));
    window.dispatchEvent(new CustomEvent("adisyon:messages-read"));
  }

  async function open(n: StoredNotification) {
    if (!n.receiptId) return;
    const r = await store.getReceiptById(n.receiptId);
    if (r) setPopup(r);
  }

  if (ready && !user) {
    return (
      <div className="flex flex-col items-center text-center py-16 gap-3 px-6">
        <Gus mood="wink" size={150} />
        <h1>Bildirimler</h1>
        <p className="text-muted font-semibold">Bildirimlerini görmek için giriş yap.</p>
        <Link href="/auth" className="btn btn-primary">Giriş Yap</Link>
      </div>
    );
  }

  const empty = !loading && requests.length === 0 && notifs.length === 0;
  return (
    <div className="pb-10">
      <div className="px-4 flex items-center gap-2 -mb-1">
        <Link href="/" aria-label="Geri" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform">
          <ArrowLeft className="w-6 h-6" strokeWidth={3} />
        </Link>
      </div>
      <h1 className="px-4 mb-4">Bildirimler</h1>

      {loading && <ListSkeleton rows={4} />}

      {empty && (
        <div className="flex flex-col items-center text-center px-6 py-12 gap-2">
          <Gus mood="sleepy" size={150} />
          <p className="text-xl font-black text-charcoal mt-2">Sessiz bir gün</p>
          <p className="text-sm font-semibold text-muted">Yeni bir şey olduğunda ilk ben haber veririm.</p>
        </div>
      )}

      {requests.length > 0 && (
        <section className="px-4 mb-5">
          <h2 className="text-sm font-black text-muted uppercase tracking-wide mb-2">Arkadaşlık istekleri</h2>
          <div className="space-y-3">
            {requests.map((f) => (
              <div key={f.id} className="rounded-3xl border-2 border-b-4 border-border bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-lg font-black text-primary shrink-0">{f.userName.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-charcoal truncate">{f.userName}</p>
                    <p className="text-sm font-semibold text-muted">sana arkadaşlık isteği gönderdi</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => respond(f, true)} className="btn btn-primary btn-sm flex-1"><Check className="w-4 h-4" strokeWidth={3} /> Kabul et</button>
                  <button onClick={() => respond(f, false)} className="btn btn-ghost btn-sm flex-1 !text-muted"><X className="w-4 h-4" strokeWidth={3} /> Reddet</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {group(notifs).map((g) => (
        <section key={g.title} className="px-4 mb-5">
          <h2 className="text-sm font-black text-muted uppercase tracking-wide mb-2">{g.title}</h2>
          <div className="rounded-3xl border-2 border-b-4 border-border bg-surface overflow-hidden">
            {g.items.map((n) => (
              <button key={n.id} onClick={() => open(n)} className="w-full text-left flex items-start gap-3 px-4 py-3.5 border-b-2 border-border/70 last:border-0 active:bg-background transition-colors">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${n.type === "comment" ? "bg-primary-light text-primary" : "bg-gold/25 text-gold-shade"}`}>
                  {n.type === "comment" ? <MessageCircle className="w-5 h-5" strokeWidth={2.5} /> : <ThumbsUp className="w-5 h-5" strokeWidth={2.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-ink leading-snug">
                    <span className="font-black text-charcoal">{n.actorName}</span>
                    {n.type === "comment" ? " adisyonuna yorum yaptı" : " yorumunu beğendi"}
                  </p>
                  {n.type === "comment" && n.text && <p className="text-sm font-semibold text-muted mt-0.5 truncate">“{n.text}”</p>}
                  <p className="text-xs font-bold text-muted mt-1">{new Date(n.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shrink-0" />}
              </button>
            ))}
          </div>
        </section>
      ))}

      {popup && <ReceiptPopup r={popup} onClose={() => setPopup(null)} />}
    </div>
  );
}
