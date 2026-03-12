import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";

export interface WelcomeBannerProps {
  /** 표시할 사용자 이름. 없으면 "다시 오신 것을 환영합니다"만 표시 */
  displayName?: string;
  /** 왼쪽 아이콘 클래스 (기본: ri-dashboard-3-line) */
  iconClass?: string;
}

export default function WelcomeBanner({ displayName, iconClass = "ri-dashboard-3-line" }: WelcomeBannerProps) {
  const { t } = useLanguage();
  return (
    <div className="box overflow-hidden !rounded-3xl !mb-4 sm:!mb-5 border border-defaultborder dark:border-white/10 bg-gradient-to-r from-primary/[0.06] to-transparent dark:from-primary/10 dark:to-transparent">
      <div className="box-body !p-4 sm:!p-5 flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
          <i className={`${iconClass} text-xl sm:text-2xl text-primary`} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.125rem] sm:text-[1.375rem] md:text-[1.625rem] font-bold text-defaulttextcolor dark:text-defaulttextcolor/90 mb-0.5 sm:mb-1 break-words">
            {displayName ? `${t("dashboardWelcome")}, ${displayName}` : t("dashboardWelcome")}
          </h1>
          <p className="text-[0.8125rem] sm:text-[0.875rem] text-[#8c9097] dark:text-white/50 max-w-xl break-words">
            {t("dashboardSubtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
