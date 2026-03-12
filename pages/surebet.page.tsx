import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import Seo from "@/shared/layout-components/seo/seo";
import { useBookmakerOptions } from "@/shared/hooks/useBookmakerOptions";
import { useSportsOptions } from "@/shared/hooks/useSportsOptions";
import { getCurrentUser } from "@/shared/api/users";
import { searchSureBets } from "@/shared/api/surebets";
import { getBookmakerName } from "@/shared/api/bookmakers";
import { sendArbClickSurebet } from "@/shared/api/arb-clicks";
import {
  collectUniqueMarketPairs,
  getMarketDisplayCached,
} from "@/shared/api/valuebets";
import { ensurePeriodTranslationsForSports, getPeriodName } from "@/shared/api/periods";
import type { CurrentUser } from "@/shared/types/users";
import type { SureBetsSearchResponse } from "@/shared/types/surebets";
import SureBetPageHeader from "./components/surebet/SureBetPageHeader";
import SureBetFilters from "./components/surebet/SureBetFilters";
import SureBetTipCard from "./components/surebet/SureBetTipCard";
import SureBetTipCardSkeleton from "./components/surebet/SureBetTipCardSkeleton";
import UpgradeModal from "./components/subscription/UpgradeModal";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { useEntitlements } from "@/shared/hooks/useEntitlements";
import {
  extractSureBetTips,
  extractSureBetTipsAsync,
  type SureBetTipDisplay,
} from "@/shared/utils/surebet/surebet-utils";
import { useBetsCount } from "@/shared/contexts/BetsCountContext";
import { sortTips } from "@/shared/utils/bets-sort";
import type { BetsSortOption } from "@/shared/utils/bets-sort";
import { filterTipsByTimeRange } from "@/shared/utils/time-range-filter";
import type { TimeRangePreset, TipWithStartTime } from "@/shared/utils/time-range-filter";
import { useNewOpportunityAlert } from "@/shared/hooks/useNewOpportunityAlert";
import { useRefreshUserOnSubscriptionUpdate } from "@/shared/hooks/useRefreshUserOnSubscriptionUpdate";

export default function SurebetPage() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const displayName =
    currentUser?.firstname || currentUser?.lastname
      ? [currentUser?.firstname, currentUser?.lastname].filter(Boolean).join(" ").trim()
      : currentUser?.email ?? "";
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const entitlements = useEntitlements(currentUser ?? undefined);
  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);
  useRefreshUserOnSubscriptionUpdate(setCurrentUser);

  const [data, setData] = useState<SureBetsSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(10);
  const [isLive, setIsLive] = useState(false);
  const [bookmakerIds, setBookmakerIds] = useState<number[]>([]);
  const refreshIntervalSeconds = 5;
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const bookmakerOptions = useBookmakerOptions();
  const { options: sportOptions, loading: sportOptionsLoading } = useSportsOptions();
  const [sportIds, setSportIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<BetsSortOption>("time_asc_profit_desc");
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>("all");
  const [minProfitPercent, setMinProfitPercent] = useState<number>(0);
  const [alertMuted, setAlertMuted] = useState(false);
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("staterkit_alert_muted") === "1") {
        setAlertMuted(true);
      }
    } catch {
      /* ignore */
    }
  }, []);
  const hasInitializedSports = useRef(false);
  const hasInitializedBookmakers = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const isBackgroundRefreshRef = useRef(false);
  const fetchedBookmakerNamesRef = useRef(new Map<number, string>());

  // 스포츠 목록 로드 시 디폴트로 전체 선택 (최초 1회만)
  useEffect(() => {
    if (sportOptions.length > 0 && !hasInitializedSports.current) {
      hasInitializedSports.current = true;
      setSportIds(sportOptions.map((o) => o.value));
    }
  }, [sportOptions]);

  // 부키 목록 로드 시 디폴트로 전체 선택 (최초 1회만)
  useEffect(() => {
    if (bookmakerOptions.length > 0 && !hasInitializedBookmakers.current) {
      hasInitializedBookmakers.current = true;
      setBookmakerIds(bookmakerOptions.map((o) => o.value));
    }
  }, [bookmakerOptions]);

  const fetchData = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
        isBackgroundRefreshRef.current = true;
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await searchSureBets({
          per_page: perPage,
          is_live: isLive,
          bookmaker_ids: bookmakerIds.length > 0 ? bookmakerIds : undefined,
          sport_ids: sportIds.length > 0 ? sportIds : undefined,
        });
        setData(res ? { ...res } : null);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다.",
        );
        if (!silent) setData(null);
        if (silent) isBackgroundRefreshRef.current = false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [perPage, isLive, bookmakerIds, sportIds],
  );

  const triggerRefresh = useCallback(
    (isBackground: boolean) => {
      fetchData(isBackground);
      if (refreshIntervalSeconds > 0) setCountdownSeconds(refreshIntervalSeconds);
    },
    [fetchData, refreshIntervalSeconds],
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    if (!entitlements.access_live && isLive) setIsLive(false);
  }, [entitlements.access_live, isLive]);

  useEffect(() => {
    if (refreshIntervalSeconds <= 0 || !data) {
      setCountdownSeconds(null);
      return;
    }
    setCountdownSeconds(refreshIntervalSeconds);
  }, [refreshIntervalSeconds, !!data]);

  useEffect(() => {
    if (countdownSeconds == null || refreshIntervalSeconds <= 0) return;
    const tid = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev == null || prev <= 0) return prev;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tid);
  }, [countdownSeconds, refreshIntervalSeconds]);

  useEffect(() => {
    if (countdownSeconds === 0 && data) {
      triggerRefresh(true);
    }
  }, [countdownSeconds, data, triggerRefresh]);

  const [tips, setTips] = useState<SureBetTipDisplay[]>([]);
  const [tipsReady, setTipsReady] = useState(true); // 추출 완료 여부(무한 스켈레톤 방지)
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null);
  const { setSurebetCount } = useBetsCount();

  const sortedTips = React.useMemo(() => sortTips(tips, sortBy), [tips, sortBy]);
  const displayedTips = React.useMemo(() => {
    const byTime = filterTipsByTimeRange(sortedTips as unknown as TipWithStartTime[], {
      timeRangePreset,
    }) as unknown as SureBetTipDisplay[];
    const minPct = Number(minProfitPercent);
    return byTime.filter((t) => {
      const pct = Number(t.percent);
      if (Number.isNaN(pct)) return minPct <= 0;
      if (Number.isNaN(minPct)) return true;
      return pct >= minPct;
    });
  }, [sortedTips, timeRangePreset, minProfitPercent]);

  const displayedTipIds = React.useMemo(() => displayedTips.map((t) => t.id), [displayedTips]);
  useNewOpportunityAlert(displayedTipIds, alertMuted);

  useEffect(() => {
    setSurebetCount(displayedTips.length);
  }, [displayedTips.length, setSurebetCount]);

  const handleAlertMuteToggle = useCallback(() => {
    setAlertMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("staterkit_alert_muted", next ? "1" : "0");
      } catch {
        /* localStorage unavailable or quota exceeded */
      }
      return next;
    });
  }, []);

  const handleCardClick = useCallback((tip: SureBetTipDisplay) => {
    setSelectedTipId(tip.id);
    const clicks = tip.legs.map((leg) => ({
      bookmaker_id: leg.bookmaker_id,
      direct_link: leg.direct_link,
      bookmaker_event_direct_link: leg.bookmaker_event_direct_link,
      koef: leg.odd,
      bookmaker_event_name: leg.bookmaker_event_name,
      bookmaker_league_name: leg.bookmaker_league_name,
      market_and_bet_type_param: leg.market_and_bet_type_param,
    }));
    sendArbClickSurebet(clicks).catch(() => {});
  }, []);

  const arbs = data?.arbs ?? data?.source?.arbs ?? [];
  const dataHasArbs = !!(
    data?.bets?.length &&
    Array.isArray(arbs) &&
    arbs.length > 0
  );

  useEffect(() => {
    if (!data?.bets?.length || !Array.isArray(arbs) || arbs.length === 0) {
      setTips([]);
      setTipsReady(true);
      return;
    }
    const currentData = data;
    const isBackgroundRefresh = isBackgroundRefreshRef.current;
    if (isBackgroundRefresh) isBackgroundRefreshRef.current = false;
    if (!isBackgroundRefresh) {
      setTips([]);
      setTipsReady(false);
    }
    const done = () => setTipsReady(true);
    const applyIfNotStale = (tips: SureBetTipDisplay[]) => {
      if (dataRef.current !== currentData) return;
      setTips(tips);
    };
    const filterBySport = (tips: SureBetTipDisplay[]) => {
      if (sportIds.length === 0) return tips;
      const idSet = new Set(sportIds);
      return tips.filter((t) => idSet.has(t.sportId));
    };
    const bookmakerMap = new Map(bookmakerOptions.map((o) => [o.value, o.label]));
    fetchedBookmakerNamesRef.current.forEach((name, id) => bookmakerMap.set(id, name));
    const sportMap = new Map(sportOptions.map((o) => [o.value, o.label]));
    const bets = currentData.bets ?? [];
    const uniqueBookmakerIds = [...new Set(bets.map((b) => b.bookmaker_id ?? 0).filter((id) => id > 0))];
    const missingBookmakerIds = uniqueBookmakerIds.filter((id) => !bookmakerMap.has(id));
    const ensureBookmakerMap = (): Promise<Map<number, string>> => {
      if (missingBookmakerIds.length === 0) return Promise.resolve(bookmakerMap);
      return Promise.all(
        missingBookmakerIds.map((id) =>
          getBookmakerName(id).then((name) => {
            fetchedBookmakerNamesRef.current.set(id, name);
            return { id, name };
          }),
        ),
      ).then((results) => {
        results.forEach(({ id, name }) => bookmakerMap.set(id, name));
        return bookmakerMap;
      });
    };
    const getBookmakerResolver = (map: Map<number, string>) => (id: number) =>
      Promise.resolve(map.get(id) ?? "부키");
    const pairs = collectUniqueMarketPairs(bets);
    if (!pairs.length) {
      const fallbackLineAndMarket = (type: number, param?: number) =>
        Promise.resolve({
          lineLabel: param != null && param !== 0 ? `${param > 0 ? "+" : ""}${param}` : "-",
          marketLabel: `마켓 ${type}`,
        });
      const sportIdsFromArbs = [...new Set((arbs as { sport_id?: number }[]).map((a) => a.sport_id).filter((id): id is number => id != null))];
      Promise.all([ensurePeriodTranslationsForSports(sportIdsFromArbs), ensureBookmakerMap()])
        .then(([, map]) =>
          extractSureBetTipsAsync(currentData, {
            getSportName: (id) => Promise.resolve(sportMap.get(id) ?? "기타"),
            getMarketLineAndMarket: fallbackLineAndMarket,
            getBookmakerName: getBookmakerResolver(map),
            getPeriodName: (sportId, periodIdentifier) => getPeriodName(sportId, periodIdentifier),
          }),
        )
        .then(filterBySport)
        .then(applyIfNotStale)
        .then(done)
        .catch(done);
      return;
    }
    const sportIdsFromArbs = [...new Set((arbs as { sport_id?: number }[]).map((a) => a.sport_id).filter((id): id is number => id != null))];
    Promise.all([
      ensurePeriodTranslationsForSports(sportIdsFromArbs),
      ensureBookmakerMap(),
      getMarketDisplayCached(pairs),
    ])
      .then(([_, map, lineMarketMap]) =>
        extractSureBetTipsAsync(currentData, {
          getSportName: (id) => Promise.resolve(sportMap.get(id) ?? "기타"),
          getMarketLineAndMarket: (type, param) => {
            const entry = lineMarketMap.get(`${type}_${param ?? 0}`);
            if (!entry) return Promise.resolve({ lineLabel: "-", marketLabel: `마켓 ${type}` });
            const marketLabel = entry.descriptionShort ?? entry.market;
            return Promise.resolve({
              lineLabel: entry.line,
              marketLabel: marketLabel ?? entry.market,
              marketDescription: entry.description ?? undefined,
            });
          },
          getBookmakerName: getBookmakerResolver(map),
          getPeriodName: (sportId, periodIdentifier) => getPeriodName(sportId, periodIdentifier),
        }),
      )
      .then(filterBySport)
      .then(applyIfNotStale)
      .then(done)
      .catch(done);
  }, [data, sportIds, bookmakerOptions, sportOptions]);

  return (
    <Fragment>
      <Seo title="Sure Bet" />
      <UpgradeModal show={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <SureBetPageHeader
            displayName={displayName}
            showLowLatencyBadge={entitlements.data_latency_mode === "LOW_LATENCY"}
            alertMuted={alertMuted}
            onAlertMuteToggle={handleAlertMuteToggle}
          />
          <SureBetFilters
            perPage={perPage}
            isLive={isLive}
            bookmakerIds={bookmakerIds}
            bookmakerOptions={bookmakerOptions}
            sportIds={sportIds}
            sportOptions={sportOptions}
            sportOptionsLoading={sportOptionsLoading}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            timeRangePreset={timeRangePreset}
            onTimeRangePresetChange={setTimeRangePreset}
            onSportIdsChange={setSportIds}
            onPerPageChange={setPerPage}
            onIsLiveChange={setIsLive}
            onBookmakerIdsChange={setBookmakerIds}
            minProfitPercent={minProfitPercent}
            onMinProfitPercentChange={setMinProfitPercent}
            accessLive={entitlements.access_live}
            onLiveLockedClick={() => setUpgradeModalOpen(true)}
          />
          {error && (
            <div className="alert alert-danger mb-4 flex" role="alert">
              <i className="ri-error-warning-line me-2 text-[1.125rem]"></i>
              <span className="text-[0.875rem]">{error}</span>
            </div>
          )}
          {/* 카드 그리드 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[1rem] text-defaulttextcolor dark:text-defaulttextcolor/80 mb-0 flex items-center gap-2">
                <i className="ri-pie-chart-2-line text-primary"></i>
                {t("sureBetTipsTitle")}
              </h3>
              {(loading && !tips.length) || (!tips.length && dataHasArbs && !tipsReady) ? (
                <span className="h-6 w-12 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
              ) : (
                <span className="text-[0.8125rem] text-primary font-medium bg-primary/10 dark:bg-primary/20 dark:text-primary rounded-full py-1 px-3">
                  {displayedTips.length}{t("tipsCount")}
                </span>
              )}
            </div>
            {(loading && !tips.length) || (!tips.length && dataHasArbs && !tipsReady) ? (
              <>
                <div className="mb-4 flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] dark:from-primary/10 dark:to-primary/5 border-l-4 border-primary/40 dark:border-primary/50 shadow-sm">
                  <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                    <i className="ri-information-line text-[1.125rem]"></i>
                  </span>
                  <p className="text-[0.8125rem] leading-relaxed text-defaulttextcolor/90 dark:text-white/75 pt-0.5">
                    {t("appCtaMessage")}
                  </p>
                </div>
                <div
                  className="grid gap-3 sm:gap-4 items-stretch"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))" }}
                >
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="min-w-0 h-[340px] flex flex-col overflow-hidden p-[3px]">
                      <SureBetTipCardSkeleton />
                    </div>
                  ))}
                </div>
              </>
            ) : !tips.length ? (
              <div className="box border-0 shadow-none bg-transparent dark:bg-transparent">
                <div className="box-body flex flex-col items-center justify-center py-20">
                  <span className="!w-16 !h-16 rounded-2xl bg-light dark:bg-white/5 inline-flex items-center justify-center text-[#8c9097] dark:text-white/40 mb-4">
                    <i className="ri-pie-chart-2-line text-3xl"></i>
                  </span>
                  <p className="text-[#8c9097] dark:text-white/50 text-[0.9375rem] mb-0 font-medium">
                    {t("noSureBetTips")}
                  </p>
                  <p className="text-[#8c9097] dark:text-white/40 text-[0.8125rem] mt-1">
                    {t("changeFiltersOrRetry")}
                  </p>
                </div>
              </div>
            ) : displayedTips.length > 0 ? (
              <>
                <div className="mb-4 flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] dark:from-primary/10 dark:to-primary/5 border-l-4 border-primary/40 dark:border-primary/50 shadow-sm">
                  <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                    <i className="ri-information-line text-[1.125rem]"></i>
                  </span>
                  <p className="text-[0.8125rem] leading-relaxed text-defaulttextcolor/90 dark:text-white/75 pt-0.5">
                    {t("appCtaMessage")}
                  </p>
                </div>
                <div
                  className="grid gap-3 sm:gap-4 items-stretch"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))" }}
                >
                {displayedTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="min-w-0 h-[340px] flex flex-col cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] rounded-[0.75rem] overflow-visible p-[3px]"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick(tip)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick(tip);
                      }
                    }}
                  >
                    <SureBetTipCard tip={tip} isSelected={selectedTipId === tip.id} />
                  </div>
                ))}
              </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Fragment>
  );
}

SurebetPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
