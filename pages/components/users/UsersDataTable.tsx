"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import type { User } from "@/shared/types/users";
import { USER_LEVEL } from "@/shared/types/users";
import EditUserModal from "./EditUserModal";
import LevelBadge from "./LevelBadge";
import StatusBadge from "./StatusBadge";

// 0=본사/관리자, 1=총판, 2=매장, 10=일반회원 (동일 숫자 키 중복 방지)
const LEVEL_KEYS: Record<number, string> = {
  0: "levelSuperAdmin",
  1: "levelPartner",
  2: "levelStore",
  10: "levelUser",
};

const SELECT_MENU_STYLES = {
  menu: (base: object) => ({ ...base, marginTop: 0 }),
  menuList: (base: object) => ({ ...base, paddingTop: 0 }),
};

function formatDateTime(s: string | null | undefined): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? String(s) : d.toLocaleString("ko-KR");
  } catch {
    return String(s ?? "-");
  }
}

function displayName(u: User): string {
  if (u.nickName?.trim()) return u.nickName.trim();
  const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return name || u.email || "-";
}

type SortKey = "name" | "email" | "level" | "status" | "registerTime" | "lastLoginTime" | "attribution";
type SortDir = "asc" | "desc";
/** 귀속 필터: 전체 / 본사 직속 / 총판 귀속 / 매장 귀속 */
type AttributionFilter = "all" | "direct" | "partner" | "store";

const menuPortalTarget =
  typeof document !== "undefined" ? document.body : undefined;

export default function UsersDataTable({
  users,
  currentUserLevel,
  isSuperAdmin,
  isPartnerOrStore,
  getCanManageUser,
  getAttributionLabel,
  editingId,
  onLevelChange,
  onStatusChange,
  onNameEdit,
  onDeleteClick,
  onDeleteForbidden,
}: {
  users: User[];
  currentUserLevel: number;
  isSuperAdmin: boolean;
  isPartnerOrStore: boolean;
  getCanManageUser: (user: User) => boolean;
  getAttributionLabel: (user: User) => string;
  editingId: number | null;
  onLevelChange: (user: User, level: number) => void;
  onStatusChange: (user: User, status: string) => void;
  onNameEdit: (updated: User) => void;
  onDeleteClick: () => void;
  onDeleteForbidden: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [attributionFilter, setAttributionFilter] = useState<AttributionFilter>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [editUser, setEditUser] = useState<User | null>(null);
  const { t } = useLanguage();
  const STATUS_OPTIONS = useMemo(
    () => [
      { value: "ACTIVE", label: t("active") },
      { value: "PENDING", label: t("pending") },
      { value: "SUSPENDED", label: t("suspended") },
    ],
    [t]
  );
  const LEVEL_OPTIONS = useMemo(
    () =>
      Object.entries(LEVEL_KEYS).map(([val, key]) => ({
        value: Number(val),
        label: t(key),
      })),
    [t]
  );

  const PER_PAGE_OPTIONS = [
    { value: 5, label: "5" },
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
  ];

  const filteredAndSorted = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          displayName(u).toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.levelName || "").toLowerCase().includes(q) ||
          (u.status || "").toLowerCase().includes(q) ||
          getAttributionLabel(u).toLowerCase().includes(q)
      );
    }
    if (attributionFilter !== "all") {
      list = list.filter((u) => {
        if (attributionFilter === "direct") return !u.storeId && !u.partnerId;
        if (attributionFilter === "store") return !!u.storeId;
        if (attributionFilter === "partner") return !u.storeId && !!u.partnerId;
        return true;
      });
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = displayName(a).localeCompare(displayName(b));
          break;
        case "email":
          cmp = (a.email ?? "").localeCompare(b.email ?? "");
          break;
        case "level":
          cmp = a.level - b.level;
          break;
        case "status":
          cmp = (a.status ?? "").localeCompare(b.status ?? "");
          break;
        case "registerTime":
          cmp =
            new Date(a.registerTime || 0).getTime() -
            new Date(b.registerTime || 0).getTime();
          break;
        case "lastLoginTime":
          cmp =
            new Date(a.lastLoginTime || 0).getTime() -
            new Date(b.lastLoginTime || 0).getTime();
          break;
        case "attribution":
          cmp = getAttributionLabel(a).localeCompare(getAttributionLabel(b));
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [users, search, sortKey, sortDir, attributionFilter, getAttributionLabel]);

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

  const statusValue = (u: User) =>
    u.status === "INACTIVE" ? "PENDING" : u.status ?? "ACTIVE";

  return (
    <>
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
            placeholder={t("searchPlaceholderUsers")}
            className="ti-form-control form-control-sm !text-[0.8125rem] !py-2 !px-3 flex-1 min-w-0 sm:w-[18rem]"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap">귀속</span>
          <div className="min-w-[7rem] Select2-outline-wrapper">
            <select
              className="ti-form-select rounded-sm !p-0 !text-[0.8125rem] !py-2 !px-3 w-full"
              value={attributionFilter}
              onChange={(e) => {
                setAttributionFilter(e.target.value as AttributionFilter);
                setPage(1);
              }}
            >
              <option value="all">전체</option>
              <option value="direct">본사 직속</option>
              <option value="partner">총판 귀속</option>
              <option value="store">매장 귀속</option>
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
                onClick={() => toggleSort("name")}
              >
                <span className="inline-flex items-center gap-1 flex-nowrap"><i className="ri-user-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />{t("userColumn")} <SortIcon column="name" /></span>
              </th>
              <th
                className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                onClick={() => toggleSort("email")}
              >
                <span className="inline-flex items-center gap-1 flex-nowrap"><i className="ri-mail-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />{t("emailColumn")} <SortIcon column="email" /></span>
              </th>
              <th
                className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 whitespace-nowrap"
                onClick={() => toggleSort("attribution")}
              >
                <span className="inline-flex items-center gap-1 flex-nowrap"><i className="ri-links-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />귀속 <SortIcon column="attribution" /></span>
              </th>
              <th
                className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                onClick={() => toggleSort("registerTime")}
              >
                <span className="inline-flex items-center gap-1 flex-nowrap"><i className="ri-time-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />{t("registerTime")} <SortIcon column="registerTime" /></span>
              </th>
              <th
                className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                onClick={() => toggleSort("lastLoginTime")}
              >
                <span className="inline-flex items-center gap-1 flex-nowrap"><i className="ri-login-box-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />{t("lastLoginTime")} <SortIcon column="lastLoginTime" /></span>
              </th>
              <th
                className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                onClick={() => toggleSort("level")}
              >
                <span className="inline-flex items-center gap-1 flex-nowrap"><i className="ri-vip-crown-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />{t("levelColumn")} <SortIcon column="level" /></span>
              </th>
              <th
                className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
                onClick={() => toggleSort("status")}
              >
                <span className="inline-flex items-center gap-1 flex-nowrap"><i className="ri-checkbox-circle-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />{t("statusColumn")} <SortIcon column="status" /></span>
              </th>
              <th className="!text-start !text-[0.75rem] sm:!text-[0.8rem] !font-semibold text-defaulttextcolor dark:text-white/80 !py-2 sm:!py-3 !px-3 sm:!px-5 border-b border-defaultborder dark:border-white/10 w-[4.5rem] sm:w-[5rem]">
                <span className="inline-flex items-center gap-1 flex-nowrap"><i className="ri-settings-3-line text-[0.7rem] sm:text-[0.75rem] shrink-0" />{t("actionsColumn")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((user) => (
              <tr
                key={user.id}
                className="border-b border-defaultborder dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 border-r border-defaultborder dark:border-white/10">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span
                      className="shrink-0 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center"
                      style={{ width: "1.75rem", height: "1.75rem" }}
                      aria-hidden
                    >
                      <i
                        className={`text-[0.875rem] ${
                          user.level === USER_LEVEL.PARTNER
                            ? "ri-team-line text-primary"
                            : user.level === USER_LEVEL.STORE
                              ? "ri-store-2-line text-primary/80"
                              : "ri-user-line text-[#6b7280] dark:text-white/50"
                        }`}
                      />
                    </span>
                    <p className="!text-[0.75rem] sm:!text-[0.8125rem] font-semibold text-defaulttextcolor dark:text-white/80 mb-0 truncate">
                      {displayName(user)}
                    </p>
                  </div>
                </td>
                <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.7rem] sm:!text-[0.8125rem] text-[#8c9097] dark:text-white/50 border-r border-defaultborder dark:border-white/10 max-w-[8rem] sm:max-w-none truncate">
                  {user.email ?? "-"}
                </td>
                <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.7rem] sm:!text-[0.8125rem] text-[#8c9097] dark:text-white/50 border-r border-defaultborder dark:border-white/10 whitespace-nowrap">
                  {getAttributionLabel(user)}
                </td>
                <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.65rem] sm:!text-[0.75rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap border-r border-defaultborder dark:border-white/10">
                  {formatDateTime(user.registerTime)}
                </td>
                <td className="!py-2 sm:!py-3 !px-3 sm:!px-5 !text-[0.65rem] sm:!text-[0.75rem] text-[#8c9097] dark:text-white/50 whitespace-nowrap border-r border-defaultborder dark:border-white/10">
                  {formatDateTime(user.lastLoginTime)}
                </td>
                <td className="!py-2 !px-3 sm:!px-5 border-r border-defaultborder dark:border-white/10 align-middle overflow-visible">
                  {(isSuperAdmin || isPartnerOrStore || !getCanManageUser(user)) ? (
                    <LevelBadge level={user.level} t={t} />
                  ) : (
                    <div className="min-w-[5.5rem] sm:min-w-[6.5rem] Select2-outline-wrapper">
                      <Select
                        key={`level-${user.id}-${user.level}`}
                        classNamePrefix="Select2"
                        className="ti-form-select rounded-sm !p-0"
                        options={LEVEL_OPTIONS}
                        value={
                          LEVEL_OPTIONS.find((o) => o.value === user.level) ?? null
                        }
                        onChange={(opt) => opt && onLevelChange(user, opt.value)}
                        isDisabled={editingId === user.id}
                        menuPortalTarget={menuPortalTarget}
                        menuPosition="fixed"
                        styles={SELECT_MENU_STYLES}
                      />
                    </div>
                  )}
                </td>
                <td className="!py-2 !px-3 sm:!px-5 border-r border-defaultborder dark:border-white/10 align-middle overflow-visible">
                  {(isSuperAdmin || (!isPartnerOrStore && getCanManageUser(user))) ? (
                    <div className="min-w-[4.5rem] sm:min-w-[5.5rem] Select2-outline-wrapper">
                      <Select
                        key={`status-${user.id}-${user.status}`}
                        classNamePrefix="Select2"
                        className="ti-form-select rounded-sm !p-0"
                        options={STATUS_OPTIONS}
                        value={
                          STATUS_OPTIONS.find(
                            (o) => o.value === statusValue(user)
                          ) ?? null
                        }
                        onChange={(opt) => opt && onStatusChange(user, opt.value)}
                        isDisabled={editingId === user.id}
                        menuPortalTarget={menuPortalTarget}
                        menuPosition="fixed"
                        styles={SELECT_MENU_STYLES}
                      />
                    </div>
                  ) : (
                    <StatusBadge status={statusValue(user)} t={t} />
                  )}
                </td>
                <td className="!py-2 sm:!py-3 !px-2 sm:!px-5 align-middle">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {!isSuperAdmin && !isPartnerOrStore && getCanManageUser(user) && (
                      <span className="hs-tooltip ti-main-tooltip inline-block">
                        <button
                          type="button"
                          className="hs-tooltip-toggle inline-flex items-center justify-center !w-7 !h-7 sm:!w-8 sm:!h-8 rounded-md text-primary hover:bg-primary/10 transition-colors"
                          onClick={() => setEditUser(user)}
                        >
                          <i className="ri-pencil-line text-[1rem] sm:text-[1.1rem]"></i>
                        </button>
                        <span className="hs-tooltip-content ti-main-tooltip-content !py-1 !px-2 text-xs whitespace-nowrap" role="tooltip">{t("editName")}</span>
                      </span>
                    )}
                    {(isSuperAdmin || getCanManageUser(user) || isPartnerOrStore) && (
                      <span className="hs-tooltip ti-main-tooltip inline-block">
                        <button
                          type="button"
                          className="hs-tooltip-toggle inline-flex items-center justify-center !w-7 !h-7 sm:!w-8 sm:!h-8 rounded-md text-danger hover:bg-danger/10 transition-colors"
                          onClick={isPartnerOrStore ? onDeleteForbidden : onDeleteClick}
                        >
                          <i className="ri-delete-bin-line text-[1rem] sm:text-[1.1rem]"></i>
                        </button>
                        <span className="hs-tooltip-content ti-main-tooltip-content !py-1 !px-2 text-xs whitespace-nowrap" role="tooltip">{t("delete")}</span>
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border-t border-defaultborder dark:border-white/10">
        <p className="text-[0.75rem] sm:text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-0 order-2 sm:order-1">
          {filteredAndSorted.length} {t("showingCount")}{" "}
          {(page - 1) * perPage + 1}–
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
    {editUser && (
      <EditUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={(updated) => {
          setEditUser(null);
          onNameEdit(updated);
        }}
      />
    )}
    </>
  );
}
