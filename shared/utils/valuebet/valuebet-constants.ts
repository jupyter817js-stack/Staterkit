/** 페이지당 개수 react-select용 options */
export const PER_PAGE_SELECT_OPTIONS = [
  { value: 10, label: "10" },
  { value: 25, label: "20" },
  { value: 50, label: "25" },
  { value: 100, label: "30" },
];

/** 정렬 옵션 (벨류벳/슈어벳 공통) - 라벨은 i18n sortByTimeAsc 등 사용 */
export const BETS_SORT_OPTIONS = [
  { value: "time_asc_profit_desc" as const, labelKey: "sortByTimeThenProfit" },
  { value: "time_asc" as const, labelKey: "sortByTimeAsc" },
  { value: "profit_desc" as const, labelKey: "sortByProfitDesc" },
];

/** 시간 범위 프리셋 (오늘 경기만 / N시간 이내) */
export const BETS_TIME_RANGE_OPTIONS = [
  { value: "all" as const, labelKey: "timeRangeAll" },
  { value: "today" as const, labelKey: "timeRangeToday" },
  { value: "6h" as const, labelKey: "timeRange6h" },
  { value: "12h" as const, labelKey: "timeRange12h" },
];
