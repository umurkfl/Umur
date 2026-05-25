"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusCircle, Bookmark, Receipt, Trophy, LogOut, ChevronDown, Star, User, Users, Bell, Check, X, Settings, MessageCircle, ThumbsUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store, StoredFriendship, StoredNotification } from "@/lib/store";

const MENU_ITEMS = [
  {
    group: "Hesabım",
    items: [
      { href: "/profile", icon: User, label: "Profilim" },
      { href: "/upload", icon: Receipt, label: "Adisyon Ekle", accent: true },
      { href: "/friends", icon: Users, label: "Arkadaşlar" },
      { href: "/wishlist", icon: Bookmark, label: "Gitmek İstediklerim" },
      { href: "/badges", icon: Trophy, label: "Rozetlerim" },
      { href: "/settings", icon: Settings, label: "Ayarlar" },
    ],
  },
];

function NotificationPanel({ userId, onClose, onCountChange }: {
  userId: string;
  onClose: () => void;
  onCountChange: (n: number) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [requests, setRequests] = useState<StoredFriendship[]>([]);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const openReceipt = useCallback((receiptId: string) => {
    if (!receiptId) { onClose(); return; }
    onClose();
    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("adisyon:open-receipt", { detail: receiptId }));
    } else {
      sessionStorage.setItem("adisyon_open_receipt", receiptId);
      router.push("/");
    }
  }, [pathname, router, onClose]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    Promise.all([
      store.getFriendships(userId),
      store.getNotifications(userId),
    ]).then(([fs, notifs]) => {
      setRequests(fs.filter((f) => f.status === "pending" && f.friendId === userId));
      setNotifications(notifs);
      setLoading(false);
      // Mark all as read now that panel is open
      store.markNotificationsRead(userId);
      onCountChange(fs.filter((f) => f.status === "pending" && f.friendId === userId).length);
    });
  }, [userId]);

  async function accept(f: StoredFriendship) {
    await store.acceptFriendRequest(f.id);
    const updated = requests.filter((r) => r.id !== f.id);
    setRequests(updated);
    onCountChange(updated.length);
  }

  async function reject(f: StoredFriendship) {
    await store.removeFriendship(f.id);
    const updated = requests.filter((r) => r.id !== f.id);
    setRequests(updated);
    onCountChange(updated.length);
  }

  const isEmpty = !loading && requests.length === 0 && notifications.length === 0;

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-80 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-border bg-background">
        <p className="font-semibold text-charcoal text-sm">Bildirimler</p>
      </div>
      {loading ? (
        <div className="px-4 py-6 text-center text-sm text-muted">Yükleniyor...</div>
      ) : isEmpty ? (
        <div className="px-4 py-6 text-center text-sm text-muted">Yeni bildirim yok</div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {/* Friend requests */}
          {requests.map((f) => (
            <div key={f.id} className="px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {f.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{f.userName}</p>
                  <p className="text-xs text-muted">sana arkadaşlık isteği gönderdi</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => accept(f)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl active:scale-95 transition-transform">
                  <Check className="w-3.5 h-3.5" /> Kabul Et
                </button>
                <button onClick={() => reject(f)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-background border border-border text-muted text-xs font-semibold rounded-xl active:scale-95 transition-transform">
                  <X className="w-3.5 h-3.5" /> Reddet
                </button>
              </div>
            </div>
          ))}

          {/* Comment & reaction notifications */}
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => openReceipt(n.receiptId)}
              className={`w-full text-left px-4 py-3 border-b border-border/50 last:border-0 flex items-start gap-2.5 active:bg-primary-light/50 transition-colors ${!n.read ? "bg-primary-light/30" : ""}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.type === "comment" ? "bg-primary-light text-primary" : "bg-yellow-50 text-yellow-600"}`}>
                {n.type === "comment"
                  ? <MessageCircle className="w-4 h-4" />
                  : <ThumbsUp className="w-4 h-4" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink leading-snug">
                  <span className="font-semibold">{n.actorName}</span>
                  {n.type === "comment" ? " adisyonuna yorum yaptı" : " yorumunu beğendi"}
                </p>
                {n.type === "comment" && n.text && (
                  <p className="text-xs text-muted mt-0.5 truncate">"{n.text}"</p>
                )}
                <p className="text-[10px] text-muted mt-1">{new Date(n.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="border-t border-border">
        <Link href="/friends" onClick={onClose} className="block px-4 py-2.5 text-xs text-primary font-semibold text-center active:bg-primary-light">
          Tüm arkadaş isteklerini gör →
        </Link>
      </div>
    </div>
  );
}

function UserDropdown({ user, onClose }: { user: { name: string; email: string; avatar?: string | null }; onClose: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  function handleLogout() {
    onClose();
    logout();
    router.push("/");
  }

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-64 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50">
      <div className="px-4 py-3.5 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-light overflow-hidden flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {user.avatar
              ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
              : user.name.charAt(0).toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-charcoal text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {MENU_ITEMS.map((group) => (
        <div key={group.group} className="py-1.5">
          {group.items.map(({ href, icon: Icon, label, accent }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors active:bg-primary-light ${
                accent ? "text-primary font-semibold" : "text-ink hover:bg-background"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${accent ? "text-primary" : "text-muted"}`} />
              {label}
            </Link>
          ))}
        </div>
      ))}

      <div className="border-t border-border py-1.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) { setPendingCount(0); return; }

    function load() {
      Promise.all([
        store.getFriendships(user!.id),
        store.getNotifications(user!.id),
      ]).then(([fs, notifs]) => {
        const friendPending = fs.filter((f) => f.status === "pending" && f.friendId === user!.id).length;
        const unreadNotifs = notifs.filter((n) => !n.read).length;
        setPendingCount(friendPending + unreadNotifs);
      });
    }

    load();
    const interval = setInterval(load, 30_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [user]);

  const navItems = [
    { href: "/", icon: Home, label: "Ana Sayfa" },
    { href: "/discover", icon: Search, label: "Keşfet" },
    { href: "/upload", icon: PlusCircle, label: "Ekle" },
    { href: "/friends", icon: Users, label: "Arkadaşlar" },
    ...(user ? [{ href: "/wishlist", icon: Bookmark, label: "Liste" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 grid grid-cols-3 items-center">

          {/* Sol: logo */}
          <div className="justify-self-start">
            <Link href="/">
              <svg width="30" height="30" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="9" fill="#1D9E75" />
                <text x="18" y="18" textAnchor="middle" dy="0.35em"
                  fontSize="22" fontWeight="700"
                  fontFamily="'Arial Rounded MT Bold', Nunito, sans-serif"
                  fill="white">g</text>
                <circle cx="28" cy="8" r="5" fill="#D85A30" />
              </svg>
            </Link>
          </div>

          {/* Orta: wordmark */}
          <Link href="/" className="justify-self-center font-display text-[22px] font-bold text-primary tracking-[-0.3px]">
            grazer
          </Link>

          {/* Sağ: bildirim + avatar */}
          <div className="justify-self-end flex items-center gap-1.5">
            {ready && user && (
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen((v) => !v); setDropdownOpen(false); }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-background active:bg-background transition-colors"
                  aria-label="Bildirimler"
                >
                  <Bell className="w-5 h-5 text-muted" />
                  {pendingCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </button>
                {notifOpen && user && (
                  <NotificationPanel
                    userId={user.id}
                    onClose={() => setNotifOpen(false)}
                    onCountChange={setPendingCount}
                  />
                )}
              </div>
            )}

            <div className="relative">
              {ready && (
                user ? (
                  <button
                    onClick={() => { setDropdownOpen((v) => !v); setNotifOpen(false); }}
                    className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
                    aria-label="Hesap menüsü"
                  >
                    <span className="text-sm font-semibold text-charcoal">
                      {user.name.split(" ")[0]}
                    </span>
                    <div className="w-8 h-8 bg-primary-light rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-primary">
                      {user.avatar
                        ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                        : user.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href="/auth" className="text-sm font-semibold text-primary bg-primary-light px-3 py-1.5 rounded-full">
                    Giriş Yap
                  </Link>
                )
              )}
              {dropdownOpen && user && (
                <UserDropdown user={user} onClose={() => setDropdownOpen(false)} />
              )}
            </div>
          </div>

        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
