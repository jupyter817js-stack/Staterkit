import React from "react";

export default function SureBetTipCardSkeleton() {
  return (
    <div
      className="h-full w-full overflow-hidden rounded-[1.65rem]
        bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.28),transparent_34%),linear-gradient(135deg,rgba(141,102,220,0.72),rgba(118,80,202,0.74)_46%,rgba(86,56,172,0.76)_100%)]
        dark:bg-[radial-gradient(circle_at_22%_0%,rgba(255,255,255,0.10),transparent_34%),linear-gradient(135deg,rgba(83,55,142,0.34),rgba(58,34,103,0.32)_48%,rgba(30,19,60,0.46))]
        ring-1 ring-violet-300/[0.30] dark:ring-white/[0.16] animate-pulse"
    >
      <div className="relative flex h-full min-h-[368px] flex-col gap-3 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <span className="h-10 w-40 shrink-0 rounded-full bg-white/20" />
          <div className="flex flex-col items-end gap-1">
            <span className="h-5 w-20 rounded bg-white/20" />
            <span className="h-1 w-16 rounded-full bg-white/20" />
          </div>
        </div>

        <div className="mt-2.5 space-y-2.5">
          <div className="flex items-center justify-between gap-4">
            <span className="h-7 w-48 rounded bg-white/20" />
            <span className="h-5 w-16 rounded bg-white/20" />
          </div>
          <div className="h-2 w-full" />
          <div className="flex items-center justify-between gap-4">
            <span className="h-4 w-24 rounded bg-white/20" />
            <span className="h-10 w-16 rounded bg-white/20" />
          </div>
        </div>

        <div className="mt-1.5 space-y-2.5 rounded-[1.2rem] border border-white/[0.24] bg-violet-950/[0.10] px-3.5 py-3 dark:bg-white/[0.07]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-20 rounded bg-white/20" />
              <span className="h-3.5 w-px rounded-full bg-white/20" />
              <span className="h-4 w-24 rounded bg-white/20" />
            </div>
            <span className="h-4 w-4 rounded-full bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="h-4 w-16 rounded bg-white/20" />
              <span className="h-3.5 w-px rounded-full bg-white/20" />
              <span className="h-4 w-24 rounded bg-white/20" />
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <div className="flex justify-end">
              <span className="h-8 w-16 rounded bg-white/20" />
            </div>
            <span className="h-7 w-px rounded-full bg-white/20" />
            <div className="flex justify-end">
              <span className="h-8 w-16 rounded bg-white/20" />
            </div>
          </div>
        </div>

        <div className="flex justify-center border-t border-white/[0.18] pt-3 dark:border-white/[0.14]">
          <div className="inline-flex min-w-[15.5rem] items-center justify-center gap-3 rounded-full border border-white/[0.12] bg-violet-950/[0.12] px-6 py-2.5 dark:bg-black/10">
            <span className="h-4 w-24 rounded bg-white/20" />
            <span className="h-6 w-16 rounded bg-emerald-400/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
