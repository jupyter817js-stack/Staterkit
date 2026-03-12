'use client';

import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Seo from "@/shared/layout-components/seo/seo";
import { getCurrentUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import { USER_LEVEL } from "@/shared/types/users";
import { useRouter } from "next/router";
import {
  listSettlements,
  getSettlementsTree,
  mapSettlementsTreeToNodes,
  type ListSettlementsParams,
} from "@/shared/api/settlements";
import type { SettlementRecord } from "@/shared/types/partner-store";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { getPartner, listPartners } from "@/shared/api/partners";
import { getStore, listStores } from "@/shared/api/stores";
import type { Partner } from "@/shared/types/partner-store";
import type { Store } from "@/shared/types/partner-store";
import { buildSettlementTree, sumTotalPayoutFromTree } from "@/shared/utils/settlementTree";
import type { SettlementTreeNode } from "@/shared/utils/settlementTree";
import SettlementTreeView from "./components/settlements/SettlementTreeView";

/** 당월 1일 ~ 말일을 YYYY-MM-DD 로 반환 */
function getDefaultPeriod(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

export default function SettlementsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [params, setParams] = useState<ListSettlementsParams>(() => ({
    per_page: 100,
    ...getDefaultPeriod(),
  }));
  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");
  const [treeNodesFromApi, setTreeNodesFromApi] = useState<SettlementTreeNode[] | null>(null);
  const [treeTotalPayoutFromApi, setTreeTotalPayoutFromApi] = useState<number | null>(null);
  const [treeTotalNetSalesFromApi, setTreeTotalNetSalesFromApi] = useState<number | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);

  const isAdmin =
    currentUser &&
    (currentUser.level === USER_LEVEL.SUPER_ADMIN || currentUser.level === USER_LEVEL.ADMIN);
  const isPartner = currentUser?.level === USER_LEVEL.PARTNER;
  const isStore = currentUser?.level === USER_LEVEL.STORE;
  const canAccess = isAdmin || isPartner || isStore;

  const managedPartnerId =
    (currentUser as CurrentUser & { managed_partner_id?: string })?.managed_partner_id ??
    (currentUser as CurrentUser & { managedPartnerId?: string })?.managedPartnerId ??
    null;
  const managedStoreId =
    (currentUser as CurrentUser & { managed_store_id?: string })?.managed_store_id ??
    (currentUser as CurrentUser & { managedStoreId?: string })?.managedStoreId ??
    null;

  const load = useCallback(async () => {
    const r = await listSettlements(params);
    setRecords(r.records);
  }, [params]);

  const loadPartnersStores = useCallback(async () => {
    if (!currentUser) return;
    if (isAdmin) {
      const [pList, sList] = await Promise.all([listPartners(), listStores()]);
      setPartners(Array.isArray(pList) ? pList : []);
      setStores(Array.isArray(sList) ? sList : []);
    } else if (isPartner && managedPartnerId) {
      const [p, sList] = await Promise.all([getPartner(managedPartnerId), listStores(managedPartnerId)]);
      setPartners(p ? [p] : []);
      setStores(Array.isArray(sList) ? sList : []);
    } else if (isStore && managedStoreId) {
      const s = await getStore(managedStoreId);
      if (s?.partnerId) {
        const p = await getPartner(s.partnerId);
        setPartners(p ? [p] : []);
        setStores(s ? [s] : []);
      } else {
        setPartners([]);
        setStores(s ? [s] : []);
      }
    }
  }, [currentUser, isAdmin, isPartner, isStore, managedPartnerId, managedStoreId]);

  useEffect(() => {
    getCurrentUser().then((me) => {
      setCurrentUser(me ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (canAccess) {
      load();
      loadPartnersStores();
    }
  }, [canAccess, load, loadPartnersStores]);

  // 트리 뷰 + 기간 선택 시 GET /api/v1/settlements/tree 사용
  useEffect(() => {
    if (!canAccess || viewMode !== "tree" || !params.periodStart || !params.periodEnd) {
      setTreeNodesFromApi(null);
      setTreeTotalPayoutFromApi(null);
      setTreeTotalNetSalesFromApi(null);
      return;
    }
    setTreeLoading(true);
    getSettlementsTree(params.periodStart, params.periodEnd)
      .then((res) => {
        if (res) {
          setTreeNodesFromApi(mapSettlementsTreeToNodes(res));
          setTreeTotalPayoutFromApi(
            res.totalPayoutAmount != null ? res.totalPayoutAmount : null
          );
          setTreeTotalNetSalesFromApi(
            res.totalNetSales != null ? res.totalNetSales : null
          );
        } else {
          setTreeNodesFromApi(null);
          setTreeTotalPayoutFromApi(null);
          setTreeTotalNetSalesFromApi(null);
        }
      })
      .catch(() => {
        setTreeNodesFromApi(null);
        setTreeTotalPayoutFromApi(null);
        setTreeTotalNetSalesFromApi(null);
      })
      .finally(() => setTreeLoading(false));
  }, [canAccess, viewMode, params.periodStart, params.periodEnd]);

  const settlementTreeRoots = useMemo((): SettlementTreeNode[] => {
    if (viewMode === "tree" && treeNodesFromApi != null && treeNodesFromApi.length > 0) {
      return treeNodesFromApi;
    }
    return buildSettlementTree(partners, stores, records);
  }, [viewMode, treeNodesFromApi, partners, stores, records]);

  const totalPayoutAmount = useMemo((): number => {
    if (viewMode === "tree" && treeTotalPayoutFromApi != null) {
      return treeTotalPayoutFromApi;
    }
    return sumTotalPayoutFromTree(settlementTreeRoots);
  }, [viewMode, treeTotalPayoutFromApi, settlementTreeRoots]);

  const totalNetSales = useMemo((): number | null => {
    if (viewMode === "tree" && treeTotalNetSalesFromApi != null) {
      return treeTotalNetSalesFromApi;
    }
    return null;
  }, [viewMode, treeTotalNetSalesFromApi]);

  if (loading) {
    return (
      <Fragment>
        <Seo title={t("settlementManagement")} />
        <div className="box-body flex items-center justify-center py-20">
          <i className="ri-loader-4-line text-4xl text-primary animate-spin" />
        </div>
      </Fragment>
    );
  }

  if (!canAccess) {
    router.replace("/login");
    return null;
  }

  const statusLabel = (s: string) => {
    if (s === "paid") return "지급완료";
    if (s === "failed") return "실패";
    if (s === "hold" || s === "pending" || s === "calculated") return "계산됨";
    return s;
  };

  return (
    <Fragment>
      <Seo title={t("settlementManagement")} />
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <div className="box border-0 shadow-none bg-transparent dark:bg-transparent">
            <div className="box-body p-0">
              <h5 className="font-semibold mb-4">{t("settlementManagement")}</h5>
              <p className="text-[0.8125rem] text-defaulttextcolor/70 dark:text-white/70 mb-4">
                선택한 기간의 순매출을 기준으로, 총판·매장별로 <strong>누가 얼마를 받아야 하는지</strong> 계산한 내역입니다. (실제 자동 지급 기능은 추후 구현 예정)
              </p>

              {/* 수익 구조 설명 */}
              <details className="mb-6 rounded-xl border border-defaultborder/60 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] overflow-hidden">
                <summary className="px-4 py-3 cursor-pointer font-medium text-defaulttextcolor dark:text-white/90 select-none flex items-center gap-2">
                  <i className="ri-information-line text-primary" />
                  수익 구조 (왜 이 금액인지)
                </summary>
                <div className="px-4 pb-4 pt-1 text-[0.8125rem] text-defaulttextcolor/80 dark:text-white/80 space-y-2">
                  <p>
                    <strong>총판 하위 매장</strong> 예시 (순매출 100 USDT, 총판 수익률 40%, 매장 수익률 30%):
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>매장 수익 = 순매출 × 매장 수익률 → 100 × 30% = <strong>30 USDT</strong></li>
                    <li>총판 수익 = 순매출 × (총판 수익률 − 매장 수익률) → 100 × (40% − 30%) = <strong>10 USDT</strong></li>
                    <li>본사 수익 = 순매출 − 매장 수익 − 총판 수익 = <strong>60 USDT</strong></li>
                  </ul>
                  <p>
                    실제 정산 계산 시에는 <strong>DB에 저장된 총판·매장별 수익률</strong>을 사용합니다. 본사 직속 매장은 매장 수익만, 총판 직속 회원은 총판 수익률만 적용됩니다.
                  </p>
                </div>
              </details>

              {/* 뷰 전환 + 기간 선택: 반응형 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3 sm:gap-4 mb-6 p-4 rounded-xl border border-defaultborder/60 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03]">
                <div className="flex items-center gap-2">
                  <span className="text-[0.8125rem] font-medium text-defaulttextcolor dark:text-white/80 whitespace-nowrap">
                    보기
                  </span>
                  <div className="inline-flex rounded-lg overflow-hidden border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg shadow-sm">
                    <button
                      type="button"
                      onClick={() => setViewMode("tree")}
                      className={`px-3 py-2 text-[0.8125rem] font-medium transition-colors ${viewMode === "tree" ? "bg-primary text-white" : "text-defaulttextcolor/70 hover:bg-gray-100 dark:hover:bg-white/10"}`}
                    >
                      <i className="ri-node-tree align-middle mr-1.5" />
                      트리
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-2 text-[0.8125rem] font-medium transition-colors ${viewMode === "table" ? "bg-primary text-white" : "text-defaulttextcolor/70 hover:bg-gray-100 dark:hover:bg-white/10"}`}
                    >
                      <i className="ri-list-unordered align-middle mr-1.5" />
                      목록
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-[0.8125rem] font-medium text-defaulttextcolor dark:text-white/80 whitespace-nowrap">
                    기간
                  </span>
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <input
                      type="date"
                      className="ti-form-control !text-[0.8125rem] !py-2 !px-3 w-full min-w-0 sm:w-[10.5rem] max-w-[12rem]"
                      value={params.periodStart ?? ""}
                      onChange={(e) => setParams((prev) => ({ ...prev, periodStart: e.target.value || undefined }))}
                    />
                    <span className="text-defaulttextcolor/60 dark:text-white/50 shrink-0">~</span>
                    <input
                      type="date"
                      className="ti-form-control !text-[0.8125rem] !py-2 !px-3 w-full min-w-0 sm:w-[10.5rem] max-w-[12rem]"
                      value={params.periodEnd ?? ""}
                      onChange={(e) => setParams((prev) => ({ ...prev, periodEnd: e.target.value || undefined }))}
                    />
                  </div>
                </div>
              </div>

              {viewMode === "tree" ? (
                <>
                  {!params.periodStart || !params.periodEnd ? (
                    <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-4">
                      기간을 선택하면 서버에서 트리 구조를 불러옵니다.
                    </p>
                  ) : null}
                  {treeLoading ? (
                    <div className="box flex items-center justify-center py-16">
                      <i className="ri-loader-4-line text-4xl text-primary animate-spin" />
                    </div>
                  ) : (
                    <SettlementTreeView
                      treeRoots={settlementTreeRoots}
                      totalNetSales={totalNetSales}
                      totalPayoutAmount={totalPayoutAmount}
                    />
                  )}
                </>
              ) : (
                <div className="box">
                  <div className="box-body overflow-x-auto">
                    {records.length === 0 ? (
                      <p className="text-[0.8125rem] text-defaulttextcolor/70">정산 내역이 없습니다.</p>
                    ) : (
                      <table className="table min-w-full text-[0.8125rem]">
                        <thead>
                          <tr>
                            <th>{t("period")}</th>
                            <th>{t("targetType")}</th>
                            <th>대상 ID</th>
                            <th>순매출</th>
                            <th>수익률</th>
                            <th>{t("payoutAmount")}</th>
                            <th>네트워크</th>
                            <th>상태</th>
                            <th>{t("txHash")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r, i) => (
                            <tr key={r.id ?? i}>
                              <td>
                                {r.periodStart} ~ {r.periodEnd}
                              </td>
                              <td>{r.targetType === "partner" ? "총판" : "매장"}</td>
                              <td>{r.targetId}</td>
                              <td>{r.netSalesAmount} USDT</td>
                              <td>{r.commissionRatePercent}%</td>
                              <td>{r.payoutAmount} USDT</td>
                              <td>{r.network}</td>
                              <td>{statusLabel(r.status)}</td>
                              <td className="max-w-[8rem] truncate" title={r.txHash ?? undefined}>
                                {r.txHash || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

SettlementsPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
