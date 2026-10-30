import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Providers } from "@/components/Providers";
import { Onboarding } from "@/components/Onboarding";
import { RouteTransition } from "@/components/RouteTransition";
import { SheetEnhancer } from "@/components/SheetEnhancer";
import { PullToRefresh } from "@/components/PullToRefresh";

const nunito = Nunito({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800", "900"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "grazer — Gerçek Restoran Fiyatları",
  description: "Gerçek fiyatlar, gerçek adisyonlar. Git öncesini bil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${nunito.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Apply theme before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('adisyon_theme')||'system';if(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}if(!localStorage.getItem('grazer_onboarded_v1'))document.documentElement.setAttribute('data-onb','1')}catch(e){}})()` }} />
      </head>
      <body className="min-h-full bg-page font-body text-ink">
        <Providers>
          <Onboarding />
          <SheetEnhancer />
          <PullToRefresh />
          <Navigation />
          <main className="max-w-2xl mx-auto px-4 pb-24 pt-4"><RouteTransition>{children}</RouteTransition></main>
        </Providers>
      </body>
    </html>
  );
}
