import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type {
  PaymentHistoryItem,
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

/** tb_user 기준 my-history 항목 정규화. payment_amount는 항상 null */
function normalizeMyHistoryItem(raw: Record<string, unknown>): PaymentHistoryItem {
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
    status: String(raw.status ?? "active").toLowerCase() === "expired" ? "expired" : "active",
  };
}

/**
 * 내 결제·구독 이력 (GET /api/v1/payments/my-history).
 * tb_user 1건 기준이므로 구독 있으면 items 길이 1·total 1, 없으면 items: []·total: 0.
 * per_page / page는 실질적으로 무시해도 됨.
 */
export async function getMyPaymentHistory(
  params: MyPaymentHistoryParams = {}
): Promise<PaymentHistoryResponse> {
  if (!API_BASE) return { items: [], total: 0 };
  const q = new URLSearchParams();
  if (params.per_page != null) q.set("per_page", String(params.per_page));
  if (params.page != null) q.set("page", String(params.page));
  const qs = q.toString();

  try {
    const res = await fetchWithErrorHandling(
      `${API_BASE}/api/v1/payments/my-history${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        headers: authHeaders(),
        redirectOnError: false,
      }
    );
    if (!res.ok) return { items: [], total: 0 };
    const data = (await res.json()) as { items?: unknown[]; data?: unknown[]; total?: number };
    const list = Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];
    return {
      items: list.map((r) => normalizeMyHistoryItem(r as Record<string, unknown>)),
      total: typeof data.total === "number" ? data.total : list.length,
    };
  } catch {
    return { items: [], total: 0 };
  }
}
