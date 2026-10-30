"use client";

import { useEffect } from "react";

/**
 * Every bottom sheet in the app is a `.rounded-t-3xl` element sitting right after its backdrop.
 * This adds the native feel in one place: drag the top of the sheet down to dismiss it.
 * Closing is done by clicking the backdrop, so each sheet keeps its own close logic.
 */
export function SheetEnhancer() {
  useEffect(() => {
    const wired = new WeakSet<Element>();

    function wire(sheet: HTMLElement) {
      if (wired.has(sheet)) return;
      wired.add(sheet);
      let startY = 0, dy = 0, active = false, startedAt = 0;

      sheet.addEventListener("touchstart", (e) => {
        const rect = sheet.getBoundingClientRect();
        const y = e.touches[0].clientY;
        // only the grab zone at the top of the sheet starts a drag
        if (y - rect.top > 72) return;
        active = true; startY = y; dy = 0; startedAt = Date.now();
        sheet.style.transition = "none";
      }, { passive: true });

      sheet.addEventListener("touchmove", (e) => {
        if (!active) return;
        dy = Math.max(0, e.touches[0].clientY - startY);
        sheet.style.transform = `translateY(${dy}px)`;
      }, { passive: true });

      sheet.addEventListener("touchend", () => {
        if (!active) return;
        active = false;
        const fast = dy > 40 && Date.now() - startedAt < 220;
        sheet.style.transition = "transform .26s cubic-bezier(.2,.8,.3,1)";
        if (dy > 120 || fast) {
          sheet.style.transform = "translateY(105%)";
          const backdrop = sheet.previousElementSibling as HTMLElement | null;
          setTimeout(() => backdrop?.click(), 200);
        } else {
          sheet.style.transform = "";
        }
      });
    }

    const scan = () => document.querySelectorAll<HTMLElement>(".rounded-t-3xl").forEach(wire);
    scan();
    const obs = new MutationObserver(scan);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  return null;
}
