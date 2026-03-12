import React from "react";
import Select from "react-select";
import type { BookmakerSelectOption } from "@/shared/types/bookmakers";
import type { SportSelectOption } from "@/shared/hooks/useSportsOptions";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { PER_PAGE_SELECT_OPTIONS, BETS_SORT_OPTIONS, BETS_TIME_RANGE_OPTIONS } from "@/shared/utils/valuebet/valuebet-constants";
import type { BetsSortOption } from "@/shared/utils/bets-sort";
import type { TimeRangePreset } from "@/shared/utils/time-range-filter";
type PerPageOption = (typeof PER_PAGE_SELECT_OPTIONS)[number];

interface SureBetFiltersProps {
  perPage: number;
  isLive: boolean;
  bookmakerIds: number[];
  bookmakerOptions: BookmakerSelectOption[];
  sportIds: number[];
  sportOptions: SportSelectOption[];
  sportOptionsLoading: boolean;
  sortBy: BetsSortOption;
  onSortByChange: (v: BetsSortOption) => void;
  timeRangePreset: TimeRangePreset;
  onTimeRangePresetChange: (v: TimeRangePreset) => void;
  onSportIdsChange: (ids: number[]) => void;
  onPerPageChange: (v: number) => void;
  onIsLiveChange: (v: boolean) => void;
  onBookmakerIdsChange: (ids: number[]) => void;
  /** 최소 수익률 (%) — 이 값 이상만 표시 (클라이언트 필터, 기본 2) */
  minProfitPercent: number;
  onMinProfitPercentChange: (v: number) => void;
  /** false면 라이브 탭 비활성 + 클릭 시 업그레이드 유도 */
  accessLive?: boolean;
  onLiveLockedClick?: () => void;
}

const filterLabelClass =
  "flex items-center gap-1.5 text-[0.8125rem] font-medium text-defaulttextcolor dark:text-white/70 mb-1.5";
const filterLabelIconClass = "text-[0.875rem] text-defaulttextcolor/80 dark:text-white/60 shrink-0";
const selectWrapperClass = "Select2-outline-wrapper";

export default function SureBetFilters({
  perPage,
  isLive,
  bookmakerIds,
  bookmakerOptions,
  sportIds,
  sportOptions,
  sportOptionsLoading,
  sortBy,
  onSortByChange,
  timeRangePreset,
  onTimeRangePresetChange,
  onSportIdsChange,
  onPerPageChange,
  onIsLiveChange,
  onBookmakerIdsChange,
  minProfitPercent,
  onMinProfitPercentChange,
  accessLive = true,
  onLiveLockedClick,
}: SureBetFiltersProps) {
  const { t } = useLanguage();
  const canAccessLive = accessLive !== false;
  const sortOptions = BETS_SORT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const timeRangeOptions = BETS_TIME_RANGE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));

  const handleLiveClick = () => {
    if (canAccessLive) {
      onIsLiveChange(true);
    } else {
      onLiveLockedClick?.();
    }
  };

  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined;
  const selectMenuStyles = {
    menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className="rounded-2xl border border-defaultborder/80 dark:border-white/10 bg-white dark:bg-bodybg shadow-sm overflow-visible mb-6 shrink-0 min-w-0">
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-defaultborder/80 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-[1.05rem] text-primary" aria-hidden />
          <span className="text-[0.9375rem] font-semibold text-defaulttextcolor dark:text-white/90">
            {t("filters")}
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="flex-1 min-w-[9rem]">
            <label className={filterLabelClass}><i className={`ri-arrow-up-down-line ${filterLabelIconClass}`} aria-hidden />{t("sortBy")}</label>
            <div className={`${selectWrapperClass} w-full min-w-0`}>
              <Select
                classNamePrefix="Select2"
                className="ti-form-select rounded-sm !p-0"
                options={sortOptions}
                value={sortOptions.find((o) => o.value === sortBy) ?? sortOptions[0]}
                onChange={(option) => option && onSortByChange(option.value)}
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                styles={selectMenuStyles}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[9rem]">
            <label className={filterLabelClass}><i className={`ri-file-list-3-line ${filterLabelIconClass}`} aria-hidden />{t("itemsPerPage")}</label>
            <div className={`${selectWrapperClass} w-full max-w-[6rem] min-w-0`}>
              <Select
                classNamePrefix="Select2"
                className="ti-form-select rounded-sm !p-0"
                placeholder={t("count")}
                options={PER_PAGE_SELECT_OPTIONS}
                value={
                  PER_PAGE_SELECT_OPTIONS.find((o) => o.value === perPage) ?? null
                }
                onChange={(option: PerPageOption | null) => {
                  if (option) onPerPageChange(option.value);
                }}
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                styles={selectMenuStyles}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[8rem] max-w-[6rem]">
            <label className={filterLabelClass}><i className={`ri-arrow-up-line ${filterLabelIconClass}`} aria-hidden />{t("minProfitRateFilter")}</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={minProfitPercent}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onMinProfitPercentChange(0);
                  return;
                }
                const v = parseFloat(raw);
                if (!Number.isNaN(v) && v >= 0) onMinProfitPercentChange(Math.max(0, v));
              }}
              className="ti-form-input rounded-sm text-[0.8125rem] w-full"
              placeholder="2"
            />
          </div>
          <div className="flex-1 min-w-[9rem]">
            <label className={filterLabelClass}><i className={`ri-time-line ${filterLabelIconClass}`} aria-hidden />{t("timeRange")}</label>
            <div className={`${selectWrapperClass} w-full min-w-0`}>
              <Select
                classNamePrefix="Select2"
                className="ti-form-select rounded-sm !p-0"
                options={timeRangeOptions}
                value={timeRangeOptions.find((o) => o.value === timeRangePreset) ?? timeRangeOptions[0]}
                onChange={(option) => option && onTimeRangePresetChange(option.value)}
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                styles={selectMenuStyles}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label className={filterLabelClass}><i className={`ri-calendar-event-line ${filterLabelIconClass}`} aria-hidden />{t("typeLabel")}</label>
            <div className="flex rounded-lg overflow-hidden border border-defaultborder dark:border-white/10 w-fit max-w-full bg-white dark:bg-bodybg">
              <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer px-3 py-2 sm:px-4 sm:py-2.5 text-[0.75rem] sm:text-[0.8125rem] font-normal has-[:checked]:font-medium has-[:checked]:bg-primary has-[:checked]:text-white border-r border-defaultborder dark:border-white/10 transition-colors">
                <input
                  type="radio"
                  name="surebet-type"
                  className="ti-form-radio"
                  checked={!isLive}
                  onChange={() => onIsLiveChange(false)}
                />
                <span className="whitespace-nowrap">{t("preMatch")}</span>
              </label>
              <label
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-[0.75rem] sm:text-[0.8125rem] font-normal has-[:checked]:font-medium has-[:checked]:bg-primary has-[:checked]:text-white transition-colors ${canAccessLive ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                onClick={canAccessLive ? undefined : (e) => { e.preventDefault(); onLiveLockedClick?.(); }}
              >
                <input
                  type="radio"
                  name="surebet-type"
                  className="ti-form-radio"
                  checked={!!isLive}
                  disabled={!canAccessLive}
                  onChange={handleLiveClick}
                />
                <span className="whitespace-nowrap">{t("live")}</span>
                {!canAccessLive && (
                  <span
                    className="text-[0.65rem] font-semibold text-warning ms-0.5 whitespace-nowrap"
                    title={t("upgradeRequired")}
                  >
                    Pro
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-defaultborder/70 dark:border-white/10 flex flex-wrap gap-x-6 gap-y-4">
          <div className="flex-1 min-w-[min(100%, 18rem)]">
            <label className={filterLabelClass}><i className={`ri-building-line ${filterLabelIconClass}`} aria-hidden />{t("bookmaker")}</label>
            <div className={`${selectWrapperClass} w-full min-w-0`}>
              <Select
                isMulti
                classNamePrefix="Select2"
                className="ti-form-select rounded-sm !p-0"
                placeholder={t("bookmakerSelect")}
                options={bookmakerOptions}
                value={bookmakerOptions.filter((o) => bookmakerIds.includes(o.value))}
                onChange={(selected) => onBookmakerIdsChange(selected ? selected.map((s) => s.value) : [])}
                closeMenuOnSelect={false}
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                styles={selectMenuStyles}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[min(100%, 18rem)]">
            <label className={filterLabelClass}><i className={`ri-basketball-line ${filterLabelIconClass}`} aria-hidden />{t("Sport")}</label>
            <div className={`${selectWrapperClass} w-full min-w-0`}>
              <Select
                isMulti
                isDisabled={sportOptionsLoading}
                classNamePrefix="Select2"
                className="ti-form-select rounded-sm !p-0"
                placeholder={sportOptionsLoading ? "로딩 중..." : "스포츠 선택"}
                options={sportOptions}
                value={sportOptions.filter((o) => sportIds.includes(o.value))}
                onChange={(selected) => onSportIdsChange(selected.map((s) => s.value))}
                closeMenuOnSelect={false}
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                styles={selectMenuStyles}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
