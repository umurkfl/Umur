"use client";

import { useState, useEffect } from "react";
import { X, Search, Send, Check } from "lucide-react";
import { store, StoredReceipt } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export function ShareSheet({ receipt, onClose }: { receipt: StoredReceipt; onClose: () => void }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<{ userId: string; userName: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    store.getFriendships(user.id).then((fs) => {
      setFriends(
        fs
          .filter((f) => f.status === "accepted")
          .map((f) => ({
            userId: f.userId === user.id ? f.friendId : f.userId,
            userName: f.userId === user.id ? f.friendName : f.userName,
          }))
      );
    });
  }, [user?.id]);

  const filtered = friends.filter((f) =>
    f.userName.toLowerCase().includes(q.toLowerCase())
  );

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  async function handleSend() {
    if (!user || selected.size === 0) return;
    setSending(true);
    const avatar = await store.getPublicAvatar(user.id);
    for (const f of friends.filter((x) => selected.has(x.userId))) {
      await store.sendDirectMessage({
        id: crypto.randomUUID(),
        fromUserId: user.id,
        fromUserName: user.name,
        fromUserAvatar: avatar ?? undefined,
        toUserId: f.userId,
        toUserName: f.userName,
        type: "receipt",
        receiptId: receipt.id,
        restaurantName: receipt.restaurantName,
        text: note.trim() || undefined,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    setSent(true);
    setTimeout(onClose, 1100);
  }

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="relative bg-surface rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div>
            <p className="font-bold text-charcoal text-base">Gönder</p>
            <p className="text-xs text-muted truncate max-w-[220px]">{receipt.restaurantName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-background transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
              <Check className="w-7 h-7 text-white" />
            </div>
            <p className="font-semibold text-charcoal">Gönderildi!</p>
          </div>
        ) : (
          <>
            {friends.length > 4 && (
              <div className="px-4 pt-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="search"
                    placeholder="Arkadaş ara..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 min-h-0">
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted py-10">
                  {friends.length === 0
                    ? "Henüz arkadaşın yok. Arkadaş ekleyerek adisyon paylaşabilirsin."
                    : "Sonuç bulunamadı."}
                </p>
              )}
              {filtered.map((f) => (
                <button
                  key={f.userId}
                  onClick={() => toggle(f.userId)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${
                    selected.has(f.userId) ? "bg-primary-light" : "active:bg-background"
                  }`}
                >
                  <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {f.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-ink flex-1 text-left">{f.userName}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected.has(f.userId) ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {selected.has(f.userId) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            {selected.size > 0 && (
              <div className="px-4 pb-8 pt-2 border-t border-border space-y-2 shrink-0">
                <input
                  type="text"
                  placeholder="Bir not ekle... (isteğe bağlı)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={120}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full bg-primary text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Gönderiliyor..." : `${selected.size} kişiye gönder`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
