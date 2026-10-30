"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Gus } from "@/components/Gus";
import { haptic } from "@/lib/haptics";

const THRESHOLD = 84;

/** Pull the page down at the top and Gus jumps out; pages listen for `grazer:refresh`. */
export function PullToRefresh() {
  const pathname = usePathname();
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const passed = useRef(false);

  useEffect(() => {
    // The discover deck is its own gesture surface
    if (pathname.startsWith("/discover")) return;

    function start(e: TouchEvent) {
      if (window.scrollY > 0 || busy) return;
      if ((e.target as HTMLElement).closest(".fixed, [data-no-ptr]")) return;
      startY.current = e.touches[0].clientY;
      passed.current = false;
    }
    function move(e: TouchEvent) {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { pullRef.current = 0; setPull(0); return; }
      if (e.cancelable) e.preventDefault();
      const eased = Math.min(130, dy * 0.55);
      pullRef.current = eased;
      setPull(eased);
      if (eased >= THRESHOLD && !passed.current) { passed.current = true; haptic("tap"); }
    }
    function end() {
      if (startY.current == null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        setBusy(true);
        setPull(THRESHOLD);
        haptic("success");
        window.dispatchEvent(new CustomEvent("grazer:refresh"));
        setTimeout(() => { setBusy(false); setPull(0); pullRef.current = 0; }, 1100);
      } else {
        setPull(0); pullRef.current = 0;
      }
    }
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
    };
  }, [pathname, busy]);

  // push the page down with the finger so Gus lives in the gap
  useEffect(() => {
    const m = document.querySelector("main") as HTMLElement | null;
    if (!m) return;
    m.style.transition = startY.current == null ? "transform .25s cubic-bezier(.2,.8,.3,1)" : "none";
    m.style.transform = pull > 0 ? `translateY(${pull}px)` : "";
    return () => { m.style.transform = ""; };
  }, [pull]);

  if (pull <= 2 && !busy) return null;
  const ready = pull >= THRESHOLD;
  return (
    <div
      className="fixed left-0 right-0 z-[45] flex justify-center pointer-events-none"
      style={{ top: `calc(env(safe-area-inset-top) + 56px + ${Math.max(0, pull / 2 - 38)}px)`, opacity: Math.min(1, pull / 40) }}
      aria-hidden
    >
      <Gus mood={busy ? "laugh" : ready ? "wink" : "think"} size={72} playful={false} />
    </div>
  );
}
