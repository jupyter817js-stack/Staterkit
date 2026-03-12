import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import Seo from "@/shared/layout-components/seo/seo";
import { getCurrentUser } from "@/shared/api/users";
import { useEntitlements } from "@/shared/hooks/useEntitlements";
import { useBookmakerOptions } from "@/shared/hooks/useBookmakerOptions";
import { useSportsOptions } from "@/shared/hooks/useSportsOptions";
import {
  collectUniqueMarketPairs,
  getMarketDisplayCached,
  searchValueBets,
} from "@/shared/api/valuebets";
import { ensurePeriodTranslationsForSports, getPeriodName } from "@/shared/api/periods";
import { getBookmakerName } from "@/shared/api/bookmakers";
import type { ValueBetsSearchResponse } from "@/shared/types/valuebets";
import ValueBetPageHeader from "./components/valuebet/ValueBetPageHeader";
import ValueBetFilters from "./components/valuebet/ValueBetFilters";
import ValueBetTable from "./components/valuebet/ValueBetTable";
import { sendArbClickValuebet } from "@/shared/api/arb-clicks";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import {
  extractValueBetTips,
  extractValueBetTipsAsync,
  type ValueBetTipDisplay,
} from "@/shared/utils/valuebet/valuebet-utils";
import { useBetsCount } from "@/shared/contexts/BetsCountContext";
import { sortTips } from "@/shared/utils/bets-sort";
import type { BetsSortOption } from "@/shared/utils/bets-sort";
import { filterTipsByTimeRange } from "@/shared/utils/time-range-filter";
import type { TimeRangePreset, TipWithStartTime } from "@/shared/utils/time-range-filter";
import { useNewOpportunityAlert } from "@/shared/hooks/useNewOpportunityAlert";
import { useRefreshUserOnSubscriptionUpdate } from "@/shared/hooks/useRefreshUserOnSubscriptionUpdate";
import UpgradeModal from "./components/subscription/UpgradeModal";

type FetchState = {
  loading: boolean;
  data: ValueBetsSearchResponse | null;
};

export default function ValuebetPage() {
  const [currentUser, setCurrentUser] = useState<Awaited<ReturnType<typeof getCurrentUser>> | null>(null);
  const entitlements = useEntitlements(currentUser ?? undefined);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [fetchState, setFetchState] = useState<FetchState>({ loading: true, data: null });
  const data = fetchState.data;
  const loading = fetchState.loading;
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(10);
  const [isLive, setIsLive] = useState(false);
  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);
  useRefreshUserOnSubscriptionUpdate(setCurrentUser);
  useEffect(() => {
    if (!entitlements.access_live && isLive) setIsLive(false);
  }, [entitlements.access_live, isLive]);
  const [bookmakerIds, setBookmakerIds] = useState<number[]>([]);
  const [sportIds, setSportIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<BetsSortOption>("time_asc_profit_desc");
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>("all");
  const [minProfitPercent, setMinProfitPercent] = useState<number>(0);
  const [alertMuted, setAlertMuted] = useState(false);
  const refreshIntervalSeconds = 5;
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("staterkit_alert_muted") === "1") {
        setAlertMuted(true);
      }
    } catch {
      /* ignore */
    }
  }, []);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const bookmakerOptions = useBookmakerOptions();
  const { options: sportOptions, loading: sportOptionsLoading } = useSportsOptions();
  const hasInitializedSports = useRef(false);
  const hasInitializedBookmakers = useRef(false);

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
      } else {
        setFetchState((prev) => ({ ...prev, loading: true }));
      }
      setError(null);
      try {
        const res = await searchValueBets({
          per_page: perPage,
          is_live: isLive,
          bookmaker_ids: bookmakerIds.length > 0 ? bookmakerIds : undefined,
          sport_ids: sportIds.length > 0 ? sportIds : undefined,
        });
        setFetchState({ loading: false, data: res });
      } catch (e) {
        setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다.");
        if (!silent) setFetchState({ loading: false, data: null });
        else setFetchState((prev) => ({ ...prev, loading: false }));
      } finally {
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

  const [tips, setTips] = useState<ValueBetTipDisplay[]>([]);
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null);
  const [bookmakerNamesMap, setBookmakerNamesMap] = useState<Map<number, string>>(new Map());
  const bookmakerNamesMapRef = useRef<Map<number, string>>(new Map());
  const { setValuebetCount } = useBetsCount();

  useEffect(() => {
    bookmakerNamesMapRef.current = bookmakerNamesMap;
  }, [bookmakerNamesMap]);

  const sortedTips = React.useMemo(() => sortTips(tips, sortBy), [tips, sortBy]);
  const displayedTips = React.useMemo(() => {
    const byTime = filterTipsByTimeRange(sortedTips as unknown as TipWithStartTime[], {
      timeRangePreset,
    }) as unknown as ValueBetTipDisplay[];
    const minPct = Number(minProfitPercent);
    return byTime.filter((t) => {
      const pct = Number(t.percent);
      if (Number.isNaN(pct)) return minPct <= 0;
      if (Number.isNaN(minPct)) return true;
      return pct >= minPct;
    });
  }, [sortedTips, timeRangePreset, minProfitPercent]);

  const displayedTipIds = React.useMemo(() => displayedTips.map((t) => t.betId), [displayedTips]);
  useNewOpportunityAlert(displayedTipIds, alertMuted);

  useEffect(() => {
    setValuebetCount(displayedTips.length);
  }, [displayedTips.length, setValuebetCount]);

  // 카드별 부키 이름: 옵션 + 이미 조회한 맵에서 채운 뒤, 없는 id만 API로 조회 (주기 검색 시 중복 요청 방지)
  useEffect(() => {
    const fromOptions = new Map<number, string>(
      bookmakerOptions.map((o) => [o.value, o.label]),
    );
    const uniqueIds = [...new Set(displayedTips.map((t) => t.bookmaker_id).filter((id) => id > 0))];
    setBookmakerNamesMap((prev) => {
      let changed = false;
      const next = new Map(prev);
      fromOptions.forEach((name, id) => {
        if (next.get(id) !== name) {
          next.set(id, name);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    const knownNames = bookmakerNamesMapRef.current;
    const missing = uniqueIds.filter((id) => !fromOptions.has(id) && !knownNames.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map((id) => getBookmakerName(id).then((name) => ({ id, name }))))
      .then((pairs) => {
        if (cancelled) return;
        setBookmakerNamesMap((prev) => {
          let changed = false;
          const next = new Map(prev);
          fromOptions.forEach((name, id) => {
            if (next.get(id) !== name) {
              next.set(id, name);
              changed = true;
            }
          });
          pairs.forEach(({ id, name }) => {
            if (next.get(id) !== name) {
              next.set(id, name);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [displayedTips, bookmakerOptions]);

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

  useEffect(() => {
    if (!data?.bets?.length || !data?.source?.value_bets?.length) {
      setTips([]);
      return;
    }
    let syncTips = extractValueBetTips(data);
    // 스포츠 필터 클라이언트 적용 (백엔드 미지원 시)
    if (sportIds.length > 0) {
      const idSet = new Set(sportIds);
      syncTips = syncTips.filter((t) => idSet.has(t.sportId));
    }
    const pairs = collectUniqueMarketPairs(data.bets);
    if (!pairs.length) {
      setTips(syncTips);
      return;
    }
    setTips((prev) => (prev.length === 0 ? syncTips : prev));
    const sportMap = new Map(sportOptions.map((o) => [o.value, o.label]));
    const sportIdsFromBets = [...new Set((data.bets ?? []).map((b) => b.sport_id).filter((id) => id != null))] as number[];
    Promise.all([
      getMarketDisplayCached(pairs),
      ensurePeriodTranslationsForSports(sportIdsFromBets),
    ])
      .then(([lineMarketMap]) => {
        const getMarketLineAndMarket = (type: number, param?: number) => {
          const entry = lineMarketMap.get(`${type}_${param ?? 0}`);
          if (!entry) return Promise.resolve({ lineLabel: "-", marketLabel: `마켓 ${type}` });
          const marketLabel = entry.descriptionShort ?? entry.market;
          return Promise.resolve({
            lineLabel: entry.line,
            marketLabel: marketLabel ?? entry.market,
            marketDescription: entry.description ?? undefined,
          });
        };
        return extractValueBetTipsAsync(data, {
          getSportName: (id) => Promise.resolve(sportMap.get(id) ?? "기타"),
          getMarketLineAndMarket,
          getPeriodName: (sportId, periodIdentifier) => getPeriodName(sportId, periodIdentifier),
        });
      })
      .then((asyncTips) => {
        if (sportIds.length > 0) {
          const idSet = new Set(sportIds);
          return asyncTips.filter((t) => idSet.has(t.sportId));
        }
        return asyncTips;
      })
      .then(setTips)
      .catch(() => {});
  }, [data, sportIds, sportOptions]);

  const { t } = useLanguage();
  const displayName =
    currentUser?.firstname || currentUser?.lastname
      ? [currentUser?.firstname, currentUser?.lastname].filter(Boolean).join(" ").trim()
      : currentUser?.email ?? "";

  const handleCardClick = useCallback((tip: ValueBetTipDisplay) => {
    setSelectedBetId(tip.betId);
    sendArbClickValuebet({
      bookmaker_id: tip.bookmaker_id,
      direct_link: tip.direct_link,
      bookmaker_event_direct_link: tip.bookmaker_event_direct_link,
      koef: tip.koef,
      bookmaker_event_name: tip.bookmaker_event_name,
      bookmaker_league_name: tip.bookmaker_league_name,
      market_and_bet_type_param: tip.market_and_bet_type_param,
    }).catch(() => {});
  }, []);

  return (
    <Fragment>
      <Seo title="Value Bet" />
      <UpgradeModal show={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      <div className="flex flex-col min-h-0">
        <ValueBetPageHeader
          displayName={displayName}
          alertMuted={alertMuted}
          onAlertMuteToggle={handleAlertMuteToggle}
        />
        <ValueBetFilters
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
          <div className="alert alert-danger mb-4 flex shrink-0" role="alert">
            <i className="ri-error-warning-line me-2 text-[1.125rem]"></i>
            <span className="text-[0.875rem]">{error}</span>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ValueBetTable
            tips={displayedTips}
            loading={loading && !tips.length}
            dataHasBets={!!(data?.bets?.length && data?.source?.value_bets?.length)}
            bookmakerNamesMap={bookmakerNamesMap}
            selectedBetId={selectedBetId}
            onCardClick={handleCardClick}
          />
        </div>
      </div>
    </Fragment>
  );
}

ValuebetPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
