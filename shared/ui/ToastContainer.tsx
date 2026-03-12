"use client";

import React from "react";
import Toast, { type ToastItem } from "./Toast";

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[1090] flex flex-col gap-2 max-w-[22rem] pointer-events-none"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {toasts.map((item) => (
          <Toast key={item.id} item={item} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
}
