/**
 * 링크 기반 귀속: /join?p=partner_A 또는 /join?s=store_1 접속 시 쿠키 저장,
 * 가입 완료 시 백엔드에 store_id / partner_id 전달
 */
import {
  COOKIE_PARTNER_ID,
  COOKIE_STORE_ID,
  JOIN_QUERY_PARTNER,
  JOIN_QUERY_STORE,
} from "@/shared/types/partner-store";

const COOKIE_MAX_AGE_DAYS = 30;

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;path=/;max-age=0`;
}

/**
 * URL 쿼리 p, s 값을 쿠키에 저장 (s가 있으면 store_id만, p만 있으면 partner_id만).
 * 매장 링크(s)가 우선이면 store_id 저장 시 partner_id는 백엔드에서 매장→총판으로 자동 연결.
 */
export function saveAttributionFromQuery(query: Record<string, string | string[] | undefined>) {
  const s = query[JOIN_QUERY_STORE];
  const p = query[JOIN_QUERY_PARTNER];
  const storeId = typeof s === "string" ? s.trim() : Array.isArray(s) ? s[0]?.trim() : "";
  const partnerId = typeof p === "string" ? p.trim() : Array.isArray(p) ? p[0]?.trim() : "";

  if (storeId) {
    setCookie(COOKIE_STORE_ID, storeId);
    // 매장 링크면 partner_id는 보내지 않음(백엔드가 store→partner 자동 연결)
    removeCookie(COOKIE_PARTNER_ID);
  } else if (partnerId) {
    setCookie(COOKIE_PARTNER_ID, partnerId);
    removeCookie(COOKIE_STORE_ID);
  }
}

/**
 * 가입 요청 시 쿠키에서 store_id, partner_id 읽어서 반환. 사용 후 쿠키 제거 권장.
 */
export function getAttributionFromCookie(): { store_id?: string; partner_id?: string } {
  const storeId = getCookie(COOKIE_STORE_ID);
  const partnerId = getCookie(COOKIE_PARTNER_ID);
  const out: { store_id?: string; partner_id?: string } = {};
  if (storeId) out.store_id = storeId;
  if (partnerId) out.partner_id = partnerId;
  return out;
}

/** 가입 완료 후 귀속 쿠키 제거 */
export function clearAttributionCookie() {
  removeCookie(COOKIE_STORE_ID);
  removeCookie(COOKIE_PARTNER_ID);
}
