'use client';

import React, { Fragment, useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import Seo from "@/shared/layout-components/seo/seo";
import { getCurrentUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import { USER_LEVEL } from "@/shared/types/users";
import { useEntitlements } from "@/shared/hooks/useEntitlements";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { useRouter } from "next/router";

function ApiPageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const entitlements = useEntitlements(currentUser ?? undefined);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  const isAdmin = currentUser?.level === USER_LEVEL.SUPER_ADMIN || currentUser?.level === USER_LEVEL.ADMIN;
  useEffect(() => {
    if (currentUser === null) return;
    if (!isAdmin) router.replace("/valuebet");
  }, [currentUser, isAdmin, router]);

  if (currentUser === null) {
    return (
      <Fragment>
        <Seo title="API" />
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 flex items-center justify-center py-20">
            <i className="ri-loader-4-line text-4xl text-primary animate-spin" />
          </div>
        </div>
      </Fragment>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (!entitlements.api_enabled) {
    return (
      <Fragment>
        <Seo title="API" />
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12">
            <div className="box">
              <div className="box-body flex flex-col items-center justify-center py-20">
                <span className="!w-16 !h-16 rounded-2xl bg-warning/10 inline-flex items-center justify-center text-warning mb-4">
                  <i className="ri-lock-line text-3xl" />
                </span>
                <p className="text-defaulttextcolor dark:text-white/80 text-[0.9375rem] mb-0 font-medium">
                  {t("upgradeRequired")}
                </p>
                <p className="text-[#8c9097] dark:text-white/50 text-[0.8125rem] mt-1">
                  API 사용은 Pro 구독에서 가능합니다.
                </p>
                <button
                  type="button"
                  className="ti-btn ti-btn-primary mt-4 btn-wave"
                  onClick={() => router.push("/subscription")}
                >
                  {t("upgradeToPro")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Seo title="API" />
      <div className="md:flex block items-center justify-between my-[1.5rem] page-header-breadcrumb">
        <div>
          <p className="font-semibold text-[1.125rem] text-defaulttextcolor dark:text-defaulttextcolor/70 !mb-0">
            API
          </p>
          <p className="font-normal text-[#8c9097] dark:text-white/50 text-[0.813rem]">
            API Key 발급 및 Rate Limit 설정 (준비 중)
          </p>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <div className="box">
            <div className="box-body flex flex-col items-center justify-center py-20">
              <span className="!w-14 !h-14 rounded-2xl bg-primary/10 inline-flex items-center justify-center text-primary mb-3">
                <i className="ri-code-line text-2xl" />
              </span>
              <p className="text-[#8c9097] dark:text-white/50 text-[0.8125rem] mb-0">
                API Key 관리 및 문서는 추후 제공될 예정입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

const ApiPage = dynamic(() => Promise.resolve(ApiPageInner), { ssr: false }) as React.ComponentType & { layout?: string };
ApiPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default ApiPage;
