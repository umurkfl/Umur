"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { haptic } from "@/lib/haptics";
import { Gus } from "@/components/Gus";
import { HomeNavIcon, SearchNavIcon, FriendsNavIcon, ProfileNavIcon, PlusNavIcon, BellIcon, ChatIcon } from "@/components/NavIcons";
import type { GusMood } from "@/lib/gus";

interface Gate { title: string; text: string; mood: GusMood }

// Screens that need an account. Logged-out users still see the tab and get a friendly gate.
const GATES: Record<string, Gate> = {
  "/upload": { title: "Fiş paylaşmak için üye ol", text: "Adisyonunu paylaş, yonca topla, Gus'la zirveye tırman.", mood: "wink" },
  "/friends": { title: "Arkadaşların için üye ol", text: "Arkadaş ekle, adisyon gönder, mesajlaş.", mood: "love" },
  "/profile": { title: "Profilin için üye ol", text: "Seviyen, rozetlerin ve kaydettiklerin seni bekliyor.", mood: "happy" },
  "/notifications": { title: "Bildirimler için üye ol", text: "Yorumlar ve arkadaş istekleri burada görünür.", mood: "happy" },
  "/messages": { title: "Mesajlar için üye ol", text: "Arkadaşlarınla fiş ve mesaj paylaş.", mood: "wink" },
};

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [dmCount, setDmCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [gate, setGate] = useState<Gate | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setPendingCount(0); setDmCount(0); return; }

    function load() {
      const clearedAt = localStorage.getItem(`adisyon_nav_dm_cleared_${user!.id}`);
      Promise.all([
        store.getFriendships(user!.id),
        store.getNotifications(user!.id),
        store.getAllMessages(user!.id),
      ]).then(([fs, notifs, msgs]) => {
        const friendPending = fs.filter((f) => f.status === "pending" && f.friendId === user!.id).length;
        const unreadNotifs = notifs.filter((n) => !n.read).length;
        setDmCount(msgs.filter((m) => m.toUserId === user!.id && !m.read && (!clearedAt || m.createdAt > clearedAt)).length);
        setPendingCount(friendPending + unreadNotifs);
      });
    }

    load();
    const interval = setInterval(load, 30_000);
    window.addEventListener("focus", load);
    window.addEventListener("adisyon:messages-read", load);
    return () => { clearInterval(interval); window.removeEventListener("focus", load); window.removeEventListener("adisyon:messages-read", load); };
  }, [user]);

  // Tapping a gated entry while logged out opens the gate instead of navigating
  function guard(href: string, e: React.MouseEvent) {
    haptic("tap");
    if (!user && GATES[href]) { e.preventDefault(); setGate(GATES[href]); }
  }

  function openMessages(e: React.MouseEvent) {
    e.preventDefault();
    haptic("tap");
    if (!user) { setGate(GATES["/messages"]); return; }
    localStorage.setItem(`adisyon_nav_dm_cleared_${user.id}`, new Date().toISOString());
    setDmCount(0);
    if (pathname.startsWith("/friends")) window.dispatchEvent(new CustomEvent("grazer:open-tab", { detail: "mesajlar" }));
    else router.push("/friends?tab=mesajlar");
  }

  const tabs = [
    { href: "/", label: "Ana Sayfa", Icon: HomeNavIcon },
    { href: "/discover", label: "Keşfet", Icon: SearchNavIcon },
    { href: "/upload", label: "Fiş ekle", Icon: PlusNavIcon },
    { href: "/friends", label: "Arkadaşlar", Icon: FriendsNavIcon },
    { href: "/profile", label: "Profilim", Icon: ProfileNavIcon },
  ];
  // Wishlist and settings live inside the profile now
  const profileActive = ["/profile", "/wishlist", "/settings", "/badges", "/levels"].some((p) => pathname.startsWith(p));

  return (
    <>
      <header className="app-header sticky top-0 z-50 bg-page/90 backdrop-blur" data-scrolled={scrolled ? "1" : "0"}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link href="/" aria-label="grazer ana sayfa" className="font-display text-[28px] font-black text-primary tracking-[-0.04em] active:scale-95 transition-transform">
            grazer
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/friends?tab=mesajlar" onClick={openMessages} aria-label="Mesajlar" className="relative w-11 h-11 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform">
              <ChatIcon />
              {dmCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 border-2 border-page rounded-full text-white text-[10px] font-black flex items-center justify-center px-0.5">
                  {dmCount > 9 ? "9+" : dmCount}
                </span>
              )}
            </Link>
            <Link href="/notifications" onClick={(e) => guard("/notifications", e)} aria-label="Bildirimler" className="relative w-11 h-11 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform">
              <BellIcon />
              {pendingCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 border-2 border-page rounded-full text-white text-[10px] font-black flex items-center justify-center px-0.5">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-page/95 backdrop-blur border-t-2 border-border safe-area-pb">
        <div className="max-w-2xl mx-auto flex items-end justify-around px-2 pt-2 pb-2">
          {tabs.map(({ href, label, Icon }) => {
            const active = href === "/profile" ? profileActive : pathname === href || (href !== "/" && pathname.startsWith(href));
            if (href === "/upload") {
              return (
                <Link key={href} href={href} aria-label="Adisyon ekle" onClick={(e) => guard(href, e)} className="btn btn-primary !p-0 w-14 h-12 !rounded-2xl -mt-5 shadow-sm">
                  <PlusNavIcon size={28} />
                </Link>
              );
            }
            const isProfile = href === "/profile";
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                onClick={(e) => guard(href, e)}
                className={`relative w-14 h-12 flex items-center justify-center rounded-2xl border-2 transition-all active:scale-90 ${
                  active ? "bg-primary-light border-primary text-primary" : "border-transparent text-[#AFAFAB]"
                }`}
              >
                {isProfile && ready && user?.avatar ? (
                  <img src={user.avatar} alt="" className={`w-8 h-8 rounded-full object-cover border-2 ${active ? "border-primary" : "border-border"}`} />
                ) : (
                  <Icon size={30} active={active} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Login gate: a friendly bottom sheet (drag down to dismiss) */}
      {gate && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[300]" onClick={() => setGate(null)} />
          <div className="fixed bottom-0 inset-x-0 z-[301] bg-surface rounded-t-3xl px-6 pt-3 text-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
            <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-4" />
            <Gus mood={gate.mood} size={112} className="mx-auto" />
            <h2 className="mt-2 text-2xl font-black text-charcoal">{gate.title}</h2>
            <p className="mt-1.5 text-base font-semibold text-muted">{gate.text}</p>
            <div className="mt-5 flex flex-col gap-2.5 max-w-sm mx-auto">
              <Link href="/auth" onClick={() => setGate(null)} className="btn btn-primary btn-block">Giriş yap veya üye ol</Link>
              <button onClick={() => setGate(null)} className="text-sm font-extrabold text-muted py-1.5">Şimdilik değil</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
