import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import WelcomeBanner from "@/shared/components/WelcomeBanner";

interface SureBetPageHeaderProps {
  displayName?: string;
  showLowLatencyBadge?: boolean;
  alertMuted?: boolean;
  onAlertMuteToggle?: () => void;
}

export default function SureBetPageHeader({ displayName, showLowLatencyBadge, alertMuted, onAlertMuteToggle }: SureBetPageHeaderProps) {
  const { t } = useLanguage();
  return (
    <div className="min-w-0">
      <WelcomeBanner displayName={displayName} iconClass="ri-pie-chart-2-line" />
    <div className="md:flex block items-center justify-between my-[1.5rem] page-header-breadcrumb">
      <div className="flex items-start gap-3">
        <span className="!w-10 !h-10 !rounded-lg inline-flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
          <i className="ri-pie-chart-2-line text-[1.25rem]"></i>
        </span>
        <div>
          <p className="font-semibold text-[1.125rem] text-defaulttextcolor dark:text-defaulttextcolor/70 !mb-0 flex items-center gap-2">
            {t("sureBetFinder")}
            {showLowLatencyBadge && (
              <span className="badge !bg-success/10 !text-success !py-[0.25rem] !px-[0.45rem] !text-[0.7rem]">
                {t("lowLatency")}
              </span>
            )}
          </p>
          <p className="font-normal text-[#8c9097] dark:text-white/50 text-[0.813rem] mt-0.5">
            {t("sureBetDesc")}
          </p>
        </div>
      </div>
      <div className="btn-list md:mt-0 mt-3 flex items-center gap-2">
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
