import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = {};
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

export interface PeriodTranslationItem {
  sportId: number;
  periodIdentifier: string;
  name: string | null;
  template: string | null;
}

/** GET /api/v1/sports/period-translations — 전체 또는 sportId별 */
export async function getPeriodTranslations(
  sportId?: number,
): Promise<PeriodTranslationItem[]> {
  if (!API_BASE) return [];
  try {
    const url = sportId != null
      ? `${API_BASE}/api/v1/sports/period-translations?sportId=${sportId}`
      : `${API_BASE}/api/v1/sports/period-translations`;
    const res = await fetchWithErrorHandling(url, {
      method: "GET",
      headers: authHeaders(),
      redirectOnError: false,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** (sportId, periodIdentifier) → name 캐시. 한 번 로드한 스포츠는 재사용 */
const periodNameCache = new Map<string, string>();
let periodTranslationsLoaded: Promise<PeriodTranslationItem[]> | null = null;

/** 전체 period translations 한 번 로드 후 캐시에 채움 */
async function loadAllPeriodTranslations(): Promise<PeriodTranslationItem[]> {
  if (periodTranslationsLoaded) return periodTranslationsLoaded;
  periodTranslationsLoaded = getPeriodTranslations();
  const list = await periodTranslationsLoaded;
  for (const item of list) {
    const key = `${item.sportId}_${item.periodIdentifier}`;
    if (item.name && !periodNameCache.has(key)) {
      periodNameCache.set(key, item.name);
    }
  }
  return list;
}

/**
 * 스포츠 ID 목록에 해당하는 period만 로드해 캐시 보강 (이미 전체 로드 시 스킵)
 * 호출 후 getPeriodNameCached 사용 가능
 */
export async function ensurePeriodTranslationsForSports(
  sportIds: number[],
): Promise<void> {
  if (sportIds.length === 0) return;
  await loadAllPeriodTranslations();
  const missing = sportIds.filter((sid) => {
    return !periodNameCache.has(`${sid}_0`) && !periodNameCache.has(`${sid}_1`);
  });
  if (missing.length === 0) return;
  await Promise.all(missing.map((sportId) => getPeriodTranslations(sportId))).then(
    (arrays) => {
      for (const list of arrays) {
        for (const item of list) {
          const key = `${item.sportId}_${item.periodIdentifier}`;
          if (item.name) periodNameCache.set(key, item.name);
        }
      }
    },
  );
}

/** 캐시에서 (sportId, periodIdentifier)에 해당하는 구간명 반환 */
export function getPeriodNameCached(
  sportId: number,
  periodIdentifier: string,
): string | undefined {
  const key = `${sportId}_${periodIdentifier}`;
  return periodNameCache.get(key);
}

/**
 * 비동기: 전체/스포츠별 로드 후 구간명 반환. ensurePeriodTranslationsForSports 호출 후 사용 권장
 */
export async function getPeriodName(
  sportId: number,
  periodIdentifier: string,
): Promise<string | undefined> {
  await loadAllPeriodTranslations();
  return getPeriodNameCached(sportId, periodIdentifier);
}
