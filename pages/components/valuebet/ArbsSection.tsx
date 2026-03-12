import React from "react";
import type { ArbItem } from "@/shared/types/valuebets";
import { formatProfitPercent } from "@/shared/utils/formatProfitPercent";

interface ArbsSectionProps {
  arbs: ArbItem[];
  loading?: boolean;
}

function formatArbTime(ts: number): string {
  try {
    const d = new Date(ts * 1000);
    return d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export default function ArbsSection({ arbs, loading }: ArbsSectionProps) {
  if (loading || !arbs?.length) return null;

  const displayArbs = arbs.slice(0, 20);
  const hasMore = arbs.length > 20;

  return (
    <div className="box mt-6">
      <div className="box-header justify-between">
        <div className="box-title flex items-center gap-2">
          <i className="ri-pie-chart-2-line text-[1rem] text-secondary"></i>
          아비트리지 (Arbs)
        </div>
      </div>
      <div className="box-body p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-full whitespace-nowrap table-hover border table-bordered mb-0">
            <thead>
              <tr className="border border-inherit border-solid dark:border-defaultborder/10 bg-gray-50 dark:bg-black/[0.05]">
                <th scope="col" className="!text-start !text-[0.85rem] !ps-4 !pe-5 !py-3 font-semibold">
                  경기
                </th>
                <th scope="col" className="!text-start !text-[0.85rem] !py-3 font-semibold">
                  리그
                </th>
                <th scope="col" className="!text-start !text-[0.85rem] !py-3 font-semibold">
                  수익률(%)
                </th>
                <th scope="col" className="!text-start !text-[0.85rem] !py-3 font-semibold">
                  타입
                </th>
                <th scope="col" className="!text-start !text-[0.85rem] !py-3 font-semibold">
                  배당 범위
                </th>
                <th scope="col" className="!text-start !text-[0.85rem] !py-3 font-semibold">
                  시작 시간
                </th>
              </tr>
            </thead>
            <tbody>
              {displayArbs.map((arb) => (
                <tr
                  key={arb.id}
                  className="border border-inherit border-solid hover:bg-gray-100 dark:border-defaultborder/10 dark:hover:bg-light"
                >
                  <td className="!ps-4 !pe-5 !py-3 !text-[0.8125rem] font-medium">
                    {arb.event_name}
                  </td>
                  <td className="!py-3 !text-[0.8125rem] text-[#8c9097] dark:text-white/50">
                    {arb.league}
                  </td>
                  <td className="!py-3 !text-[0.8125rem] font-semibold text-success">
                    {formatProfitPercent(Number(arb.percent))}
                  </td>
                  <td className="!py-3 !text-[0.8125rem]">
                    {arb.arb_type}
                  </td>
                  <td className="!py-3 !text-[0.8125rem]">
                    {Number(arb.min_koef).toFixed(2)} ~ {Number(arb.max_koef).toFixed(2)}
                  </td>
                  <td className="!py-3 !text-[0.8125rem] whitespace-nowrap">
                    {formatArbTime(arb.started_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {hasMore && (
        <div className="box-footer">
          <div className="text-defaulttextcolor dark:text-defaulttextcolor/70 text-[0.8125rem]">
            상위 20건 표시 (총 <span className="font-medium">{arbs.length}</span>건)
          </div>
        </div>
      )}
    </div>
  );
}
