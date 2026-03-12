"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import type { PaymentHistoryItem } from "@/shared/types/payment-history";

const SELECT_MENU_STYLES = {
  menu: (base: object) => ({ ...base, marginTop: 0 }),
  menuList: (base: object) => ({ ...base, paddingTop: 0 }),
};

function formatDate(s: string | null | undefined): string {
  if (!s || s === "-") return "-";
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("ko-KR");
  } catch {
    return String(s ?? "-");
  }
}

function formatDateTime(s: string | null | undefined): string {
  if (!s || s === "-") return "-";
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? String(s) : d.toLocaleString("ko-KR");
  } catch {
    return String(s ?? "-");
  }
}

type SortKey = "email" | "plan" | "paymentAmount" | "paymentDate" | "expiryDate" | "status";
type SortDir = "asc" | "desc";

const menuPortalTarget =
  typeof document !== "undefined" ? document.body : undefined;

const PER_PAGE_OPTIONS = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

interface PaymentHistoryTableProps {
  items: PaymentHistoryItem[];
  loading?: boolean;
}

export default function PaymentHistoryTable({ items, loading }: PaymentHistoryTableProps) {
  const { t } = useLanguage();
  const [emailSearch, setEmailSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("paymentDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredAndSorted = useMemo(() => {
    let list = [...items];
    if (emailSearch.trim()) {
      const q = emailSearch.toLowerCase().trim();
      list = list.filter((row) => (row.email ?? "").toLowerCase().includes(q));
    }
    if (dateFrom) {
      const fromTs = new Date(dateFrom).getTime();
      list = list.filter((row) => new Date(row.paymentDate ?? 0).getTime() >= fromTs);
    }
    if (dateTo) {
      const toEnd = new Date(dateTo);
      toEnd.setHours(23, 59, 59, 999);
      const toTs = toEnd.getTime();
      list = list.filter((row) => new Date(row.paymentDate ?? 0).getTime() <= toTs);
    }
    if (planFilter) {
      list = list.filter((row) => (row.plan ?? "").toUpperCase() === planFilter);
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "email":
          cmp = (a.email ?? "").localeCompare(b.email ?? "");
          break;
        case "plan":
          cmp = (a.plan ?? "").localeCompare(b.plan ?? "");
          break;
        case "paymentAmount": {
          const amtA = Number(a.paymentAmount) || 0;
          const amtB = Number(b.paymentAmount) || 0;
          cmp = amtA - amtB;
          break;
        }
        case "paymentDate":
          cmp =
            new Date(a.paymentDate || 0).getTime() -
            new Date(b.paymentDate || 0).getTime();
          break;
        case "expiryDate":
          cmp =
            new Date(a.expiryDate || 0).getTime() -
            new Date(b.expiryDate || 0).getTime();
          break;
        case "status":
          cmp = (a.status ?? "").localeCompare(b.status ?? "");
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [items, emailSearch, dateFrom, dateTo, planFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / perPage));
  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, page, perPage]);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column)
      return <i className="ri-arrow-up-down-line text-[0.75rem] opacity-50 ms-1"></i>;
    return sortDir === "asc" ? (
      <i className="ri-arrow-up-s-line text-[0.75rem] ms-1"></i>
    ) : (
      <i className="ri-arrow-down-s-line text-[0.75rem] ms-1"></i>
    );
  };

  return (
    <div className="box">
      <div className="box-header justify-between flex-wrap gap-2">
        <div className="box-title flex items-center gap-2">
          <i className="ri-filter-3-line text-[1rem] text-primary"></i>
          {t("searchAndSort")}
        </div>
      </div>
      <div className="box-body p-0">
        <div className="p-3 sm:p-4 border-b border-defaultborder dark:border-white/10 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <i className="ri-search-line text-[#8c9097] dark:text-white/50 shrink-0"></i>
            <input
              type="text"
              placeholder={t("filterByEmailPlaceholder")}
              className="ti-form-control form-control-sm !text-[0.8125rem] !py-2 !px-3 flex-1 min-w-0 sm:w-[18rem]"
              value={emailSearch}
              onChange={(e) => {
                setEmailSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap">
              {t("filterDateFrom")}
            </span>
            <DatePicker
              selected={dateFrom ? new Date(dateFrom) : null}
              onChange={(d: Date | null) => {
                setDateFrom(d ? d.toISOString().slice(0, 10) : "");
                setPage(1);
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText={t("filterDateFrom")}
              className="ti-form-control form-control-sm !text-[0.8125rem] !py-2 !px-3 w-auto min-w-[8rem] rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg text-defaulttextcolor"
              wrapperClassName="w-auto"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap">
              {t("filterDateTo")}
            </span>
            <DatePicker
              selected={dateTo ? new Date(dateTo) : null}
              onChange={(d: Date | null) => {
                setDateTo(d ? d.toISOString().slice(0, 10) : "");
                setPage(1);
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText={t("filterDateTo")}
              className="ti-form-control form-control-sm !text-[0.8125rem] !py-2 !px-3 w-auto min-w-[8rem] rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg text-defaulttextcolor"
              wrapperClassName="w-auto"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap">
              {t("planColumn")}
            </span>
            <div className="min-w-[7rem] Select2-outline-wrapper">
              <select
                className="ti-form-select rounded-sm !p-0 !text-[0.8125rem] !py-2 !px-3 w-full"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t("filterPlanAll")}</option>
                <option value="STANDARD">STANDARD</option>
                <option value="PRO">PRO</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ms-auto shrink-0">
            <span className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap">
              {t("perPageLabel")}
            </span>
            <div className="w-[4.5rem] Select2-outline-wrapper">
              <Select
                classNamePrefix="Select2"
                className="ti-form-select rounded-sm !p-0"
                options={PER_PAGE_OPTIONS}
                value={PER_PAGE_OPTIONS.find((o) => o.value === perPage) ?? null}
                onChange={(opt) => {
                  if (opt) {
                    setPerPage(opt.value);
                    setPage(1);
                  }
                }}
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                styles={SELECT_MENU_STYLES}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="table min-w-[42rem] sm:min-w-full whitespace-nowrap table-bordered mb-0 border border-defaultborder dark:border-white/10 text-[0.75rem] sm:text-[0.8125rem]">
            <thead>
              <tr className="bg-gray-50 dark:bg-black/[0.05]">
                <th
                  className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                  onClick={() => toggleSort("email")}
                >
                  <span className="inline-flex items-center gap-1 flex-nowrap">
                    <i className="ri-mail-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />
                    {t("emailColumn")} <SortIcon column="email" />
                  </span>
                </th>
                <th
                  className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                  onClick={() => toggleSort("plan")}
                >
                  <span className="inline-flex items-center gap-1 flex-nowrap">
                    <i className="ri-vip-crown-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />
                    {t("planColumn")} <SortIcon column="plan" />
                  </span>
                </th>
                <th
                  className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                  onClick={() => toggleSort("paymentAmount")}
                >
                  <span className="inline-flex items-center gap-1 flex-nowrap">
                    <i className="ri-currency-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />
                    {t("paymentAmountColumn")} <SortIcon column="paymentAmount" />
                  </span>
                </th>
                <th
                  className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                  onClick={() => toggleSort("paymentDate")}
                >
                  <span className="inline-flex items-center gap-1 flex-nowrap">
                    <i className="ri-calendar-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />
                    {t("paymentDateColumn")} <SortIcon column="paymentDate" />
                  </span>
                </th>
                <th
                  className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                  onClick={() => toggleSort("expiryDate")}
                >
                  <span className="inline-flex items-center gap-1 flex-nowrap">
                    <i className="ri-calendar-check-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />
                    {t("expiryDateColumn")} <SortIcon column="expiryDate" />
                  </span>
                </th>
                <th
                  className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                  onClick={() => toggleSort("status")}
                >
                  <span className="inline-flex items-center gap-1 flex-nowrap">
                    <i className="ri-checkbox-circle-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />
                    {t("statusColumn")} <SortIcon column="status" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="!py-8 text-center text-[#8c9097] dark:text-white/50">
                    <i className="ri-loader-4-line text-2xl text-primary animate-spin inline-block" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="!py-12 text-center text-[#8c9097] dark:text-white/50 text-[0.8125rem]">
                    조회 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr
                    key={String(row.id)}
                    className="border-b border-defaultborder dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.7rem] sm:!text-[0.8125rem] text-defaulttextcolor dark:text-white/80 border-r border-defaultborder dark:border-white/10 max-w-[10rem] truncate">
                      {row.email ?? "-"}
                    </td>
                    <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.7rem] sm:!text-[0.8125rem] text-[#8c9097] dark:text-white/50 border-r border-defaultborder dark:border-white/10 whitespace-nowrap">
                      {row.plan ?? "-"}
                    </td>
                    <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.7rem] sm:!text-[0.8125rem] text-[#8c9097] dark:text-white/50 border-r border-defaultborder dark:border-white/10 whitespace-nowrap">
                      {row.paymentAmount != null
                        ? typeof row.paymentAmount === "number"
                          ? row.paymentAmount.toLocaleString()
                          : String(row.paymentAmount)
                        : "—"}
                    </td>
                    <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.65rem] sm:!text-[0.75rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap border-r border-defaultborder dark:border-white/10">
                      {formatDateTime(row.paymentDate ?? null)}
                    </td>
                    <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.65rem] sm:!text-[0.75rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap border-r border-defaultborder dark:border-white/10">
                      {formatDate(row.expiryDate ?? null)}
                    </td>
                    <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.7rem] sm:!text-[0.8125rem] text-[#8c9097] dark:text-white/50">
                      {row.status === "active"
                        ? t("subscriptionStatusActive")
                        : row.status === "expired"
                          ? t("subscriptionStatusExpired")
                          : row.status ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border-t border-defaultborder dark:border-white/10">
          <p className="text-[0.75rem] sm:text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-0 order-2 sm:order-1">
            {filteredAndSorted.length}건 중 {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, filteredAndSorted.length)} {t("showingDisplay")}
          </p>
          <div className="flex items-center justify-center sm:justify-end gap-2 order-1 sm:order-2">
            <button
              type="button"
              className="ti-btn ti-btn-sm ti-btn-primary !py-1.5 !px-2.5 !text-[0.75rem]"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <span className="text-[0.8125rem] text-defaulttextcolor dark:text-white/70">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="ti-btn ti-btn-sm ti-btn-primary !py-1.5 !px-2.5 !text-[0.75rem]"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
