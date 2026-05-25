"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Camera, Receipt, Send, Star, ThumbsUp, ThumbsDown, Trash2, X, ChevronRight } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/mock";
import { store, StoredReceipt, StoredComment, CommentReaction } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { WishlistButton } from "@/components/WishlistButton";

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ name, photo, size = "sm" }: { name: string; photo?: string | null; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";
  if (photo) return <img src={photo} className={`${cls} rounded-full object-cover shrink-0`} alt={name} />;
  return (
    <div className={`${cls} bg-primary-light rounded-full flex items-center justify-center font-bold text-primary shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Comment reaction bar ────────────────────────────────────────────────────

function ReactionBar({ commentId }: { commentId: string }) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<CommentReaction[]>([]);

  useEffect(() => { store.getCommentReactions(commentId).then(setReactions); }, [commentId]);

  const likes = reactions.filter((r) => r.reaction === "like").length;
  const dislikes = reactions.filter((r) => r.reaction === "dislike").length;
  const myReaction = user ? reactions.find((r) => r.userId === user.id)?.reaction : undefined;

  async function react(type: "like" | "dislike") {
    if (!user) return;
    if (myReaction === type) {
      await store.removeCommentReaction(user.id, commentId);
      setReactions((prev) => prev.filter((r) => r.userId !== user.id));
    } else {
      const r: CommentReaction = { id: crypto.randomUUID(), userId: user.id, commentId, reaction: type };
      await store.setCommentReaction(r, user.name);
      setReactions((prev) => [...prev.filter((r) => r.userId !== user.id), r]);
    }
  }

  return (
    <div className="flex gap-3 mt-1">
      <button onClick={() => react("like")} className={`flex items-center gap-1 text-xs transition-colors ${myReaction === "like" ? "text-primary font-semibold" : "text-muted"}`}>
        <ThumbsUp className="w-3 h-3" /> {likes > 0 && likes}
      </button>
      <button onClick={() => react("dislike")} className={`flex items-center gap-1 text-xs transition-colors ${myReaction === "dislike" ? "text-red-500 font-semibold" : "text-muted"}`}>
        <ThumbsDown className="w-3 h-3" /> {dislikes > 0 && dislikes}
      </button>
    </div>
  );
}

// ─── Comment section ─────────────────────────────────────────────────────────

export function CommentSection({ receiptId, inline = false }: { receiptId: string; inline?: boolean }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [text, setText] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { store.getComments(receiptId).then(setComments); }, [receiptId]);

  async function send() {
    if (!user || !text.trim()) return;
    const c: StoredComment = {
      id: crypto.randomUUID(), userId: user.id, userName: user.name,
      userAvatar: user.avatar ?? "", receiptId, text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    await store.addComment(c);
    setComments((prev) => [...prev, c]);
    setText("");
  }

  async function deleteComment(commentId: string) {
    await store.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  const visible = showAll ? comments : comments.slice(-2);

  if (inline) {
    return (
      <div className="px-3 pb-3 space-y-1.5">
        {/* Comments */}
        {comments.length > 2 && !showAll && (
          <button onClick={() => setShowAll(true)} className="text-xs text-muted font-semibold">
            Tüm {comments.length} yorumu gör
          </button>
        )}
        {visible.map((c) => (
          <div key={c.id} className="flex gap-2 items-start group">
            <Avatar name={c.userName} photo={c.userAvatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug">
                <Link href={`/users?id=${c.userId}&n=${encodeURIComponent(c.userName)}`} className="font-semibold text-charcoal hover:underline">{c.userName}</Link>
                {" "}
                <span className="text-ink">{c.text}</span>
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-muted">{timeAgo(c.createdAt)}</span>
                <ReactionBar commentId={c.id} />
                {user?.id === c.userId && (
                  <button onClick={() => deleteComment(c.id)} className="text-muted active:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Input */}
        {user ? (
          <div className="flex gap-2 items-center pt-1">
            <Avatar name={user.name} photo={user.avatar} size="sm" />
            <div className="flex-1 flex gap-2 bg-background rounded-full px-3 py-1.5 border border-border">
              <input
                type="text" value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Yorum ekle..."
                className="flex-1 bg-transparent text-xs focus:outline-none text-ink placeholder:text-muted"
              />
              {text.trim() && (
                <button onClick={send} className="text-primary text-xs font-bold shrink-0">
                  Paylaş
                </button>
              )}
            </div>
          </div>
        ) : (
          <Link href="/auth" className="text-xs text-primary font-semibold">
            Yorum yapmak için giriş yap →
          </Link>
        )}
      </div>
    );
  }

  // Modal / non-inline mode (kept for ReceiptModal usage)
  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      {visible.map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar name={c.userName} photo={c.userAvatar} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="bg-background rounded-xl px-3 py-2 relative">
              <Link href={`/users?id=${c.userId}&n=${encodeURIComponent(c.userName)}`} className="text-xs font-semibold text-ink hover:underline">{c.userName}</Link>
              <p className="text-xs text-ink mt-0.5 pr-5">{c.text}</p>
              {user?.id === c.userId && (
                <button onClick={() => deleteComment(c.id)} className="absolute top-2 right-2 text-border active:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <ReactionBar commentId={c.id} />
          </div>
        </div>
      ))}
      {comments.length > 2 && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-xs text-primary font-semibold ml-8">
          {comments.length - 2} yorum daha gör
        </button>
      )}
      {user ? (
        <div className="flex gap-2 pt-1">
          <Avatar name={user.name} photo={user.avatar} size="sm" />
          <div className="flex-1 flex gap-2">
            <input
              type="text" value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Yorum yaz..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={send} disabled={!text.trim()} className="text-primary disabled:text-border">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <Link href="/auth" className="text-xs text-primary font-semibold ml-8 block">
          Yorum yapmak için giriş yap →
        </Link>
      )}
    </div>
  );
}

// ─── Receipt helpful button ───────────────────────────────────────────────────

function HelpfulButton({ receiptId }: { receiptId: string }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(store.getReceiptLikes(receiptId).length);
    if (user) setLiked(store.isReceiptLiked(user.id, receiptId));
  }, [receiptId, user]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return;
    const nowLiked = store.toggleReceiptLike(user.id, receiptId);
    setLiked(nowLiked);
    setCount((c) => c + (nowLiked ? 1 : -1));
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
        liked
          ? "bg-primary border-primary text-white"
          : "bg-surface border-border text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {/* Checkmark icon */}
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2.5 8.5l3.5 3.5 7-7" />
      </svg>
      {liked ? "Faydalı buldum" : "Faydalı"}
      {count > 0 && <span className={`font-bold ${liked ? "text-white/80" : "text-muted"}`}>{count}</span>}
    </button>
  );
}

// ─── Receipt detail sheet ────────────────────────────────────────────────────

function ReceiptDetailSheet({ r, onClose, onDelete }: { r: StoredReceipt; onClose: () => void; onDelete?: () => void }) {
  const { user } = useAuth();
  const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "friend">("none");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    await store.deleteReceipt(r.id);
    onClose();
    onDelete?.();
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!user || user.id === r.userId) return;
    store.getFriendships(user.id).then((fs) => {
      const match = fs.find((f) => (f.userId === user.id && f.friendId === r.userId) || (f.userId === r.userId && f.friendId === user.id));
      if (!match) setFriendStatus("none");
      else if (match.status === "accepted") setFriendStatus("friend");
      else setFriendStatus("pending");
    });
  }, [user, r.userId]);

  async function addFriend() {
    if (!user) return;
    await store.sendFriendRequest(user.id, user.name, r.userId, r.userName);
    setFriendStatus("pending");
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-surface z-10">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {r.photo && (
          <div className="bg-dark">
            <img src={r.photo} alt={r.restaurantName} className="w-full max-h-72 object-contain" />
          </div>
        )}

        <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-2">
          <h2 className="font-bold text-charcoal text-lg flex-1 min-w-0 truncate">{r.restaurantName}</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            {user?.id === r.userId && (
              confirmDelete ? (
                <>
                  <button onClick={handleDelete} className="text-xs font-semibold text-red-500 px-2 py-1 rounded-lg active:bg-red-50">Sil</button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted px-2 py-1 rounded-lg active:bg-background">İptal</button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-background text-muted active:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-background text-muted shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40">
          <Link href={`/users?id=${r.userId}&n=${encodeURIComponent(r.userName)}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {r.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{r.userName}</p>
              <p className="text-xs text-muted">{timeAgo(r.createdAt)} · {r.people} kişi</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted shrink-0" />
          </Link>
          {user && user.id !== r.userId && (
            <button
              onClick={addFriend}
              disabled={friendStatus !== "none"}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                friendStatus === "friend" ? "bg-primary-light text-primary" :
                friendStatus === "pending" ? "bg-background border border-border text-muted" :
                "bg-primary text-white active:scale-95"
              }`}
            >
              {friendStatus === "friend" ? "Arkadaş ✓" : friendStatus === "pending" ? "Bekliyor" : "+ Arkadaş"}
            </button>
          )}
        </div>

        <div className="px-4 py-3 flex items-center gap-4 border-b border-border/40">
          <div className="bg-primary-light rounded-xl px-4 py-2">
            <p className="text-xl font-bold text-primary leading-none">{formatCurrency(r.perPerson)}</p>
            <p className="text-[10px] text-primary/70 mt-0.5">kişi başı</p>
          </div>
          <p className="text-sm text-muted">Toplam: <span className="font-semibold text-ink">{formatCurrency(r.total)}</span></p>
        </div>

        {(r.rating > 0 || r.comment) && (
          <div className="px-4 py-3 border-b border-border/40 space-y-1.5">
            {r.rating > 0 && (
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
                ))}
              </div>
            )}
            {r.comment && <p className="text-sm text-ink">{r.comment}</p>}
          </div>
        )}

        <div className="pb-8">
          <CommentSection receiptId={r.id} inline />
        </div>
      </div>
    </>
  );
}

// ─── Receipt card ─────────────────────────────────────────────────────────────

function UserReceiptCard({ r, onOpen, onDelete }: { r: StoredReceipt; onOpen: () => void; onDelete?: () => void }) {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    await store.deleteReceipt(r.id);
    onDelete?.();
  }

  return (
    <article className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Fiyat + meta */}
      <div className="px-4 pt-3.5 pb-1 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/restaurants?name=${encodeURIComponent(r.restaurantName)}`} onClick={(e) => e.stopPropagation()} className="font-bold text-charcoal text-base leading-tight truncate block hover:text-primary transition-colors">{r.restaurantName}</Link>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Link href={`/users?id=${r.userId}&n=${encodeURIComponent(r.userName)}`} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="w-5 h-5 bg-primary-light rounded-full flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                {r.userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-primary font-medium">{r.userName}</span>
            </Link>
            <span className="text-border text-xs">·</span>
            <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
            <span className="text-border text-xs">·</span>
            <span className="text-xs text-muted">{r.people} kişi</span>
          </div>
        </div>
        {/* Fiyat etiketi */}
        <div className="shrink-0 text-right">
          <div className="bg-primary-light rounded-xl px-3 py-1.5">
            <p className="text-lg font-bold text-primary leading-none">{formatCurrency(r.perPerson)}</p>
            <p className="text-[10px] text-primary/70 mt-0.5">kişi başı</p>
          </div>
          <p className="text-[10px] text-muted mt-1">toplam {formatCurrency(r.total)}</p>
        </div>
      </div>

      {/* Puan + yorum */}
      {(r.rating > 0 || r.comment) && (
        <div className="px-4 py-2 space-y-1">
          {r.rating > 0 && (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
              ))}
            </div>
          )}
          {r.comment && (
            <p className="text-sm text-ink leading-snug">{r.comment}</p>
          )}
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="px-4 py-2.5 flex items-center gap-2 border-t border-border/60">
        <HelpfulButton receiptId={r.id} />
        {r.photo && (
          <button
            onClick={onOpen}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted bg-surface active:scale-95 transition-all"
          >
            📷 Fotoğraf
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <WishlistButton restaurantName={r.restaurantName} size="sm" />
          {user?.id === r.userId && (
            confirmDelete ? (
              <>
                <button onClick={handleDelete} className="text-xs font-semibold text-red-500 active:opacity-70">Sil</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted active:opacity-70">İptal</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="w-7 h-7 flex items-center justify-center rounded-full active:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-muted" />
              </button>
            )
          )}
        </div>
      </div>

      {/* Yorum bölümü */}
      <CommentSection receiptId={r.id} inline />
    </article>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, ready } = useAuth();
  const [userReceipts, setUserReceipts] = useState<StoredReceipt[]>([]);
  const [selected, setSelected] = useState<StoredReceipt | null>(null);

  useEffect(() => {
    if (!ready) return;
    store.getPrivacyFilteredReceipts(user?.id).then(setUserReceipts);
  }, [ready, user?.id]);

  return (
    <div className="space-y-0">
      {/* Hero CTA */}
      <div className="bg-gradient-to-br from-primary to-primary-dark mx-4 mt-4 mb-5 rounded-3xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Adisyonunu paylaş</h1>
        <p className="text-white/80 text-sm mb-4 leading-relaxed">Gerçek fiyatları topluluğunla paylaş, başkalarının deneyimini kolaylaştır.</p>
        <Link href={user ? "/upload" : "/auth"} className="inline-flex items-center gap-2 bg-white text-primary font-bold rounded-full px-5 py-2.5 text-sm active:scale-95 transition-transform">
          <Camera className="w-4 h-4" />
          {user ? "Adisyon Ekle" : "Katıl & Paylaş"}
        </Link>
      </div>

      {/* Feed */}
      {userReceipts.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 px-4 mb-3">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-charcoal">Akış</h2>
          </div>
          <div className="space-y-3 px-4">
            {userReceipts.slice(0, 20).map((r) => (
              <UserReceiptCard
                key={r.id} r={r}
                onOpen={() => setSelected(r)}
                onDelete={() => setUserReceipts((prev) => prev.filter((x) => x.id !== r.id))}
              />
            ))}
          </div>
        </section>
      )}

      {selected && (
        <ReceiptDetailSheet
          r={selected}
          onClose={() => setSelected(null)}
          onDelete={() => setUserReceipts((prev) => prev.filter((x) => x.id !== selected.id))}
        />
      )}
    </div>
  );
}
