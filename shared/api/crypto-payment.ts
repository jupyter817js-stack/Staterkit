import { getAuthHeader, getAuthToken } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type {
  CreateSubscriptionParams,
  CreateSubscriptionResponse,
  SubscriptionPlan,
} from "@/shared/types/crypto-payment";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  } | null;
  message?: string;
};

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out: Record<string, string> = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

function ensureAuth(): void {
  if (!getAuthToken()) {
    throw new Error("Login is required.");
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data == null || typeof data !== "object") return fallback;
  const raw = data as Record<string, unknown>;

  const nestedError = raw.error;
  if (nestedError && typeof nestedError === "object") {
    const nestedMessage = (nestedError as Record<string, unknown>).message;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  const directMessage = raw.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  return fallback;
}

function unwrapApiEnvelope<T>(data: unknown, fallback: string): T {
  if (data && typeof data === "object" && ("success" in data || "data" in data || "error" in data)) {
    const envelope = data as ApiEnvelope<T>;
    if (envelope.success === false) {
      throw new Error(getErrorMessage(data, fallback));
    }
    return (envelope.data ?? (data as T)) as T;
  }

  return data as T;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (value == null) return null;
  return String(value);
}

function normalizePlan(raw: unknown): SubscriptionPlan {
  const item = (raw ?? {}) as Record<string, unknown>;
  const id = toNumber(item.id) ?? 0;
  const rawName = item.name ?? item.planName ?? item.plan_name ?? item.planType ?? item.plan_type;
  const name = toStringOrNull(rawName) ?? `Plan ${id}`;
  const planType = toStringOrNull(item.planType ?? item.plan_type ?? rawName)?.toUpperCase() ?? undefined;
  const priceUsd = toNumber(item.priceUsd ?? item.price_usd ?? item.priceAmount ?? item.price_amount);
  const priceCurrency = toStringOrNull(item.priceCurrency ?? item.price_currency ?? "USD");
  const durationDays = toNumber(item.durationDays ?? item.duration_days);

  return {
    ...item,
    id,
    name,
    planType,
    priceAmount: priceUsd,
    priceUsd,
    priceCurrency,
    durationDays,
    description: toStringOrNull(item.description),
  };
}

function normalizeCreateSubscriptionResponse(raw: unknown): CreateSubscriptionResponse {
  const item = (raw ?? {}) as Record<string, unknown>;
  const invoiceId = toNumber(item.invoiceId ?? item.invoice_id);

  return {
    ...item,
    subscriptionId: toNumber(item.subscriptionId ?? item.subscription_id),
    invoiceId,
    address: toStringOrNull(item.address ?? item.payAddress ?? item.pay_address),
    amount: toNumber(item.amount ?? item.payAmount ?? item.pay_amount),
    currency: toStringOrNull(item.currency ?? item.payCurrency ?? item.pay_currency),
    network: toStringOrNull(item.network),
    expireAt: toStringOrNull(
      item.expireAt ?? item.expire_at ?? item.expiresAt ?? item.expires_at,
    ),
    paymentUrl: null,
    raw: item,
  };
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  if (!API_BASE) throw new Error("API URL not configured");
  ensureAuth();

  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/plans`, {
    method: "GET",
    redirectOnError: false,
    headers: authHeaders(),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(json, "Failed to load plans."));

  const payload = unwrapApiEnvelope<unknown>(json, "Failed to load plans.");
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>)?.plans)
      ? ((payload as Record<string, unknown>).plans as unknown[])
      : Array.isArray((payload as Record<string, unknown>)?.items)
        ? ((payload as Record<string, unknown>).items as unknown[])
        : [];

  return items.map(normalizePlan);
}

export async function createSubscriptionInvoice(
  params: CreateSubscriptionParams,
): Promise<CreateSubscriptionResponse> {
  if (!API_BASE) throw new Error("API URL not configured");
  ensureAuth();

  const body: Record<string, unknown> = {
    planId: params.planId,
  };
  if (params.currency) body.currency = params.currency;
  if (params.network) body.network = params.network;
  if (params.userId != null) body.userId = params.userId;

  const res = await fetchWithErrorHandling(`${API_BASE}/api/v1/subscription/create`, {
    method: "POST",
    redirectOnError: false,
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(getErrorMessage(json, "Failed to create subscription invoice."));
  }

  const payload = unwrapApiEnvelope<unknown>(json, "Failed to create subscription invoice.");
  return normalizeCreateSubscriptionResponse(payload);
}

export function getInvoiceId(res: CreateSubscriptionResponse): number | null {
  return res.invoiceId ?? null;
}
