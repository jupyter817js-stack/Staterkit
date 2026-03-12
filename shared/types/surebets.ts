/** 슈어벳 한쪽 레그 (부키 1개 + 마켓 + 배당) */
export interface SureBetLeg {
  bookmaker_id: number;
  market_type?: number;
  market_param?: number;
  odd: number;
  [key: string]: unknown;
}

/** 슈어벳 한 건 (API 응답) */
export interface SureBetItem {
  id: string;
  event_id?: number;
  team1_name: string;
  team2_name: string;
  league?: string;
  league_name?: string;
  sport_id: number;
  /** 구간 식별자 (period_translations 조회용) */
  period_identifier?: string | number;
  started_at: number;
  legs: [SureBetLeg, SureBetLeg];
  percent: number;
  is_live?: boolean;
  [key: string]: unknown;
}

import type { ValueBetItem, ArbItem } from "@/shared/types/valuebets";

/** 슈어벳 검색 API 응답 (valuebets와 동일한 bets + arbs 구조 반환) */
export interface SureBetsSearchResponse {
  surebets?: SureBetItem[];
  /** 실제 API는 bets + arbs 로 반환 */
  bets?: ValueBetItem[];
  arbs?: ArbItem[];
  source?: { arbs?: ArbItem[] };
  total?: number;
  limit?: number;
  total_by_filter?: number;
  [key: string]: unknown;
}

export interface SureBetsSearchParams {
  per_page?: number;
  is_live?: boolean;
  /** 단일 부키 (레거시). 우선 bookmaker_ids 사용. */
  bookmaker_id?: number | "";
  /** 부키 ID 배열. 비어있거나 없으면 전체. */
  bookmaker_ids?: number[];
  sport_ids?: number[];
}

export interface BookmakerResponse {
  id: number;
  bookmakersName: string;
}
