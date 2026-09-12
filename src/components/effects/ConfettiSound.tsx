"use client";

import { useEffect, useRef } from "react";

export function ConfettiSound() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    // Son de célébration
    try {
      const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) throw new Error("No AudioContext");
      const ctx = new (AudioCtx as new () => AudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.4);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch {}

    // Confettis
    const colors = ["#d43d2b", "#e85d4a", "#e89f2e", "#22c55e", "#3b82f6", "#a855f7", "#f59e0b"];
    const els: HTMLElement[] = [];
    const styles: HTMLStyleElement[] = [];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement("div");
      const size = 6 + Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isCircle = Math.random() > 0.5;
      const left = Math.random() * 100;
      const duration = 1.5 + Math.random() * 2;
      const elId = `cf-${i}-${Date.now()}`;
      el.style.cssText = `position:fixed;z-index:9999;pointer-events:none;width:${size}px;height:${size}px;background:${color};border-radius:${isCircle ? "50%" : "2px"};left:${left}vw;top:-10px;opacity:${0.7 + Math.random() * 0.3};animation:${elId} ${duration}s ease-out forwards;`;
      const style = document.createElement("style");
      const rotation = 360 + Math.random() * 720;
      style.textContent = `@keyframes ${elId}{0%{transform:translateY(0) rotate(0deg) scale(1);opacity:1}100%{transform:translateY(${window.innerHeight + 100}px) rotate(${rotation}deg) scale(0.5);opacity:0}}`;
      document.head.appendChild(style);
      document.body.appendChild(el);
      els.push(el);
      styles.push(style);
    }
    setTimeout(() => {
      els.forEach((el, i) => { el.remove(); styles[i]?.remove(); });
    }, 4000);
  }, []);

  return null;
}
