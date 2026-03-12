import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type { Store } from "@/shared/types/partner-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

/** 백엔드 snake_case 응답을 프론트 camelCase 타입으로 정규화 */
function normalizeStore(raw: Record<string, unknown>): Store {
  const id = raw.id ?? raw.Id;
  const partnerIdRaw = raw.partnerId ?? raw.partner_id;
  const partnerId = partnerIdRaw == null || partnerIdRaw === "" ? null : String(partnerIdRaw);
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
    partnerId,
    commissionRatePercent: Number(rate) || 0,
    walletNetwork: String(network ?? ""),
    walletAddress: String(address ?? ""),
    ...(createdAt != null && { createdAt: String(createdAt) }),
    ...(managerUserId != null && Number.isFinite(managerUserId) && { managerUserId }),
  };
}

/** 매장 목록 (총판: 내 매장만 / 관리자: 전체). 매장관리자 계정은 호출하지 않음(403) → getStore(managed_store_id) 사용 */
export async function listStores(partnerId?: string): Promise<Store[]> {
  if (!API_BASE) return [];
  const qs = partnerId ? `?partner_id=${encodeURIComponent(partnerId)}` : "";
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/stores${qs}`, {
    method: "GET",
    headers: authHeaders(),
    redirectOnError: false,
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list = Array.isArray(data.stores) ? data.stores : Array.isArray(data) ? data : [];
  return list.map((s: Record<string, unknown>) => normalizeStore(s));
}

/** 매장 단건 조회 (매장관리자 계정에서 본인 매장 표시명 조회용) */
export async function getStore(storeId: string): Promise<Store | null> {
  if (!API_BASE) return null;
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/stores/${encodeURIComponent(storeId)}`, {
    method: "GET",
    headers: authHeaders(),
    redirectOnError: false,
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data.store ?? data;
  if (typeof raw !== "object" || raw === null) return null;
  return normalizeStore(raw);
}

/** 매장 등록. nickName은 화면 표시용. partnerId 없으면 본사 직속 매장. id 미입력 시 백엔드가 생성한 id로 응답 */
export async function createStore(params: {
  id?: string;
  nickName?: string | null;
  partnerId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  commissionRatePercent: number;
  walletNetwork: string;
  walletAddress: string;
}): Promise<Store> {
  if (!API_BASE) throw new Error("API URL not configured");
  const { id, ...rest } = params;
  const body = id != null && id.trim() !== "" ? { ...rest, partnerId: params.partnerId ?? null, id: id.trim() } : { ...rest, partnerId: params.partnerId ?? null };
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/stores`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    redirectOnError: false,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.message ?? data.error) || "매장 생성 실패");
  const raw = data.store ?? data;
  return normalizeStore(typeof raw === "object" && raw !== null ? raw : { id: raw?.id ?? "" });
}

/** 매장 수정 (nickName, 수익률, 지갑 등) */
export async function updateStore(
  id: string,
  payload: Partial<Pick<Store, "nickName" | "commissionRatePercent" | "walletNetwork" | "walletAddress">>,
): Promise<Store> {
  if (!API_BASE) throw new Error("API URL not configured");
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/stores/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    redirectOnError: false,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.message ?? data.error) || "매장 수정 실패");
  const raw = data.store ?? data;
  const normalized = normalizeStore(typeof raw === "object" && raw !== null ? raw : { id });
  // 백엔드가 PATCH 응답에 일부 필드를 누락할 수 있으므로, 보낸 payload로 보강해 UI가 즉시 반영되도록 함
  return { ...normalized, ...payload } as Store;
}

/** 매장 삭제 */
export async function deleteStore(id: string): Promise<void> {
  if (!API_BASE) throw new Error("API URL not configured");
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/stores/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
    redirectOnError: false,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data.message ?? data.error) || "매장 삭제 실패");
  }
}

/** 매장 전용 가입 링크 */
export function getStoreJoinLink(storeId: string): string {
  if (typeof window === "undefined") return "";
  const base = window.location.origin;
  return `${base}/join?s=${encodeURIComponent(storeId)}`;
}
