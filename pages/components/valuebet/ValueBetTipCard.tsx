import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { getLeagueFlagUrl } from "@/shared/utils/valuebet/league-flag-utils";
import { getSportIconClass } from "@/shared/utils/valuebet/sport-icon-utils";
import TeamMarkWithName from "./TeamMarkWithName";
import TruncatedWithTooltip from "./TruncatedWithTooltip";
import type { ValueBetTipDisplay } from "@/shared/utils/valuebet/valuebet-utils";
import { formatProfitPercent } from "@/shared/utils/formatProfitPercent";

interface ValueBetTipCardProps {
  tip: ValueBetTipDisplay;
  bookmakerName: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

/** bookmaker.xyz Best odds 스타일 카드 - 라이트/다크 모드 대응 */
export default function ValueBetTipCard({
  tip,
  bookmakerName,
  isSelected = false,
  onSelect,
}: ValueBetTipCardProps) {
  const { t } = useLanguage();
  const flagUrl = getLeagueFlagUrl(tip.leagueName);

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
      style={{ borderRadius: "0.75rem" }}
      className={`group flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-visible cursor-pointer relative
        transition-all duration-200 ease-out active:scale-[0.98]
        ${isSelected
          ? "bg-white dark:bg-white/[0.12] ring-2 ring-primary dark:ring-2 dark:ring-white/90 shadow-md dark:shadow-[0_0_0_6px_rgba(255,255,255,0.2)] border-l-2 border-primary dark:border-l-2 dark:border-white/80"
          : "bg-white dark:bg-white/[0.06] ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-sm hover:shadow-lg dark:shadow-black/20 dark:hover:shadow-primary/10 hover:ring-primary/30"}`}
    >
      <div className="p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col min-h-0 rounded-[0.7rem]">
        {/* 라이트/다크 모드별 스타디움 배경: football-light.png(라이트), football-dark.png(다크) - 투명성 없음, 전체 커버 */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <img
            src="/assets/images/card-bg/football-light.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover dark:hidden"
          />
          <img
            src="/assets/images/card-bg/football-dark.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover hidden dark:block"
          />
        </div>

        <div className="relative flex-1 flex flex-col min-h-0 space-y-4 pb-[6.5rem]">
          {/* 헤더 - 라이트모드 테두리 뚜렷 */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[0.75rem] font-bold text-primary bg-primary/12 dark:bg-primary/20 rounded-full py-1.5 px-3 shrink-0 border border-primary/20 dark:border-transparent">
              <i className={`${getSportIconClass(tip.sport)} text-[0.875rem]`}></i>
              {tip.sport}
            </span>
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 min-w-0 max-w-[65%] border border-defaultborder dark:border-white/10 shadow-sm">
              {flagUrl && (
                <span className="shrink-0 w-5 h-4 rounded overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                  <img src={flagUrl} alt="" className="w-full h-full object-cover" />
                </span>
              )}
              <span className="truncate text-[0.8125rem] font-medium text-defaulttextcolor dark:text-white/80">
                {tip.leagueName}
              </span>
            </div>
          </div>

          {/* 팀 마크 + 이름 (마크 상단 정렬, 팀명 전체 표시) */}
          <div className="flex items-start gap-4 min-h-[5rem] p-4">
            <div className="flex-1 flex flex-col items-center min-w-0 max-w-[42%]">
              <TeamMarkWithName
                teamName={tip.homeName}
                sport={tip.sport}
                className="!mb-0"
                size="large"
                circularBg
                fontWeight="normal"
                textSize="small"
                wrapName
              />
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center min-h-[3.5rem] text-center">
              <span className="text-[0.9375rem] font-bold text-gray-900 dark:text-white">{tip.startDateLabel}</span>
              <span className="text-[0.8125rem] font-medium text-gray-600 dark:text-white/60 mt-0.5">{tip.startTimeLabel}</span>
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
                className="!mb-0"
                size="large"
                circularBg
                fontWeight="normal"
                textSize="small"
                wrapName
              />
            </div>
          </div>

          {/* 마켓(왼쪽) + 부키이름(오른쪽) 한 줄, 그 아래 라인·오드·평균오드·수익률 */}
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <TruncatedWithTooltip
                text={tip.marketLabel}
                tooltipText={tip.marketDescription ?? undefined}
                className="block min-w-0 flex-1"
                triggerClassName="block text-[0.8125rem] font-bold text-gray-900 dark:text-white truncate"
              />
              {bookmakerName ? (
                <span className="shrink-0 truncate max-w-[45%] inline-flex items-center rounded-md px-2 py-0.5 bg-primary text-white text-[0.75rem] font-semibold shadow-sm ring-1 ring-primary/80" title={bookmakerName}>
                  {bookmakerName}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-4 gap-x-1 sm:gap-x-2 gap-y-1.5 text-[0.6875rem] sm:text-[0.75rem]">
              <div className="flex flex-col items-center min-w-0 min-h-[2.5rem] justify-start">
                <span className="inline-flex items-center justify-center gap-0.5 sm:gap-1 text-gray-500 dark:text-white/50 font-medium mb-0.5 whitespace-nowrap">
                  <i className="ri-hashtag text-[0.875em] shrink-0" aria-hidden></i>
                  {t("line")}
                </span>
                <span className="block min-h-[1.25rem] font-medium text-gray-800 dark:text-white/80 text-center tabular-nums flex items-center justify-center">
                  {tip.lineLabel && tip.lineLabel !== "-" ? (
                    <TruncatedWithTooltip
                      text={tip.lineLabel}
                      className="block w-full min-w-0"
                      triggerClassName="block truncate w-full text-center"
                    />
                  ) : (
                    "\u00A0"
                  )}
                </span>
              </div>
              <div className="flex flex-col items-center min-w-0">
                <span className="inline-flex items-center justify-center gap-0.5 sm:gap-1 text-gray-500 dark:text-white/50 font-medium mb-0.5 whitespace-nowrap">
                  <i className="ri-price-tag-3-line text-[0.875em] shrink-0" aria-hidden></i>
                  {t("odds")}
                </span>
                <span className="font-bold text-primary tabular-nums">{tip.koef.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center min-w-0">
                <span className="inline-flex items-center justify-center gap-0.5 sm:gap-1 text-gray-500 dark:text-white/50 font-medium mb-0.5 whitespace-nowrap">
                  <i className="ri-line-chart-line text-[0.875em] shrink-0" aria-hidden></i>
                  {t("avgOdds")}
                </span>
                <span className="font-bold text-gray-900 dark:text-white tabular-nums">{tip.avgOdd.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center min-w-0">
                <span className="inline-flex items-center justify-center gap-0.5 sm:gap-1 text-gray-500 dark:text-white/50 font-medium mb-0.5 whitespace-nowrap">
                  <i className="ri-arrow-up-line text-[0.875em] shrink-0" aria-hidden></i>
                  {t("profitRate")}
                </span>
                <span className="font-bold text-emerald-700 dark:text-success tabular-nums">+{formatProfitPercent(tip.percent)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
