import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type { CurrentUser, User, UserApiResponse } from "@/shared/types/users";
import type { SubscriptionPlanType } from "@/shared/types/subscription";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

function normalizeUser(raw: UserApiResponse | Record<string, unknown>): User {
  const r = raw as Record<string, unknown>;
  const parentIdRaw = r.parentId ?? r.parent_id;
  const parentId =
    parentIdRaw === null || parentIdRaw === undefined
      ? null
      : Number(parentIdRaw);
  const storeId = r.store_id ?? r.storeId;
  const partnerId = r.partner_id ?? r.partnerId;
  return {
    id: Number(r.id),
    email: String(r.email ?? ""),
    firstName: String(r.firstName ?? r.firstname ?? ""),
    lastName: String(r.lastName ?? r.lastname ?? ""),
    registerTime: String(r.registerTime ?? r.register_time ?? ""),
    lastLoginTime: r.lastLoginTime != null ? String(r.lastLoginTime) : r.lastlogin_time != null ? String(r.lastlogin_time) : null,
    level: Number(r.level ?? 10),
    levelName: String(r.levelName ?? r.level_name ?? ""),
    status: String(r.status ?? "ACTIVE"),
    parentId: Number.isFinite(parentId) ? parentId : null,
    nickName: String(r.nickName ?? r.nick_name ?? ""),
    storeId: storeId != null ? String(storeId) : null,
    partnerId: partnerId != null ? String(partnerId) : null,
  };
}

function normalizeCurrentUser(raw: Record<string, unknown>): CurrentUser {
  const planRaw = raw.subscription_plan ?? raw.subscriptionPlan;
  const subscription_plan =
    planRaw === "STANDARD" || planRaw === "PRO" ? (planRaw as SubscriptionPlanType) : null;
  const managedPartner = raw.managed_partner_id ?? raw.managedPartnerId;
  const managedStore = raw.managed_store_id ?? raw.managedStoreId;
  const registerTime = raw.registerTime ?? raw.register_time;
  const lastLoginTime = raw.lastLoginTime ?? raw.lastlogin_time;
  const subscription_start_at = raw.subscription_start_at ?? raw.subscriptionStartAt;
  const subscription_end_at = raw.subscription_end_at ?? raw.subscriptionEndAt;
  return {
    id: Number(raw.id),
    email: String(raw.email ?? ""),
    firstname: raw.firstname != null ? String(raw.firstname) : raw.firstName != null ? String(raw.firstName) : undefined,
    lastname: raw.lastname != null ? String(raw.lastname) : raw.lastName != null ? String(raw.lastName) : undefined,
    level: Number(raw.level ?? 10),
    subscription_plan: subscription_plan ?? null,
    subscription_start_at: subscription_start_at != null ? String(subscription_start_at) : null,
    subscription_end_at: subscription_end_at != null ? String(subscription_end_at) : null,
    managed_partner_id: managedPartner != null ? String(managedPartner) : null,
    managed_store_id: managedStore != null ? String(managedStore) : null,
    registerTime: registerTime != null ? String(registerTime) : null,
    lastLoginTime: lastLoginTime != null ? String(lastLoginTime) : null,
  };
}

/** 현재 로그인 유저 조회 (권한 체크용). auth/me 응답에 subscription_plan 포함 시 구독 상태 반영 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/auth/me`, {
      method: "GET",
      headers: authHeaders(),
      redirectOnError: false,
      redirectOnUnauthorized: false,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return normalizeCurrentUser(data);
  } catch {
    return null;
  }
}

/** 유저 목록 조회 (관리자: 전체, 총판: partner_id 기준, 매장: store_id 기준) */
export async function listUsers(params?: {
  page?: number;
  per_page?: number;
  partner_id?: string;
  store_id?: string;
}): Promise<{ users: User[]; total?: number }> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.per_page != null) search.set("per_page", String(params.per_page));
  if (params?.partner_id) search.set("partner_id", params.partner_id);
  if (params?.store_id) search.set("store_id", params.store_id);
  const qs = search.toString();

  const url = `${API_BASE}/api/v1/users${qs ? `?${qs}` : ""}`;
  const res = await fetchWithErrorHandling(url, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "유저 목록 조회 실패");
  }
  const data = await res.json();
  const rawUsers = Array.isArray(data.users) ? data.users : [];
  return {
    users: rawUsers.map(normalizeUser),
    total: data.total,
  };
}

/** 유저 수정 (level, status, firstName, lastName, nickName, parentId 등) */
export async function updateUser(
  id: number,
  payload: Partial<Pick<User, "level" | "status" | "firstName" | "lastName" | "nickName" | "parentId">>,
): Promise<User> {
  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/users/${id}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "유저 수정 실패");
  }
  const data = await res.json();
  const raw = (data.user ?? data.data ?? data) as UserApiResponse | Record<string, unknown>;
  return normalizeUser(raw);
}
