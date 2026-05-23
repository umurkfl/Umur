import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Adisyon — Restaurant Price Transparency",
  description: "Real restaurant prices from real receipts. See what others paid before you go.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">{children}</main>
      </body>
    </html>
  );
}
