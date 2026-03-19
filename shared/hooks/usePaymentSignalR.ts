"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { getAuthToken } from "@/shared/api/auth";
import { getSubscriptionUpdatedEventName } from "@/shared/hooks/useRefreshUserOnSubscriptionUpdate";
import {
  CRYPTO_INVOICE_ID_KEY,
  SUBSCRIPTION_PAYMENT_PENDING_KEY,
} from "@/shared/constants/subscription-payment";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const HUB_URL = `${API_BASE}/api/hubs/payment`;

export type SignalRConnectionState =
  | "Disconnected"
  | "Connecting"
  | "Connected"
  | "Reconnecting";

export interface PaymentRealtimePayload {
  event?: string;
  userId?: number;
  plan?: string;
  expireDate?: string;
  invoiceId?: number;
  network?: string;
  txHash?: string;
  amount?: number;
  raw?: Record<string, unknown>;
}

export type PaymentConfirmedPayload = PaymentRealtimePayload;
export type PaymentDetectedPayload = PaymentRealtimePayload;
export type InvoiceExpiredPayload = PaymentRealtimePayload;

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}

function normalizeRealtimePayload(data: unknown): PaymentRealtimePayload {
  if (!data || typeof data !== "object") {
    return {};
  }

  const raw = data as Record<string, unknown>;

  return {
    event: toOptionalString(raw.event),
    userId: toOptionalNumber(raw.userId ?? raw.user_id),
    plan: toOptionalString(raw.plan),
    expireDate: toOptionalString(raw.expireDate ?? raw.expire_date),
    invoiceId: toOptionalNumber(raw.invoiceId ?? raw.invoice_id),
    network: toOptionalString(raw.network),
    txHash: toOptionalString(raw.txHash ?? raw.tx_hash),
    amount: toOptionalNumber(raw.amount),
    raw,
  };
}

function isIgnorableStartupError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("stopped during negotiation") ||
    message.includes("abort") ||
    message.includes("cancel")
  );
}

function clearPendingInvoiceState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SUBSCRIPTION_PAYMENT_PENDING_KEY);
  sessionStorage.removeItem(CRYPTO_INVOICE_ID_KEY);
}

export function usePaymentSignalR(options?: {
  onPaymentDetected?: (data: PaymentDetectedPayload) => void;
  onPaymentConfirmed?: (data: PaymentConfirmedPayload) => void;
  onSubscriptionUpdated?: (data: PaymentRealtimePayload) => void;
  onInvoiceExpired?: (data: InvoiceExpiredPayload) => void;
  onToast?: (message: string) => void;
}) {
  const [connectionState, setConnectionState] =
    useState<SignalRConnectionState>("Disconnected");
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handlePaymentDetected = useCallback((data: unknown) => {
    const payload = normalizeRealtimePayload(data);
    optionsRef.current?.onToast?.("Payment detected. Waiting for confirmation.");
    optionsRef.current?.onPaymentDetected?.(payload);
  }, []);

  const handlePaymentConfirmed = useCallback((data: PaymentConfirmedPayload) => {
    const payload = normalizeRealtimePayload(data);
    clearPendingInvoiceState();
    window.dispatchEvent(new CustomEvent(getSubscriptionUpdatedEventName()));
    optionsRef.current?.onToast?.("Payment confirmed. Your subscription is now active.");
    optionsRef.current?.onPaymentConfirmed?.(payload);
  }, []);

  const handleSubscriptionUpdated = useCallback((data: unknown) => {
    const payload = normalizeRealtimePayload(data);
    window.dispatchEvent(new CustomEvent(getSubscriptionUpdatedEventName()));
    optionsRef.current?.onToast?.("Subscription updated.");
    optionsRef.current?.onSubscriptionUpdated?.(payload);
  }, []);

  const handleInvoiceExpired = useCallback((data: unknown) => {
    const payload = normalizeRealtimePayload(data);
    clearPendingInvoiceState();
    optionsRef.current?.onToast?.("Invoice expired. Please create a new payment request.");
    optionsRef.current?.onInvoiceExpired?.(payload);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !API_BASE) return;

    const token = getAuthToken();
    if (!token) return;
    let isActive = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => Promise.resolve(getAuthToken() ?? token),
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on("PaymentDetected", handlePaymentDetected);
    connection.on("PaymentConfirmed", handlePaymentConfirmed);
    connection.on("SubscriptionUpdated", handleSubscriptionUpdated);
    connection.on("InvoiceExpired", handleInvoiceExpired);

    connection.onreconnecting(() => {
      if (isActive) setConnectionState("Reconnecting");
    });
    connection.onreconnected(() => {
      if (isActive) setConnectionState("Connected");
    });
    connection.onclose(() => {
      if (isActive) setConnectionState("Disconnected");
    });

    if (isActive) setConnectionState("Connecting");

    const startPromise = connection
      .start()
      .then(async () => {
        if (!isActive) {
          await connection.stop().catch(() => undefined);
          return;
        }
        setConnectionState("Connected");
      })
      .catch((error) => {
        if (!isActive || isIgnorableStartupError(error)) return;
        setConnectionState("Disconnected");
      });

    return () => {
      isActive = false;
      connection.off("PaymentDetected", handlePaymentDetected);
      connection.off("PaymentConfirmed", handlePaymentConfirmed);
      connection.off("SubscriptionUpdated", handleSubscriptionUpdated);
      connection.off("InvoiceExpired", handleInvoiceExpired);
      void startPromise.finally(async () => {
        if (connection.state !== signalR.HubConnectionState.Disconnected) {
          await connection.stop().catch(() => undefined);
        }
        if (connectionRef.current === connection) {
          connectionRef.current = null;
        }
      });
    };
  }, [
    handleInvoiceExpired,
    handlePaymentConfirmed,
    handlePaymentDetected,
    handleSubscriptionUpdated,
  ]);

  return { connectionState, connection: connectionRef.current };
}
