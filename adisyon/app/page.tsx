"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, TrendingUp, Receipt, Send, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { RESTAURANTS, RECEIPTS, formatCurrency, priceLabel, priceColors, timeAgo } from "@/lib/mock";
import { store, StoredReceipt, StoredComment, CommentReaction } from "@/lib/store";
import { useAuth } from "@/lib/auth";

function Avatar({ name, photo, size = "sm" }: { name: string; photo?: string | null; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";
  if (photo) return <img src={photo} className={`${cls} rounded-full object-cover shrink-0`} alt={name} />;
  return (
    <div className={`${cls} bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

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
      setReactions((prev) => {
        const without = prev.filter((r) => r.userId !== user.id);
        return [...without, r];
      });
    }
  }

  return (
    <div className="flex gap-3 mt-1.5">
      <button
        onClick={() => react("like")}
        className={`flex items-center gap-1 text-xs transition-colors ${myReaction === "like" ? "text-green-600 font-semibold" : "text-gray-400"}`}
      >
        <ThumbsUp className="w-3.5 h-3.5" /> {likes > 0 && likes}
      </button>
      <button
        onClick={() => react("dislike")}
        className={`flex items-center gap-1 text-xs transition-colors ${myReaction === "dislike" ? "text-red-500 font-semibold" : "text-gray-400"}`}
      >
        <ThumbsDown className="w-3.5 h-3.5" /> {dislikes > 0 && dislikes}
      </button>
    </div>
  );
}

function CommentSection({ receiptId }: { receiptId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [text, setText] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { store.getComments(receiptId).then(setComments); }, [receiptId]);

  async function send() {
    if (!user || !text.trim()) return;
    const c: StoredComment = {
      id: crypto.randomUUID(), userId: user.id, userName: user.name,
      receiptId, text: text.trim(), createdAt: new Date().toISOString(),
    };
    await store.addComment(c);
    setComments((prev) => [...prev, c]);
    setText("");
  }

  const visible = showAll ? comments : comments.slice(0, 2);

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
      {visible.map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar name={c.userName} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-gray-700">{c.userName}</p>
              <p className="text-xs text-gray-600 mt-0.5">{c.text}</p>
            </div>
            <ReactionBar commentId={c.id} />
          </div>
        </div>
      ))}

      {comments.length > 2 && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-xs text-orange-500 font-semibold ml-8">
          {comments.length - 2} yorum daha gör
        </button>
      )}

      {user ? (
        <div className="flex gap-2 pt-1">
          <Avatar name={user.name} photo={user.avatar} size="sm" />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Yorum yaz..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button onClick={send} disabled={!text.trim()} className="text-orange-500 disabled:text-gray-300">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <Link href="/auth" className="text-xs text-orange-500 font-semibold ml-8 block">
          Yorum yapmak için giriş yap →
        </Link>
      )}
    </div>
  );
}

function UserReceiptCard({ r }: { r: StoredReceipt }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {r.photo && (
        <div className="bg-gray-900">
          <img src={r.photo} alt="Adisyon" className="w-full max-h-56 object-contain" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-gray-900">{r.restaurantName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {r.userName} · {timeAgo(r.createdAt)} · {r.people} kişi
            </p>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="font-bold text-gray-900">{formatCurrency(r.total)}</p>
            <p className="text-xs text-orange-500 font-medium">kişi başı {formatCurrency(r.perPerson)}</p>
          </div>
        </div>
        {r.rating > 0 && (
          <div className="flex gap-0.5 mb-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-gray-200"}`} />
            ))}
          </div>
        )}
        {r.comment && <p className="text-sm text-gray-600 leading-snug mb-1">{r.comment}</p>}
        <CommentSection receiptId={r.id} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [userReceipts, setUserReceipts] = useState<StoredReceipt[]>([]);

  useEffect(() => { store.getReceipts().then(setUserReceipts); }, []);

  const trending = RESTAURANTS.slice().sort((a, b) => b.receiptCount - a.receiptCount).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Adisyonunu paylaş</h1>
        <p className="text-orange-100 text-sm mb-4 leading-relaxed">
          Gerçek fiyatları topluluğunla paylaş, başkalarının deneyimini kolaylaştır.
        </p>
        <Link
          href={user ? "/upload" : "/auth"}
          className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold rounded-full px-5 py-2.5 text-sm active:scale-95 transition-transform"
        >
          <Camera className="w-4 h-4" />
          {user ? "Adisyon Ekle" : "Katıl & Paylaş"}
        </Link>
      </div>

      {/* Community receipts */}
      {userReceipts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-900">Topluluktan Son Adisyonlar</h2>
          </div>
          <div className="space-y-3">
            {userReceipts.slice(0, 6).map((r) => <UserReceiptCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-gray-900">Bu Hafta Popüler</h2>
        </div>
        <div className="space-y-3">
          {trending.map((r) => {
            const c = priceColors(r.priceRange);
            return (
              <Link key={r.id} href={`/restaurants/${r.slug}`} className="block">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.cuisine} · {r.city}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm font-bold ${c.bg} ${c.text}`}>{priceLabel(r.priceRange)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">Kişi başı <span className="font-semibold text-gray-800">~{formatCurrency(r.avgSpendPerPerson)}</span></span>
                    <span className="text-yellow-500 font-semibold">★ {r.avgRating.toFixed(1)}</span>
                    <span className="text-gray-400 ml-auto text-xs">{r.receiptCount} adisyon</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link href="/discover" className="block text-center text-sm text-orange-600 font-semibold mt-3 py-2">
          Tüm restoranları gör →
        </Link>
      </section>

      {/* Mock receipts */}
      <section className="pb-4">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-5 h-5 text-gray-400" />
          <h2 className="font-bold text-gray-900">Örnek Adisyonlar</h2>
        </div>
        <div className="space-y-4">
          {RECEIPTS.slice(0, 3).map((receipt) => {
            const restaurant = RESTAURANTS.find((r) => r.id === receipt.restaurantId)!;
            return (
              <div key={receipt.id}>
                <Link href={`/restaurants/${restaurant.slug}`} className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  {restaurant.name}
                </Link>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">{timeAgo(receipt.createdAt)}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(receipt.total)}</span>
                  </div>
                  {receipt.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-0.5">
                      <span className="text-gray-600 truncate flex-1 mr-2">
                        {item.quantity > 1 && <span className="text-gray-400">{item.quantity}× </span>}
                        {item.name}
                      </span>
                      <span className="text-gray-400 shrink-0">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  {receipt.items.length > 3 && <p className="text-xs text-gray-400 mt-1">+{receipt.items.length - 3} ürün daha</p>}
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
