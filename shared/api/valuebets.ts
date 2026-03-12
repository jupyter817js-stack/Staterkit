import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type {
  ValueBetsSearchParams,
  ValueBetsSearchResponse,
} from "@/shared/types/valuebets";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

export async function searchValueBets(
  params: ValueBetsSearchParams = {},
): Promise<ValueBetsSearchResponse> {
  const body = new URLSearchParams();
  body.append("pagenum", String(params.per_page ?? 10));
  body.append("islive", String(params.is_live ?? false));
  if (params.bookmaker_ids?.length) {
    params.bookmaker_ids.forEach((id) => body.append("bookie_ids[]", String(id)));
  } else if (params.bookmaker_id !== undefined && params.bookmaker_id !== "") {
    body.append("bookie_id", String(params.bookmaker_id));
  }
  if (params.sport_ids?.length) {
    params.sport_ids.forEach((id) => body.append("sport_ids[]", String(id)));
  }

  // const url = `${API_BASE}/api/v1/valuebets/search?access_token=${DEFAULT_ACCESS_TOKEN}`;
  const url = `${API_BASE}/api/v1/valuebets/search`;
  const res = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body: body.toString(),
  });
  return res.json();
}

/** 스포츠 ID → 표시명 (서버 조회, 실패 시 fallback 반환) */
export async function getSportDisplayName(
  sportId: number,
  fallback: string = "기타",
): Promise<string> {
  if (!API_BASE) return fallback;
  try {
    const url = `${API_BASE}/api/v1/sports/${sportId}`;
    const res = await fetchWithErrorHandling(url, {
      method: "GET",
      headers: authHeaders(),
      redirectOnError: false,
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    if (typeof data === "string") return data;
    return data?.name ?? data?.displayName ?? fallback;
  } catch {
    return fallback;
  }
}

/** 마켓 배치 요청 한 건 */
export interface MarketDisplayBatchRequest {
  marketAndBetType: number;
  marketAndBetTypeParam?: number;
}

/** 마켓 배치 응답 한 건 */
export interface MarketDisplayBatchItem {
  marketAndBetType: number;
  marketAndBetTypeParam?: number | null;
  display: string;
  /** API에서 내려주는 라인 (예: "+0.5") */
  line?: string;
  /** API에서 내려주는 마켓 표시용 짧은 라벨 */
  market?: string;
  /** Betburger 원문 마켓 이름 — 툴팁용 */
  description?: string | null;
  /** 카드 표시용 짧은 표기 (AH1, 1X, 2 등) */
  descriptionShort?: string | null;
}

/** api/v1/markets/display/batch — 마켓 표시 문자열 일괄 조회 */
export async function getMarketDisplayBatch(
  items: MarketDisplayBatchRequest[],
): Promise<MarketDisplayBatchItem[]> {
  if (!API_BASE || !items?.length) return [];
  try {
    const url = `${API_BASE}/api/v1/markets/display/batch`;
    const res = await fetchWithErrorHandling(url, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(
        items.map(({ marketAndBetType, marketAndBetTypeParam = 0 }) => ({
          marketAndBetType,
          marketAndBetTypeParam: marketAndBetTypeParam ?? 0,
        })),
      ),
      redirectOnError: false,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** 마켓 표시 캐시: 카드에는 descriptionShort(또는 market), 툴팁에는 description */
export interface MarketDisplayEntry {
  line: string;
  market: string;
  description?: string | null;
  descriptionShort?: string | null;
}

const marketDisplayCache = new Map<string, MarketDisplayEntry>();

/**
 * 마켓 표시 맵 조회. 캐시에 없으면 배치 요청 후 캐시에 병합해 반환.
 * 카드 표시: descriptionShort ?? market / 툴팁: description
 */
export async function getMarketDisplayCached(
  pairs: MarketDisplayBatchRequest[],
): Promise<Map<string, MarketDisplayEntry>> {
  const missing = pairs.filter((p) => {
    const key = `${p.marketAndBetType}_${p.marketAndBetTypeParam ?? 0}`;
    return !marketDisplayCache.has(key);
  });
  if (missing.length > 0) {
    const batch = await getMarketDisplayBatch(missing);
    const merged = marketLineAndMarketMapFromBatch(batch);
    merged.forEach((v, k) => marketDisplayCache.set(k, v));
  }
  const result = new Map<string, MarketDisplayEntry>();
  for (const p of pairs) {
    const key = `${p.marketAndBetType}_${p.marketAndBetTypeParam ?? 0}`;
    const entry = marketDisplayCache.get(key);
    if (entry) result.set(key, entry);
    else result.set(key, { line: "-", market: `마켓 ${p.marketAndBetType}` });
  }
  return result;
}

/** 배치 응답을 (type_param -> display) Map으로 변환 */
export function marketDisplayMapFromBatch(
  list: MarketDisplayBatchItem[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of list) {
    map.set(`${r.marketAndBetType}_${r.marketAndBetTypeParam}`, r.display ?? "");
  }
  return map;
}

/** display 문자열을 " - " 기준으로 line / market 으로 나눔 (fallback) */
function parseDisplayFallback(display: string): { line: string; market: string } {
  if (!display?.trim()) return { line: "-", market: "-" };
  const sep = " - ";
  const idx = display.indexOf(sep);
  if (idx >= 0) {
    return {
      line: display.slice(0, idx).trim() || "-",
      market: display.slice(idx + sep.length).trim() || "-",
    };
  }
  return { line: "-", market: display.trim() || "-" };
}

/** 배치 응답을 (type_param -> { line, market, description, descriptionShort }) Map으로 변환 */
export function marketLineAndMarketMapFromBatch(
  list: MarketDisplayBatchItem[],
): Map<string, MarketDisplayEntry> {
  const map = new Map<string, MarketDisplayEntry>();
  for (const r of list) {
    const key = `${r.marketAndBetType}_${r.marketAndBetTypeParam ?? 0}`;
    const fallback = parseDisplayFallback(r.display ?? "");
    const line = r.line != null ? String(r.line) : fallback.line;
    const market = r.market != null ? String(r.market) : fallback.market;
    const cardLabel = r.descriptionShort ?? r.market ?? market;
    map.set(key, {
      line,
      market,
      description: r.description ?? null,
      descriptionShort: cardLabel ?? null,
    });
  }
  return map;
}

/** bets 배열에서 마켓 (type, param) 유니크 목록 추출 — 배치 요청용 */
export function collectUniqueMarketPairs(bets: Array<{
  market_and_bet_type?: number;
  market_and_bet_type_param?: number;
}>): MarketDisplayBatchRequest[] {
  const seen = new Set<string>();
  const out: MarketDisplayBatchRequest[] = [];
  for (const b of bets) {
    const t = b.market_and_bet_type ?? 0;
    const p = b.market_and_bet_type_param ?? 0;
    const key = `${t}_${p}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ marketAndBetType: t, marketAndBetTypeParam: p });
    }
  }
  return out;
}
