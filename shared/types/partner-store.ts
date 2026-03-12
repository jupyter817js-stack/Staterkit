/**
 * 총판 → 매장 → 회원 구조 (링크 기반 자동 귀속 및 정산)
 * docs/[총판 → 매장 → 회원 구조  링크 기반 자동 귀속 및 정산.txt] 참고
 */

/** 가입 링크 쿼리 키: p=총판ID, s=매장ID */
export const JOIN_QUERY_PARTNER = "p";
export const JOIN_QUERY_STORE = "s";

/** 귀속 저장용 쿠키 키 (가입 시 백엔드로 전달) */
export const COOKIE_STORE_ID = "staterkit_store_id";
export const COOKIE_PARTNER_ID = "staterkit_partner_id";

/** 총판 (본사가 생성, 수익률·지갑 설정). 표시용 nickName, 내부 식별 id */
export interface Partner {
  id: string;
  /** 화면 표시명 (DB nick_name). 없으면 id 사용 */
  nickName?: string | null;
  commissionRatePercent: number;
  walletNetwork: string;
  walletAddress: string;
  createdAt?: string;
  managerUserId?: number | null;
}

/** 매장 (총판이 생성 또는 본사 직속). 표시용 nickName, 내부 식별 id */
export interface Store {
  id: string;
  /** 화면 표시명 (DB nick_name). 없으면 id 사용 */
  nickName?: string | null;
  partnerId: string | null;
  commissionRatePercent: number;
  walletNetwork: string;
  walletAddress: string;
  createdAt?: string;
  managerUserId?: number | null;
}

/** 정산 기록. 현재는 계산 결과만 반환(누가 얼마 받아야 하는지). 자동 지급은 추후 구현. */
export interface SettlementRecord {
  id: string | number;
  periodStart: string;
  periodEnd: string;
  targetType: "partner" | "store";
  targetId: string;
  netSalesAmount: number;
  /** 적용된 수익률(%). 백엔드가 DB의 총판/매장 수익률에서 조회해 사용 */
  commissionRatePercent: number;
  payoutAmount: number;
  network: string;
  walletAddress: string;
  txHash?: string | null;
  /** calculated/pending = 계산됨, paid = 지급완료, failed = 실패, hold = 대기 */
  status: "paid" | "failed" | "hold" | "pending" | "calculated";
  paidAt?: string | null;
  failureReason?: string | null;
}

/** 총판 표시명 (nickName 우선, 없으면 id) */
export function displayPartnerName(p: Partner): string {
  const n = (p.nickName ?? "").trim();
  return n || p.id || "";
}

/** 매장 표시명 (nickName 우선, 없으면 id) */
export function displayStoreName(s: Store): string {
  const n = (s.nickName ?? "").trim();
  return n || s.id || "";
}
