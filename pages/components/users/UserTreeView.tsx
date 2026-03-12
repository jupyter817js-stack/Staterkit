"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import type { User } from "@/shared/types/users";
import { USER_LEVEL } from "@/shared/types/users";
import type { UserTreeNode } from "@/shared/utils/userTree";
import EditUserModal from "./EditUserModal";
import LevelBadge from "./LevelBadge";

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

const menuPortalTarget =
  typeof document !== "undefined" ? document.body : undefined;

/** 아바타 너비와 동일한 단위로 트리 레벨당 들여쓰기 (2.5rem = w-10) */
const AVATAR_WIDTH_REM = 2.5;
const EXPAND_ICON_WIDTH_REM = 1.5;

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

/** 활성(ACTIVE) / 정지(SUSPENDED·PENDING) 두 가지만 표시하는 토글 스위치 */
function StatusToggle({
  user,
  editingId,
  onStatusChange,
  t,
}: {
  user: User;
  editingId: number | null;
  onStatusChange: (user: User, status: string) => void;
  t: (key: string) => string;
}) {
  const isActive = user.status === "ACTIVE";
  const disabled = editingId === user.id;

  return (
    <div
      className="inline-flex rounded-lg overflow-hidden border border-defaultborder dark:border-white/10 bg-gray-100 dark:bg-white/5 shadow-inner"
      role="group"
      aria-label={t("statusColumn")}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onStatusChange(user, "ACTIVE")}
        className={`
          px-2.5 py-1.5 text-[0.75rem] font-medium transition-all duration-200 border-r border-defaultborder dark:border-white/10
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          ${isActive
            ? "bg-primary text-white shadow-sm"
            : "text-[#8c9097] dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10"}
        `}
      >
        {t("active")}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onStatusChange(user, "SUSPENDED")}
        className={`
          px-2.5 py-1.5 text-[0.75rem] font-medium transition-all duration-200
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          ${!isActive
            ? "bg-danger/90 text-white shadow-sm"
            : "text-[#8c9097] dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10"}
        `}
      >
        {t("suspended")}
      </button>
    </div>
  );
}

export default function UserTreeView({
  treeNodes,
  currentUserLevel,
  editingId,
  onLevelChange,
  onStatusChange,
  onNameEdit,
  onDeleteClick,
}: {
  treeNodes: UserTreeNode[];
  currentUserLevel: number;
  editingId: number | null;
  onLevelChange: (user: User, level: number) => void;
  onStatusChange: (user: User, status: string) => void;
  onNameEdit: (updated: User) => void;
  onDeleteClick: () => void;
}) {
  const { t } = useLanguage();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editUser, setEditUser] = useState<User | null>(null);

  const LEVEL_OPTIONS = useMemo(
    () =>
      Object.entries(LEVEL_KEYS).map(([val, key]) => ({
        value: Number(val),
        label: t(key),
      })),
    [t]
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function TreeRow({
    node,
    depth,
  }: {
    node: UserTreeNode;
    depth: number;
  }) {
    const u = node.user;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(u.id);
    /** 부모보다 아바타 너비만큼 들어가게: 레벨당 AVATAR_WIDTH_REM(2.5rem) 들여쓰기. Tailwind pl- 제거해 인라인만 적용 */
    const paddingLeftRem = 0.75 + depth * AVATAR_WIDTH_REM;
    const isChild = depth > 0;

    return (
      <>
        <tr
          key={u.id}
          className="hover:bg-primary/[0.05] dark:hover:bg-white/[0.04] transition-colors duration-150"
        >
          <td
            className={`py-2.5 sm:py-3 pr-3 align-middle ${isChild ? "border-l-4 border-l-primary/50 bg-gray-50/70 dark:bg-white/[0.03]" : ""}`}
            style={{ paddingLeft: `${paddingLeftRem}rem` }}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span
                className="shrink-0 flex items-center justify-center"
                style={{ width: `${EXPAND_ICON_WIDTH_REM}rem` }}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-defaulttextcolor dark:text-white/70"
                    onClick={() => toggleExpand(u.id)}
                    aria-label={isExpanded ? t("collapse") : t("expand")}
                  >
                    <i
                      className={`ri-arrow-right-s-line text-[1rem] transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                ) : (
                  <span style={{ width: `${EXPAND_ICON_WIDTH_REM}rem` }} />
                )}
              </span>
              <span
                className="shrink-0 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center"
                style={{ width: "1.75rem", height: "1.75rem" }}
                aria-hidden
              >
                <i
                  className={`text-[0.875rem] ${
                    u.level === USER_LEVEL.PARTNER
                      ? "ri-team-line text-primary"
                      : u.level === USER_LEVEL.STORE
                        ? "ri-store-2-line text-primary/80"
                        : "ri-user-line text-[#6b7280] dark:text-white/50"
                  }`}
                />
              </span>
              <p className="!text-[0.75rem] sm:!text-[0.8125rem] font-semibold text-defaulttextcolor dark:text-white/80 mb-0 truncate">
                {displayName(u)}
              </p>
            </div>
          </td>
          <td className="py-2.5 sm:py-3 px-3 text-[0.7rem] sm:text-[0.8125rem] text-[#6b7280] dark:text-white/50 max-w-[7rem] sm:max-w-[10rem] truncate">
            {u.email ?? "-"}
          </td>
          <td className="py-2.5 sm:py-3 px-3 text-[0.65rem] sm:text-[0.75rem] text-[#6b7280] dark:text-white/50 whitespace-nowrap hidden md:table-cell">
            {formatDateTime(u.registerTime)}
          </td>
          <td className="py-2.5 sm:py-3 px-3 text-[0.65rem] sm:text-[0.75rem] text-[#6b7280] dark:text-white/50 whitespace-nowrap hidden lg:table-cell">
            {formatDateTime(u.lastLoginTime)}
          </td>
          <td className="py-2.5 px-3 align-middle overflow-visible">
            {currentUserLevel === USER_LEVEL.SUPER_ADMIN ? (
              <div className="min-w-[5rem] sm:min-w-[6rem] Select2-outline-wrapper">
                <Select
                  key={`level-${u.id}-${u.level}`}
                  classNamePrefix="Select2"
                  className="ti-form-select rounded-sm !p-0 text-[0.75rem] sm:!text-[0.8125rem]"
                  options={LEVEL_OPTIONS}
                  value={LEVEL_OPTIONS.find((o) => o.value === u.level) ?? null}
                  onChange={(opt) => opt && onLevelChange(u, opt.value)}
                  isDisabled={editingId === u.id}
                  menuPortalTarget={menuPortalTarget}
                  menuPosition="fixed"
                  styles={SELECT_MENU_STYLES}
                />
              </div>
            ) : (
              <LevelBadge level={u.level} t={t} />
            )}
          </td>
          <td className="py-2.5 px-3 align-middle overflow-visible">
            <StatusToggle
              user={u}
              editingId={editingId}
              onStatusChange={onStatusChange}
              t={t}
            />
          </td>
          <td className="py-2.5 sm:py-3 pl-3 pr-4 align-middle bg-gray-50/30 dark:bg-white/[0.02]">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="hs-tooltip ti-main-tooltip inline-block">
                <button
                  type="button"
                  className="hs-tooltip-toggle inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => setEditUser(u)}
                >
                  <i className="ri-pencil-line text-[1rem] sm:text-[1.1rem]" />
                </button>
                <span
                  className="hs-tooltip-content ti-main-tooltip-content !py-1 !px-2 text-xs whitespace-nowrap"
                  role="tooltip"
                >
                  {t("editName")}
                </span>
              </span>
              <span className="hs-tooltip ti-main-tooltip inline-block">
                <button
                  type="button"
                  className="hs-tooltip-toggle inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                  onClick={onDeleteClick}
                >
                  <i className="ri-delete-bin-line text-[1rem] sm:text-[1.1rem]" />
                </button>
                <span
                  className="hs-tooltip-content ti-main-tooltip-content !py-1 !px-2 text-xs whitespace-nowrap"
                  role="tooltip"
                >
                  {t("delete")}
                </span>
              </span>
            </div>
          </td>
        </tr>
        {hasChildren &&
          isExpanded &&
          node.children.map((child) => (
            <TreeRow key={child.user.id} node={child} depth={depth + 1} />
          ))}
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-defaultborder/70 dark:border-white/10 bg-white dark:bg-bodybg shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="overflow-x-auto -mx-2 sm:mx-0 scrollbar-thin">
          <table className="w-full min-w-[36rem] text-[0.75rem] sm:text-[0.8125rem] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100/90 to-gray-50/80 dark:from-white/[0.06] dark:to-white/[0.02] border-b-2 border-defaultborder/80 dark:border-white/10">
                <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 pl-4 pr-3">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-user-line text-[0.95rem] opacity-80" aria-hidden />
                    {t("userColumn")}
                  </span>
                </th>
                <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-mail-line text-[0.95rem] opacity-80" aria-hidden />
                    {t("emailColumn")}
                  </span>
                </th>
                <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-calendar-check-line text-[0.95rem] opacity-80" aria-hidden />
                    {t("registerTime")}
                  </span>
                </th>
                <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3 hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-login-circle-line text-[0.95rem] opacity-80" aria-hidden />
                    {t("lastLoginTime")}
                  </span>
                </th>
                <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-shield-star-line text-[0.95rem] opacity-80" aria-hidden />
                    {t("levelColumn")}
                  </span>
                </th>
                <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-toggle-line text-[0.95rem] opacity-80" aria-hidden />
                    {t("statusColumn")}
                  </span>
                </th>
                <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 pl-3 pr-4 w-[4.5rem] sm:w-[5rem]">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-settings-4-line text-[0.95rem] opacity-80" aria-hidden />
                    {t("actionsColumn")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-defaultborder/60 dark:divide-white/10">
              {treeNodes.map((node) => (
                <TreeRow key={node.user.id} node={node} depth={0} />
              ))}
            </tbody>
          </table>
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
