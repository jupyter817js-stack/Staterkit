import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import WelcomeBanner from "@/shared/components/WelcomeBanner";

interface ValueBetPageHeaderProps {
  displayName?: string;
  alertMuted?: boolean;
  onAlertMuteToggle?: () => void;
}

export default function ValueBetPageHeader({ displayName, alertMuted, onAlertMuteToggle }: ValueBetPageHeaderProps) {
  const { t } = useLanguage();
  return (
    <div className="min-w-0">
      <WelcomeBanner displayName={displayName} iconClass="ri-line-chart-line" />
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 my-[1.5rem] page-header-breadcrumb min-w-0">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="!w-10 !h-10 !rounded-lg inline-flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
          <i className="ri-line-chart-line text-[1.25rem]"></i>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[1.125rem] text-defaulttextcolor dark:text-defaulttextcolor/70 !mb-0 break-words">
            {t("valueBetFinder")}
          </p>
          <p className="font-normal text-[#8c9097] dark:text-white/50 text-[0.813rem] mt-0.5 break-words">
            {t("valueBetDesc")}
          </p>
        </div>
      </div>
      <div className="btn-list shrink-0 flex items-center gap-2">
        {onAlertMuteToggle != null && (
          <button
            type="button"
            className="ti-btn ti-btn-light !font-medium !text-[0.85rem] !rounded-[0.35rem] !py-[0.51rem] !px-[0.6rem]"
            onClick={onAlertMuteToggle}
            title={alertMuted ? t("alertSoundOn") : t("alertSoundOff")}
            aria-label={alertMuted ? t("alertSoundOn") : t("alertSoundOff")}
          >
            <i className={alertMuted ? "ri-volume-mute-line" : "ri-notification-3-line"}></i>
          </button>
        )}
      </div>
    </div>
    </div>
  );
}
