"use client";

import { useState, useEffect, useRef } from "react";
import { Bookmark, Plus, Check, X } from "lucide-react";
import { store, WishlistList, WISHLIST_SUGGESTIONS } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Props {
  restaurantName: string;
  restaurantSlug?: string | null;
  size?: "sm" | "md";
}

export function WishlistButton({ restaurantName, restaurantSlug = null, size = "md" }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<WishlistList[]>([]);
  const [inLists, setInLists] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const isSaved = inLists.size > 0;

  useEffect(() => {
    if (!user) return;
    const userLists = store.getWishlistLists(user.id);
    const inSet = new Set<string>(
      userLists.filter((l) => store.isInWishlistList(user.id, restaurantName, l.id)).map((l) => l.id)
    );
    setInLists(inSet);
  }, [user, restaurantName]);

  useEffect(() => {
    if (!open || !user) return;
    const userLists = store.getWishlistLists(user.id);
    setLists(userLists);
    const inSet = new Set<string>(
      userLists.filter((l) => store.isInWishlistList(user.id, restaurantName, l.id)).map((l) => l.id)
    );
    setInLists(inSet);
  }, [open, user, restaurantName]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push("/auth"); return; }
    setOpen((v) => !v);
  }

  function toggleList(listId: string) {
    if (!user) return;
    if (inLists.has(listId)) {
      store.removeFromWishlistList(user.id, restaurantName, listId);
      setInLists((prev) => { const s = new Set(prev); s.delete(listId); return s; });
    } else {
      store.addToWishlist({
        id: crypto.randomUUID(),
        userId: user.id,
        restaurantName,
        restaurantSlug: restaurantSlug ?? null,
        addedAt: new Date().toISOString(),
        listId,
      });
      setInLists((prev) => new Set([...prev, listId]));
    }
  }

  function addFromSuggestion(name: string) {
    if (!user) return;
    const existing = lists.find((l) => l.name === name);
    if (existing) { toggleList(existing.id); return; }
    const list: WishlistList = {
      id: crypto.randomUUID(), userId: user.id, name,
      createdAt: new Date().toISOString(),
    };
    store.createWishlistList(list);
    store.addToWishlist({
      id: crypto.randomUUID(), userId: user.id, restaurantName,
      restaurantSlug: restaurantSlug ?? null, addedAt: new Date().toISOString(), listId: list.id,
    });
    setLists((prev) => [...prev, list]);
    setInLists((prev) => new Set([...prev, list.id]));
  }

  function createAndAdd() {
    if (!user || !newName.trim()) return;
    const list: WishlistList = {
      id: crypto.randomUUID(), userId: user.id, name: newName.trim(),
      createdAt: new Date().toISOString(),
    };
    store.createWishlistList(list);
    store.addToWishlist({
      id: crypto.randomUUID(), userId: user.id, restaurantName,
      restaurantSlug: restaurantSlug ?? null, addedAt: new Date().toISOString(), listId: list.id,
    });
    setLists((prev) => [...prev, list]);
    setInLists((prev) => new Set([...prev, list.id]));
    setNewName("");
    setCreating(false);
  }

  const sz = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const pad = size === "sm" ? "p-1.5" : "p-2";
  const unusedSuggestions = WISHLIST_SUGGESTIONS.filter((s) => !lists.some((l) => l.name === s));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleClick}
        aria-label={isSaved ? "Listelerden düzenle" : "Listeye ekle"}
        className={`${pad} rounded-full transition-colors active:scale-90 ${isSaved ? "text-primary" : "text-border active:text-primary"}`}
      >
        <Bookmark className={`${sz} ${isSaved ? "fill-primary stroke-primary" : "stroke-current"}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Listeye ekle</p>
            <p className="text-sm font-semibold text-charcoal truncate mt-0.5">{restaurantName}</p>
          </div>

          {lists.length > 0 && (
            <div className="py-1 border-b border-border max-h-44 overflow-y-auto">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => toggleList(list.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-background transition-colors"
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                    inLists.has(list.id) ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {inLists.has(list.id) && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </span>
                  <span className="flex-1 text-left truncate">{list.name}</span>
                  <span className="text-xs text-muted shrink-0">
                    {store.getWishlistByList(user!.id, list.id).length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {unusedSuggestions.length > 0 && (
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-[11px] text-muted mb-2 font-medium">Hızlı ekle</p>
              <div className="flex flex-wrap gap-1.5">
                {unusedSuggestions.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    onClick={() => addFromSuggestion(s)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-background text-ink border border-border active:bg-primary-light active:text-primary active:border-primary transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-2">
            {creating ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createAndAdd();
                    if (e.key === "Escape") { setCreating(false); setNewName(""); }
                  }}
                  placeholder="Liste adı..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button onClick={createAndAdd} disabled={!newName.trim()} className="p-1.5 rounded-lg bg-primary text-white disabled:opacity-40">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button onClick={() => { setCreating(false); setNewName(""); }} className="p-1.5 rounded-lg bg-background border border-border text-muted">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted hover:text-primary transition-colors rounded-xl hover:bg-primary-light"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni liste oluştur
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
