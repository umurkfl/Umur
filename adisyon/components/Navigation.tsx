"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, User, Bookmark } from "lucide-react";
import { useAuth } from "@/lib/auth";

function GrazerLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="9" fill="#1D9E75" />
        <text x="18" y="18" textAnchor="middle" dy="0.35em"
          fontSize="22" fontWeight="700"
          fontFamily="'Arial Rounded MT Bold', Nunito, sans-serif"
          fill="white">g</text>
        <circle cx="28" cy="8" r="5" fill="#D85A30" />
      </svg>
      <span className="font-display text-[22px] font-bold text-primary tracking-[-0.3px]">grazer</span>
    </div>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  const navItems = [
    { href: "/", icon: Home, label: "Ana Sayfa" },
    { href: "/discover", icon: Search, label: "Keşfet" },
    { href: "/upload", icon: PlusCircle, label: "Ekle" },
    ...(user ? [{ href: "/wishlist", icon: Bookmark, label: "Liste" }] : []),
    { href: user ? "/profile" : "/auth", icon: User, label: user ? "Profil" : "Giriş" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 grid grid-cols-3 items-center">
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
          <span className="font-display text-[22px] font-bold text-primary tracking-[-0.3px] justify-self-center">grazer</span>
          <div className="justify-self-end">
            {ready && (
              user ? (
                <Link href="/profile" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-light rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-primary">
                    {user.avatar
                      ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                      : user.name.charAt(0).toUpperCase()
                    }
                  </div>
                  <span className="text-sm font-semibold text-ink hidden sm:block">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>
              ) : (
                <Link href="/auth" className="text-sm font-semibold text-primary bg-primary-light px-3 py-1.5 rounded-full">
                  Giriş Yap
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href ||
              (href !== "/" && href !== "/auth" && pathname.startsWith(href));
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
