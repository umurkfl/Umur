"use client";

import { usePathname } from "next/navigation";

/** Soft slide + fade whenever the route changes. */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname} className="route-enter">{children}</div>;
}
