export interface SubscriptionPlan {
  id: number;
  name?: string;
  planType?: string;
  priceAmount?: number | null;
  priceUsd?: number | null;
  priceCurrency?: string | null;
  durationDays?: number | null;
  description?: string | null;
  [key: string]: unknown;
}

export interface CreateSubscriptionParams {
  planId: number;
  currency?: string;
  network?: string;
  userId?: number;
}

export interface CreateSubscriptionResponse {
  subscriptionId?: number | null;
  invoiceId?: number | null;
  address?: string | null;
  amount?: number | null;
  currency?: string | null;
  network?: string | null;
  expireAt?: string | null;
  paymentUrl?: string | null;
  raw?: Record<string, unknown>;
  [key: string]: unknown;
}
