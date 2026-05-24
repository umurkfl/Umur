"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusCircle, Bookmark, Receipt, Trophy, LogOut, ChevronDown, Star, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

const MENU_ITEMS = [
  {
    group: "Hesabım",
    items: [
      { href: "/profile", icon: User, label: "Profilim" },
      { href: "/upload", icon: Receipt, label: "Adisyon Ekle", accent: true },
      { href: "/wishlist", icon: Bookmark, label: "Gitmek İstediklerim" },
      { href: "/badges", icon: Trophy, label: "Rozetlerim" },
      { href: "/discover", icon: Star, label: "Restoranları Keşfet" },
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
      {/* User info */}
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

      {/* Menu groups */}
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

      {/* Logout */}
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

  const navItems = [
    { href: "/", icon: Home, label: "Ana Sayfa" },
    { href: "/discover", icon: Search, label: "Keşfet" },
    { href: "/upload", icon: PlusCircle, label: "Ekle" },
    ...(user ? [{ href: "/wishlist", icon: Bookmark, label: "Liste" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 grid grid-cols-3 items-center">
          {/* Logo — left */}
          <Link href="/" className="justify-self-start">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="9" fill="#1D9E75" />
              <text x="18" y="18" textAnchor="middle" dy="0.35em"
                fontSize="22" fontWeight="700"
                fontFamily="'Arial Rounded MT Bold', Nunito, sans-serif"
                fill="white">g</text>
              <circle cx="28" cy="8" r="5" fill="#D85A30" />
            </svg>
          </Link>

          {/* Wordmark — center */}
          <span className="font-display text-[22px] font-bold text-primary tracking-[-0.3px] justify-self-center">grazer</span>

          {/* User — right */}
          <div className="justify-self-end relative">
            {ready && (
              user ? (
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
                  aria-label="Hesap menüsü"
                >
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
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href));
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
