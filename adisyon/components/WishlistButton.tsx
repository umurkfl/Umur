"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { store } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Props {
  restaurantName: string;
  restaurantSlug?: string | null;
  size?: "sm" | "md";
}

export function WishlistButton({ restaurantName, restaurantSlug = null, size = "md" }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) setSaved(store.isInWishlist(user.id, restaurantName));
  }, [user, restaurantName]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push("/auth"); return; }
    if (saved) {
      store.removeFromWishlist(user.id, restaurantName);
      setSaved(false);
    } else {
      store.addToWishlist({ id: crypto.randomUUID(), userId: user.id, restaurantName, restaurantSlug, addedAt: new Date().toISOString() });
      setSaved(true);
    }
  }

  const sz = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const pad = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Listeden çıkar" : "Listeye ekle"}
      className={`${pad} rounded-full transition-colors active:scale-90 ${saved ? "text-primary" : "text-border active:text-primary"}`}
    >
      <Bookmark className={`${sz} ${saved ? "fill-primary stroke-primary" : "stroke-current"}`} />
    </button>
  );
}
