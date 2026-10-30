// Tiny haptic feedback helper. navigator.vibrate exists on Android browsers; iOS Safari
// does not implement it, so on iPhone/iPad this silently does nothing.
type Kind = "tap" | "success" | "error";

const PATTERNS: Record<Kind, number | number[]> = {
  tap: 8,
  success: [12, 40, 18],
  error: [30, 50, 30],
};

export function haptic(kind: Kind = "tap"): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(PATTERNS[kind]);
  } catch { /* unsupported */ }
}
