"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePaymentSignalR } from "@/shared/hooks/usePaymentSignalR";
import type {
  PaymentRealtimePayload,
  SignalRConnectionState,
} from "@/shared/hooks/usePaymentSignalR";

export type PaymentSignalREventType =
  | "payment-detected"
  | "payment-confirmed"
  | "subscription-updated"
  | "invoice-expired";

export interface PaymentSignalREvent {
  type: PaymentSignalREventType;
  payload: PaymentRealtimePayload;
  receivedAt: number;
}

interface PaymentSignalRContextValue {
  connectionState: SignalRConnectionState;
  latestEvent: PaymentSignalREvent | null;
}

const PaymentSignalRContext = createContext<PaymentSignalRContextValue | null>(null);

export function usePaymentSignalRContext() {
  return useContext(PaymentSignalRContext);
}

interface PaymentSignalRProviderProps {
  children: React.ReactNode;
}

export default function PaymentSignalRProvider({ children }: PaymentSignalRProviderProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [latestEvent, setLatestEvent] = useState<PaymentSignalREvent | null>(null);

  const pushEvent = useCallback((type: PaymentSignalREventType, payload: PaymentRealtimePayload) => {
    setLatestEvent({
      type,
      payload,
      receivedAt: Date.now(),
    });
  }, []);

  const { connectionState } = usePaymentSignalR({
    onToast: (msg) => setToastMessage(msg),
    onPaymentDetected: (payload) => pushEvent("payment-detected", payload),
    onPaymentConfirmed: (payload) => pushEvent("payment-confirmed", payload),
    onSubscriptionUpdated: (payload) => pushEvent("subscription-updated", payload),
    onInvoiceExpired: (payload) => pushEvent("invoice-expired", payload),
  });

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const value = useMemo(
    () => ({ connectionState, latestEvent }),
    [connectionState, latestEvent],
  );

  return (
    <PaymentSignalRContext.Provider value={value}>
      {children}
      {toastMessage ? (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-[9999] max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-lg border border-primary/30 bg-primary px-4 py-3 text-center text-[0.875rem] font-medium text-white shadow-lg animate-in fade-in duration-200"
        >
          {toastMessage}
        </div>
      ) : null}
    </PaymentSignalRContext.Provider>
  );
}
