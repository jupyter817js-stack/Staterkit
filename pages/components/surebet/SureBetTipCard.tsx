import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { getSportIconClass, getSportImageSrc } from "@/shared/utils/valuebet/sport-icon-utils";
import type { SureBetTipDisplay } from "@/shared/utils/surebet/surebet-utils";
import { formatProfitPercent } from "@/shared/utils/formatProfitPercent";

interface SureBetTipCardProps {
  tip: SureBetTipDisplay;
  isSelected?: boolean;
  onSelect?: () => void;
}

const lightHexPatternStyle: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(30deg, rgba(255,255,255,0.13) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.13) 87.5%, rgba(255,255,255,0.13))",
    "linear-gradient(150deg, rgba(255,255,255,0.13) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.13) 87.5%, rgba(255,255,255,0.13))",
    "linear-gradient(30deg, rgba(255,255,255,0.06) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.06) 87.5%, rgba(255,255,255,0.06))",
    "linear-gradient(150deg, rgba(255,255,255,0.06) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.06) 87.5%, rgba(255,255,255,0.06))",
    "linear-gradient(60deg, rgba(255,255,255,0.08) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.08) 75%, rgba(255,255,255,0.08))",
    "linear-gradient(60deg, rgba(255,255,255,0.04) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.04) 75%, rgba(255,255,255,0.04))",
  ].join(", "),
  backgroundSize: "20px 34px",
  backgroundPosition: "0 0, 0 0, 10px 17px, 10px 17px, 0 0, 10px 17px",
  opacity: 0.1,
};

const darkHexPatternStyle: React.CSSProperties = {
  ...lightHexPatternStyle,
  opacity: 0.18,
  mixBlendMode: "screen",
};

function getMatchTextClass(matchLabel: string): string {
  if (matchLabel.length > 58) return "text-[0.78rem]";
  if (matchLabel.length > 52) return "text-[0.86rem]";
  if (matchLabel.length > 46) return "text-[0.94rem]";
  if (matchLabel.length > 40) return "text-[1.02rem]";
  if (matchLabel.length > 34) return "text-[1.12rem]";
  if (matchLabel.length > 28) return "text-[1.24rem]";
  return "text-[1.38rem]";
}

function getMarketTextClass(text: string): string {
  if (text.length > 58) return "text-[0.6rem]";
  if (text.length > 50) return "text-[0.66rem]";
  if (text.length > 44) return "text-[0.72rem]";
  if (text.length > 38) return "text-[0.78rem]";
  if (text.length > 32) return "text-[0.84rem]";
  return "text-[0.9rem]";
}

export default function SureBetTipCard({ tip, isSelected = false, onSelect }: SureBetTipCardProps) {
  const { t } = useLanguage();
  const matchLabel = `${tip.homeName} vs ${tip.awayName}`;
  const sportImageSrc = getSportImageSrc(tip.sport);
  const leg0 = tip.legs[0];
  const leg1 = tip.legs[1];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={`group relative h-full w-full cursor-pointer overflow-hidden rounded-[1.65rem]
        backdrop-blur-[2px]
        transition-all duration-200 ease-out active:scale-[0.98]
        ${
          isSelected
            ? "shadow-[0_0_0_1px_rgba(208,168,255,0.26),0_0_24px_rgba(154,92,244,0.24),0_18px_40px_rgba(96,64,158,0.22)] dark:shadow-[0_0_0_1px_rgba(243,210,255,0.16),0_0_28px_rgba(188,108,255,0.52),0_0_58px_rgba(126,66,236,0.34),0_18px_38px_rgba(30,10,76,0.24)]"
            : "ring-1 ring-violet-300/[0.30] shadow-[0_14px_32px_rgba(108,78,176,0.14)] hover:ring-violet-300/[0.48] hover:shadow-[0_20px_38px_rgba(111,77,186,0.18)] dark:ring-white/[0.16] dark:shadow-[0_16px_34px_rgba(26,9,65,0.14)] dark:hover:ring-amber-200/[0.45] dark:hover:shadow-[0_22px_42px_rgba(31,11,72,0.24)]"
        }`}
    >
      {isSelected ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.65rem] bg-[linear-gradient(135deg,rgba(255,246,255,0.98)_0%,rgba(226,182,255,0.98)_16%,rgba(188,118,255,1)_36%,rgba(143,86,255,1)_58%,rgba(108,72,255,0.98)_76%,rgba(247,214,255,0.98)_100%)] dark:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[2px] rounded-[calc(1.65rem-2px)] bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,rgba(112,76,188,0.88),rgba(88,55,162,0.9)_46%,rgba(60,35,126,0.92)_100%)] dark:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 hidden rounded-[1.65rem] bg-[linear-gradient(135deg,rgba(255,245,255,0.98)_0%,rgba(224,174,255,0.98)_16%,rgba(188,118,255,1)_36%,rgba(143,86,255,1)_58%,rgba(108,72,255,0.98)_76%,rgba(247,214,255,0.98)_100%)] dark:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[2px] hidden rounded-[calc(1.65rem-2px)] bg-[radial-gradient(circle_at_22%_0%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(83,55,142,0.36),rgba(58,34,103,0.34)_48%,rgba(30,19,60,0.48))] dark:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -inset-[4px] rounded-[1.95rem] bg-[radial-gradient(circle_at_50%_50%,rgba(232,186,255,0.34),rgba(166,92,255,0.20)_42%,transparent_74%)] blur-[10px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[2px] rounded-[calc(1.65rem-2px)] border border-fuchsia-100/[0.34] shadow-[inset_0_0_24px_rgba(214,146,255,0.16)] dark:border-fuchsia-100/[0.34]"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.65rem] bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.28),transparent_34%),linear-gradient(135deg,rgba(141,102,220,0.72),rgba(118,80,202,0.74)_46%,rgba(86,56,172,0.76)_100%)] dark:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 hidden rounded-[1.65rem] bg-[radial-gradient(circle_at_22%_0%,rgba(255,255,255,0.10),transparent_34%),linear-gradient(135deg,rgba(83,55,142,0.34),rgba(58,34,103,0.32)_48%,rgba(30,19,60,0.46))] dark:block"
            aria-hidden
          />
        </>
      )}
      <div className="pointer-events-none absolute inset-0 dark:hidden" style={lightHexPatternStyle} aria-hidden />
      <div className="pointer-events-none absolute inset-0 hidden dark:block" style={darkHexPatternStyle} aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(255,214,95,0.08),transparent_22%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-[1px] rounded-[calc(1.65rem-1px)] border border-white/[0.16] dark:border-white/[0.09]" aria-hidden />

      <div className="relative z-10 flex h-full min-h-[368px] flex-col gap-3 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.08] px-3.5 py-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm">
              {sportImageSrc ? (
                <img
                  src={sportImageSrc}
                  alt=""
                  className="h-[2rem] w-[2rem] shrink-0 object-contain drop-shadow-[0_0_10px_rgba(255,214,110,0.24)]"
                  aria-hidden
                />
              ) : (
                <i className={`${getSportIconClass(tip.sport)} shrink-0 text-[1.45rem] text-amber-200 drop-shadow-[0_0_12px_rgba(255,214,110,0.32)]`} aria-hidden />
              )}
              <span className="shrink-0 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-white">
                {tip.sport}
              </span>
              <span className="shrink-0 text-white/40" aria-hidden>
                |
              </span>
              <span title={tip.leagueName} className="min-w-0 truncate text-[0.82rem] font-semibold text-white/[0.88]">
                {tip.leagueName}
              </span>
            </span>
          </div>
          <div className="flex min-w-fit shrink-0 items-center">
            <span
              className="relative inline-flex items-center justify-center rounded-lg border-2 border-emerald-400/90 bg-emerald-500/20 px-4 py-2 font-black uppercase tracking-[0.08em] text-emerald-300 text-[1rem] shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
              style={{ transform: "skewX(-8deg)" }}
            >
              <span style={{ transform: "skewX(8deg)" }}>{t("sureBetLabel")}</span>
            </span>
          </div>
        </div>

        <div className="mt-2.5 space-y-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <h3
              title={matchLabel}
              className={`min-w-0 overflow-hidden whitespace-nowrap font-extrabold leading-none tracking-[-0.055em] drop-shadow-[0_2px_8px_rgba(25,7,61,0.22)] ${getMatchTextClass(matchLabel)}`}
            >
              <span className="text-white/[0.96]">{tip.homeName}</span>
              <span className="mx-2 text-amber-200 drop-shadow-[0_0_10px_rgba(255,223,125,0.32)]">
                vs
              </span>
              <span className="text-fuchsia-100/[0.96]">{tip.awayName}</span>
            </h3>
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-[1.05rem] font-black uppercase tracking-[0.04em] text-amber-300">
              <i className="ri-calendar-line text-[1.1rem]" aria-hidden />
              {tip.startDateLabel}
            </span>
          </div>

          <div className="relative h-[8px] w-full" aria-hidden>
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-white/[0.26] via-fuchsia-100/[0.58] to-transparent" />
            <div className="absolute left-[14%] right-[20%] top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/[0.18] blur-[3px]" />
            <div className="absolute left-[40%] top-1/2 h-[5px] w-20 -translate-y-1/2 rounded-full bg-amber-200/[0.40] blur-[6px]" />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className="min-w-0">
              {tip.periodLabel ? (
                <div className={`whitespace-nowrap font-black uppercase tracking-[0.07em] text-white ${getMarketTextClass(tip.periodLabel)}`}>
                  <span>{t("time")} :</span>
                  <span className="ml-2 text-amber-200">{tip.periodLabel}</span>
                </div>
              ) : null}
            </div>
            <span className="whitespace-nowrap text-[2.5rem] font-black leading-none tracking-[-0.055em] text-amber-300">
              {tip.startTimeLabel}
            </span>
          </div>
        </div>

        {tip.legs.length >= 2 ? (
          <div className="mt-1.5 space-y-2.5 rounded-[1.2rem] border border-white/[0.24] bg-violet-950/[0.10] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]">
            {/* 첫행: 부키만, 각 절반의 왼쪽 정렬(마켓과 줄 맞춤), 큰 폰트, 부키 길이만큼 밑줄 */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex min-w-0 justify-start overflow-hidden">
                <span
                  title={leg0.bookmakerName}
                  className="inline-block max-w-full truncate border-b-2 border-amber-300/90 pb-0.5 text-[1.12rem] font-black uppercase tracking-[0.06em] text-amber-300"
                >
                  {leg0.bookmakerName}
                </span>
              </div>
              <div className="flex h-full items-center justify-center px-1 text-white/40" aria-hidden>
                <i className="ri-arrow-left-right-line text-[1rem]" />
              </div>
              <div className="flex min-w-0 justify-start overflow-hidden">
                <span
                  title={leg1.bookmakerName}
                  className="inline-block max-w-full truncate border-b-2 border-amber-300/90 pb-0.5 text-[1.12rem] font-black uppercase tracking-[0.06em] text-amber-300"
                >
                  {leg1.bookmakerName}
                </span>
              </div>
            </div>
            {/* 둘째행: 마켓(오즈 왼쪽, 최대 2줄) | 오즈 | 구분선 | 마켓(오즈 왼쪽, 최대 2줄) | 오즈 — 하단 정렬 */}
            <div className="grid min-h-[2.75rem] grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div className="flex min-w-0 items-end justify-between gap-2">
                <span
                  title={leg0.marketName}
                  className={`min-w-0 flex-1 overflow-hidden font-black uppercase tracking-[0.04em] text-white line-clamp-2 break-words ${getMarketTextClass(leg0.marketName)}`}
                >
                  {leg0.lineLabel?.trim() && leg0.lineLabel !== "-" ? (
                    <>
                      {leg0.marketLabel}
                      <span className="text-white/45"> - </span>
                      {leg0.lineLabel}
                    </>
                  ) : (
                    leg0.marketLabel || leg0.marketName
                  )}
                </span>
                <span className="shrink-0 text-[1.75rem] font-black leading-none tracking-[-0.05em] text-amber-300 tabular-nums">
                  {leg0.odd.toFixed(2)}
                </span>
              </div>
              <div className="h-7 w-px rounded-full bg-white/20 shrink-0" aria-hidden />
              <div className="flex min-w-0 items-end justify-between gap-2">
                <span
                  title={leg1.marketName}
                  className={`min-w-0 flex-1 overflow-hidden font-black uppercase tracking-[0.04em] text-white line-clamp-2 break-words ${getMarketTextClass(leg1.marketName)}`}
                >
                  {leg1.lineLabel?.trim() && leg1.lineLabel !== "-" ? (
                    <>
                      {leg1.marketLabel}
                      <span className="text-white/45"> - </span>
                      {leg1.lineLabel}
                    </>
                  ) : (
                    leg1.marketLabel || leg1.marketName
                  )}
                </span>
                <span className="shrink-0 text-[1.75rem] font-black leading-none tracking-[-0.05em] text-amber-300 tabular-nums">
                  {leg1.odd.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex shrink-0 border-t border-white/[0.18] pt-3 dark:border-white/[0.14]">
          <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-violet-950/[0.12] px-5 py-2.5 dark:bg-black/10">
            <span className="whitespace-nowrap text-[1.05rem] font-black uppercase tracking-[0.06em] text-white">
              {t("sureProfit")}
            </span>
            <span className="whitespace-nowrap text-[1.4rem] font-black tabular-nums text-emerald-400">
              +{formatProfitPercent(tip.percent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
