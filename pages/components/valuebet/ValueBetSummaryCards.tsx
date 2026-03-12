import React from "react";

interface ValueBetSummaryCardsProps {
  betsCount: number;
  valueBetsCount: number;
  arbsCount: number;
}

export default function ValueBetSummaryCards({
  betsCount,
  valueBetsCount,
  arbsCount,
}: ValueBetSummaryCardsProps) {
  const cards = [
    {
      label: "전체 베팅",
      value: betsCount,
      icon: "ri-file-list-3-line",
      bg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "밸류 벳",
      value: valueBetsCount,
      icon: "ri-arrow-up-circle-line",
      bg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      label: "아비트리지",
      value: arbsCount,
      icon: "ri-pie-chart-2-line",
      bg: "bg-secondary/10",
      iconColor: "text-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="xxl:col-span-4 lg:col-span-4 col-span-12"
        >
          <div className="box overflow-hidden">
            <div className="box-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#8c9097] dark:text-white/50 text-[0.813rem] mb-1">
                    {card.label}
                  </p>
                  <h4 className="font-semibold text-[1.5rem] text-defaulttextcolor dark:text-defaulttextcolor/70 !mb-0">
                    {card.value.toLocaleString()}
                  </h4>
                </div>
                <span
                  className={`!w-11 !h-11 !rounded-lg inline-flex items-center justify-center flex-shrink-0 ${card.bg} ${card.iconColor}`}
                >
                  <i className={`${card.icon} text-[1.25rem]`}></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
