import type { ValueBetsSearchResponse } from "@/shared/types/valuebets";

/** 화면에 표시할 Value Bet 팁 한 건 */
export interface ValueBetTipDisplay {
  betId: string;
  sportId: number;
  sport: string;
  /** period_identifier로 조회한 구간명 (예: 1st Half, Regular Time) */
  periodLabel?: string;
  marketDepth?: string;
  leagueName: string;
  homeName: string;
  awayName: string;
  startTime: number;
  startDateLabel: string;
  startTimeLabel: string;
  marketName: string;
  /** 카드 표시용 (API descriptionShort) */
  marketLabel: string;
  /** 툴팁용 (API description) */
  marketDescription?: string | null;
  lineLabel: string;
  koef: number;
  avgOdd: number;
  percent: number;
  bookmaker_id: number;
  direct_link: string;
  bookmaker_event_direct_link: string;
  /** arb-clicks용: 부키 이벤트명 */
  bookmaker_event_name?: string;
  /** arb-clicks용: 부키 리그명 */
  bookmaker_league_name?: string;
  /** arb-clicks용: 마켓/베팅 타입 파라미터 (헤더 전송) */
  market_and_bet_type_param?: number;
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

const MARKET_NAMES: Record<number, string> = {
  1: "1X2 홈",
  2: "1X2 원정",
  11: "1X2 홈",
  12: "1X2 무승부",
  13: "1X2 원정",
  17: "핸디캡 원정",
  18: "핸디캡 홈",
  19: "오버",
  20: "언더",
  55: "오버 (코너)",
  56: "언더 (코너)",
};

const MARKET_TYPES: Record<number, string> = {
  1: "1X2",
  2: "1X2",
  11: "1X2",
  12: "1X2",
  13: "1X2",
  17: "핸디캡",
  18: "핸디캡",
  19: "오버",
  20: "언더",
  55: "오버 (코너)",
  56: "언더 (코너)",
};

function getBetLine(marketAndBetType?: number, param?: number): string {
  if (marketAndBetType == null) return "-";
  const paramStr =
    param != null &&
    (marketAndBetType === 17 ||
      marketAndBetType === 18 ||
      marketAndBetType === 19 ||
      marketAndBetType === 20 ||
      marketAndBetType === 55 ||
      marketAndBetType === 56)
      ? ` ${param > 0 ? "+" : ""}${param}`
      : "";
  switch (marketAndBetType) {
    case 1:
    case 11:
      return "홈";
    case 2:
    case 13:
      return "원정";
    case 12:
      return "무승부";
    case 17:
      return `원정${paramStr}`;
    case 18:
      return `홈${paramStr}`;
    case 19:
    case 55:
      return paramStr ? paramStr.trim() : "-";
    case 20:
    case 56:
      return paramStr ? paramStr.trim() : "-";
    default:
      return MARKET_NAMES[marketAndBetType] ?? `마켓 ${marketAndBetType}`;
  }
}

function getSportName(sportId: number): string {
  return SPORT_NAMES[sportId] ?? "기타";
}

function getMarketName(marketAndBetType?: number, param?: number): string {
  if (marketAndBetType == null) return "기타";
  const name = MARKET_NAMES[marketAndBetType];
  if (name) {
    if (
      param != null &&
      (marketAndBetType === 17 ||
        marketAndBetType === 18 ||
        marketAndBetType === 19 ||
        marketAndBetType === 20 ||
        marketAndBetType === 55 ||
        marketAndBetType === 56)
    ) {
      return `${name} ${param > 0 ? "+" : ""}${param}`;
    }
    return name;
  }
  return `마켓 ${marketAndBetType}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatStartTimeSplit(ts: number): { dateLabel: string; timeLabel: string } {
  try {
    const d = new Date(ts * 1000);
    const now = new Date();
    const hour = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    const timeLabel = `${hour}:${min}`;

    const toDateKey = (x: Date) =>
      `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
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

export function parseMarketDisplay(display: string): { lineLabel: string; marketLabel: string } {
  if (!display?.trim()) return { lineLabel: "-", marketLabel: "-" };
  const idx = display.indexOf("-");
  if (idx >= 0) {
    const lineLabel = display.slice(0, idx).trim() || "-";
    const marketLabel = display.slice(idx + 1).trim() || "-";
    return { lineLabel, marketLabel };
  }
  return { lineLabel: "-", marketLabel: display.trim() || "-" };
}

function formatMarketDepth(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "-";
    return Number.isInteger(value)
      ? value.toString()
      : value.toFixed(2).replace(/\.?0+$/, "");
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "-";
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  return String(value);
}

export function extractValueBetTips(
  data: ValueBetsSearchResponse | null,
): ValueBetTipDisplay[] {
  if (!data?.bets?.length || !data?.source?.value_bets?.length) return [];

  const betMap = new Map(data.bets.map((b) => [b.id, b]));
  const sourceArbs = data.source?.arbs ?? [];
  const tips: ValueBetTipDisplay[] = [];

  data.source.value_bets.forEach((vb, idx) => {
    const bet = betMap.get(vb.bet_id);
    if (!bet) return;

    const fullMarket = getMarketName(
      bet.market_and_bet_type,
      bet.market_and_bet_type_param,
    );
    const parsed = parseMarketDisplay(fullMarket);
    const lineLabel = parsed.lineLabel;
    const marketLabel = parsed.marketLabel !== "-" ? parsed.marketLabel : fullMarket;
    const { dateLabel, timeLabel } = formatStartTimeSplit(bet.started_at);
    const percent = vb.middle_value != null ? Number(vb.middle_value) : Number(vb.percent ?? 0);
    tips.push({
      betId: bet.id,
      sportId: bet.sport_id,
      sport: getSportName(bet.sport_id),
      marketDepth: formatMarketDepth((bet as { market_depth?: unknown }).market_depth),
      leagueName: bet.league_name ?? bet.league ?? "-",
      homeName: bet.home ?? bet.team1_name ?? "-",
      awayName: bet.away ?? bet.team2_name ?? "-",
      startTime: bet.started_at,
      startDateLabel: dateLabel,
      startTimeLabel: timeLabel,
      marketName: fullMarket,
      marketLabel,
      lineLabel,
      koef: Number(bet.koef),
      avgOdd: Number(vb.avg_koef),
      percent,
      bookmaker_id: bet.bookmaker_id ?? 0,
      direct_link: (bet as { direct_link?: string }).direct_link ?? "",
      bookmaker_event_direct_link: (bet as { bookmaker_event_direct_link?: string }).bookmaker_event_direct_link ?? "",
      bookmaker_event_name: (bet as { bookmaker_event_name?: string }).bookmaker_event_name ?? "",
      bookmaker_league_name: (bet as { bookmaker_league_name?: string }).bookmaker_league_name ?? "",
      market_and_bet_type_param: bet.market_and_bet_type_param ?? undefined,
    });
  });

  return tips;
}

export type ValueBetTipResolvers = {
  getSportName: (sportId: number) => Promise<string>;
  getMarketLineAndMarket: (marketType: number, param?: number) => Promise<{ lineLabel: string; marketLabel: string; marketDescription?: string | null }>;
  getPeriodName?: (sportId: number, periodIdentifier: string) => Promise<string | undefined>;
};

export async function extractValueBetTipsAsync(
  data: ValueBetsSearchResponse | null,
  resolvers: ValueBetTipResolvers,
): Promise<ValueBetTipDisplay[]> {
  if (!data?.bets?.length || !data?.source?.value_bets?.length) return [];

  const betMap = new Map(data.bets.map((b) => [b.id, b]));
  const sportCache = new Map<number, string>();
  const marketCache = new Map<string, { lineLabel: string; marketLabel: string; marketDescription?: string | null }>();

  const getSport = async (sportId: number): Promise<string> => {
    if (sportCache.has(sportId)) return sportCache.get(sportId)!;
    const name = await resolvers.getSportName(sportId);
    sportCache.set(sportId, name);
    return name;
  };

  const getMarketLineAndMarket = async (type: number, param?: number) => {
    const key = `${type}_${param ?? ""}`;
    if (marketCache.has(key)) return marketCache.get(key)!;
    const out = await resolvers.getMarketLineAndMarket(type, param);
    marketCache.set(key, out);
    return out;
  };

  const sourceArbs = data.source?.arbs ?? [];
  const tips: ValueBetTipDisplay[] = [];

  const vbs = data.source.value_bets;
  for (let i = 0; i < vbs.length; i++) {
    const vb = vbs[i];
    const bet = betMap.get(vb.bet_id);
    if (!bet) continue;

    const rawPeriod = (bet as { period_identifier?: string | number }).period_identifier;
    const periodIdentifier = rawPeriod != null ? String(rawPeriod) : "0";
    const [sport, lineAndMarket, periodLabel] = await Promise.all([
      getSport(bet.sport_id),
      getMarketLineAndMarket(bet.market_and_bet_type ?? 0, bet.market_and_bet_type_param),
      resolvers.getPeriodName?.(bet.sport_id, periodIdentifier) ?? Promise.resolve(undefined),
    ]);
    const lineLabel = lineAndMarket.lineLabel;
    const marketLabel = lineAndMarket.marketLabel;
    const marketDescription = lineAndMarket.marketDescription;
    const hasLine = lineLabel?.trim() && lineLabel !== "-";
    const marketName = hasLine && marketLabel !== "-" ? `${marketLabel} - ${lineLabel}` : marketLabel !== "-" ? marketLabel : `마켓 ${bet.market_and_bet_type ?? ""}`;
    const { dateLabel, timeLabel } = formatStartTimeSplit(bet.started_at);
    const percent = vb.middle_value != null ? Number(vb.middle_value) : Number(vb.percent ?? 0);

    tips.push({
      betId: bet.id,
      sportId: bet.sport_id,
      sport,
      periodLabel: periodLabel ?? undefined,
      marketDepth: formatMarketDepth((bet as { market_depth?: unknown }).market_depth),
      leagueName: bet.league_name ?? bet.league ?? "-",
      homeName: bet.home ?? bet.team1_name ?? "-",
      awayName: bet.away ?? bet.team2_name ?? "-",
      startTime: bet.started_at,
      startDateLabel: dateLabel,
      startTimeLabel: timeLabel,
      marketName,
      marketLabel,
      marketDescription: marketDescription ?? undefined,
      lineLabel,
      koef: Number(bet.koef),
      avgOdd: Number(vb.avg_koef),
      percent,
      bookmaker_id: bet.bookmaker_id ?? 0,
      direct_link: (bet as { direct_link?: string }).direct_link ?? "",
      bookmaker_event_direct_link: (bet as { bookmaker_event_direct_link?: string }).bookmaker_event_direct_link ?? "",
      bookmaker_event_name: (bet as { bookmaker_event_name?: string }).bookmaker_event_name ?? "",
      bookmaker_league_name: (bet as { bookmaker_league_name?: string }).bookmaker_league_name ?? "",
      market_and_bet_type_param: bet.market_and_bet_type_param ?? undefined,
    });
  }

  return tips;
}
