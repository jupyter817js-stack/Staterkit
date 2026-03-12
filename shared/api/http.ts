import { redirectToLogin } from "./auth";

const TIMEOUT = Number(process.env.NEXT_PUBLIC_AUTH_TIMEOUT_MS ?? 15000);

/**
 * 401 시: 세션 제거 후 로그인 페이지로 이동.
 * 404/500 등: 에러 페이지로 리다이렉트하지 않음(호출부에서 처리).
 */
function handleHttpError(status: number, _url: string) {
  if (typeof window === "undefined") return;
  if (status === 401) {
    redirectToLogin({ clearToken: true });
  }
}

export interface FetchOptions extends RequestInit {
  /** true면 401/404/500 시 오류 페이지로 리다이렉트 (기본 true) */
  redirectOnError?: boolean;
  /** false면 401이어도 로그인 페이지로 강제 이동하지 않음 */
  redirectOnUnauthorized?: boolean;
}

/**
 * fetch 래퍼 - 401/404/500 시 테마 오류 페이지로 리다이렉트
 */
export async function fetchWithErrorHandling(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    redirectOnError = true,
    redirectOnUnauthorized = true,
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.status === 401) {
      if (redirectOnUnauthorized !== false) {
        handleHttpError(res.status, url);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    if (redirectOnError !== false && !res.ok) {
      handleHttpError(res.status, url);
      throw new Error(`HTTP ${res.status}`);
    }
    return res;
  } catch (err: any) {
    // AbortError(타임아웃) 시에도 에러 페이지로 이동하지 않음
    throw err;
  }
}
