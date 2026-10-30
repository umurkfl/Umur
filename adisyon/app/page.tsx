"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Camera, Receipt, Send, Star, ThumbsUp, ThumbsDown, Trash2, X, ChevronRight, MessageCircle } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/mock";
import { store, StoredReceipt, StoredComment, CommentReaction } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { WishlistButton } from "@/components/WishlistButton";
import { ShareSheet } from "@/components/ShareSheet";
import { HomeHero, FeedEmpty, Greeting } from "@/components/HomeHero";
import { Stories } from "@/components/Stories";
import { FeedSkeleton } from "@/components/Skeleton";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 10" className={className} fill="currentColor" aria-hidden>
      <path d="M4 0C2.07 0 .5 1.57.5 3.5c0 2.63 3.5 6.5 3.5 6.5s3.5-3.87 3.5-6.5C7.5 1.57 5.93 0 4 0zm0 4.75a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
    </svg>
  );
}

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

export function CommentSection({ receiptId, inline = false, autoFocus = false }: { receiptId: string; inline?: boolean; autoFocus?: boolean }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [text, setText] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { store.getComments(receiptId).then(setComments); }, [receiptId]);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  // Split into top-level and replies map
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap = new Map<string, StoredComment[]>();
  comments.filter((c) => c.parentId).forEach((c) => {
    const arr = repliesMap.get(c.parentId!) ?? [];
    arr.push(c);
    repliesMap.set(c.parentId!, arr);
  });

  async function send() {
    if (!user || !text.trim()) return;
    const c: StoredComment = {
      id: crypto.randomUUID(), userId: user.id, userName: user.name,
      userAvatar: user.avatar ?? "", receiptId, text: text.trim(),
      createdAt: new Date().toISOString(),
      parentId: replyTo?.id ?? null,
    };
    await store.addComment(c);
    setComments((prev) => [...prev, c]);
    if (replyTo) setExpandedReplies((prev) => new Set([...prev, replyTo.id]));
    setReplyTo(null);
    setText("");
  }

  async function deleteComment(commentId: string) {
    await store.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    setConfirmDeleteId(null);
  }

  function startReply(c: StoredComment) {
    setReplyTo({ id: c.id, userName: c.userName });
    setText(`@${c.userName} `);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  }

  // Visible top-level comments
  const visibleTop = showAll ? topLevel : topLevel.slice(-2);

  function CommentRow({ c, isReply = false }: { c: StoredComment; isReply?: boolean }) {
    const replies = repliesMap.get(c.id) ?? [];
    const repliesExpanded = expandedReplies.has(c.id);
    return (
      <div>
        <div className="flex gap-2 items-start">
          {/* Avatar — smaller for replies */}
          <Link href={`/users?id=${c.userId}&n=${encodeURIComponent(c.userName)}`} className="shrink-0 mt-0.5">
            {isReply
              ? (c.userAvatar
                  ? <img src={c.userAvatar} className="w-5 h-5 rounded-full object-cover" alt={c.userName} />
                  : <div className="w-5 h-5 bg-border rounded-full flex items-center justify-center text-[9px] font-bold text-muted">{c.userName.charAt(0).toUpperCase()}</div>
                )
              : <Avatar name={c.userName} photo={c.userAvatar} size="sm" />
            }
          </Link>
          <div className="flex-1 min-w-0">
            <p className={`leading-snug ${isReply ? "text-[11px]" : "text-xs"}`}>
              <Link href={`/users?id=${c.userId}&n=${encodeURIComponent(c.userName)}`} className={`font-semibold hover:underline ${isReply ? "text-muted" : "text-charcoal"}`}>{c.userName}</Link>
              {" "}<span className="text-ink">{c.text}</span>
            </p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-[10px] text-muted">{timeAgo(c.createdAt)}</span>
              {!isReply && <ReactionBar commentId={c.id} />}
              {user && !isReply && (
                <button onClick={() => startReply(c)} className="text-[10px] font-semibold text-muted active:text-primary transition-colors">
                  Yanıtla
                </button>
              )}
              {user?.id === c.userId && (
                confirmDeleteId === c.id ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => deleteComment(c.id)} className="text-[10px] font-semibold text-red-500 active:opacity-70">Sil</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-muted active:opacity-70">İptal</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(c.id)} className="text-muted active:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Replies section — only on top-level */}
        {!isReply && (replies.length > 0 || repliesExpanded) && (
          <div className="ml-8 mt-1.5">
            {/* Toggle button */}
            <button
              onClick={() => toggleReplies(c.id)}
              className="flex items-center gap-2 text-[11px] font-semibold text-primary active:opacity-70 mb-2"
            >
              <span className="w-5 h-px bg-border/70 shrink-0" />
              {repliesExpanded
                ? "Yanıtları gizle"
                : `${replies.length} yanıt`}
            </button>

            {/* Expanded replies with left accent line */}
            {repliesExpanded && (
              <div className="border-l-2 border-border/50 pl-3 space-y-2.5">
                {replies.map((r) => <CommentRow key={r.id} c={r} isReply />)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const inputArea = (
    <div className="pt-2 space-y-1.5">
      {replyTo && (
        <div className="flex items-center gap-1.5 ml-8">
          <span className="text-[11px] text-muted">Yanıtlıyorsun:</span>
          <span className="text-[11px] font-semibold text-primary">@{replyTo.userName}</span>
          <button
            onClick={() => { setReplyTo(null); setText(""); }}
            className="text-muted active:text-ink ml-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {user ? (
        <div className="flex gap-2 items-center">
          <Avatar name={user.name} photo={user.avatar} size="sm" />
          <div className="flex-1 flex gap-2 bg-background rounded-full px-3 py-1.5 border border-border">
            <input
              ref={inputRef}
              type="text" value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={replyTo ? `@${replyTo.userName} yanıtla...` : "Yorum ekle..."}
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

  if (inline) {
    return (
      <div className="px-3 pt-3 pb-3 space-y-2">
        {topLevel.length > 2 && !showAll && (
          <button onClick={() => setShowAll(true)} className="text-xs text-muted font-semibold">
            Tüm {topLevel.length} yorumu gör
          </button>
        )}
        {visibleTop.map((c) => <CommentRow key={c.id} c={c} />)}
        {inputArea}
      </div>
    );
  }

  // Non-inline (ReceiptModal) mode
  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      {visibleTop.map((c) => <CommentRow key={c.id} c={c} />)}
      {topLevel.length > 2 && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-xs text-primary font-semibold ml-8">
          {topLevel.length - 2} yorum daha gör
        </button>
      )}
      {inputArea}
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
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-extrabold border transition-all active:scale-95 ${
        liked
          ? "bg-primary border-primary text-white"
          : "bg-surface border-border text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {/* Checkmark icon */}
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2.5 8.5l3.5 3.5 7-7" />
      </svg>
      {liked ? "Faydalı buldum" : "Faydalı"}
      {count > 0 && <span className={`font-bold ${liked ? "text-white/80" : "text-muted"}`}>{count}</span>}
    </button>
  );
}

// ─── Photo lightbox ──────────────────────────────────────────────────────────

function PhotoLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20"
        onClick={onClose}
        aria-label="Kapat"
      >
        <X className="w-5 h-5 text-white" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Receipt popup (feed card) ───────────────────────────────────────────────

export function ReceiptPopup({ r, onClose, onDelete }: { r: StoredReceipt; onClose: () => void; onDelete?: () => void }) {
  const { user } = useAuth();
  const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "friend">("none");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [focusComment, setFocusComment] = useState(false);
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  // Full-screen page that slides up from the bottom
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const el = pageRef.current;
    if (el) {
      el.style.transform = "translateY(100%)";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = "transform 0.42s cubic-bezier(0.2,0.9,0.25,1.02)";
        el.style.transform = "translateY(0)";
      }));
    }
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    store.getPublicAvatar(r.userId).then((a) => { if (a) setOwnerAvatar(a); });
  }, [r.userId]);

  useEffect(() => {
    if (!user || user.id === r.userId) return;
    store.getFriendships(user.id).then((fs) => {
      const match = fs.find((f) => (f.userId === user.id && f.friendId === r.userId) || (f.userId === r.userId && f.friendId === user.id));
      if (!match) setFriendStatus("none");
      else if (match.status === "accepted") setFriendStatus("friend");
      else setFriendStatus("pending");
    });
  }, [user, r.userId]);

  function handleClose() {
    const el = pageRef.current;
    if (el) {
      el.style.transition = "transform 0.28s cubic-bezier(0.4,0,0.6,1)";
      el.style.transform = "translateY(100%)";
      setTimeout(onClose, 260);
    } else {
      onClose();
    }
  }

  // Drag the header down to dismiss
  function dragStart(e: React.TouchEvent) { drag.current = { y: e.touches[0].clientY, dy: 0 }; if (pageRef.current) pageRef.current.style.transition = "none"; }
  function dragMove(e: React.TouchEvent) {
    if (!drag.current) return;
    const dy = Math.max(0, e.touches[0].clientY - drag.current.y);
    drag.current.dy = dy;
    if (pageRef.current) pageRef.current.style.transform = `translateY(${dy}px)`;
  }
  function dragEnd() {
    if (!drag.current) return;
    const { dy } = drag.current;
    drag.current = null;
    if (dy > 130) handleClose();
    else if (pageRef.current) { pageRef.current.style.transition = "transform .25s cubic-bezier(.2,.8,.3,1)"; pageRef.current.style.transform = "translateY(0)"; }
  }

  async function handleDelete() {
    await store.deleteReceipt(r.id);
    handleClose();
    onDelete?.();
  }

  async function addFriend() {
    if (!user) return;
    await store.sendFriendRequest(user.id, user.name, r.userId, r.userName);
    setFriendStatus("pending");
  }

  function handleCommentClick() {
    setFocusComment(true);
    setTimeout(() => {
      contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
  }

  const place = [r.district, r.city].filter(Boolean).join(", ");

  return (
    <>
      <div ref={pageRef} className="fixed inset-0 z-[160] bg-page flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {/* Header: photo (or tint) + close + price badge. Dragging it down closes the page. */}
        <div className="relative shrink-0" onTouchStart={dragStart} onTouchMove={dragMove} onTouchEnd={dragEnd}>
          {r.photo ? (
            <button onClick={() => setPhotoOpen(true)} className="block w-full" aria-label="Fotoğrafı büyüt">
              <img src={r.photo} alt={r.restaurantName} className="w-full object-cover" style={{ height: "36vh", minHeight: 220 }} />
            </button>
          ) : (
            <div className="w-full flex items-center justify-center bg-primary-light" style={{ height: "24vh", minHeight: 150 }}>
              <Receipt className="w-16 h-16 text-primary/30" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
          <button
            onClick={handleClose}
            aria-label="Kapat"
            className="absolute top-3 left-3 w-10 h-10 rounded-2xl bg-white border-2 border-b-4 border-border flex items-center justify-center text-charcoal active:translate-y-0.5 active:border-b-2 transition-all"
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
          <div className="absolute right-3 bottom-[-22px] rounded-2xl bg-white border-2 border-b-4 border-border px-4 py-2 text-right shadow-sm">
            <p className="text-2xl font-black text-primary leading-none">{formatCurrency(r.perPerson)}</p>
            <p className="text-[11px] font-extrabold text-muted mt-0.5">kişi başı</p>
          </div>
        </div>

        {/* Body */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="px-4 pt-5 pb-4">
            <h2 className="text-[26px] font-black text-charcoal leading-tight pr-28">{r.restaurantName}</h2>
            {place && (
              <p className="mt-1 text-sm font-bold text-muted flex items-center gap-1">
                <PinIcon className="w-2.5 h-3 shrink-0" /> {place}
              </p>
            )}
            {r.rating > 0 && (
              <div className="mt-2 flex items-center gap-1">
                {[1,2,3,4,5].map((st) => (
                  <Star key={st} className={`w-5 h-5 ${st <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
                ))}
                <span className="ml-1 text-sm font-black text-charcoal">{r.rating}.0</span>
              </div>
            )}
          </div>

          {/* Numbers */}
          <div className="px-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-b-4 border-border px-4 py-3">
              <p className="text-[11px] font-extrabold text-muted uppercase tracking-wide">Toplam</p>
              <p className="text-xl font-black text-charcoal mt-0.5">{formatCurrency(r.total)}</p>
            </div>
            <div className="rounded-2xl border-2 border-b-4 border-border px-4 py-3">
              <p className="text-[11px] font-extrabold text-muted uppercase tracking-wide">Kişi sayısı</p>
              <p className="text-xl font-black text-charcoal mt-0.5">{r.people} kişi</p>
            </div>
          </div>

          {r.comment && <p className="px-4 mt-4 text-base font-semibold text-ink leading-relaxed">{r.comment}</p>}

          {/* Who shared it */}
          <div className="mx-4 mt-5 flex items-center gap-3 rounded-2xl border-2 border-b-4 border-border px-3.5 py-3">
            <Link href={`/users?id=${r.userId}&n=${encodeURIComponent(r.userName)}`} onClick={handleClose} className="flex items-center gap-3 flex-1 min-w-0">
              {ownerAvatar
                ? <img src={ownerAvatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt={r.userName} />
                : <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-base font-black text-primary shrink-0">{r.userName.charAt(0).toUpperCase()}</div>
              }
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-sm font-extrabold text-charcoal truncate">{r.userName}</p>
                <p className="text-xs font-semibold text-muted">{timeAgo(r.createdAt)} paylaştı</p>
              </div>
            </Link>
            {user && user.id !== r.userId && (
              <button
                onClick={addFriend}
                disabled={friendStatus !== "none"}
                className={`shrink-0 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all ${
                  friendStatus === "friend" ? "bg-primary-light text-primary" :
                  friendStatus === "pending" ? "bg-background text-muted" :
                  "btn btn-primary btn-sm !px-3.5 !py-2"
                }`}
              >
                {friendStatus === "friend" ? "Arkadaş" : friendStatus === "pending" ? "Bekliyor" : "Arkadaş ekle"}
              </button>
            )}
          </div>

          <div className="mt-5 border-t-2 border-border">
            <CommentSection receiptId={r.id} inline autoFocus={focusComment} />
          </div>
        </div>

        {/* Sticky actions */}
        <div className="shrink-0 flex items-center gap-2 px-4 pt-3 border-t-2 border-border bg-page" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
          <HelpfulButton receiptId={r.id} />
          <button onClick={handleCommentClick} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-extrabold border border-border text-muted bg-surface active:scale-95 transition-transform">
            <MessageCircle className="w-4 h-4" /> Yorum
          </button>
          {user && (
            <button onClick={() => setShareOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-extrabold border border-border text-muted bg-surface active:scale-95 transition-transform">
              <Send className="w-4 h-4" /> Gönder
            </button>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <WishlistButton restaurantName={r.restaurantName} size="sm" />
            {user?.id === r.userId && (
              confirmDelete ? (
                <>
                  <button onClick={handleDelete} className="text-xs font-extrabold text-red-500 px-2 py-1 active:opacity-70">Sil</button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs font-bold text-muted px-2 py-1 active:opacity-70">İptal</button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(true)} aria-label="Sil" className="w-9 h-9 flex items-center justify-center rounded-full text-muted active:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {photoOpen && r.photo && (
        <PhotoLightbox src={r.photo} alt={r.restaurantName} onClose={() => setPhotoOpen(false)} />
      )}
      {shareOpen && <ShareSheet receipt={r} onClose={() => setShareOpen(false)} />}
    </>
  );
}

// ─── Receipt detail sheet ────────────────────────────────────────────────────

function ReceiptDetailSheet({ r, onClose, onDelete }: { r: StoredReceipt; onClose: () => void; onDelete?: () => void }) {
  const { user } = useAuth();
  const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "friend">("none");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const el = pageRef.current;
    if (el) {
      el.style.transform = "translateY(100%)";
      el.style.transition = "none";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = "transform 0.28s cubic-bezier(0.32,0.72,0,1)";
        el.style.transform = "translateY(0)";
      }));
    }
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

  async function handleDelete() {
    await store.deleteReceipt(r.id);
    onClose();
    onDelete?.();
  }

  async function addFriend() {
    if (!user) return;
    await store.sendFriendRequest(user.id, user.name, r.userId, r.userName);
    setFriendStatus("pending");
  }

  function handleClose() {
    const el = pageRef.current;
    if (el) {
      el.style.transition = "transform 0.24s cubic-bezier(0.32,0.72,0,1)";
      el.style.transform = "translateY(100%)";
      setTimeout(onClose, 240);
    } else {
      onClose();
    }
  }

  return (
    <>
      <div
        ref={pageRef}
        className="fixed inset-0 z-50 bg-surface flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 h-14 border-b border-border bg-surface shrink-0">
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-background text-muted active:bg-border transition-colors shrink-0"
            aria-label="Geri"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="flex-1 font-bold text-charcoal text-base truncate">{r.restaurantName}</h2>
          {user?.id === r.userId && (
            confirmDelete ? (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={handleDelete} className="text-xs font-semibold text-red-500 px-2 py-1 rounded-lg active:bg-red-50">Sil</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted px-2 py-1 rounded-lg active:bg-background">İptal</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-background text-muted active:bg-red-50 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo */}
          {r.photo && (
            <button
              onClick={() => setPhotoOpen(true)}
              className="block w-full bg-black"
              aria-label="Fotoğrafı büyüt"
            >
              <img src={r.photo} alt={r.restaurantName} className="w-full max-h-72 object-contain" />
            </button>
          )}

          {/* User row */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40">
            <Link href={`/users?id=${r.userId}&n=${encodeURIComponent(r.userName)}`} onClick={handleClose} className="flex items-center gap-3 flex-1 min-w-0">
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

          {/* Price */}
          <div className="px-4 py-3 flex items-center gap-4 border-b border-border/40">
            <div className="bg-primary-light rounded-xl px-4 py-2">
              <p className="text-xl font-bold text-primary leading-none">{formatCurrency(r.perPerson)}</p>
              <p className="text-[10px] text-primary/70 mt-0.5">kişi başı</p>
            </div>
            <p className="text-sm text-muted">Toplam: <span className="font-semibold text-ink">{formatCurrency(r.total)}</span></p>
          </div>

          {/* Rating + comment */}
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
      </div>

      {photoOpen && r.photo && (
        <PhotoLightbox src={r.photo} alt={r.restaurantName} onClose={() => setPhotoOpen(false)} />
      )}
    </>
  );
}

// ─── Receipt card ─────────────────────────────────────────────────────────────

function UserReceiptCard({ r, userAvatar, onOpen, onDelete }: { r: StoredReceipt; userAvatar?: string | null; onOpen: () => void; onDelete?: () => void }) {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  async function handleDelete() {
    await store.deleteReceipt(r.id);
    onDelete?.();
  }

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button, a, input, textarea")) return;
    onOpen();
  }

  return (
    <article
      className="photo-card bg-surface rounded-3xl border-2 border-b-4 border-border overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Yazar satırı */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
        <Link href={`/users?id=${r.userId}&n=${encodeURIComponent(r.userName)}`} className="shrink-0">
          {userAvatar
            ? <img src={userAvatar} className="w-9 h-9 rounded-full object-cover" alt={r.userName} />
            : <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-sm font-black text-primary">{r.userName.charAt(0).toUpperCase()}</div>
          }
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link href={`/users?id=${r.userId}&n=${encodeURIComponent(r.userName)}`} className="block text-sm font-extrabold text-charcoal truncate">{r.userName}</Link>
          <p className="text-xs font-semibold text-muted truncate">
            {timeAgo(r.createdAt)}
            {(r.city || r.district) && <> · {[r.district, r.city].filter(Boolean).join(", ")}</>}
          </p>
        </div>
        {user?.id === r.userId && (
          confirmDelete ? (
            <div className="flex items-center gap-3">
              <button onClick={handleDelete} className="text-xs font-extrabold text-red-500 active:opacity-70">Sil</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs font-bold text-muted active:opacity-70">İptal</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} aria-label="Sil" className="w-8 h-8 flex items-center justify-center rounded-full active:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4 text-muted" />
            </button>
          )
        )}
      </div>

      {/* Fotoğraf + fiyat rozeti */}
      <div className="relative" onClick={onOpen}>
        {r.photo ? (
          <img src={r.photo} alt={r.restaurantName} className="photo" />
        ) : (
          <div className="photo flex items-center justify-center bg-primary-light">
            <Receipt className="w-14 h-14 text-primary/30" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute right-3 bottom-3 rounded-2xl bg-white border-2 border-b-4 border-border px-3 py-1.5 text-right shadow-sm">
          <p className="text-xl font-black text-primary leading-none">{formatCurrency(r.perPerson)}</p>
          <p className="text-[11px] font-extrabold text-muted mt-0.5">kişi başı</p>
        </div>
      </div>

      {/* Başlık + puan */}
      <div className="px-4 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/restaurants?name=${encodeURIComponent(r.restaurantName)}`} className="text-xl font-black text-charcoal leading-tight">{r.restaurantName}</Link>
          {r.rating > 0 && (
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
              <span className="text-sm font-black text-charcoal">{r.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm font-bold text-muted">{r.people} kişi · toplam {formatCurrency(r.total)}</p>
        {r.comment && <p className="mt-2 text-[15px] font-semibold text-ink leading-snug">{r.comment}</p>}
      </div>

      {/* Aksiyonlar */}
      <div className="px-4 pt-3 pb-3.5 flex items-center gap-2">
        <HelpfulButton receiptId={r.id} />
        {user && (
          <button
            onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-extrabold border border-border text-muted bg-surface active:scale-95 transition-transform"
          >
            <Send className="w-4 h-4" />
            Gönder
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <WishlistButton restaurantName={r.restaurantName} size="sm" />
        </div>
      </div>

      {/* Yorum bölümü */}
      <CommentSection receiptId={r.id} inline />
      {shareOpen && <ShareSheet receipt={r} onClose={() => setShareOpen(false)} />}
    </article>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, ready } = useAuth();
  const [userReceipts, setUserReceipts] = useState<StoredReceipt[]>([]);
  const [popupReceipt, setPopupReceipt] = useState<StoredReceipt | null>(null);
  const [avatarCache, setAvatarCache] = useState<Record<string, string | null>>({});
  const [loaded, setLoaded] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const again = () => setRefreshTick((n) => n + 1);
    window.addEventListener("grazer:refresh", again);
    return () => window.removeEventListener("grazer:refresh", again);
  }, []);

  useEffect(() => {
    if (!ready) return;
    store.getPrivacyFilteredReceipts(user?.id).then((receipts) => {
      setUserReceipts(receipts);
      setLoaded(true);
      // Fetch avatars for unique users in the feed
      const uniqueIds = [...new Set(receipts.map((r) => r.userId))];
      uniqueIds.forEach((id) => {
        store.getPublicAvatar(id).then((avatar) => {
          if (avatar) setAvatarCache((prev) => ({ ...prev, [id]: avatar }));
        });
      });
    });
  }, [ready, user?.id, refreshTick]);

  // Open a specific receipt when navigating from a notification (cross-page case)
  useEffect(() => {
    const raw = sessionStorage.getItem("adisyon_open_receipt");
    if (!raw) return;
    sessionStorage.removeItem("adisyon_open_receipt");
    try {
      const { receipt } = JSON.parse(raw) as { id: string; receipt: StoredReceipt | null };
      if (receipt) { setPopupReceipt(receipt); return; }
    } catch { /* plain string fallback */ }
    const id = (() => { try { return (JSON.parse(raw) as { id: string }).id; } catch { return raw; } })();
    const cached = userReceipts.find((x) => x.id === id);
    if (cached) { setPopupReceipt(cached); return; }
    store.getReceiptById(id).then((r) => { if (r) setPopupReceipt(r); });
  }, [userReceipts]);

  useEffect(() => {
    function handler(e: Event) {
      const { id, receipt } = (e as CustomEvent<{ id: string; receipt: StoredReceipt | null }>).detail;
      sessionStorage.removeItem("adisyon_open_receipt");
      if (receipt) { setPopupReceipt(receipt); return; }
      const cached = userReceipts.find((x) => x.id === id);
      if (cached) { setPopupReceipt(cached); return; }
      store.getReceiptById(id).then((r) => { if (r) setPopupReceipt(r); });
    }
    window.addEventListener("adisyon:open-receipt", handler);
    return () => window.removeEventListener("adisyon:open-receipt", handler);
  }, [userReceipts]);

  return (
    <div className="space-y-0">
      <Greeting />
      <Stories onOpen={(rc) => setPopupReceipt(rc)} />
      <HomeHero />

      {!loaded && <FeedSkeleton />}
      {loaded && userReceipts.length === 0 && <FeedEmpty />}

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
                userAvatar={avatarCache[r.userId] ?? null}
                onOpen={() => setPopupReceipt(r)}
                onDelete={() => setUserReceipts((prev) => prev.filter((x) => x.id !== r.id))}
              />
            ))}
          </div>
        </section>
      )}

      {popupReceipt && (
        <ReceiptPopup
          r={popupReceipt}
          onClose={() => setPopupReceipt(null)}
          onDelete={() => setUserReceipts((prev) => prev.filter((x) => x.id !== popupReceipt.id))}
        />
      )}
    </div>
  );
}
