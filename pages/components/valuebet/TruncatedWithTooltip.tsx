"use client";

import React from "react";

interface TruncatedWithTooltipProps {
  /** 트리거(카드 등)에 표시할 텍스트 */
  text: string;
  /** 툴팁에 표시할 텍스트. 없으면 text 사용 */
  tooltipText?: string;
  className?: string;
  /** 툴팁 트리거 요소의 클래스 (truncate 등) */
  triggerClassName?: string;
}

/**
 * 잘린 텍스트에 호버 시 기본 브라우저 툴팁(title)으로 전체 텍스트 표시.
 */
export default function TruncatedWithTooltip({
  text,
  tooltipText,
  className = "",
  triggerClassName = "",
}: TruncatedWithTooltipProps) {
  const tooltipContent = tooltipText ?? text;
  return (
    <span className={`inline-block min-w-0 ${className}`}>
      <span
        title={tooltipContent}
        className={`cursor-default outline-none ${triggerClassName}`}
      >
        {text}
      </span>
    </span>
  );
}
