import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

export interface ArbClickItem {
  bookmaker_id: number;
  direct_link: string;
  bookmaker_event_direct_link: string;
  /** 밸루벳/슈어벳 공통: 배당(odds) 값 */
  koef?: number;
  /** 밸류벳/슈어벳 공통: bets 해당 마켓의 부키 이벤트명 */
  bookmaker_event_name?: string;
  /** 밸류벳/슈어벳 공통: bets 해당 마켓의 부키 리그명 */
  bookmaker_league_name?: string;
  /** 밸류벳/슈어벳 공통: 마켓/베팅 타입 파라미터 (payload + 헤더 전송) */
  market_and_bet_type_param?: number;
}

/** valuebet 카드 클릭: POST /api/v1/arb-clicks — clicks[] 항목에 market_and_bet_type_param 포함 (0이어도 전송) */
export async function sendArbClickValuebet(payload: ArbClickItem): Promise<void> {
  if (!API_BASE) return;
  const marketParam = payload.market_and_bet_type_param ?? 0;
  const clicks = [
    {
      bookmaker_id: payload.bookmaker_id,
      direct_link: payload.direct_link ?? "",
      bookmaker_event_direct_link: payload.bookmaker_event_direct_link ?? "",
      ...(payload.koef != null && { koef: payload.koef }),
      ...(payload.bookmaker_event_name != null && payload.bookmaker_event_name !== "" && { bookmaker_event_name: payload.bookmaker_event_name }),
      ...(payload.bookmaker_league_name != null && payload.bookmaker_league_name !== "" && { bookmaker_league_name: payload.bookmaker_league_name }),
      market_and_bet_type_param: marketParam,
    },
  ];
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  headers["X-Market-And-Bet-Type-Param"] = String(marketParam);
  await fetchWithErrorHandling(`${API_BASE}/api/v1/arb-clicks`, {
    method: "POST",
    headers: authHeaders(headers),
    body: JSON.stringify({
      type: "valuebet",
      clicks,
    }),
    redirectOnError: false,
  });
}

/** surebet 카드 클릭: POST /api/v1/arb-clicks — clicks[] 각 항목에 market_and_bet_type_param 포함 (0이어도 전송) */
export async function sendArbClickSurebet(clicks: ArbClickItem[]): Promise<void> {
  if (!API_BASE || !clicks.length) return;
  const payload = clicks.map((c) => ({
    bookmaker_id: c.bookmaker_id,
    direct_link: c.direct_link ?? "",
    bookmaker_event_direct_link: c.bookmaker_event_direct_link ?? "",
    ...(c.koef != null && { koef: c.koef }),
    ...(c.bookmaker_event_name != null && c.bookmaker_event_name !== "" && { bookmaker_event_name: c.bookmaker_event_name }),
    ...(c.bookmaker_league_name != null && c.bookmaker_league_name !== "" && { bookmaker_league_name: c.bookmaker_league_name }),
    market_and_bet_type_param: c.market_and_bet_type_param ?? 0,
  }));
  const headerParams = clicks
    .map((c) => String(c.market_and_bet_type_param ?? 0))
    .join(",");
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-Market-And-Bet-Type-Param": headerParams };
  await fetchWithErrorHandling(`${API_BASE}/api/v1/arb-clicks`, {
    method: "POST",
    headers: authHeaders(headers),
    body: JSON.stringify({
      type: "surebet",
      clicks: payload,
    }),
    redirectOnError: false,
  });
}
