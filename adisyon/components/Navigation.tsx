"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusCircle, Bookmark, Receipt, Trophy, LogOut, ChevronDown, User, Users, Bell, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { GusIcon } from "@/components/Gus";
import { haptic } from "@/lib/haptics";

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
  const [pendingCount, setPendingCount] = useState(0);
  const [dmCount, setDmCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clear badge the moment the user taps Arkadaşlar
  useEffect(() => {
    if (pathname.startsWith("/friends") && user) {
      setDmCount(0);
      if (typeof window !== "undefined")
        localStorage.setItem(`adisyon_nav_dm_cleared_${user.id}`, new Date().toISOString());
    }
  }, [pathname, user?.id]);

  useEffect(() => {
    if (!user) { setPendingCount(0); setDmCount(0); return; }

    function load() {
      const clearedAt = typeof window !== "undefined"
        ? localStorage.getItem(`adisyon_nav_dm_cleared_${user!.id}`)
        : null;
      Promise.all([
        store.getFriendships(user!.id),
        store.getNotifications(user!.id),
        store.getAllMessages(user!.id),
      ]).then(([fs, notifs, msgs]) => {
        const friendPending = fs.filter((f) => f.status === "pending" && f.friendId === user!.id).length;
        const unreadNotifs = notifs.filter((n) => !n.read).length;
        const dm = msgs.filter((m) =>
          m.toUserId === user!.id && !m.read && (!clearedAt || m.createdAt > clearedAt)
        ).length;
        setDmCount(dm);
        setPendingCount(friendPending + unreadNotifs);
      });
    }

    load();
    const interval = setInterval(load, 30_000);
    const onFocus = () => load();
    const onDmRead = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("adisyon:messages-read", onDmRead);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); window.removeEventListener("adisyon:messages-read", onDmRead); };
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
      <header className="app-header sticky top-0 z-50 bg-page/90 backdrop-blur" data-scrolled={scrolled ? "1" : "0"}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-2">

          {/* Sol: Gus + wordmark */}
          <Link href="/" aria-label="grazer ana sayfa" className="flex items-center gap-2 active:scale-95 transition-transform">
            <GusIcon size={38} />
          </Link>

          {/* Sağ: bildirim + avatar */}
          <div className="flex items-center gap-1.5 relative">
            {ready && user && (
              <Link
                href="/notifications"
                onClick={() => haptic("tap")}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl active:scale-90 transition-transform"
                aria-label="Bildirimler"
              >
                <Bell className="w-6 h-6 text-muted" strokeWidth={2.5} />
                {pendingCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 border-2 border-page rounded-full text-white text-[10px] font-black flex items-center justify-center px-0.5">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            )}
            <div className="relative">
              {ready && (
                user ? (
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
                    aria-label="Hesap menüsü"
                  >
                    <span className="hidden sm:inline text-sm font-extrabold text-charcoal">
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

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-page/95 backdrop-blur border-t-2 border-border safe-area-pb">
        <div className="max-w-2xl mx-auto flex items-end justify-around px-2 pt-2 pb-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            const showBadge = href === "/friends" && dmCount > 0 && !pathname.startsWith("/friends");
            if (href === "/upload") {
              return (
                <Link
                  key={label}
                  href={href}
                  aria-label="Adisyon ekle"
                  onClick={() => haptic("tap")}
                  className="btn btn-primary !p-0 w-14 h-12 !rounded-2xl -mt-5 shadow-sm"
                >
                  <Icon className="w-7 h-7" strokeWidth={3} />
                </Link>
              );
            }
            return (
              <Link
                key={label}
                href={href}
                aria-label={label}
                onClick={() => haptic("tap")}
                className={`relative w-14 h-12 flex items-center justify-center rounded-2xl border-2 transition-all active:scale-90 ${
                  active ? "bg-primary-light border-primary text-primary" : "border-transparent text-muted"
                }`}
              >
                <Icon className="w-7 h-7" strokeWidth={active ? 2.75 : 2.25} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 border-2 border-surface rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5">
                    {dmCount > 9 ? "9+" : dmCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
