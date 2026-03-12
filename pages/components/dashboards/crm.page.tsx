'use client';

import React, { Fragment, useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import Seo from "@/shared/layout-components/seo/seo";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { getCurrentUser } from "@/shared/api/users";
import { listUsers } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import { USER_LEVEL } from "@/shared/types/users";

function StatCard({
  title,
  value,
  iconClass,
  accent,
  href,
  linkLabel,
  /** true면 value가 null일 때 스켈레톤 대신 "—" 표시 (해당 카드는 API 미호출) */
  noFetch = false,
}: {
  title: string;
  value: number | null;
  iconClass: string;
  accent: "primary" | "info" | "success";
  href?: string;
  linkLabel?: string;
  noFetch?: boolean;
}) {
  const isLoading = value === null && !noFetch;
  const showPlaceholder = value === null && noFetch;
  const iconBg = {
    primary: "bg-primary/10 dark:bg-primary/20 text-primary",
    info: "bg-info/10 dark:bg-info/20 text-info",
    success: "bg-success/10 dark:bg-success/20 text-success",
  };
  const linkColor = {
    primary: "text-primary hover:text-primary/80",
    info: "text-info hover:text-info/80",
    success: "text-success hover:text-success/80",
  };
  return (
    <Link href={href ?? "#"} className="block h-full group min-w-0">
      <div className="box overflow-hidden !rounded-3xl !mb-0 h-full hover:shadow-md transition-shadow duration-200 border border-defaultborder dark:border-white/10">
        <div className="box-body !p-4 sm:!p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[#8c9097] dark:text-white/50 text-[0.75rem] sm:text-[0.813rem] mb-1">
                {title}
              </p>
              <h4 className="font-semibold text-[1.25rem] sm:text-[1.5rem] text-defaulttextcolor dark:text-defaulttextcolor/90 !mb-1.5 sm:!mb-2 tabular-nums truncate">
                {isLoading ? (
                  <span className="inline-block w-12 sm:w-14 h-7 sm:h-8 rounded-xl bg-black/5 dark:bg-white/10 animate-pulse" />
                ) : showPlaceholder ? (
                  "—"
                ) : (
                  (value ?? 0).toLocaleString()
                )}
              </h4>
              {linkLabel && (
                <span className={`inline-flex items-center gap-1 text-[0.75rem] sm:text-[0.8125rem] font-medium ${linkColor[accent]} group-hover:gap-1.5 transition-all`}>
                  {linkLabel}
                  <i className="ri-arrow-right-line text-[0.875rem] shrink-0" aria-hidden />
                </span>
              )}
            </div>
            <span
              className={`shrink-0 !w-10 !h-10 sm:!w-12 sm:!h-12 !rounded-2xl inline-flex items-center justify-center ${iconBg[accent]}`}
              aria-hidden
            >
              <i className={`${iconClass} text-[1.125rem] sm:text-[1.25rem]`} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const QUICK_LINKS = [
  { href: "/valuebet", labelKey: "valueBets", descKey: "dashboardGoValuebet", icon: "ri-line-chart-line", color: "info" },
  { href: "/surebet", labelKey: "sureBets", descKey: "dashboardGoSurebet", icon: "ri-pie-chart-2-line", color: "success" },
  { href: "/users", labelKey: "userManagement", descKey: "dashboardGoUsers", icon: "ri-user-settings-line", color: "primary" },
  { href: "/subscription", labelKey: "dashboardGoSubscription", descKey: "dashboardGoSubscription", icon: "ri-vip-crown-line", color: "warning" },
] as const;

function QuickLinkCard({
  href,
  label,
  description,
  iconClass,
  color,
}: {
  href: string;
  label: string;
  description: string;
  iconClass: string;
  color: "primary" | "info" | "success" | "warning";
}) {
  const colorClass = {
    primary: "bg-primary/10 dark:bg-primary/20 text-primary",
    info: "bg-info/10 dark:bg-info/20 text-info",
    success: "bg-success/10 dark:bg-success/20 text-success",
    warning: "bg-warning/10 dark:bg-warning/20 text-warning",
  }[color];
  return (
    <Link href={href} className="block h-full group min-w-0">
      <div className="box overflow-hidden !rounded-3xl !mb-0 h-full hover:shadow-md transition-shadow duration-200 border border-defaultborder dark:border-white/10">
        <div className="box-body !p-3 sm:!p-4 md:!p-5 flex flex-row items-center gap-3 sm:gap-4">
          <span className={`shrink-0 !w-10 !h-10 sm:!w-11 sm:!h-11 !rounded-2xl inline-flex items-center justify-center ${colorClass}`}>
            <i className={`${iconClass} text-[1.125rem] sm:text-[1.25rem]`} />
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="font-semibold text-[0.8125rem] sm:text-[0.9375rem] text-defaulttextcolor dark:text-defaulttextcolor/90 !mb-0 group-hover:text-primary transition-colors truncate">
              {label}
            </p>
            <p className="text-[#8c9097] dark:text-white/50 text-[0.6875rem] sm:text-[0.75rem] mt-0.5 truncate">
              {description}
            </p>
          </div>
          <i className="ri-arrow-right-s-line text-[1.125rem] sm:text-[1.25rem] text-[#8c9097] dark:text-white/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [, setLoading] = useState(true);

  // 관리자만 접근 가능. 그 외에는 valuebet으로 리다이렉트
  useEffect(() => {
    if (currentUser === null) return;
    const isAdmin = currentUser.level === USER_LEVEL.SUPER_ADMIN || currentUser.level === USER_LEVEL.ADMIN;
    if (!isAdmin) {
      router.replace("/valuebet");
    }
  }, [currentUser, router]);

  // Valuebet/Surebet 건수는 해당 페이지 진입 시에만 API 호출하므로 대시보드에서는 호출하지 않음
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [userRes, usersRes] = await Promise.all([
          getCurrentUser(),
          listUsers({ per_page: 1 }).catch(() => ({ users: [], total: 0 })),
        ]);

        if (!cancelled) {
          setCurrentUser(userRes ?? null);
          setTotalUsers(typeof usersRes.total === "number" ? usersRes.total : usersRes.users?.length ?? 0);
        }
      } catch {
        if (!cancelled) setTotalUsers(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const isAdmin = currentUser?.level === USER_LEVEL.SUPER_ADMIN || currentUser?.level === USER_LEVEL.ADMIN;
  const displayName =
    currentUser?.firstname || currentUser?.lastname
      ? [currentUser?.firstname, currentUser?.lastname].filter(Boolean).join(" ").trim()
      : currentUser?.email ?? "";

  if (currentUser !== null && !isAdmin) {
    return null;
  }

  return (
    <Fragment>
      <Seo title={t("dashboards")} />
      <div className="min-h-[60vh] w-full min-w-0 px-3 py-2 sm:px-4 sm:py-4 md:px-6">
        {/* Welcome strip - 테마 box 스타일 + 둥근 모서리 */}
        <div className="box overflow-hidden !rounded-3xl !mb-4 sm:!mb-6 md:!mb-8 border border-defaultborder dark:border-white/10 bg-gradient-to-r from-primary/[0.06] to-transparent dark:from-primary/10 dark:to-transparent">
          <div className="box-body !p-4 sm:!p-5 flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <i className="ri-dashboard-3-line text-xl sm:text-2xl text-primary" aria-hidden />
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

        {/* 지표 카드 3개 - 모바일 1열, sm 3열 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatCard
            title={t("dashboardTotalUsers")}
            value={totalUsers}
            iconClass="ri-user-line"
            accent="primary"
            href="/users"
            linkLabel={t("dashboardGoUsers")}
          />
          <StatCard
            title={t("dashboardValuebetCount")}
            value={null}
            iconClass="ri-line-chart-line"
            accent="info"
            href="/valuebet"
            linkLabel={t("dashboardGoValuebet")}
            noFetch
          />
          <StatCard
            title={t("dashboardSurebetCount")}
            value={null}
            iconClass="ri-pie-chart-2-line"
            accent="success"
            href="/surebet"
            linkLabel={t("dashboardGoSurebet")}
            noFetch
          />
        </div>

        {/* 바로가기 - 모바일 1열, sm 2열, xl 4열 */}
        <section className="min-w-0">
          <h2 className="text-[0.75rem] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-white/50 mb-3 sm:mb-4">
            {t("dashboardQuickLinks")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {QUICK_LINKS.map((item) => (
              <QuickLinkCard
                key={item.href}
                href={item.href}
                label={t(item.labelKey)}
                description={t(item.descKey)}
                iconClass={item.icon}
                color={item.color}
              />
            ))}
          </div>
        </section>
      </div>
    </Fragment>
  );
}

DashboardPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
