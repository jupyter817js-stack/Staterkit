"use client";

import { useEffect, useRef } from "react";

const THROTTLE_MS = 45000; // 같은 경기 45초 내 중복 알림 방지

/** Web Audio API로 짧은 "딩동" 비프음 재생 (파일 불필요) */
function playBeep(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
    // 두 번째 톤
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
  } catch {
    // ignore
  }
}

/**
 * 신규 수익경기 등록 시 알림음 재생 (스팸 방지: 동일 id 45초 내 1회)
 * @param tipIds 현재 표시 중인 팁 id 배열 (정렬된 순서)
 * @param muted 음소거 시 true
 */
export function useNewOpportunityAlert(tipIds: string[], muted: boolean): void {
  const previousIdsRef = useRef<Set<string>>(new Set());
  const lastPlayedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (muted || tipIds.length === 0) return;
    const prev = previousIdsRef.current;
    const now = Date.now();
    const newIds = tipIds.filter((id) => !prev.has(id));
    for (const id of newIds) {
      const last = lastPlayedRef.current[id];
      if (last == null || now - last > THROTTLE_MS) {
        lastPlayedRef.current[id] = now;
        playBeep();
        break; // 한 번만 재생 (여러 건 동시 등록 시 1회만)
      }
    }
    previousIdsRef.current = new Set(tipIds);
  }, [tipIds, muted]);
}
