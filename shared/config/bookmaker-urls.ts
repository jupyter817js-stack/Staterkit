/**
 * 부키 ID → 홈페이지 URL 매핑
 * API /api/v1/bookmakers 의 id 기준.
 * 미등록 부키는 null 반환 (우측 패널에서 안내 메시지 표시)
 */
export const BOOKMAKER_BASE_URLS: Record<number, string> = {
  332: "https://bookmaker.xyz/polygon/sports",
  // 예: Bet365, Pinnacle 등 - 실제 ID는 API 응답 기준으로 추가
};

/** 부키 ID로 base URL 조회 (없으면 null) */
export function getBookmakerUrl(bookmakerId: number): string | null {
  return BOOKMAKER_BASE_URLS[bookmakerId] ?? null;
}
