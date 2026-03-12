import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type {
  PaymentHistoryItem,
  PaymentHistoryParams,
  PaymentHistoryResponse,
  MyPaymentHistoryParams,
} from "@/shared/types/payment-history";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

function toId(v: unknown): string | number {
  if (typeof v === "number" || typeof v === "string") return v;
  return v != null ? String(v) : "";
}

/** tb_user 기준 응답 정규화. payment_amount는 tb_user에 없으므로 null 허용 */
function normalizeItem(raw: Record<string, unknown>): PaymentHistoryItem {
  const amount = raw.payment_amount ?? raw.paymentAmount ?? raw.amount;
  const paymentAmount: string | number | null =
    amount == null ? null : typeof amount === "number" ? amount : Number(amount) || null;
  return {
    id: toId(raw.id ?? raw.payment_id ?? ""),
    email: String(raw.email ?? ""),
    plan: String(raw.plan ?? raw.subscription_plan ?? "").trim() || "—",
    paymentAmount: paymentAmount ?? null,
    paymentDate: String(raw.payment_date ?? raw.paymentDate ?? raw.subscription_start_at ?? raw.created_at ?? "").trim() || null,
    expiryDate: String(raw.expiry_date ?? raw.expiryDate ?? raw.subscription_end_at ?? "").trim() || null,
    status: String(raw.status ?? "").toLowerCase() === "expired" ? "expired" : "active",
  };
}

/**
 * 결제 이력 목록 조회.
 * 백엔드 GET /api/v1/payments/history 미구현 시 빈 배열 반환.
 */
export async function listPaymentHistory(
  params: PaymentHistoryParams = {}
): Promise<PaymentHistoryResponse> {
  if (!API_BASE) return { items: [] };
  const q = new URLSearchParams();
  if (params.email?.trim()) q.set("email", params.email.trim());
  if (params.date_from) q.set("date_from", params.date_from);
  if (params.date_to) q.set("date_to", params.date_to);
  if (params.plan) q.set("plan", params.plan);
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  if (params.page != null) q.set("page", String(params.page));
  const qs = q.toString();

  try {
    const res = await fetchWithErrorHandling(
      `${API_BASE}/api/v1/payments/history${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        headers: authHeaders(),
        redirectOnError: false,
      }
    );
    if (!res.ok) return { items: [] };
    const data = (await res.json()) as { items?: unknown[]; data?: unknown[]; total?: number };
    const list = Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];
    return {
      items: list.map((r) => normalizeItem(r as Record<string, unknown>)),
      total: typeof data.total === "number" ? data.total : undefined,
    };
  } catch {
    return { items: [] };
  }
}
