import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface SportItem {
  id: number;
  name: string;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

/** GET /api/v1/sports → [{ id, name }] */
export async function getSports(): Promise<SportItem[]> {
  if (!API_BASE) return [];
  try {
    const url = `${API_BASE}/api/v1/sports`;
    const res = await fetchWithErrorHandling(url, {
      method: "GET",
      headers: authHeaders(),
      redirectOnError: false,
    });
    if (!res.ok) return [];
    const data: SportItem[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
