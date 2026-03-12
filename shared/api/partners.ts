import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type { Partner } from "@/shared/types/partner-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

/** 백엔드 snake_case 응답을 프론트 camelCase 타입으로 정규화 */
function normalizePartner(raw: Record<string, unknown>): Partner {
  const id = raw.id ?? raw.Id;
  const rate = raw.commissionRatePercent ?? raw.commission_rate_percent ?? raw.commission_rate;
  const network = raw.walletNetwork ?? raw.wallet_network;
  const address = raw.walletAddress ?? raw.wallet_address;
  const createdAt = raw.createdAt ?? raw.created_at;
  const managerUserIdRaw = raw.managerUserId ?? raw.manager_user_id ?? raw.user_id ?? raw.userId;
  const managerUserId = managerUserIdRaw != null && managerUserIdRaw !== "" ? Number(managerUserIdRaw) : null;
  const nickName = raw.nickName ?? raw.nick_name;
  return {
    id: String(id ?? ""),
    nickName: nickName != null && nickName !== "" ? String(nickName) : null,
    commissionRatePercent: Number(rate) || 0,
    walletNetwork: String(network ?? ""),
    walletAddress: String(address ?? ""),
    ...(createdAt != null && { createdAt: String(createdAt) }),
    ...(managerUserId != null && Number.isFinite(managerUserId) && { managerUserId }),
  };
}

export async function listPartners(): Promise<Partner[]> {
  if (!API_BASE) return [];
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/partners`, {
    method: "GET",
    headers: authHeaders(),
    redirectOnError: false,
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list = Array.isArray(data.partners) ? data.partners : Array.isArray(data) ? data : [];
  return list.map((p: Record<string, unknown>) => normalizePartner(p));
}

/** 총판 단건 조회 (총판/매장 계정에서 본인 총판 표시명 조회용) */
export async function getPartner(partnerId: string): Promise<Partner | null> {
  if (!API_BASE) return null;
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/partners/${encodeURIComponent(partnerId)}`, {
    method: "GET",
    headers: authHeaders(),
    redirectOnError: false,
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data.partner ?? data;
  if (typeof raw !== "object" || raw === null) return null;
  return normalizePartner(raw);
}

/** 총판 등록 시 회원가입(level=1) + 파트너 레코드 생성. nickName은 화면 표시용. id 미입력 시 백엔드가 생성한 id로 응답 */
export async function createPartner(params: {
  id?: string;
  nickName?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  commissionRatePercent: number;
  walletNetwork: string;
  walletAddress: string;
}): Promise<Partner> {
  if (!API_BASE) throw new Error("API URL not configured");
  const { id, ...rest } = params;
  const body = id != null && id.trim() !== "" ? { ...rest, id: id.trim() } : rest;
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/partners`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    redirectOnError: false,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.message ?? data.error) || "총판 생성 실패");
  const raw = data.partner ?? data;
  return normalizePartner(typeof raw === "object" && raw !== null ? raw : { id: raw?.id ?? "" });
}

/** 총판 수정 (nickName, 수익률, 지갑 등) */
export async function updatePartner(
  id: string,
  payload: Partial<Pick<Partner, "nickName" | "commissionRatePercent" | "walletNetwork" | "walletAddress">>,
): Promise<Partner> {
  if (!API_BASE) throw new Error("API URL not configured");
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/partners/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    redirectOnError: false,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.message ?? data.error) || "총판 수정 실패");
  const raw = data.partner ?? data;
  const normalized = normalizePartner(typeof raw === "object" && raw !== null ? raw : { id });
  // 백엔드가 PATCH 응답에 일부 필드를 누락할 수 있으므로, 보낸 payload로 보강해 UI가 즉시 반영되도록 함
  return { ...normalized, ...payload } as Partner;
}

/** 총판 삭제 */
export async function deletePartner(id: string): Promise<void> {
  if (!API_BASE) throw new Error("API URL not configured");
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/partners/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
    redirectOnError: false,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data.message ?? data.error) || "총판 삭제 실패");
  }
}

export function getPartnerJoinLink(partnerId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/join?p=${encodeURIComponent(partnerId)}`;
}
