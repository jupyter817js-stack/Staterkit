"use client";

import React, { useEffect, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
  duration?: number;
}

const TYPE_STYLES: Record<ToastType, { alert: string; icon: string }> = {
  success: {
    alert: "alert-solid-success border-0",
    icon: "ri-checkbox-circle-fill text-white",
  },
  error: {
    alert: "alert-solid-danger border-0",
    icon: "ri-error-warning-fill text-white",
  },
  warning: {
    alert: "alert-solid-warning border-0",
    icon: "ri-alert-fill text-white",
  },
  info: {
    alert: "alert-solid-info border-0",
    icon: "ri-information-fill text-white",
  },
};

export default function Toast({ item, onDismiss, duration = 3500 }: ToastProps) {
  const dismiss = useCallback(() => onDismiss(item.id), [item.id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss]);

  const style = TYPE_STYLES[item.type];

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 py-3 px-4 rounded-md border shadow-lg ti-toast ${style.alert} animate-[slideInRight_0.3s_ease-out]`}
    >
      <i className={`${style.icon} text-[1.25rem] shrink-0`}></i>
      <span className="text-[0.8125rem] font-medium flex-1 text-white">{item.message}</span>
      <button
        type="button"
        aria-label="닫기"
        className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors text-white"
        onClick={dismiss}
      >
        <i className="ri-close-line text-[1.125rem]"></i>
      </button>
    </div>
  );
}
