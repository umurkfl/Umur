import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "grazer — Gerçek Restoran Fiyatları",
  description: "Gerçek fiyatlar, gerçek adisyonlar. Git öncesini bil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full bg-background font-body text-ink">
        <Providers>
          <Navigation />
          <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
