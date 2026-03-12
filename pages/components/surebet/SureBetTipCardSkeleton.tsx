import React from "react";

/** 로딩 중 슈어벳 카드 스켈레톤 - 실제 카드와 동일한 레이아웃·크기에 펄스 애니메이션 */
export default function SureBetTipCardSkeleton() {
  return (
    <div
      style={{ borderRadius: "0.75rem" }}
      className="h-full min-h-0 flex flex-1 flex-col w-full min-w-0 overflow-visible
        bg-white dark:bg-white/[0.06]
        shadow-sm ring-1 ring-black/[0.06] dark:ring-white/[0.08] animate-pulse"
    >
      <div className="p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col min-h-0 rounded-[0.7rem]">
        <div className="absolute inset-0 bg-gray-200/30 dark:bg-white/[0.03]" aria-hidden />
        <div className="relative flex-1 flex flex-col min-h-0 space-y-4 pb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="h-7 w-16 rounded-full bg-gray-300 dark:bg-white/10 shrink-0" />
            <span className="h-7 w-24 rounded-lg bg-gray-300 dark:bg-white/10 max-w-[65%]" />
          </div>
          <div className="flex items-start gap-2 sm:gap-3 h-[4.5rem] shrink-0 p-2 sm:p-3">
            <div className="flex-1 flex flex-col items-center min-w-0 max-w-[42%] gap-2">
              <span className="w-12 h-12 rounded-full bg-gray-300 dark:bg-white/10 shrink-0" />
              <span className="h-3 w-14 rounded bg-gray-300 dark:bg-white/10" />
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center min-h-[3.5rem] gap-1">
              <span className="h-4 w-12 rounded bg-gray-300 dark:bg-white/10" />
              <span className="h-3 w-10 rounded bg-gray-300 dark:bg-white/10" />
            </div>
            <div className="flex-1 flex flex-col items-center min-w-0 max-w-[42%] gap-2">
              <span className="w-12 h-12 rounded-full bg-gray-300 dark:bg-white/10 shrink-0" />
              <span className="h-3 w-14 rounded bg-gray-300 dark:bg-white/10" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_2fr_1fr] items-center gap-2 min-h-[2.5rem] py-2 px-3 rounded-xl bg-white/50 dark:bg-white/5"
              >
                <span className="h-3 w-16 rounded bg-gray-300 dark:bg-white/10" />
                <span className="h-3 w-24 rounded bg-gray-300 dark:bg-white/10 justify-self-center" />
                <span className="h-4 w-10 rounded bg-gray-300 dark:bg-white/10 justify-self-end" />
              </div>
            ))}
          </div>
          <div className="min-h-[3rem] flex items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 py-2">
            <span className="h-4 w-24 rounded bg-gray-300 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
