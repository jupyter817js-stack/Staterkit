'use client';

import React, { Fragment, useCallback, useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Seo from "@/shared/layout-components/seo/seo";
import { getCurrentUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import { USER_LEVEL } from "@/shared/types/users";
import { useRouter } from "next/router";
import { listPaymentHistory } from "@/shared/api/payment-history";
import type { PaymentHistoryItem } from "@/shared/types/payment-history";
import PaymentsPageHeader from "./components/payments/PaymentsPageHeader";
import PaymentHistoryTable from "./components/payments/PaymentHistoryTable";

export default function PaymentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess =
    currentUser &&
    (currentUser.level === USER_LEVEL.SUPER_ADMIN ||
      currentUser.level === USER_LEVEL.ADMIN);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getCurrentUser();
      setCurrentUser(me ?? null);
      if (!me) return;
      if (me.level !== USER_LEVEL.SUPER_ADMIN && me.level !== USER_LEVEL.ADMIN) {
        setLoading(false);
        return;
      }
      const res = await listPaymentHistory({});
      setItems(res.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 이력을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !currentUser) {
    return (
      <Fragment>
        <Seo title="결제 이력 관리" />
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12">
            <div className="box border-0 shadow-none bg-transparent dark:bg-transparent">
              <div className="box-body flex items-center justify-center py-20">
                <i className="ri-loader-4-line text-4xl text-primary animate-spin"></i>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  if (!canAccess) {
    return (
      <Fragment>
        <Seo title="결제 이력 관리" />
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12">
            <div className="box">
              <div className="box-body flex flex-col items-center justify-center py-20">
                <span className="!w-16 !h-16 rounded-2xl bg-danger/10 inline-flex items-center justify-center text-danger mb-4">
                  <i className="ri-lock-line text-3xl"></i>
                </span>
                <p className="text-defaulttextcolor dark:text-white/80 text-[0.9375rem] mb-0 font-medium">
                  접근 권한이 없습니다.
                </p>
                <p className="text-[#8c9097] dark:text-white/50 text-[0.8125rem] mt-1">
                  결제 이력 관리는 관리자 이상만 이용할 수 있습니다.
                </p>
                <button
                  type="button"
                  className="ti-btn ti-btn-primary mt-4 btn-wave !font-medium !text-[0.85rem] !rounded-[0.35rem] !py-[0.51rem] !px-[0.86rem]"
                  onClick={() => router.push("/login")}
                >
                  홈으로
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
      <Seo title="결제 이력 관리" />
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <PaymentsPageHeader onRefresh={fetchData} loading={loading} />
          {error && (
            <div className="alert alert-danger mb-4 flex" role="alert">
              <i className="ri-error-warning-line me-2 text-[1.125rem]"></i>
              <span className="text-[0.875rem]">{error}</span>
            </div>
          )}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[1rem] text-defaulttextcolor dark:text-defaulttextcolor/80 mb-0 flex items-center gap-2">
                <i className="ri-bank-card-line text-primary"></i>
                결제 이력
              </h3>
              <span className="text-[0.8125rem] text-primary font-medium bg-primary/10 dark:bg-primary/20 dark:text-primary rounded-full py-1 px-3">
                {items.length}건
              </span>
            </div>
            <PaymentHistoryTable items={items} loading={loading} />
          </div>
        </div>
      </div>
    </Fragment>
  );
}

PaymentsPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
