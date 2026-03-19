import React from "react";
import Link from "next/link";
import { useLanguage } from "@/shared/i18n/LanguageContext";

interface UpgradeModalProps {
  show: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ show, onClose }: UpgradeModalProps) {
  const { t } = useLanguage();
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="box max-w-md w-full shadow-xl">
        <div className="box-header flex items-center justify-between border-b border-defaultborder dark:border-white/10">
          <h5 id="upgrade-modal-title" className="box-title mb-0">
            {t("upgradeRequired")}
          </h5>
          <button
            type="button"
            className="ti-btn ti-btn-soft-secondary ti-btn-sm"
            onClick={onClose}
            aria-label={t("close")}
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        <div className="box-body">
          <p className="text-[0.8125rem] text-defaulttextcolor dark:text-white/70 mb-4">
            {t("upgradeRequired")} {t("upgradeToPro")}
          </p>
          <div className="flex gap-2">
            <Link
              href="/subscription?plan=PRO"
              className="ti-btn ti-btn-primary !font-medium"
              onClick={onClose}
            >
              {t("upgradeToPro")}
            </Link>
            <button
              type="button"
              className="ti-btn ti-btn-soft-secondary"
              onClick={onClose}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
