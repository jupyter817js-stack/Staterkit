"use client";

import React from "react";
import { USER_LEVEL } from "@/shared/types/users";

// 0=본사/관리자, 1=총판, 2=매장, 10=일반회원 (SUPER_ADMIN/ADMIN=0, USER/MEMBER=10 이라 키 중복 방지)
const LEVEL_KEYS: Record<number, string> = {
  0: "levelSuperAdmin",
  1: "levelPartner",
  2: "levelStore",
  10: "levelUser",
};

/** 등급 표시용 뱃지 (0=본사/관리자, 1=총판, 2=매장, 10=일반회원) */
export default function LevelBadge({
  level,
  t,
}: {
  level: number;
  t: (key: string) => string;
}) {
  const label = LEVEL_KEYS[level] != null ? t(LEVEL_KEYS[level]) : String(level);
  const style =
    level === USER_LEVEL.SUPER_ADMIN || level === USER_LEVEL.ADMIN
      ? "bg-primary/15 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/40 shadow-sm"
      : level === USER_LEVEL.PARTNER
        ? "bg-warning/15 dark:bg-warning/20 text-warning dark:text-warning border border-warning/30 dark:border-warning/40 shadow-sm"
        : level === USER_LEVEL.STORE
          ? "bg-info/15 dark:bg-info/20 text-info dark:text-info border border-info/30 dark:border-info/40 shadow-sm"
          : "bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-white/80 border border-gray-300/50 dark:border-white/20";
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
