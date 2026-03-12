import React from "react";

/** 로딩 중 밸류벳 카드 스켈레톤 - 실제 카드와 동일한 레이아웃·크기에 펄스 애니메이션 */
export default function ValueBetTipCardSkeleton() {
  return (
    <div
      style={{ borderRadius: "0.75rem" }}
      className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-visible
        bg-white dark:bg-white/[0.06]
        shadow-sm ring-1 ring-black/[0.06] dark:ring-white/[0.08] animate-pulse"
    >
      <div className="p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col min-h-0 rounded-[0.7rem]">
        <div className="absolute inset-0 bg-gray-200/30 dark:bg-white/[0.03]" aria-hidden />
        <div className="relative flex-1 flex flex-col min-h-0 space-y-4 pb-[6.5rem]">
          <div className="flex items-center justify-between gap-2">
            <span className="h-7 w-16 rounded-full bg-gray-300 dark:bg-white/10 shrink-0" />
            <span className="h-7 w-24 rounded-lg bg-gray-300 dark:bg-white/10 max-w-[65%]" />
          </div>
          <div className="flex items-start gap-4 min-h-[5rem] p-4">
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
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <div className="h-3.5 w-20 rounded mx-auto bg-gray-300 dark:bg-white/10" />
            <div className="grid grid-cols-4 gap-x-1 gap-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="h-3 w-8 rounded bg-gray-300 dark:bg-white/10" />
                  <span className="h-4 w-10 rounded bg-gray-300 dark:bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
