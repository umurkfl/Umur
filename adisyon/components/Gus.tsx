"use client";

import { useMemo, useState } from "react";
import { gusSvg, gusIconSvg, GUS_MOODS, GusMood, GusOpts } from "@/lib/gus";
import { haptic } from "@/lib/haptics";

interface GusProps extends GusOpts {
  mood?: GusMood;
  size?: number;
  className?: string;
  /** tapping makes Gus jump */
  playful?: boolean;
}

export function Gus({ mood = "happy", size = 140, className = "", playful = true, ...overrides }: GusProps) {
  const [jump, setJump] = useState(0);
  const key = JSON.stringify([mood, overrides]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => gusSvg({ ...GUS_MOODS[mood], ...overrides }), [key]);
  const tall = overrides.body === "full";
  return (
    <div
      className={`gus ${jump ? "gus-jump" : ""} ${className}`}
      style={{ width: size, height: tall ? size * 1.31 : size, touchAction: "manipulation" }}
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
