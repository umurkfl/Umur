"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Trash2, MapPin, Plus, Check, X, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { store, WishlistItem, WishlistList, WISHLIST_SUGGESTIONS } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/mock";

function ListSection({
  list,
  userId,
  onDelete,
  onRename,
}: {
  list: WishlistList;
  userId: string;
  onDelete: (listId: string) => void;
  onRename: (listId: string, name: string) => void;
}) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(list.name);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setItems(store.getWishlistByList(userId, list.id));
  }, [userId, list.id]);

  function removeItem(restaurantName: string) {
    store.removeFromWishlistList(userId, restaurantName, list.id);
    setItems((prev) => prev.filter((i) => i.restaurantName !== restaurantName));
  }

  function handleRename() {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === list.name) { setRenaming(false); return; }
    store.renameWishlistList(userId, list.id, trimmed);
    onRename(list.id, trimmed);
    setRenaming(false);
  }

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button
          onClick={() => !renaming && setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted shrink-0" />
            : <ChevronDown className="w-4 h-4 text-muted shrink-0" />
          }
          {renaming ? (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setNewName(list.name); setRenaming(false); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 font-semibold text-charcoal text-sm bg-transparent border-b border-primary focus:outline-none"
            />
          ) : (
            <span className="font-semibold text-charcoal text-sm truncate">{list.name}</span>
          )}
          <span className="text-xs bg-primary-light text-primary font-semibold px-2 py-0.5 rounded-full shrink-0">
            {items.length}
          </span>
        </button>

        {renaming ? (
          <div className="flex gap-1 shrink-0">
            <button onClick={handleRename} className="p-1.5 bg-primary text-white rounded-lg">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button onClick={() => { setNewName(list.name); setRenaming(false); }} className="p-1.5 bg-background border border-border rounded-lg text-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1.5 text-muted active:text-ink rounded-lg"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => { setRenaming(true); setMenuOpen(false); }}
                    className="w-full px-3 py-2.5 text-sm text-left text-ink hover:bg-background transition-colors"
                  >
                    İsim Değiştir
                  </button>
                  <button
                    onClick={() => { onDelete(list.id); setMenuOpen(false); }}
                    className="w-full px-3 py-2.5 text-sm text-left text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Listeyi Sil
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {expanded && (
        items.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted">
            Bu listede henüz restoran yok
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
                <div className="w-8 h-8 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {item.restaurantSlug ? (
                    <Link href={`/restaurants/${item.restaurantSlug}`} className="font-medium text-sm text-charcoal hover:text-primary truncate block">
                      {item.restaurantName}
                    </Link>
                  ) : (
                    <p className="font-medium text-sm text-charcoal truncate">{item.restaurantName}</p>
                  )}
                  <p className="text-xs text-muted mt-0.5">{timeAgo(item.addedAt)} eklendi</p>
                </div>
                <button
                  onClick={() => removeItem(item.restaurantName)}
                  className="p-1.5 text-border active:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function WishlistPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<WishlistList[]>([]);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    if (ready && !user) router.push("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) setLists(store.getWishlistLists(user.id));
  }, [user]);

  if (!ready || !user) return null;

  const totalItems = lists.reduce((sum, l) => sum + store.getWishlistByList(user.id, l.id).length, 0);
  const unusedSuggestions = WISHLIST_SUGGESTIONS.filter((s) => !lists.some((l) => l.name === s));

  function createList(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const list: WishlistList = {
      id: crypto.randomUUID(), userId: user!.id, name: trimmed,
      createdAt: new Date().toISOString(),
    };
    store.createWishlistList(list);
    setLists((prev) => [...prev, list]);
    setNewListName("");
    setCreating(false);
  }

  function deleteList(listId: string) {
    store.deleteWishlistList(user!.id, listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }

  function renameList(listId: string, name: string) {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name } : l)));
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-primary fill-primary" />
        <h1 className="text-xl font-bold text-charcoal">Gitmek İstediklerim</h1>
        {totalItems > 0 && (
          <span className="ml-auto text-xs bg-primary-light text-primary font-semibold px-2 py-0.5 rounded-full">
            {totalItems} mekan
          </span>
        )}
      </div>

      {lists.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-primary/30" />
          </div>
          <p className="font-semibold text-ink">Henüz listeniz yok</p>
          <p className="text-sm text-muted max-w-xs">
            Restoran sayfalarındaki <Bookmark className="w-3.5 h-3.5 inline text-muted" /> ikonuna basarak listeler oluşturabilirsin.
          </p>

          {unusedSuggestions.length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-muted mb-2">Hazır bir liste seç</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {unusedSuggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    onClick={() => createList(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-light text-primary border border-primary/20 active:bg-primary active:text-white transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary mt-1"
          >
            <Plus className="w-4 h-4" />
            Yeni liste oluştur
          </button>
          <Link href="/discover" className="bg-primary text-white font-bold rounded-full px-5 py-2.5 text-sm active:bg-primary-dark">
            Restoran Keşfet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <ListSection
              key={list.id}
              list={list}
              userId={user.id}
              onDelete={deleteList}
              onRename={renameList}
            />
          ))}

          {unusedSuggestions.length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-muted mb-2 px-1">Hazır liste ekle</p>
              <div className="flex flex-wrap gap-2">
                {unusedSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => createList(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface text-ink border border-border active:bg-primary-light active:text-primary active:border-primary transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {creating ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createList(newListName);
              if (e.key === "Escape") { setNewListName(""); setCreating(false); }
            }}
            placeholder="Liste adı..."
            className="flex-1 text-sm px-3.5 py-2.5 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => createList(newListName)}
            disabled={!newListName.trim()}
            className="px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-semibold disabled:opacity-40"
          >
            Ekle
          </button>
          <button
            onClick={() => { setNewListName(""); setCreating(false); }}
            className="p-2.5 rounded-2xl border border-border text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        lists.length > 0 && (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border text-sm text-muted hover:text-primary hover:border-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni liste oluştur
          </button>
        )
      )}
    </div>
  );
}
