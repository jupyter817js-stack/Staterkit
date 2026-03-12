import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type { BookmakerResponse } from "@/shared/types/surebets";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

/** GET /api/v1/bookmakers → [{ id, bookmakersName }] */
export async function getBookmakers(): Promise<BookmakerResponse[]> {
  if (!API_BASE) return [];
  try {
    const url = `${API_BASE}/api/v1/bookmakers`;
    const res = await fetchWithErrorHandling(url, {
      method: "GET",
      headers: authHeaders(),
      redirectOnError: false,
    });
    if (!res.ok) return [];
    const data: BookmakerResponse[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** 단건 조회 결과 메모리 캐시 — 주기 검색 시 동일 id 반복 요청 방지 */
const bookmakerNameCache = new Map<number, string>();

/** GET api/v1/bookmakers/{id} → { id, bookmakersName }. 동일 id는 캐시 사용 */
export async function getBookmakerName(
  id: number,
  fallback: string = "부키",
): Promise<string> {
  if (!API_BASE) return fallback;
  const cached = bookmakerNameCache.get(id);
  if (cached !== undefined) return cached;
  try {
    const url = `${API_BASE}/api/v1/bookmakers/${id}`;
    const res = await fetchWithErrorHandling(url, {
      method: "GET",
      headers: authHeaders(),
      redirectOnError: false,
    });
    if (!res.ok) return fallback;
    const data: BookmakerResponse = await res.json();
    const name = data?.bookmakersName ?? fallback;
    bookmakerNameCache.set(id, name);
    return name;
  } catch {
    return fallback;
  }
}
