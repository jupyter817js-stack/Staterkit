/** 결제 창 오픈 후 구독 상태 폴링용. 값은 타임스탬프(ms) 문자열 */
export const SUBSCRIPTION_PAYMENT_PENDING_KEY =
  "staterkit_subscription_payment_pending";

/** 폴링 간격(ms) */
export const SUBSCRIPTION_POLL_INTERVAL_MS = 5000;

/** 폴링 최대 대기(ms). 그 후에는 중단 */
export const SUBSCRIPTION_POLL_MAX_WAIT_MS = 10 * 60 * 1000; // 10분
