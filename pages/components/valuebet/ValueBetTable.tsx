import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import type { ValueBetTipDisplay } from "@/shared/utils/valuebet/valuebet-utils";
import ValueBetTipCard from "./ValueBetTipCard";
import ValueBetTipCardSkeleton from "./ValueBetTipCardSkeleton";

interface ValueBetTableProps {
  tips: ValueBetTipDisplay[];
  loading?: boolean;
  /** API 응답에 베팅 데이터가 있음(팁 추출 비동기 진행 중일 수 있음) */
  dataHasBets?: boolean;
  /** bookmaker_id → 부키 이름 (카드별 표시용) */
  bookmakerNamesMap: Map<number, string>;
  selectedBetId?: string | null;
  onCardClick?: (tip: ValueBetTipDisplay) => void;
}

export default function ValueBetTable({
  tips,
  loading,
  dataHasBets = false,
  bookmakerNamesMap,
  selectedBetId = null,
  onCardClick,
}: ValueBetTableProps) {
  const { t } = useLanguage();

  const showSkeleton = (loading && !tips.length) || (!tips.length && dataHasBets);

  if (showSkeleton) {
    const SKELETON_COUNT = 6;
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[1rem] text-defaulttextcolor dark:text-defaulttextcolor/80 mb-0 flex items-center gap-2">
            <i className="ri-lightbulb-flash-line text-primary"></i>
            {t("valueBetTipsTitle")}
          </h3>
          <span className="h-6 w-12 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="mb-4 flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] dark:from-primary/10 dark:to-primary/5 border-l-4 border-primary/40 dark:border-primary/50 shadow-sm">
          <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
            <i className="ri-information-line text-[1.125rem]"></i>
          </span>
          <p className="text-[0.8125rem] leading-relaxed text-defaulttextcolor/90 dark:text-white/75 pt-0.5">
            {t("appCtaMessage")}
          </p>
        </div>
        <div
          className="grid gap-1.5 sm:gap-2 items-stretch"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))",
          }}
        >
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className="min-w-0 min-h-0 flex flex-col h-full overflow-visible p-[3px]"
            >
              <ValueBetTipCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tips.length) {
    return (
      <div className="box border-0 shadow-none bg-transparent dark:bg-transparent">
        <div className="box-body flex flex-col items-center justify-center py-20">
          <span className="!w-16 !h-16 rounded-2xl bg-light dark:bg-white/5 inline-flex items-center justify-center text-[#8c9097] dark:text-white/40 mb-4">
            <i className="ri-line-chart-line text-3xl"></i>
          </span>
          <p className="text-[#8c9097] dark:text-white/50 text-[0.9375rem] mb-0 font-medium">
            {t("noValueBetTips")}
          </p>
          <p className="text-[#8c9097] dark:text-white/40 text-[0.8125rem] mt-1">
            {t("changeFiltersOrRetry")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[1rem] text-defaulttextcolor dark:text-defaulttextcolor/80 mb-0 flex items-center gap-2">
          <i className="ri-lightbulb-flash-line text-primary"></i>
          {t("valueBetTipsTitle")}
        </h3>
        <span className="text-[0.8125rem] text-primary font-medium bg-primary/10 dark:bg-primary/20 dark:text-primary rounded-full py-1 px-3">
          {tips.length}{t("tipsCount")}
        </span>
      </div>
      {/* 카드 클릭 안내 */}
      <div className="mb-4 flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] dark:from-primary/10 dark:to-primary/5 border-l-4 border-primary/40 dark:border-primary/50 shadow-sm">
        <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
          <i className="ri-information-line text-[1.125rem]"></i>
        </span>
        <p className="text-[0.8125rem] leading-relaxed text-defaulttextcolor/90 dark:text-white/75 pt-0.5">
          {t("appCtaMessage")}
        </p>
      </div>
      <div
        className="grid gap-1.5 sm:gap-2 items-stretch"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))",
        }}
      >
        {tips.map((tip) => (
          <div
            key={tip.betId}
            className="min-w-0 min-h-0 flex flex-col h-full overflow-visible p-[3px]"
          >
            <ValueBetTipCard
              tip={tip}
              bookmakerName={bookmakerNamesMap.get(tip.bookmaker_id) ?? ""}
              isSelected={selectedBetId === tip.betId}
              onSelect={() => onCardClick?.(tip)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
