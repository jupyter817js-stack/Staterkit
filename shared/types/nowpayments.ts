/** NOWPayments 결제 생성 요청 (우리 백엔드 → NOWPayments API) */
export interface NowPaymentsCreatePaymentBody {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  order_id: string;
  order_description?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

/** NOWPayments 결제 생성 응답 */
export interface NowPaymentsPaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description?: string;
  pay_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  outcome_amount?: number;
  outcome_currency?: string;
}

/** NOWPayments 구독 플랜 생성 요청 */
export interface NowPaymentsSubscriptionPlanBody {
  title: string;
  interval_day: number;
  amount: number;
  currency: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
  partially_paid_url?: string;
}

/** NOWPayments 구독 생성 요청 (이메일로 결제 링크 발송) */
export interface NowPaymentsSubscriptionBody {
  subscription_plan_id: number;
  customer_email: string;
}

/** 구독 생성 API 응답 (백엔드가 결제 URL을 반환하면 새 탭에서 열기 위함) */
export interface CreateSubscriptionResponse {
  success?: boolean;
  message?: string;
  subscription_link?: string;
  pay_url?: string;
  payment_url?: string;
  invoice_url?: string;
  payment_link?: string;
  invoice_link?: string;
  link?: string;
  url?: string;
  [key: string]: unknown;
}
