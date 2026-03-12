/**
 * 벨류벳/슈어벳 리스트 정렬 옵션 및 적용
 * - 가까운 경기 우선 (kickoff_time ASC)
 * - 수익률 우선 (profit_pct DESC)
 * - 가까운 경기 + 수익률 (kickoff_time ASC → profit_pct DESC) [기본값]
 */

export type BetsSortOption = "time_asc" | "profit_desc" | "time_asc_profit_desc";

export interface SortableTip {
  startTime: number;
  percent: number;
}

export function sortTips<T extends SortableTip>(tips: T[], option: BetsSortOption): T[] {
  const arr = [...tips];
  if (option === "time_asc") {
    arr.sort((a, b) => a.startTime - b.startTime);
  } else if (option === "profit_desc") {
    arr.sort((a, b) => b.percent - a.percent);
  } else {
    // time_asc_profit_desc: kickoff ASC, then percent DESC
    arr.sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime - b.startTime;
      return b.percent - a.percent;
    });
  }
  return arr;
}
