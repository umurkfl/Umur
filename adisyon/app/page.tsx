"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, TrendingUp, Receipt, Send, Star, ThumbsUp, ThumbsDown, Trash2, Heart, MessageCircle } from "lucide-react";
import { RESTAURANTS, RECEIPTS, formatCurrency, priceLabel, priceColors, timeAgo } from "@/lib/mock";
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
      await store.setCommentReaction(r);
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
                <span className="font-semibold text-charcoal">{c.userName}</span>
                {" "}
                <span className="text-ink">{c.text}</span>
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-muted">{timeAgo(c.createdAt)}</span>
                <ReactionBar commentId={c.id} />
                {user?.id === c.userId && (
                  <button onClick={() => deleteComment(c.id)} className="text-[10px] text-muted active:text-red-500 opacity-0 group-active:opacity-100">
                    sil
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
              <p className="text-xs font-semibold text-ink">{c.userName}</p>
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

// ─── Receipt like button ──────────────────────────────────────────────────────

function ReceiptLikeButton({ receiptId }: { receiptId: string }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const likes = store.getReceiptLikes(receiptId);
    setCount(likes.length);
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
    <button onClick={toggle} className="flex items-center gap-1.5 active:scale-90 transition-transform">
      <Heart className={`w-6 h-6 transition-colors ${liked ? "fill-red-500 stroke-red-500" : "stroke-charcoal"}`} />
      {count > 0 && <span className="text-sm font-semibold text-charcoal">{count}</span>}
    </button>
  );
}

// ─── Instagram-style receipt card ────────────────────────────────────────────

function UserReceiptCard({ r }: { r: StoredReceipt }) {
  const [commentOpen, setCommentOpen] = useState(false);

  return (
    <article className="bg-surface border-b border-border">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
          {r.userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-charcoal truncate">{r.restaurantName}</p>
          <p className="text-xs text-muted">{r.userName} · {timeAgo(r.createdAt)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-primary">{formatCurrency(r.perPerson)}</p>
          <p className="text-[10px] text-muted">/kişi</p>
        </div>
      </div>

      {/* Photo */}
      {r.photo && (
        <div className="bg-dark">
          <img src={r.photo} alt={r.restaurantName} className="w-full max-h-[480px] object-contain" />
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-1">
        <ReceiptLikeButton receiptId={r.id} />
        <button
          onClick={() => setCommentOpen((v) => !v)}
          className="flex items-center gap-1.5 active:scale-90 transition-transform"
        >
          <MessageCircle className={`w-6 h-6 transition-colors ${commentOpen ? "stroke-primary" : "stroke-charcoal"}`} />
        </button>
        <div className="ml-auto">
          <WishlistButton restaurantName={r.restaurantName} size="sm" />
        </div>
      </div>

      {/* Caption / receipt info */}
      <div className="px-4 pb-2 space-y-1">
        {r.rating > 0 && (
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
            ))}
          </div>
        )}
        {r.comment && (
          <p className="text-sm">
            <span className="font-semibold text-charcoal">{r.userName}</span>
            {" "}
            <span className="text-ink">{r.comment}</span>
          </p>
        )}
        <div className="flex gap-3 text-xs text-muted flex-wrap">
          <span>{r.people} kişi</span>
          <span>Toplam <span className="font-semibold text-ink">{formatCurrency(r.total)}</span></span>
        </div>
      </div>

      {/* Inline comments — always shown */}
      <CommentSection receiptId={r.id} inline />
    </article>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const [userReceipts, setUserReceipts] = useState<StoredReceipt[]>([]);

  useEffect(() => { store.getReceipts().then(setUserReceipts); }, []);

  const trending = RESTAURANTS.slice().sort((a, b) => b.receiptCount - a.receiptCount).slice(0, 3);

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

      {/* Community feed */}
      {userReceipts.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 px-4 mb-3">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-charcoal">Topluluktan Son Paylaşımlar</h2>
          </div>
          <div className="border-t border-border">
            {userReceipts.slice(0, 10).map((r) => <UserReceiptCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-charcoal">Bu Hafta Popüler</h2>
        </div>
        <div className="space-y-3">
          {trending.map((r) => {
            const c = priceColors(r.priceRange);
            return (
              <Link key={r.id} href={`/restaurants/${r.slug}`} className="block">
                <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-charcoal">{r.name}</p>
                      <p className="text-xs text-muted mt-0.5">{r.cuisine} · {r.city}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-2 py-1 rounded-full text-sm font-bold ${c.bg} ${c.text}`}>{priceLabel(r.priceRange)}</span>
                      <WishlistButton restaurantName={r.name} restaurantSlug={r.slug} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted">Kişi başı <span className="font-semibold text-ink">~{formatCurrency(r.avgSpendPerPerson)}</span></span>
                    <span className="text-yellow-500 font-semibold">★ {r.avgRating.toFixed(1)}</span>
                    <span className="text-muted ml-auto text-xs">{r.receiptCount} adisyon</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link href="/discover" className="block text-center text-sm text-primary font-semibold mt-3 py-2">Tüm restoranları gör →</Link>
      </section>

      {/* Sample receipts */}
      <section className="px-4 pb-24">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-5 h-5 text-muted" />
          <h2 className="font-bold text-charcoal">Örnek Adisyonlar</h2>
        </div>
        <div className="space-y-4">
          {RECEIPTS.slice(0, 3).map((receipt) => {
            const restaurant = RESTAURANTS.find((r) => r.id === receipt.restaurantId)!;
            return (
              <div key={receipt.id}>
                <Link href={`/restaurants/${restaurant.slug}`} className="text-sm font-semibold text-ink mb-1.5 block">{restaurant.name}</Link>
                <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted">{timeAgo(receipt.createdAt)}</span>
                    <span className="font-bold text-charcoal">{formatCurrency(receipt.total)}</span>
                  </div>
                  {receipt.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-0.5">
                      <span className="text-ink truncate flex-1 mr-2">{item.quantity > 1 && <span className="text-muted">{item.quantity}× </span>}{item.name}</span>
                      <span className="text-muted shrink-0">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  {receipt.items.length > 3 && <p className="text-xs text-muted mt-1">+{receipt.items.length - 3} ürün daha</p>}
                  <CommentSection receiptId={receipt.id} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
