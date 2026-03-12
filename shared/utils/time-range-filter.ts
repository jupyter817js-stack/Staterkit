/**
 * 오늘 경기만 / N시간 이내 프리셋
 * startTime = Unix timestamp (seconds)
 */

export type TimeRangePreset = "all" | "today" | "6h" | "12h";

export interface TimeRangeFilterOptions {
  timeRangePreset: TimeRangePreset;
}

function getNowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** 오늘 00:00:00 (로컬) ~ 23:59:59 의 Unix timestamp 범위 */
function getTodayStartEnd(): { start: number; end: number } {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const start = Math.floor(new Date(y, m, day, 0, 0, 0).getTime() / 1000);
  const end = start + 86400 - 1; // 23:59:59
  return { start, end };
}

export interface TipWithStartTime {
  startTime: number;
  [key: string]: unknown;
}

/**
 * 시간 범위 필터 적용
 */
export function filterTipsByTimeRange<T extends TipWithStartTime>(
  tips: T[],
  options: TimeRangeFilterOptions
): T[] {
  const { timeRangePreset } = options;
  const now = getNowSeconds();

  return tips.filter((tip) => {
    const t = tip.startTime;
    if (timeRangePreset === "all") return true;
    if (timeRangePreset === "today") {
      const { start, end } = getTodayStartEnd();
      return t >= start && t <= end;
    }
    if (timeRangePreset === "6h") {
      return t <= now + 6 * 3600;
    }
    if (timeRangePreset === "12h") {
      return t <= now + 12 * 3600;
    }
    return true;
  });
}
