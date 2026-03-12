"use client";

import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";

interface PartnersPageHeaderProps {
  onRefresh?: () => void;
  onAdd?: () => void;
  loading?: boolean;
}

export default function PartnersPageHeader({ onRefresh, onAdd, loading }: PartnersPageHeaderProps) {
  const { t } = useLanguage();
  return (
    <div className="md:flex block items-center justify-between my-[1.5rem] page-header-breadcrumb">
      <div className="flex items-start gap-3">
        <span className="!w-10 !h-10 !rounded-lg inline-flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
          <i className="ri-team-line text-[1.25rem]" />
        </span>
        <div>
          <p className="font-semibold text-[1.125rem] text-defaulttextcolor dark:text-defaulttextcolor/70 !mb-0">
            {t("partnerManagement")}
          </p>
          <p className="font-normal text-[#8c9097] dark:text-white/50 text-[0.813rem] mt-0.5">
            {t("partnerManagementDesc")}
          </p>
        </div>
      </div>
      <div className="btn-list md:mt-0 mt-3 flex flex-wrap gap-2">
        {onRefresh && (
          <button
            type="button"
            className={`ti-btn bg-primary text-white btn-wave !font-medium !text-[0.85rem] !rounded-[0.35rem] !py-[0.51rem] !px-[0.86rem] shadow-none ${loading ? "ti-btn-loader btn-loader" : ""}`}
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? <span className="ti-spinner !w-4 !h-4 !border-2 inline-block" /> : <i className="ri-refresh-line inline-block" />}
            <span className="ms-1.5">{t("refresh")}</span>
          </button>
        )}
        {onAdd && (
          <button
            type="button"
            className="ti-btn ti-btn-primary btn-wave !font-medium !text-[0.85rem] !rounded-[0.35rem] !py-[0.51rem] !px-[0.86rem]"
            onClick={onAdd}
          >
            <i className="ri-add-line inline-block" />
            <span className="ms-1.5">{t("addPartner")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
