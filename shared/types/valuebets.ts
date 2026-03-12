export interface ValueBetItem {
  id: string;
  home: string;
  away: string;
  team1_name?: string;
  team2_name?: string;
  event_name: string;
  league: string;
  league_name?: string;
  started_at: number;
  koef: number;
  is_value_bet?: boolean;
  bookmaker_id: number;
  sport_id: number;
  /** 구간 식별자 (period_translations 조회용, 예: "0", "1", "10") */
  period_identifier?: string | number;
  market_and_bet_type?: number;
  market_and_bet_type_param?: number;
  /** arb-clicks용: 부키 상세 링크 쿼리 */
  direct_link?: string;
  /** arb-clicks용: 부키 이벤트 경로 */
  bookmaker_event_direct_link?: string;
  /** arb-clicks용: 부키 이벤트명 (bets 해당 마켓) */
  bookmaker_event_name?: string;
  /** arb-clicks용: 부키 리그명 (bets 해당 마켓) */
  bookmaker_league_name?: string;
  [key: string]: unknown;
}

export interface ArbItem {
  id: string;
  event_id: number;
  event_name: string;
  team1_name: string;
  team2_name: string;
  league: string;
  percent: number;
  arb_type: string;
  min_koef: number;
  max_koef: number;
  started_at: number;
  is_live: boolean;
  [key: string]: unknown;
}

export interface ValueBetsSearchResponse {
  limit: number;
  total: number;
  total_by_filter: number;
  bets: ValueBetItem[];
  arbs: ArbItem[];
  source?: {
    value_bets?: Array<{
      bet_id: string;
      percent?: number;
      /** valuebet 수익률(%) — 이 값 자체가 퍼센트. 예: 1.9928932 → 1.9928932% */
      middle_value?: number;
      avg_koef: number;
      started_at: number;
      arbs_count: number;
    }>;
    arbs?: ArbItem[];
  };
  total_time?: number;
  last_update?: number;
  [key: string]: unknown;
}

export interface ValueBetsSearchParams {
  per_page?: number;
  is_live?: boolean;
  /** 단일 부키 (레거시). 우선 bookmaker_ids 사용. */
  bookmaker_id?: number | "";
  /** 부키 ID 배열. 비어있거나 없으면 전체. */
  bookmaker_ids?: number[];
  sport_ids?: number[];
}
