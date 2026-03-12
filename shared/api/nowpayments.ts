import { getAuthHeader, getAuthToken } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type {
  NowPaymentsPaymentResponse,
  CreateSubscriptionResponse,
} from "@/shared/types/nowpayments";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

/** 결제/구독 API는 Bearer 토큰 필수. 없으면 명확한 에러 */
function ensureAuth(): void {
  if (!getAuthToken()) {
    throw new Error("로그인이 필요합니다. 로그인 후 다시 시도해 주세요.");
  }
}

/** 백엔드 에러 응답에서 메시지 추출 (error / message / 중첩 JSON 문자열 지원) */
function getErrorMessage(data: unknown, fallback: string): string {
  if (data == null || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  const raw = d.error ?? d.message;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const msg = parsed.message ?? parsed.error;
      if (typeof msg === "string") return msg;
    } catch {
      return raw;
    }
    return raw;
  }
  if (typeof raw === "object" && raw !== null && "message" in (raw as object)) {
    const msg = (raw as Record<string, unknown>).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

export interface CreatePaymentParams {
  price_amount: number;
  price_currency?: string;
  pay_currency?: string;
  order_id?: string;
  order_description?: string;
}

/**
 * 결제 링크 생성. 백엔드 API 호출 → 백엔드가 NOWPayments 연동.
 */
export async function createPayment(
  params: CreatePaymentParams
): Promise<NowPaymentsPaymentResponse> {
  if (!API_BASE) throw new Error("API URL not configured");
  ensureAuth();
  const url = `${API_BASE}/api/v1/payments/create`;
  const res = await fetchWithErrorHandling(url, {
    method: "POST",
    redirectOnError: false,
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      price_amount: params.price_amount,
      price_currency: params.price_currency ?? "usd",
      pay_currency: params.pay_currency,
      order_id: params.order_id,
      order_description: params.order_description,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "결제 생성에 실패했습니다."));
  return data as NowPaymentsPaymentResponse;
}

/**
 * 구독 생성. 백엔드 API 호출 → 백엔드가 NOWPayments 구독 생성.
 * 응답에 pay_url / payment_url / invoice_url 이 있으면 프론트에서 새 탭으로 결제 페이지를 연다.
 */
export async function createSubscription(params: {
  plan: "STANDARD" | "PRO";
  email: string;
}): Promise<CreateSubscriptionResponse> {
  if (!API_BASE) throw new Error("API URL not configured");
  ensureAuth();
  const url = `${API_BASE}/api/v1/subscriptions/create`;
  const res = await fetchWithErrorHandling(url, {
    method: "POST",
    redirectOnError: false,
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      Plan: params.plan,
      Email: params.email,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "구독 생성에 실패했습니다."));
  return data as CreateSubscriptionResponse;
}

/** createSubscription 응답에서 결제 페이지 URL 추출 (subscription_link 등 여러 필드명 지원) */
export function getSubscriptionPaymentUrl(res: CreateSubscriptionResponse): string | null {
  const url =
    res.subscription_link ??
    res.pay_url ??
    res.payment_url ??
    res.invoice_url ??
    res.payment_link ??
    res.invoice_link ??
    res.link ??
    res.url;
  if (typeof url === "string" && url.startsWith("http")) return url;
  return null;
}
