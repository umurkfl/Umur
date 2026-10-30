// Tiny synthesized sound effects (no audio files). Browsers only allow audio after a tap,
// and the user can switch it off in Settings, so every call is guarded.
type Sfx = "tap" | "success" | "level";

const NOTES: Record<Sfx, number[]> = {
  tap: [660],
  success: [523.25, 659.25, 783.99],
  level: [523.25, 659.25, 783.99, 1046.5],
};

let ctx: AudioContext | null = null;

export function sfxEnabled(): boolean {
  try { return localStorage.getItem("grazer_sfx") !== "off"; } catch { return true; }
}

export function setSfxEnabled(on: boolean): void {
  try { localStorage.setItem("grazer_sfx", on ? "on" : "off"); } catch { /* ignore */ }
}

export function playSfx(kind: Sfx = "tap"): void {
  try {
    if (!sfxEnabled() || typeof window === "undefined") return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    NOTES[kind].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = t0 + i * (kind === "tap" ? 0 : 0.09);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.05 : 0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (kind === "tap" ? 0.08 : 0.28));
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  } catch { /* audio unavailable */ }
}
