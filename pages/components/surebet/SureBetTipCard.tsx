import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { getLeagueFlagUrl } from "@/shared/utils/valuebet/league-flag-utils";
import { getSportIconClass } from "@/shared/utils/valuebet/sport-icon-utils";
import TeamMarkWithName from "../valuebet/TeamMarkWithName";
import TruncatedWithTooltip from "../valuebet/TruncatedWithTooltip";
import type { SureBetTipDisplay } from "@/shared/utils/surebet/surebet-utils";
import { formatProfitPercent } from "@/shared/utils/formatProfitPercent";

interface SureBetTipCardProps {
  tip: SureBetTipDisplay;
  isSelected?: boolean;
}

export default function SureBetTipCard({ tip, isSelected = false }: SureBetTipCardProps) {
  const { t } = useLanguage();
  const flagUrl = getLeagueFlagUrl(tip.leagueName);

  return (
    <div
      className={`group h-full min-h-0 flex flex-1 flex-col w-full min-w-0 overflow-visible relative
        transition-all duration-200 ease-out
        ${isSelected
          ? "bg-white dark:bg-white/[0.12] ring-2 ring-primary dark:ring-2 dark:ring-white/90 shadow-md dark:shadow-[0_0_0_6px_rgba(255,255,255,0.2)] border-l-2 border-primary dark:border-l-2 dark:border-white/80"
          : "bg-white dark:bg-white/[0.06] ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-sm hover:shadow-lg dark:shadow-black/20 dark:hover:shadow-primary/10 hover:ring-primary/30"}`}
      style={{ borderRadius: "0.75rem" }}
    >
      <div className="p-3 sm:p-4 relative overflow-hidden flex-1 flex flex-col min-h-0 rounded-[0.65rem]">
        {/* 스타디움 배경 */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <img src="/assets/images/card-bg/football-light.png" alt="" className="absolute inset-0 w-full h-full object-cover dark:hidden" />
          <img src="/assets/images/card-bg/football-dark.png" alt="" className="absolute inset-0 w-full h-full object-cover hidden dark:block" />
        </div>

        <div className="relative flex-1 flex flex-col min-h-0 space-y-2.5 pb-1">
          {/* 헤더 */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1 text-[0.6875rem] sm:text-[0.7rem] font-bold text-primary bg-primary/12 dark:bg-primary/20 rounded-full py-1 px-2 sm:px-2.5 shrink-0 border border-primary/20 dark:border-transparent">
              <i className={`${getSportIconClass(tip.sport)} text-[0.75rem]`}></i>
              {tip.sport}
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-white/80 dark:bg-white/5 backdrop-blur-sm px-2 sm:px-2.5 py-1 min-w-0 max-w-[60%] border border-defaultborder dark:border-white/10 shadow-sm">
              {flagUrl && (
                <span className="shrink-0 w-4 h-3.5 rounded overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                  <img src={flagUrl} alt="" className="w-full h-full object-cover" />
                </span>
              )}
              <span className="truncate text-[0.6875rem] sm:text-[0.75rem] font-medium text-defaulttextcolor dark:text-white/80">{tip.leagueName}</span>
            </div>
          </div>

          {/* 팀 마크 + 이름 — 밸류벳 카드처럼 하단에 여백 두고 그 아래 마켓 디브 배치 */}
          <div className="flex items-start gap-2 sm:gap-3 h-[6.5rem] shrink-0 p-2 sm:p-3 mt-2 mb-4">
            <div className="flex-1 flex flex-col items-center min-w-0 max-w-[42%]">
              <TeamMarkWithName
                teamName={tip.homeName}
                sport={tip.sport}
                wrapName
                size="default"
                circularBg
                fontWeight="normal"
                textSize="small"
              />
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center min-h-[2.5rem] text-center">
              <span className="text-[0.75rem] sm:text-[0.8125rem] font-bold text-gray-900 dark:text-white">{tip.startDateLabel}</span>
              <span className="text-[0.6875rem] sm:text-[0.75rem] font-medium text-gray-600 dark:text-white/60 mt-0.5">{tip.startTimeLabel}</span>
              {tip.periodLabel ? (
                <div className="mt-2 py-1.5 px-2.5 rounded-md bg-white/60 dark:bg-white/10 border border-primary/30 dark:border-white/20 ring-1 ring-primary/20 dark:ring-white/10 shadow-sm">
                  <span className="text-[0.6875rem] sm:text-[0.75rem] font-semibold text-gray-700 dark:text-white/80">
                    {tip.periodLabel}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="flex-1 flex flex-col items-center min-w-0 max-w-[42%]">
              <TeamMarkWithName
                teamName={tip.awayName}
                sport={tip.sport}
                wrapName
                size="default"
                circularBg
                fontWeight="normal"
                textSize="small"
              />
            </div>
          </div>

          {/* 부키별 행 — 마켓/라인 2줄 높이 고정(라인 없어도 공백 유지해 균일 정렬) */}
          <div className="space-y-1.5 mt-0 min-h-[5.75rem]">
            {tip.legs.map((leg, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_2fr_1fr] items-center gap-1.5 sm:gap-2 min-h-[1.875rem] py-1.5 px-2 sm:px-2.5 rounded-lg bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-sm"
              >
                <TruncatedWithTooltip
                  text={leg.bookmakerName}
                  className="block min-w-0 overflow-hidden"
                  triggerClassName="block text-[0.6875rem] sm:text-[0.75rem] font-medium text-gray-800 dark:text-white/80 text-left truncate min-w-0"
                />
                <div className="flex flex-col items-center justify-center text-center min-w-0 min-h-[2.25rem]">
                  <TruncatedWithTooltip
                    text={leg.marketLabel}
                    tooltipText={leg.marketDescription ?? undefined}
                    className="block w-full min-w-0"
                    triggerClassName="block text-[0.6875rem] sm:text-[0.75rem] font-bold text-gray-900 dark:text-white truncate w-full"
                  />
                  <span className="block min-h-[1.125rem] text-[0.625rem] sm:text-[0.6875rem] font-medium text-gray-600 dark:text-white/60 truncate w-full leading-tight">
                    {leg.lineLabel && leg.lineLabel !== "-" ? (
                      <TruncatedWithTooltip
                        text={leg.lineLabel}
                        className="block w-full min-w-0"
                        triggerClassName="block truncate w-full"
                      />
                    ) : (
                      "\u00A0"
                    )}
                  </span>
                </div>
                <span className="text-[0.75rem] sm:text-[0.8125rem] font-bold text-primary tabular-nums text-right shrink-0">
                  {leg.odd.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* 수익률 */}
          <div className="min-h-[2.25rem] flex items-center justify-center rounded-lg bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-sm py-1.5">
            <span className="inline-flex items-center gap-1 font-medium text-[0.75rem] sm:text-[0.8125rem] text-success tabular-nums">
              <i className="ri-percent-line text-[0.9em] shrink-0"></i>
              {t("profitRate")} {formatProfitPercent(tip.percent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
