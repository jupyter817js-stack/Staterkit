"use client";

import { useCallback, useEffect, useRef } from "react";

const THROTTLE_MS = 45000;

type BrowserWindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playBeepTone(ctx: AudioContext): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.frequency.value = 1100;
  osc2.type = "sine";
  gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
  osc2.start(ctx.currentTime + 0.2);
  osc2.stop(ctx.currentTime + 0.35);
}

export function useNewOpportunityAlert(
  tipIds: string[],
  muted: boolean,
): { activateAlertSound: () => Promise<boolean> } {
  const previousIdsRef = useRef<Set<string>>(new Set());
  const lastPlayedRef = useRef<Record<string, number>>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  const activateAlertSound = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    const audioWindow = window as BrowserWindowWithWebkitAudio;
    const AudioContextCtor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextCtor) return false;

    try {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContextCtor();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      return audioContextRef.current.state === "running";
    } catch {
      return false;
    }
  }, []);

  const playBeep = useCallback((): void => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state !== "running") return;
    playBeepTone(ctx);
  }, []);

  useEffect(() => {
    if (tipIds.length === 0) {
      previousIdsRef.current = new Set();
      return;
    }

    if (muted) {
      previousIdsRef.current = new Set(tipIds);
      return;
    }

    const prev = previousIdsRef.current;
    const now = Date.now();
    const newIds = tipIds.filter((id) => !prev.has(id));

    for (const id of newIds) {
      const last = lastPlayedRef.current[id];
      if (last == null || now - last > THROTTLE_MS) {
        lastPlayedRef.current[id] = now;
        playBeep();
        break;
      }
    }

    previousIdsRef.current = new Set(tipIds);
  }, [tipIds, muted, playBeep]);

  useEffect(() => {
    return () => {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      if (!ctx || ctx.state === "closed") return;
      void ctx.close().catch(() => undefined);
    };
  }, []);

  return { activateAlertSound };
}
