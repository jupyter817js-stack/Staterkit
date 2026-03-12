"use client";

import React, { useState } from "react";
import type { SettlementRecord } from "@/shared/types/partner-store";
import type { SettlementTreeNode } from "@/shared/utils/settlementTree";

const EXPAND_ICON_WIDTH_REM = 1.5;
const AVATAR_WIDTH_REM = 2.5;

function statusLabel(s: string): string {
  if (s === "paid") return "지급완료";
  if (s === "failed") return "실패";
  if (s === "hold" || s === "pending" || s === "calculated") return "계산됨";
  return s;
}

/** 단일 정산 레코드의 "왜 이 금액인지" 공식 설명 */
function FormulaLine({ r }: { r: SettlementRecord }) {
  const formula =
    r.targetType === "store"
      ? `순매출 ${r.netSalesAmount} × 매장수익률 ${r.commissionRatePercent}% = ${r.payoutAmount} USDT`
      : `순매출 ${r.netSalesAmount} × (총판수익률−매장수익률) ${r.commissionRatePercent}% = ${r.payoutAmount} USDT`;
  return (
    <div className="text-[0.75rem] text-[#5a5e66] dark:text-white/60 flex flex-wrap items-center gap-x-1 gap-y-0.5">
      <span className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
        {formula}
      </span>
      <span className="text-[#8c9097] dark:text-white/40">
        {r.periodStart} ~ {r.periodEnd}
      </span>
      <span
        className={
          r.status === "paid"
            ? "text-success"
            : r.status === "failed"
              ? "text-danger"
              : "text-warning"
        }
      >
        {statusLabel(r.status)}
      </span>
    </div>
  );
}

interface SettlementTreeViewProps {
  treeRoots: SettlementTreeNode[];
  /** 총 순매출(USDT). 있으면 슈퍼관리자 행에 총수익·본사수익·총정산액 요약 표시 */
  totalNetSales?: number | null;
  /** 총 지급 예정액(USDT). 본사수익 = totalNetSales - totalPayoutAmount */
  totalPayoutAmount?: number;
}

function formatUsdt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function SettlementTreeView({ treeRoots, totalNetSales, totalPayoutAmount }: SettlementTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["root"]));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function renderRow(node: SettlementTreeNode, depth: number): React.ReactNode {
    const paddingLeftRem = 0.75 + depth * AVATAR_WIDTH_REM;
    const isChild = depth > 0;

    if (node.type === "root") {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedIds.has("root");
      return (
        <React.Fragment key="root">
          <tr className="bg-primary/5 dark:bg-primary/10 border-b border-defaultborder/60 dark:border-white/10">
            <td
              className="py-3 pr-3 align-top font-semibold"
              style={{ paddingLeft: `${paddingLeftRem}rem` }}
              colSpan={2}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{ width: `${EXPAND_ICON_WIDTH_REM}rem` }}
                  className="shrink-0 flex justify-center"
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10"
                      onClick={() => toggleExpand("root")}
                      aria-label={isExpanded ? "접기" : "펼치기"}
                    >
                      <i
                        className={`ri-arrow-right-s-line text-[1rem] transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </button>
                  ) : null}
                </span>
                <i className="ri-shield-star-line text-primary text-[1.1rem]" aria-hidden />
                <span className="text-defaulttextcolor dark:text-white/90">{node.label}</span>
                {totalNetSales != null && (
                  <div className="ml-3 sm:ml-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] sm:text-[0.8125rem] font-medium">
                    <span className="text-defaulttextcolor dark:text-white/80 whitespace-nowrap">
                      총수익: <span className="text-primary font-semibold">{formatUsdt(totalNetSales)} USDT</span>
                    </span>
                    <span className="text-muted hidden sm:inline">|</span>
                    <span className="text-defaulttextcolor dark:text-white/80 whitespace-nowrap">
                      본사수익: <span className="font-semibold">{formatUsdt(totalNetSales - (totalPayoutAmount ?? 0))} USDT</span>
                    </span>
                    <span className="text-muted hidden sm:inline">|</span>
                    <span className="text-defaulttextcolor dark:text-white/80 whitespace-nowrap">
                      총정산액: <span className="font-semibold">{formatUsdt(totalPayoutAmount ?? 0)} USDT</span>
                    </span>
                  </div>
                )}
              </div>
            </td>
          </tr>
          {hasChildren && isExpanded && node.children.map((child) => renderRow(child, depth + 1))}
        </React.Fragment>
      );
    }

    if (node.type === "partner") {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedIds.has(node.id);
      const hasRecords = node.records.length > 0;
      return (
        <React.Fragment key={node.id}>
          <tr className="hover:bg-primary/[0.05] dark:hover:bg-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02]">
            <td
              className={`py-2.5 sm:py-3 pr-3 align-top ${isChild ? "border-l-4 border-l-primary/50" : ""}`}
              style={{ paddingLeft: `${paddingLeftRem}rem` }}
              colSpan={2}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  style={{ width: `${EXPAND_ICON_WIDTH_REM}rem` }}
                  className="shrink-0 flex justify-center"
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10"
                      onClick={() => toggleExpand(node.id)}
                    >
                      <i
                        className={`ri-arrow-right-s-line text-[1rem] transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </button>
                  ) : (
                    <span style={{ width: `${EXPAND_ICON_WIDTH_REM}rem` }} />
                  )}
                </span>
                <i className="ri-team-line text-primary/80 text-[1rem]" aria-hidden />
                <span className="font-semibold text-[0.8125rem] text-defaulttextcolor dark:text-white/80">
                  총판 · {node.label}
                </span>
                {hasRecords && (
                  <span className="text-[0.7rem] text-[#6b7280] dark:text-white/50">
                    수익률 {node.partner.commissionRatePercent}%
                  </span>
                )}
              </div>
              {hasRecords && (
                <div className="mt-2 ml-6 space-y-1">
                  {node.records.map((r, i) => (
                    <FormulaLine key={r.id ?? i} r={r} />
                  ))}
                </div>
              )}
            </td>
          </tr>
          {hasChildren && isExpanded && node.children.map((child) => renderRow(child, depth + 1))}
        </React.Fragment>
      );
    }

    // store
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const hasRecords = node.records.length > 0;
    return (
      <React.Fragment key={node.id}>
        <tr className="hover:bg-primary/[0.05] dark:hover:bg-white/[0.04] bg-white/50 dark:bg-white/[0.02]">
          <td
            className={`py-2.5 sm:py-3 pr-3 align-top ${isChild ? "border-l-4 border-l-primary/40" : ""}`}
            style={{ paddingLeft: `${paddingLeftRem}rem` }}
            colSpan={2}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                style={{ width: `${EXPAND_ICON_WIDTH_REM}rem` }}
                className="shrink-0 flex justify-center"
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10"
                    onClick={() => toggleExpand(node.id)}
                  >
                    <i
                      className={`ri-arrow-right-s-line text-[1rem] transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>
                ) : (
                  <span style={{ width: `${EXPAND_ICON_WIDTH_REM}rem` }} />
                )}
              </span>
              <i className="ri-store-2-line text-primary/70 text-[1rem]" aria-hidden />
              <span className="font-semibold text-[0.8125rem] text-defaulttextcolor dark:text-white/80">
                매장 · {node.label}
              </span>
              {hasRecords && (
                <span className="text-[0.7rem] text-[#6b7280] dark:text-white/50">
                  수익률 {node.store.commissionRatePercent}%
                </span>
              )}
            </div>
            {hasRecords && (
              <div className="mt-2 ml-6 space-y-1">
                {node.records.map((r, i) => (
                  <FormulaLine key={r.id ?? i} r={r} />
                ))}
              </div>
            )}
          </td>
        </tr>
        {hasChildren && isExpanded && node.children.map((child) => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-defaultborder/70 dark:border-white/10 bg-white dark:bg-bodybg shadow-lg shadow-black/5 dark:shadow-black/20">
      <div className="overflow-x-auto -mx-2 sm:mx-0 scrollbar-thin">
        <table className="w-full min-w-[28rem] text-[0.75rem] sm:text-[0.8125rem] border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-100/90 to-gray-50/80 dark:from-white/[0.06] dark:to-white/[0.02] border-b-2 border-defaultborder/80 dark:border-white/10">
              <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 pl-4 pr-3">
                <span className="inline-flex items-center gap-1.5">
                  <i className="ri-node-tree text-[0.95rem] opacity-80" aria-hidden />
                  수익 구조 (관리자별)
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-defaultborder/60 dark:divide-white/10">
            {treeRoots.map((root) => renderRow(root, 0))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
