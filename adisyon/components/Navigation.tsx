"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Navigation() {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  const navItems = [
    { href: "/", icon: Home, label: "Ana Sayfa" },
    { href: "/discover", icon: Search, label: "Keşfet" },
    { href: "/upload", icon: PlusCircle, label: "Ekle" },
    { href: user ? "/profile" : "/auth", icon: User, label: user ? "Profil" : "Giriş" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-orange-600 tracking-tight">
            Adisyon
          </Link>
          {ready && (
            user ? (
              <Link href="/profile" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-orange-600">
                  {user.avatar
                    ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                    : user.name.charAt(0).toUpperCase()
                  }
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <Link href="/auth" className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                Giriş Yap
              </Link>
            )
          )}
        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href ||
              (href !== "/" && href !== "/auth" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  active ? "text-orange-600" : "text-gray-400 hover:text-gray-600"
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
