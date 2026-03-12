import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type {
  SureBetsSearchParams,
  SureBetsSearchResponse,
} from "@/shared/types/surebets";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

export async function searchSureBets(
  params: SureBetsSearchParams = {},
): Promise<SureBetsSearchResponse> {
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

  const url = `${API_BASE}/api/v1/surebets/search`;
  const res = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body: body.toString(),
  });
  const raw = (await res.json()) as Record<string, unknown>;
  // 응답이 { data: { bets, arbs } } 또는 source 안에 있을 수 있음 → 항상 최상위 bets, arbs 로 정규화
  const dataObj = raw.data as { bets?: unknown[]; arbs?: unknown[] } | undefined;
  const sourceObj = raw.source as { bets?: unknown[]; arbs?: unknown[] } | undefined;
  const bets = (raw.bets ?? dataObj?.bets ?? sourceObj?.bets ?? []) as SureBetsSearchResponse["bets"];
  const arbs = (raw.arbs ?? dataObj?.arbs ?? sourceObj?.arbs ?? []) as SureBetsSearchResponse["arbs"];
  return { ...raw, bets, arbs } as SureBetsSearchResponse;
}
