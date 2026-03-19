import React from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { getSportIconClass, getSportImageSrc } from "@/shared/utils/valuebet/sport-icon-utils";
import type { ValueBetTipDisplay } from "@/shared/utils/valuebet/valuebet-utils";
import { formatProfitPercent } from "@/shared/utils/formatProfitPercent";

interface ValueBetTipCardProps {
  tip: ValueBetTipDisplay;
  bookmakerName: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

type BetVisual = {
  iconClass: string;
  wrapperClass: string;
  iconColorClass: string;
};

const lightHexPatternStyle: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(30deg, rgba(255,255,255,0.13) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.13) 87.5%, rgba(255,255,255,0.13))",
    "linear-gradient(150deg, rgba(255,255,255,0.13) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.13) 87.5%, rgba(255,255,255,0.13))",
    "linear-gradient(30deg, rgba(255,255,255,0.06) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.06) 87.5%, rgba(255,255,255,0.06))",
    "linear-gradient(150deg, rgba(255,255,255,0.06) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.06) 87.5%, rgba(255,255,255,0.06))",
    "linear-gradient(60deg, rgba(255,255,255,0.08) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.08) 75%, rgba(255,255,255,0.08))",
    "linear-gradient(60deg, rgba(255,255,255,0.04) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.04) 75%, rgba(255,255,255,0.04))",
  ].join(", "),
  backgroundSize: "20px 34px",
  backgroundPosition: "0 0, 0 0, 10px 17px, 10px 17px, 0 0, 10px 17px",
  opacity: 0.1,
};

const darkHexPatternStyle: React.CSSProperties = {
  ...lightHexPatternStyle,
  opacity: 0.18,
  mixBlendMode: "screen",
};

const oddPanelOuterStyle: React.CSSProperties = {
  transform: "skewX(-18deg)",
};

const oddPanelInnerStyle: React.CSSProperties = {
  transform: "skewX(18deg)",
};

function getBetVisual(text: string): BetVisual {
  const value = text.toLowerCase();

  if (value.includes("over") || value.includes("오버")) {
    return {
      iconClass: "ri-arrow-up-circle-line",
      wrapperClass: "bg-emerald-200/[0.08]",
      iconColorClass: "text-emerald-100",
    };
  }

  if (value.includes("under") || value.includes("언더")) {
    return {
      iconClass: "ri-arrow-down-circle-line",
      wrapperClass: "bg-sky-200/[0.08]",
      iconColorClass: "text-sky-100",
    };
  }

  if (value.includes("away") || value.includes("원정")) {
    return {
      iconClass: "ri-road-map-line",
      wrapperClass: "bg-amber-200/[0.08]",
      iconColorClass: "text-amber-100",
    };
  }

  if (value.includes("draw") || value.includes("무승부") || value === "x") {
    return {
      iconClass: "ri-pause-circle-line",
      wrapperClass: "bg-slate-200/[0.08]",
      iconColorClass: "text-slate-100",
    };
  }

  if (value.includes("yes") || value.includes("예")) {
    return {
      iconClass: "ri-check-line",
      wrapperClass: "bg-emerald-200/[0.08]",
      iconColorClass: "text-emerald-100",
    };
  }

  if (value.includes("no") || value.includes("아니오")) {
    return {
      iconClass: "ri-close-line",
      wrapperClass: "bg-rose-200/[0.08]",
      iconColorClass: "text-rose-100",
    };
  }

  if (value.includes("home") || value.includes("홈")) {
    return {
      iconClass: "ri-home-4-line",
      wrapperClass: "bg-fuchsia-200/[0.08]",
      iconColorClass: "text-fuchsia-100",
    };
  }

  return {
    iconClass: "ri-focus-2-line",
    wrapperClass: "bg-white/[0.06]",
    iconColorClass: "text-white",
  };
}

function getMatchTextClass(matchLabel: string): string {
  if (matchLabel.length > 58) return "text-[0.78rem]";
  if (matchLabel.length > 52) return "text-[0.86rem]";
  if (matchLabel.length > 46) return "text-[0.94rem]";
  if (matchLabel.length > 40) return "text-[1.02rem]";
  if (matchLabel.length > 34) return "text-[1.12rem]";
  if (matchLabel.length > 28) return "text-[1.24rem]";
  return "text-[1.38rem]";
}

function getMarketTextClass(marketSummary: string): string {
  if (marketSummary.length > 58) return "text-[0.6rem]";
  if (marketSummary.length > 50) return "text-[0.66rem]";
  if (marketSummary.length > 44) return "text-[0.72rem]";
  if (marketSummary.length > 38) return "text-[0.78rem]";
  if (marketSummary.length > 32) return "text-[0.84rem]";
  return "text-[0.9rem]";
}

function getBetTextClass(betLabel: string): string {
  if (betLabel.length > 30) return "text-[0.86rem]";
  if (betLabel.length > 24) return "text-[0.96rem]";
  if (betLabel.length > 18) return "text-[1.06rem]";
  return "text-[1.18rem]";
}

function buildMarketSummary(marketLabel: string, betLabel: string): string {
  const cleanMarket = marketLabel.trim();
  const cleanBet = betLabel.trim();

  if (!cleanBet || cleanBet === "\u2014") return cleanMarket;
  if (cleanMarket.toLowerCase().includes(cleanBet.toLowerCase())) return cleanMarket;

  return `${cleanMarket} - ${cleanBet}`;
}

function formatPolymarketValue(odd: number): string {
  if (!Number.isFinite(odd) || odd <= 0) return "-";
  return (100 / odd).toFixed(2).replace(/\.?0+$/, "");
}

export default function ValueBetTipCard({
  tip,
  bookmakerName,
  isSelected = false,
  onSelect,
}: ValueBetTipCardProps) {
  const { t, lang } = useLanguage();
  const betLabel =
    tip.lineLabel && tip.lineLabel !== "-" ? tip.lineLabel : tip.marketLabel || "\u2014";
  const matchLabel = `${tip.homeName} vs ${tip.awayName}`;
  const marketSummary = buildMarketSummary(tip.marketLabel, betLabel);
  const betVisual = getBetVisual(`${marketSummary} ${betLabel}`);
  const isPolymarket = bookmakerName.trim().toLowerCase().includes("polymarket");
  const polymarketValue = isPolymarket ? formatPolymarketValue(tip.koef) : null;
  const maxBetLabel = lang === "ko" ? "최대 베팅금액" : "Max Bet";
  const bookmakerTextClass =
    bookmakerName.length > 18 ? "text-[0.9rem]" : bookmakerName.length > 13 ? "text-[1rem]" : "text-[1.1rem]";
  const sportImageSrc = getSportImageSrc(tip.sport);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={`group relative h-full w-full cursor-pointer overflow-hidden rounded-[1.65rem]
        backdrop-blur-[2px]
        transition-all duration-200 ease-out active:scale-[0.98]
        ${
          isSelected
            ? "shadow-[0_0_0_1px_rgba(208,168,255,0.26),0_0_24px_rgba(154,92,244,0.24),0_18px_40px_rgba(96,64,158,0.22)] dark:shadow-[0_0_0_1px_rgba(243,210,255,0.16),0_0_28px_rgba(188,108,255,0.52),0_0_58px_rgba(126,66,236,0.34),0_18px_38px_rgba(30,10,76,0.24)]"
            : "ring-1 ring-violet-300/[0.30] shadow-[0_14px_32px_rgba(108,78,176,0.14)] hover:ring-violet-300/[0.48] hover:shadow-[0_20px_38px_rgba(111,77,186,0.18)] dark:ring-white/[0.16] dark:shadow-[0_16px_34px_rgba(26,9,65,0.14)] dark:hover:ring-amber-200/[0.45] dark:hover:shadow-[0_22px_42px_rgba(31,11,72,0.24)]"
        }`}
    >
      {isSelected ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.65rem] bg-[linear-gradient(135deg,rgba(255,246,255,0.98)_0%,rgba(226,182,255,0.98)_16%,rgba(188,118,255,1)_36%,rgba(143,86,255,1)_58%,rgba(108,72,255,0.98)_76%,rgba(247,214,255,0.98)_100%)] dark:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[2px] rounded-[calc(1.65rem-2px)] bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,rgba(112,76,188,0.88),rgba(88,55,162,0.9)_46%,rgba(60,35,126,0.92)_100%)] dark:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 hidden rounded-[1.65rem] bg-[linear-gradient(135deg,rgba(255,245,255,0.98)_0%,rgba(224,174,255,0.98)_16%,rgba(188,118,255,1)_36%,rgba(143,86,255,1)_58%,rgba(108,72,255,0.98)_76%,rgba(247,214,255,0.98)_100%)] dark:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[2px] hidden rounded-[calc(1.65rem-2px)] bg-[radial-gradient(circle_at_22%_0%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(83,55,142,0.36),rgba(58,34,103,0.34)_48%,rgba(30,19,60,0.48))] dark:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -inset-[4px] rounded-[1.95rem] bg-[radial-gradient(circle_at_50%_50%,rgba(232,186,255,0.34),rgba(166,92,255,0.20)_42%,transparent_74%)] blur-[10px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[2px] rounded-[calc(1.65rem-2px)] border border-fuchsia-100/[0.34] shadow-[inset_0_0_24px_rgba(214,146,255,0.16)] dark:border-fuchsia-100/[0.34]"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.65rem] bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.28),transparent_34%),linear-gradient(135deg,rgba(141,102,220,0.72),rgba(118,80,202,0.74)_46%,rgba(86,56,172,0.76)_100%)] dark:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 hidden rounded-[1.65rem] bg-[radial-gradient(circle_at_22%_0%,rgba(255,255,255,0.10),transparent_34%),linear-gradient(135deg,rgba(83,55,142,0.34),rgba(58,34,103,0.32)_48%,rgba(30,19,60,0.46))] dark:block"
            aria-hidden
          />
        </>
      )}
      <div className="pointer-events-none absolute inset-0 dark:hidden" style={lightHexPatternStyle} aria-hidden />
      <div className="pointer-events-none absolute inset-0 hidden dark:block" style={darkHexPatternStyle} aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(255,214,95,0.08),transparent_22%)] dark:bg-[radial-gradient(circle_at_88%_18%,rgba(255,214,95,0.08),transparent_22%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-[1px] rounded-[calc(1.65rem-1px)] border border-white/[0.16] dark:border-white/[0.09]" aria-hidden />

      <div className="relative z-10 flex h-full min-h-[308px] flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.08] px-3.5 py-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm">
              {sportImageSrc ? (
                <img
                  src={sportImageSrc}
                  alt=""
                  className="h-[2rem] w-[2rem] shrink-0 object-contain drop-shadow-[0_0_10px_rgba(255,214,110,0.24)]"
                  aria-hidden
                />
              ) : (
                <i className={`${getSportIconClass(tip.sport)} shrink-0 text-[1.45rem] text-amber-200 drop-shadow-[0_0_12px_rgba(255,214,110,0.32)]`} aria-hidden />
              )}
              <span className="shrink-0 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-white">
                {tip.sport}
              </span>
              <span className="shrink-0 text-white/40" aria-hidden>
                |
              </span>
              <span
                title={tip.leagueName}
                className="min-w-0 truncate text-[0.82rem] font-semibold text-white/[0.88]"
              >
                {tip.leagueName}
              </span>
            </span>
          </div>
          {bookmakerName ? (
            <div className="flex min-w-fit flex-col items-end shrink-0 pt-1">
              <span
                title={bookmakerName}
                className={`whitespace-nowrap text-right font-black uppercase tracking-[0.06em] text-amber-300 ${bookmakerTextClass}`}
              >
                {bookmakerName}
              </span>
              <span className="mt-1 h-[3px] w-full rounded-full bg-amber-300/95" aria-hidden />
            </div>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <h3
              title={matchLabel}
              className={`min-w-0 overflow-hidden whitespace-nowrap font-extrabold leading-none tracking-[-0.055em] drop-shadow-[0_2px_8px_rgba(25,7,61,0.22)] ${getMatchTextClass(matchLabel)}`}
            >
              <span className="text-white/[0.96]">{tip.homeName}</span>
              <span className="mx-2 text-amber-200 drop-shadow-[0_0_10px_rgba(255,223,125,0.32)]">
                vs
              </span>
              <span className="text-fuchsia-100/[0.96]">{tip.awayName}</span>
            </h3>
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-[1.05rem] font-black uppercase tracking-[0.04em] text-amber-300">
              <i className="ri-calendar-line text-[1.1rem]" aria-hidden />
              {tip.startDateLabel}
            </span>
          </div>

          <div className="relative h-[8px] w-full" aria-hidden>
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-white/[0.26] via-fuchsia-100/[0.58] to-transparent" />
            <div className="absolute left-[14%] right-[20%] top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/[0.18] blur-[3px]" />
            <div className="absolute left-[40%] top-1/2 h-[5px] w-20 -translate-y-1/2 rounded-full bg-amber-200/[0.40] blur-[6px]" />
          </div>

          {tip.periodLabel ? (
            <div className={`min-w-0 whitespace-nowrap font-black uppercase tracking-[0.07em] text-white ${getMarketTextClass(tip.periodLabel)}`}>
              <span>{t("time")} :</span>
              <span className="ml-2 text-amber-200">{tip.periodLabel}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className={`min-w-0 whitespace-nowrap font-black uppercase tracking-[0.07em] text-white ${getMarketTextClass(marketSummary)}`}>
              <span>{t("market")} :</span>
              {marketSummary.includes(" - ") ? (
                <>
                  <span className="ml-2 text-amber-200">{marketSummary.split(" - ")[0]}</span>
                  <span className="text-amber-200/55"> - </span>
                  <span className="text-amber-200">{marketSummary.split(" - ").slice(1).join(" - ")}</span>
                </>
              ) : (
                <span className="ml-2 text-amber-200">{marketSummary}</span>
              )}
            </div>
            <span className="whitespace-nowrap text-[2.5rem] font-black leading-none tracking-[-0.055em] text-amber-300">
              {tip.startTimeLabel}
            </span>
          </div>
        </div>

        <div className="grid min-h-[4.95rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[1.2rem] border border-white/[0.24] bg-violet-950/[0.10] px-3 py-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0 text-[0.92rem] font-black uppercase tracking-[0.08em] text-white">
              {t("bet")} :
            </span>
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${betVisual.wrapperClass}`}>
              <i className={`${betVisual.iconClass} text-[1.46rem] ${betVisual.iconColorClass} drop-shadow-[0_0_10px_rgba(255,255,255,0.12)]`} aria-hidden />
            </span>
            <span
              title={betLabel}
              className={`min-w-0 whitespace-nowrap font-black tracking-[-0.03em] text-white ${getBetTextClass(betLabel)}`}
            >
              {betLabel}
            </span>
          </div>

          <div
            className="relative overflow-hidden rounded-[1rem]
              border border-white/[0.36] dark:border-white/[0.24]
              bg-[linear-gradient(145deg,rgba(240,220,255,0.95)_0%,rgba(195,145,255,0.98)_35%,rgba(145,85,235,1)_70%,rgba(105,55,205,1)_100%)]
              shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_rgba(105,55,205,0.25)]
              dark:bg-[linear-gradient(145deg,rgba(118,78,195,0.78)_0%,rgba(88,52,165,0.88)_45%,rgba(68,38,135,0.95)_100%)]
              dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_rgba(50,25,100,0.4)]"
            style={oddPanelOuterStyle}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_20%,rgba(255,255,255,0.35),transparent_50%)]" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,transparent_35%,rgba(40,15,90,0.15)_100%)]" aria-hidden />
            <div className="pointer-events-none absolute inset-x-[8%] top-px h-px bg-white/50" aria-hidden />
            <div className="pointer-events-none absolute left-[15%] right-[20%] top-[25%] h-10 rounded-full bg-amber-200/[0.12] blur-[14px]" aria-hidden />

            <div className="flex min-h-[3.72rem] items-center gap-3 px-5 py-[2px]" style={oddPanelInnerStyle}>
              <span className="whitespace-nowrap text-[0.88rem] font-black uppercase tracking-[0.08em] text-white/[0.92]">
                {t("odds")}
              </span>
              <div className="flex min-h-[2.35rem] flex-col items-end justify-center leading-none">
                <span className="whitespace-nowrap text-[2rem] font-black tracking-[-0.05em] text-amber-300">
                  {tip.koef.toFixed(2)}
                </span>
                {polymarketValue ? (
                  <span className="mt-0.5 whitespace-nowrap text-[0.68rem] font-semibold tracking-[0.04em] text-white/[0.72]">
                    PM {polymarketValue}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 border-t border-white/[0.18] pt-4 dark:border-white/[0.14]">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-violet-950/[0.10] px-3.5 py-2.5 dark:bg-black/10">
            <span className="whitespace-nowrap text-[0.83rem] font-bold uppercase tracking-[0.05em] text-white/[0.78]">
              {maxBetLabel}
            </span>
            <span className="whitespace-nowrap text-[1.05rem] font-black tabular-nums text-fuchsia-100">
              {tip.marketDepth ?? "-"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-violet-950/[0.10] px-3.5 py-2.5 dark:bg-black/10">
              <span className="whitespace-nowrap text-[0.83rem] font-bold uppercase tracking-[0.05em] text-white/[0.78]">
                {t("avgOdds")}
              </span>
              <span className="whitespace-nowrap text-[1.15rem] font-black tabular-nums text-white">
                {tip.avgOdd.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-violet-950/[0.10] px-3.5 py-2.5 text-right dark:bg-black/10">
              <span className="whitespace-nowrap text-[0.83rem] font-bold uppercase tracking-[0.05em] text-white/[0.78]">
                {t("profitRate")}
              </span>
              <span className="whitespace-nowrap text-[1.15rem] font-black tabular-nums text-emerald-300">
                +{formatProfitPercent(tip.percent)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
