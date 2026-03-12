/** 결제/구독 이력 한 건 (tb_user 기준: history / my-history 공통)
 * payment_amount는 tb_user에 없으므로 항상 null.
 * status는 "active" | "expired" (구독 중 / 만료).
 */
export interface PaymentHistoryItem {
  id: string | number;
  email: string;
  plan: string;
  /** tb_user 기준 응답에서는 항상 null. 표시 시 "—" 또는 숨김 처리 */
  paymentAmount: string | number | null;
  paymentDate: string | null;
  expiryDate: string | null;
  /** "active" = 구독 중, "expired" = 만료 */
  status: string;
}

/** 결제 이력 목록 API 쿼리 (관리자용) */
export interface PaymentHistoryParams {
  email?: string;
  date_from?: string;
  date_to?: string;
  plan?: string;
  per_page?: number;
  page?: number;
}

/** 내 결제·구독 이력 API 쿼리 (본인용, per_page 기본 20·최대 100) */
export interface MyPaymentHistoryParams {
  per_page?: number;
  page?: number;
}

/** 결제 이력 목록 API 응답 */
export interface PaymentHistoryResponse {
  items: PaymentHistoryItem[];
  total?: number;
}
