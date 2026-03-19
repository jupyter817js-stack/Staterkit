import React from "react";

export default function ValueBetTipCardSkeleton() {
  return (
    <div
      className="relative flex-1 min-h-0 w-full min-w-0 overflow-hidden rounded-[1.65rem]
        bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.24),transparent_34%),linear-gradient(135deg,rgba(141,102,220,0.68),rgba(118,80,202,0.72)_46%,rgba(86,56,172,0.74)_100%)]
        ring-1 ring-violet-300/[0.26] shadow-[0_14px_30px_rgba(108,78,176,0.12)]
        dark:bg-[linear-gradient(135deg,rgba(100,63,171,0.42),rgba(72,39,129,0.38)_48%,rgba(38,21,73,0.52))]
        dark:ring-white/[0.16] dark:shadow-none animate-pulse"
    >
      <div className="absolute inset-[1px] rounded-[calc(1.65rem-1px)] border border-white/[0.16] dark:border-white/[0.09]" aria-hidden />

      <div className="relative flex h-full min-h-[308px] flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <span className="h-10 w-48 shrink-0 rounded-full bg-white/10" />
          <div className="flex flex-col items-end gap-1">
            <span className="h-5 w-24 rounded bg-white/10" />
            <span className="h-[3px] w-20 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <span className="block h-7 w-full rounded bg-white/10" />
            <span className="block h-6 w-32 rounded bg-white/10" />
          </div>

          <div className="h-px w-full bg-white/10" />

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <span className="block h-5 w-full rounded bg-white/10" />
            <span className="block h-11 w-24 rounded bg-white/10" />
          </div>
        </div>

        <div className="grid min-h-[4.95rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[1.2rem] border border-white/[0.18] bg-violet-950/[0.10] px-3 py-[2px] dark:bg-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-12 rounded bg-white/10" />
            <span className="h-8 w-8 rounded-xl bg-white/10" />
            <span className="h-6 w-32 rounded bg-white/10" />
          </div>
          <span className="h-[3.72rem] w-32 rounded-[0.95rem] bg-white/10 [transform:skewX(-18deg)]" />
        </div>

        <div className="mt-auto space-y-3 border-t border-white/[0.18] pt-4 dark:border-white/[0.14]">
          <span className="block h-11 rounded-xl bg-violet-950/[0.10] dark:bg-white/10" />
          <div className="grid grid-cols-2 gap-3">
            <span className="h-11 rounded-xl bg-violet-950/[0.10] dark:bg-white/10" />
            <span className="h-11 rounded-xl bg-violet-950/[0.10] dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
