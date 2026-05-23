"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Ana Sayfa" },
  { href: "/discover", icon: Search, label: "Keşfet" },
  { href: "/upload", icon: PlusCircle, label: "Ekle" },
  { href: "/profile", icon: User, label: "Profil" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-orange-600 tracking-tight">
            Adisyon
          </Link>
          <span className="text-xs text-gray-400 font-medium">Gerçek fiyatlar, gerçek adisyonlar</span>
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  active ? "text-orange-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${active ? "stroke-[2.5]" : "stroke-[1.5]"}`}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
