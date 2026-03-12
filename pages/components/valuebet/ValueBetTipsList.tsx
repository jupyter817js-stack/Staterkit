import React from "react";
import type { ValueBetTipDisplay } from "@/shared/utils/valuebet/valuebet-utils";
import ValueBetTipCard from "./ValueBetTipCard";

interface ValueBetTipsListProps {
  tips: ValueBetTipDisplay[];
  loading?: boolean;
  /** 카드에 표시할 부키명 (미전달 시 빈 문자열) */
  bookmakerName?: string;
}

export default function ValueBetTipsList({
  tips,
  loading,
  bookmakerName = "",
}: ValueBetTipsListProps) {
  if (loading) {
    return (
      <div className="box">
        <div className="box-body flex items-center justify-center py-16">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary animate-spin inline-block mb-3"></i>
            <p className="text-[#8c9097] dark:text-white/50 text-[0.875rem]">
              데이터를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!tips.length) {
    return (
      <div className="box">
        <div className="box-body flex flex-col items-center justify-center py-16">
          <span className="!w-14 !h-14 rounded-full bg-light dark:bg-white/5 inline-flex items-center justify-center text-[#8c9097] dark:text-white/40 mb-3">
            <i className="ri-line-chart-line text-2xl"></i>
          </span>
          <p className="text-[#8c9097] dark:text-white/50 text-[0.875rem] mb-0">
            표시할 밸류 벳 팁이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="box">
      <div className="box-header justify-between">
        <div className="box-title">밸류 벳 팁</div>
        <span className="text-[0.8125rem] text-primary font-medium bg-primary/10 dark:bg-primary/20 dark:text-primary rounded-full py-1 px-3">
          {tips.length}건
        </span>
      </div>
      <div className="box-body">
        <div className="grid grid-cols-12 gap-4">
          {tips.map((tip) => (
            <div key={tip.betId} className="xl:col-span-6 col-span-12">
              <ValueBetTipCard tip={tip} bookmakerName={bookmakerName} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
