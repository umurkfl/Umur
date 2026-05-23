import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Providers } from "@/components/Providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Adisyon — Gerçek Restoran Fiyatları",
  description: "Gerçek fiyatlar, gerçek adisyonlar. Git öncesini bil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans">
        <Providers>
          <Navigation />
          <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
