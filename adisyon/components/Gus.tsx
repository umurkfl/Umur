"use client";

import { useEffect, useMemo, useState } from "react";
import { gusSvg, gusIconSvg, gusFaceSvg, GUS_MOODS, GusMood, GusOpts } from "@/lib/gus";
import { haptic } from "@/lib/haptics";
import { currentUserId, getLook, Look } from "@/lib/shop";
import { getPro } from "@/lib/pro";

interface GusProps extends GusOpts {
  mood?: GusMood;
  size?: number;
  className?: string;
  /** tapping makes Gus jump */
  playful?: boolean;
  /** render without the equipped costume (e.g. the shop preview passes its own look) */
  bare?: boolean;
}

/** The costume the signed-in user has equipped (empty for guests and when Pro ended) */
function useLook(enabled: boolean): Look {
  const [look, setLook] = useState<Look>({});
  useEffect(() => {
    if (!enabled) return;
    const read = () => { const uid = currentUserId(); setLook(getLook(uid, getPro(uid).active)); };
    read();
    window.addEventListener("grazer:look-changed", read);
    window.addEventListener("grazer:pro-changed", read);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener("grazer:look-changed", read); window.removeEventListener("grazer:pro-changed", read); window.removeEventListener("storage", read); };
  }, [enabled]);
  return look;
}

export function Gus({ mood = "happy", size = 140, className = "", playful = true, bare = false, ...overrides }: GusProps) {
  const [jump, setJump] = useState(0);
  const worn = useLook(!bare && !overrides.look);
  const look = overrides.look ?? worn;
  const key = JSON.stringify([mood, overrides, look]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => gusSvg({ ...GUS_MOODS[mood], ...overrides, look }), [key]);
  const party = overrides.extra?.includes("confetti") || overrides.prop === "trophy";
  return (
    <div
      className={`gus gus-m-${mood} ${party ? "gus-party" : ""} ${jump ? "gus-jump" : ""} ${className}`}
      style={{ width: size, height: size, touchAction: "manipulation" }}
      onClick={playful ? () => { setJump((n) => n + 1); haptic("tap"); } : undefined}
      onAnimationEnd={(e) => { if (e.animationName === "gus-squish") setJump(0); }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function GusIcon({ size = 36, className = "" }: { size?: number; className?: string }) {
  return <span className={`inline-block shrink-0 ${className}`} style={{ width: size, height: size, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: gusIconSvg(size) }} />;
}

/** Gus with a speech bubble: the main way he talks to the user */
export function GusSays({ children, mood = "happy", size = 120, className = "", ...rest }: {
  children: React.ReactNode; mood?: GusMood; size?: number; className?: string;
} & GusOpts) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Gus mood={mood} size={size} {...rest} />
      <div className="gus-bubble flex-1 min-w-0">{children}</div>
    </div>
  );
}

/** Gus's head as a sticker/emoji: our own reaction set */
export function GusFace({ mood, size = 28, className = "" }: { mood: GusMood; size?: number; className?: string }) {
  const html = useMemo(() => gusFaceSvg({ ...GUS_MOODS[mood], label: mood }), [mood]);
  return <span className={`gus gus-face inline-block shrink-0 ${className}`} style={{ width: size, height: size * 0.84, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: html }} />;
}
