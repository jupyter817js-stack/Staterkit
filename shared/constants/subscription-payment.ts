/** 결제 창 오픈 후 구독 상태 폴링용. 값은 타임스탬프(ms) 문자열 */
export const SUBSCRIPTION_PAYMENT_PENDING_KEY =
  "staterkit_subscription_payment_pending";

/** 암호화폐 결제 인보이스 ID. SignalR 이벤트 처리 중 참조할 수 있도록 sessionStorage에 보관 */
export const CRYPTO_INVOICE_ID_KEY = "staterkit_crypto_invoice_id";
