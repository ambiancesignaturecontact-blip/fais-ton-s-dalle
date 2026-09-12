"use client";

/**
 * Sound design — sons courts générés via AudioContext
 * Pas besoin de fichiers audio, tout est synthétisé
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { return null; }
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

/** Son quand on ajoute un article au panier */
export function playAddToCartSound() {
  playTone(880, 0.15, "sine", 0.12);
  setTimeout(() => playTone(1320, 0.15, "sine", 0.08), 80);
}

/** Son quand on passe commande */
export function playOrderSound() {
  playTone(523, 0.1, "sine", 0.1);
  setTimeout(() => playTone(659, 0.1, "sine", 0.1), 100);
  setTimeout(() => playTone(784, 0.1, "sine", 0.1), 200);
  setTimeout(() => playTone(1047, 0.2, "sine", 0.12), 300);
}

/** Son quand on reçoit une nouvelle commande (admin) */
export function playNewOrderSound() {
  playTone(600, 0.1, "square", 0.08);
  setTimeout(() => playTone(900, 0.15, "square", 0.08), 120);
}

/** Son quand on supprime un article */
export function playRemoveSound() {
  playTone(400, 0.1, "sawtooth", 0.06);
  setTimeout(() => playTone(300, 0.1, "sawtooth", 0.04), 80);
}

/** Son erreur */
export function playErrorSound() {
  playTone(200, 0.15, "square", 0.08);
  setTimeout(() => playTone(180, 0.2, "square", 0.08), 150);
}
