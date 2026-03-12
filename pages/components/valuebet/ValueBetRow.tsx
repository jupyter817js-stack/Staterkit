import React from "react";
import type { ValueBetItem } from "@/shared/types/valuebets";

interface ValueBetRowProps {
  bet: ValueBetItem;
}

function formatStartTime(ts: number): string {
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

export default function ValueBetRow({ bet }: ValueBetRowProps) {
  const eventName = bet.event_name || `${bet.home} - ${bet.away}`;
  const league = bet.league_name ?? bet.league ?? "-";

  return (
    <tr className="border border-inherit border-solid hover:bg-gray-100 dark:border-defaultborder/10 dark:hover:bg-light">
      <td className="!ps-4 !pe-5 !py-3 !text-[0.8125rem] font-medium">
        {eventName}
      </td>
      <td className="!py-3 !text-[0.8125rem] text-[#8c9097] dark:text-white/50">
        {league}
      </td>
      <td className="!py-3 !text-[0.8125rem] whitespace-nowrap">
        {formatStartTime(bet.started_at)}
      </td>
      <td className="!py-3 !text-[0.8125rem] font-semibold">
        {Number(bet.koef).toFixed(2)}
      </td>
      <td className="!py-3">
        {bet.is_value_bet ? (
          <span className="inline-flex items-center gap-1 text-success !py-[0.2rem] !px-[0.5rem] rounded-md !font-semibold !text-[0.75em] bg-success/10 border border-success/20">
            <i className="ri-checkbox-circle-fill text-[0.9em]"></i>
            Value
          </span>
        ) : (
          <span className="text-[#8c9097] dark:text-white/50 text-[0.75em]">-</span>
        )}
      </td>
    </tr>
  );
}
