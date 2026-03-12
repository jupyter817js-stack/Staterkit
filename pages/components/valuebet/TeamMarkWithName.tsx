"use client";

import React, { useState } from "react";
import { getTeamMarkUrl } from "@/shared/utils/valuebet/team-mark-utils";
import { getSportMarkFallbackIconClass } from "@/shared/utils/valuebet/sport-icon-utils";

interface TeamMarkWithNameProps {
  teamName: string;
  sport?: string;
  className?: string;
  /** 카드 컴팩트 모드: 마크/이름 크기 축소 */
  compact?: boolean;
  /** 팀명 두 줄 래핑 (길어도 두 줄로 표시) */
  wrapName?: boolean;
  /** 마크 크기: large=더 크게 */
  size?: "default" | "compact" | "large";
  /** 마크 원형 바탕 */
  circularBg?: boolean;
  /** 팀명 폰트 굵기 */
  fontWeight?: "normal" | "medium" | "semibold";
  /** 팀명 폰트 크기 */
  textSize?: "default" | "small";
}

/** 팀 마크(위, 크게·중심·테두리없음) + 팀 이름(아래). 이미지 없으면 스포츠별 공통 아이콘 표시 */
export default function TeamMarkWithName({ teamName, sport, className = "", compact, wrapName = false, size, circularBg = false, fontWeight, textSize = "default" }: TeamMarkWithNameProps) {
  const url = getTeamMarkUrl(teamName);
  const [imgLoaded, setImgLoaded] = useState(false);
  const fallbackIconClass = getSportMarkFallbackIconClass(sport ?? "");

  const sz = size ?? (compact ? "compact" : "default");
  const boxCls = sz === "compact" ? "w-8 h-8 sm:w-9 sm:h-9" : sz === "large" ? "w-14 h-14 sm:w-16 sm:h-16" : "w-12 h-12 sm:w-14 sm:h-14";
  const imgCls = sz === "compact" ? "w-7 h-7 sm:w-8 sm:h-8" : sz === "large" ? "w-11 h-11 sm:w-12 sm:h-12" : "w-10 h-10 sm:w-12 sm:h-12";
  const iconCls = sz === "compact" ? "text-[1rem] sm:text-[1.25rem]" : sz === "large" ? "text-[1.75rem] sm:text-[2rem]" : "text-[1.5rem] sm:text-[1.75rem]";
  const fw = fontWeight ?? "semibold";
  const fwCls = fw === "normal" ? "font-normal" : fw === "medium" ? "font-medium" : "font-semibold";
  const sizeCls = sz === "compact"
    ? "text-[0.6875rem] sm:text-[0.75rem]"
    : textSize === "small"
      ? "text-[0.6875rem] sm:text-[0.75rem]"
      : "text-[0.8125rem] sm:text-[0.9375rem]";
  const textCls = `${fwCls} ${sizeCls}`;

  const markBoxCls = `${boxCls} flex items-center justify-center shrink-0 mb-1 ${circularBg ? "rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden" : ""}`;

  return (
    <div className={`hs-tooltip ti-main-tooltip flex flex-col items-center justify-center shrink-0 ${className}`}>
      <div className="hs-tooltip-toggle flex flex-col items-center cursor-default">
      <div className={markBoxCls}>
        {url ? (
          <img
            src={url}
            alt=""
            className={`${imgCls} object-contain transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <span
            className={`${imgCls} flex items-center justify-center rounded-full bg-light/80 dark:bg-white/10 text-primary/70 dark:text-primary/50 ${iconCls}`}
            aria-hidden
          >
            <i className={fallbackIconClass} />
          </span>
        )}
      </div>
      <span className={`${textCls} text-defaulttextcolor dark:text-defaulttextcolor/90 text-center w-full px-1
        ${wrapName ? "line-clamp-3 break-words" : "truncate"}`}>
        {teamName}
      </span>
      </div>
      <span className="hs-tooltip-content ti-main-tooltip-content !py-1 !px-2 text-xs whitespace-nowrap" role="tooltip">
        {teamName}
      </span>
    </div>
  );
}
