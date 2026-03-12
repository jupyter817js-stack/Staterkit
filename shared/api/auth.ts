const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const STRICT = process.env.NEXT_PUBLIC_STRICT_BACKEND_AUTH === "true";
const TIMEOUT = Number(process.env.NEXT_PUBLIC_AUTH_TIMEOUT_MS ?? 8000);

function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

function handleNetworkError(err: any) {
  if (err?.name === "AbortError") {
    throw new Error("서버 응답이 지연되고 있습니다. 잠시 후 다시 시도하세요.");
  }
  throw new Error("서버 연결에 실패했습니다.");
}

/** localStorage에 저장되어 새로고침·탭 종료 후에도 세션 유지. 401 응답 시에만 clearAuthToken 호출됨. */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function getAuthHeader() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  return localStorage.removeItem("auth_token");
}

export function getLoginRedirectPath(fallbackReturnUrl = "/"): string {
  if (typeof window === "undefined") return "/login";
  const currentPath = window.location.pathname + window.location.search + window.location.hash;
  const rawReturnUrl =
    currentPath && currentPath !== "/login" && currentPath !== "/login/"
      ? currentPath
      : fallbackReturnUrl;
  const returnUrl =
    typeof rawReturnUrl === "string" && rawReturnUrl.startsWith("/")
      ? rawReturnUrl
      : fallbackReturnUrl;
  return returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login";
}

export function redirectToLogin(options: {
  clearToken?: boolean;
  fallbackReturnUrl?: string;
} = {}) {
  if (typeof window === "undefined") return;
  if (options.clearToken) clearAuthToken();
  window.location.replace(getLoginRedirectPath(options.fallbackReturnUrl));
}

/* ============================
   Firebase REGISTER
============================ */
export async function registerWithFirebaseToken(
  idToken: string,
  firstName: string,
  lastName: string,
  options?: { store_id?: string; partner_id?: string },
) {
  if (!API_BASE) {
    if (STRICT) throw new Error("API URL not configured");
    localStorage.setItem("auth_token", idToken);
    return;
  }

  const body: Record<string, unknown> = {
    idToken,
    firstName,
    lastName,
  };
  if (options?.store_id) body.store_id = options.store_id;
  if (options?.partner_id) body.partner_id = options.partner_id;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/firebase-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "회원가입 실패");
    }

    const data = await res.json();
    const token = data.token;

    if (!token) throw new Error("서버 토큰이 없습니다.");

    localStorage.setItem("auth_token", token);
  } catch (err) {
    if (err instanceof Error) throw err;
    if (!STRICT) {
      localStorage.setItem("auth_token", idToken);
      return;
    }
    handleNetworkError(err);
  }
}

/* ============================
   Firebase LOGIN
============================ */
export async function loginWithFirebaseToken(idToken: string) {
  if (!API_BASE) {
    if (STRICT) throw new Error("API URL not configured");
    localStorage.setItem("auth_token", idToken);
    return;
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/firebase-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "로그인 실패");
    }

    const data = await res.json();
    const token = data.token;

    if (!token) throw new Error("서버 토큰이 없습니다.");

    localStorage.setItem("auth_token", token);
  } catch (err) {
    if (err instanceof Error) throw err;
    if (!STRICT) {
      localStorage.setItem("auth_token", idToken);
      return;
    }
    handleNetworkError(err);
  }
}

