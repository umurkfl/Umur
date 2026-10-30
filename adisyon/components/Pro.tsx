"use client";

import Link from "next/link";
import { CrownIcon } from "@/components/Icons";

/** The small gold "PRO" tag shown next to anything that needs Pro */
export function ProChip({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gold text-[#4A3A00] border-b-2 border-gold-shade px-2 py-0.5 text-[10px] font-black tracking-wide leading-none ${className}`}>
      <CrownIcon size={11} /> PRO
    </span>
  );
}

/** A card that explains a locked feature and sends people to /pro */
export function ProLock({ title, text, className = "" }: { title: string; text: string; className?: string }) {
  return (
    <div className={`rounded-3xl border-2 border-b-4 border-gold-shade bg-gold/15 p-5 text-center ${className}`}>
      <div className="mx-auto w-14 h-14 rounded-2xl bg-white flex items-center justify-center"><CrownIcon size={34} /></div>
      <p className="mt-3 text-lg font-black text-charcoal">{title}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{text}</p>
      <Link href="/pro" className="btn btn-gold btn-sm mt-4">Pro'yu keşfet</Link>
    </div>
  );
}
