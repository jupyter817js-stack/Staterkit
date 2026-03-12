/** 스포츠 타입 이름 → Remix Icon 클래스 (ri-*-line) */
const SPORT_TO_ICON: Record<string, string> = {
  soccer: "ri-football-line",
  football: "ri-football-line",
  축구: "ri-football-line",
  basketball: "ri-basketball-line",
  농구: "ri-basketball-line",
  tennis: "ri-trophy-line",
  테니스: "ri-trophy-line",
  baseball: "ri-trophy-line",
  야구: "ri-trophy-line",
  hockey: "ri-trophy-line",
  하키: "ri-trophy-line",
  esports: "ri-gamepad-2-line",
  "e-sports": "ri-gamepad-2-line",
  "e-sport": "ri-gamepad-2-line",
  esport: "ri-gamepad-2-line",
  이스포츠: "ri-gamepad-2-line",
  cricket: "ri-trophy-line",
  크리켓: "ri-trophy-line",
  volleyball: "ri-trophy-line",
  배구: "ri-trophy-line",
  handball: "ri-trophy-line",
  핸드볼: "ri-trophy-line",
  rugby: "ri-trophy-line",
  럭비: "ri-trophy-line",
};

const DEFAULT_ICON = "ri-trophy-line";

/** 팀 마크 없을 때 스포츠별 대체 아이콘 (fill 스타일) */
const SPORT_TO_MARK_FALLBACK: Record<string, string> = {
  soccer: "ri-football-fill",
  football: "ri-football-fill",
  basketball: "ri-basketball-fill",
  tennis: "ri-trophy-fill",
  baseball: "ri-trophy-fill",
  hockey: "ri-trophy-fill",
  esports: "ri-gamepad-fill",
  "e-sports": "ri-gamepad-fill",
  esport: "ri-gamepad-fill",
  cricket: "ri-trophy-fill",
  volleyball: "ri-trophy-fill",
  handball: "ri-trophy-fill",
  rugby: "ri-trophy-fill",
};

const DEFAULT_MARK_FALLBACK = "ri-trophy-fill";

/** 스포츠 타입에 맞는 Remix Icon 클래스 반환 */
export function getSportIconClass(sportName: string): string {
  if (!sportName?.trim()) return DEFAULT_ICON;
  const key = sportName.trim().toLowerCase();
  return SPORT_TO_ICON[key] ?? DEFAULT_ICON;
}

/** 팀 마크 이미지가 없을 때 표시할 스포츠별 대체 아이콘 클래스 반환 */
export function getSportMarkFallbackIconClass(sportName: string): string {
  if (!sportName?.trim()) return DEFAULT_MARK_FALLBACK;
  const key = sportName.trim().toLowerCase();
  return SPORT_TO_MARK_FALLBACK[key] ?? DEFAULT_MARK_FALLBACK;
}
