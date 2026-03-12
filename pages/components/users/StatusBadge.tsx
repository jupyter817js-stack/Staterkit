"use client";

import React from "react";

/** 상태 표시용 뱃지 (LevelBadge와 동일한 스타일) - Active / Suspended */
export default function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  const isActive = status === "ACTIVE" || status === "active";
  const label = isActive ? t("active") : t("suspended");
  const style = isActive
    ? "bg-primary/15 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/40 shadow-sm"
    : "bg-danger/15 dark:bg-danger/20 text-danger dark:text-danger border border-danger/30 dark:border-danger/40 shadow-sm";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[0.75rem] sm:text-[0.8125rem] font-semibold min-w-[4.5rem] ${style}`}
      role="status"
      aria-label={label}
    >
      {label}
    </span>
  );
}
