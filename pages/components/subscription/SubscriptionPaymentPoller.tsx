"use client";

import React, { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import {
  SUBSCRIPTION_PAYMENT_PENDING_KEY,
  SUBSCRIPTION_POLL_INTERVAL_MS,
  SUBSCRIPTION_POLL_MAX_WAIT_MS,
} from "@/shared/constants/subscription-payment";
import { getSubscriptionUpdatedEventName } from "@/shared/hooks/useRefreshUserOnSubscriptionUpdate";

const TOAST_DURATION_MS = 5000;

/**
 * 결제 창 오픈 후 sessionStorage에 플래그가 있으면 getCurrentUser를 주기적으로 호출해
 * subscription_plan이 변경된 시점에 플래그 제거, 이벤트 발송, 토스트 표시.
 * ContentLayout에 한 번만 렌더링합니다.
 */
export default function SubscriptionPaymentPoller() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousUserRef = useRef<CurrentUser | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pending = sessionStorage.getItem(SUBSCRIPTION_PAYMENT_PENDING_KEY);
    if (!pending) return;

    const startedAt = startedAtRef.current || Date.now();
    startedAtRef.current = startedAt;

    const check = async () => {
      if (Date.now() - startedAt > SUBSCRIPTION_POLL_MAX_WAIT_MS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        sessionStorage.removeItem(SUBSCRIPTION_PAYMENT_PENDING_KEY);
        return;
      }

      try {
        const user = await getCurrentUser();
        const prev = previousUserRef.current;
        previousUserRef.current = user ?? null;

        const prevPlan = prev?.subscription_plan ?? null;
        const nextPlan = user?.subscription_plan ?? null;

        if (nextPlan !== prevPlan && nextPlan != null) {
          sessionStorage.removeItem(SUBSCRIPTION_PAYMENT_PENDING_KEY);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          window.dispatchEvent(new CustomEvent(getSubscriptionUpdatedEventName()));
          setToastMessage("결제가 반영되었습니다. 구독이 활성화되었습니다.");
        }
      } catch {
        // ignore
      }
    };

    getCurrentUser().then((user) => {
      previousUserRef.current = user ?? null;
      intervalRef.current = setInterval(check, SUBSCRIPTION_POLL_INTERVAL_MS);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [toastMessage]);

  if (!toastMessage) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-[min(90vw,24rem)] py-3 px-4 rounded-lg shadow-lg border border-primary/30 bg-primary text-white text-[0.875rem] font-medium text-center animate-in fade-in duration-200"
    >
      {toastMessage}
    </div>
  );
}
