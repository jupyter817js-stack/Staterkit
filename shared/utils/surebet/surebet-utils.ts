import type { ValueBetsSearchResponse } from "@/shared/types/valuebets";
import type { SureBetsSearchResponse } from "@/shared/types/surebets";
import type { ValueBetItem } from "@/shared/types/valuebets";

type BetsArbsResponse = ValueBetsSearchResponse | SureBetsSearchResponse;

export interface SureBetLegDisplay {
  bookmakerName: string;
  marketName: string;
  lineLabel: string;
  /** 카드 표시용 (API descriptionShort) */
  marketLabel: string;
  /** 툴팁용 (API description) */
  marketDescription?: string | null;
  odd: number;
  bookmaker_id: number;
  direct_link: string;
  bookmaker_event_direct_link: string;
  home: string;
  away: string;
  /** arb-clicks용: bets 해당 마켓의 부키 이벤트명 */
  bookmaker_event_name: string;
  /** arb-clicks용: bets 해당 마켓의 부키 리그명 */
  bookmaker_league_name: string;
  /** arb-clicks용: 마켓/베팅 타입 파라미터 (헤더 전송) */
  market_and_bet_type_param?: number;
}

export interface SureBetTipDisplay {
  id: string;
  sportId: number;
  sport: string;
  /** period_identifier로 조회한 구간명 */
  periodLabel?: string;
  leagueName: string;
  homeName: string;
  awayName: string;
  /** Unix timestamp (seconds) for kickoff - 정렬용 */
  startTime: number;
  startDateLabel: string;
  startTimeLabel: string;
  legs: SureBetLegDisplay[];
  percent: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatStartTimeSplit(ts: number): { dateLabel: string; timeLabel: string } {
  try {
    const d = new Date(ts * 1000);
    const hour = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    const timeLabel = `${hour}:${min}`;
    const now = new Date();
    const toDateKey = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
    const todayKey = toDateKey(now);
    const eventKey = toDateKey(d);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = toDateKey(tomorrow);
    let dateLabel: string;
    if (eventKey === todayKey) dateLabel = "Today";
    else if (eventKey === tomorrowKey) dateLabel = "Tomorrow";
    else dateLabel = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    return { dateLabel, timeLabel };
  } catch {
    return { dateLabel: "-", timeLabel: "-" };
  }
}

const SPORT_NAMES: Record<number, string> = {
  1: "축구",
  2: "농구",
  6: "아이스하키",
  7: "축구",
  8: "테니스",
  9: "배구",
  48: "e스포츠",
};

function getSportName(sportId: number): string {
  return SPORT_NAMES[sportId] ?? "기타";
}

function getMarketNameFallback(marketType?: number, param?: number): string {
  if (marketType == null) return "기타";
  if (param != null && param !== 0)
    return `마켓 ${marketType} ${param > 0 ? "+" : ""}${param}`;
  return `마켓 ${marketType}`;
}

function parseDisplayToLineAndMarket(display: string): { lineLabel: string; marketLabel: string } {
  if (!display?.trim()) return { lineLabel: "-", marketLabel: "-" };
  const sep = " - ";
  const idx = display.indexOf(sep);
  if (idx >= 0) {
    return {
      lineLabel: display.slice(0, idx).trim() || "-",
      marketLabel: display.slice(idx + sep.length).trim() || "-",
    };
  }
  return { lineLabel: "-", marketLabel: display.trim() || "-" };
}

function getArbBetIds(arb: Record<string, unknown>): string[] {
  const fromArray = arb.bet_ids ?? arb.bet_ids_list;
  if (Array.isArray(fromArray) && fromArray.length >= 2) {
    return fromArray.filter((id): id is string => typeof id === "string");
  }
  const legs = arb.legs as Array<{ bet_id?: string; id?: string }> | undefined;
  if (Array.isArray(legs) && legs.length >= 2) {
    const ids = legs.map((leg) => leg.bet_id ?? leg.id).filter(Boolean) as string[];
    if (ids.length >= 2) return ids;
  }
  const b1 = arb.bet1_id ?? arb.bet_1_id ?? arb.bet_id_1;
  const b2 = arb.bet2_id ?? arb.bet_2_id ?? arb.bet_id_2;
  const b3 = arb.bet3_id ?? arb.bet_3_id ?? arb.bet_id_3;
  return [b1, b2, b3].filter(Boolean) as string[];
}

export function extractSureBetTips(
  data: BetsArbsResponse | null,
): SureBetTipDisplay[] {
  if (!data?.bets?.length) return [];
  const arbs = data.arbs ?? (data as SureBetsSearchResponse).source?.arbs ?? [];
  if (!Array.isArray(arbs) || arbs.length === 0) return [];

  const betsById = new Map<string, ValueBetItem>(
    data.bets.map((b) => [b.id, b]),
  );

  const tips: SureBetTipDisplay[] = [];

  for (const arb of arbs) {
    const arbAny = arb as Record<string, unknown>;
    const betIds = getArbBetIds(arbAny);

    const legs: SureBetLegDisplay[] = [];
    for (const bid of betIds) {
      const bet = betsById.get(bid);
      if (!bet) continue;
      const fallback = getMarketNameFallback(
        bet.market_and_bet_type,
        bet.market_and_bet_type_param,
      );
      const { lineLabel, marketLabel } = parseDisplayToLineAndMarket(fallback);
      legs.push({
        bookmakerName: `부키 ${bet.bookmaker_id}`,
        marketName: fallback,
        lineLabel,
        marketLabel,
        odd: Number(bet.koef),
        bookmaker_id: bet.bookmaker_id ?? 0,
        direct_link: (bet as { direct_link?: string }).direct_link ?? "",
        bookmaker_event_direct_link: (bet as { bookmaker_event_direct_link?: string }).bookmaker_event_direct_link ?? "",
        home: bet.home ?? bet.team1_name ?? "",
        away: bet.away ?? bet.team2_name ?? "",
        bookmaker_event_name: (bet as { bookmaker_event_name?: string }).bookmaker_event_name ?? "",
        bookmaker_league_name: (bet as { bookmaker_league_name?: string }).bookmaker_league_name ?? "",
        market_and_bet_type_param: bet.market_and_bet_type_param ?? undefined,
      });
    }
    if (legs.length < 2) continue;

    const startedAt = arb.started_at;
    const ts =
      typeof startedAt === "number"
        ? startedAt
        : typeof startedAt === "string"
          ? Math.floor(new Date(startedAt).getTime() / 1000)
          : 0;
    const { dateLabel, timeLabel } = formatStartTimeSplit(ts);
    const sportId = typeof arb.sport_id === "number" ? arb.sport_id : 7;
    const raw = arb as Record<string, unknown>;
    tips.push({
      id: arb.id,
      sportId,
      sport: getSportName(sportId),
      leagueName: String(raw.league ?? arb.league_name ?? "-"),
      homeName: String(raw.home ?? arb.team1_name ?? "-"),
      awayName: String(raw.away ?? arb.team2_name ?? "-"),
      startTime: ts,
      startDateLabel: dateLabel,
      startTimeLabel: timeLabel,
      legs,
      percent: Number(arb.percent),
    });
  }

  return tips;
}

export type SureBetTipResolvers = {
  getSportName: (sportId: number) => Promise<string>;
  getMarketLineAndMarket: (marketType: number, param?: number) => Promise<{ lineLabel: string; marketLabel: string; marketDescription?: string | null }>;
  getBookmakerName: (bookmakerId: number) => Promise<string>;
  getPeriodName?: (sportId: number, periodIdentifier: string) => Promise<string | undefined>;
};

export async function extractSureBetTipsAsync(
  data: BetsArbsResponse | null,
  resolvers: SureBetTipResolvers,
): Promise<SureBetTipDisplay[]> {
  const sync = extractSureBetTips(data);
  if (!sync.length) return [];

  const arbs = data!.arbs ?? (data as SureBetsSearchResponse).source?.arbs ?? [];
  const betsById = new Map<string, ValueBetItem>(
    data!.bets!.map((b) => [b.id, b]),
  );

  const result: SureBetTipDisplay[] = [];

  for (let i = 0; i < sync.length; i++) {
    const tip = sync[i];
    const arb = arbs[i];
    if (!arb) {
      result.push(tip);
      continue;
    }
    const arbAny = arbs[i] as Record<string, unknown>;
    const betIds = getArbBetIds(arbAny);
    const sportId = typeof (arbAny.sport_id as number) === "number" ? (arbAny.sport_id as number) : 7;
    const rawPeriod = arbAny.period_identifier as string | number | undefined;
    const periodIdentifier = rawPeriod != null ? String(rawPeriod) : "0";
    const periodLabel = resolvers.getPeriodName
      ? await resolvers.getPeriodName(sportId, periodIdentifier)
      : undefined;

    const legs: SureBetLegDisplay[] = [];
    for (const bid of betIds) {
      const bet = betsById.get(bid);
      if (!bet) continue;
      const [lineAndMarket, bookmakerName] = await Promise.all([
        resolvers.getMarketLineAndMarket(
          bet.market_and_bet_type ?? 0,
          bet.market_and_bet_type_param,
        ),
        resolvers.getBookmakerName(bet.bookmaker_id),
      ]);
      const marketName =
        lineAndMarket.lineLabel !== "-" && lineAndMarket.marketLabel !== "-"
          ? `${lineAndMarket.lineLabel} - ${lineAndMarket.marketLabel}`
          : lineAndMarket.marketLabel;
      legs.push({
        bookmakerName,
        marketName,
        lineLabel: lineAndMarket.lineLabel,
        marketLabel: lineAndMarket.marketLabel,
        marketDescription: lineAndMarket.marketDescription ?? undefined,
        odd: Number(bet.koef),
        bookmaker_id: bet.bookmaker_id ?? 0,
        direct_link: (bet as { direct_link?: string }).direct_link ?? "",
        bookmaker_event_direct_link: (bet as { bookmaker_event_direct_link?: string }).bookmaker_event_direct_link ?? "",
        home: bet.home ?? bet.team1_name ?? "",
        away: bet.away ?? bet.team2_name ?? "",
        bookmaker_event_name: (bet as { bookmaker_event_name?: string }).bookmaker_event_name ?? "",
        bookmaker_league_name: (bet as { bookmaker_league_name?: string }).bookmaker_league_name ?? "",
        market_and_bet_type_param: bet.market_and_bet_type_param ?? undefined,
      });
    }

    const sportName =
      legs.length > 0
        ? await resolvers.getSportName(sportId)
        : tip.sport;

    result.push({
      ...tip,
      sportId,
      sport: sportName,
      periodLabel: periodLabel ?? undefined,
      legs: legs.length >= 2 ? legs : tip.legs,
    });
  }

  return result;
}
