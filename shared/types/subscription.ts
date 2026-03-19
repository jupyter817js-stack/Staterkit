/**
 * 구독 등급 (2단계)
 * - STANDARD: 월 $29, 일반 사용자
 * - PRO: 월 $89, 고급 사용자
 */
export const SUBSCRIPTION_PLAN = {
  STANDARD: "STANDARD",
  PRO: "PRO",
} as const;

export type SubscriptionPlanType =
  (typeof SUBSCRIPTION_PLAN)[keyof typeof SUBSCRIPTION_PLAN];

/** 권한(Entitlement) 항목 */
export interface Entitlements {
  access_prematch: boolean;
  access_live: boolean;
  access_valuebet: boolean;
  data_latency_mode: "REALTIME" | "LOW_LATENCY";
  alerts_enabled: boolean;
  alerts_priority: boolean;
  dex_mode: "PARTIAL" | "FULL";
  api_enabled: boolean;
  presets_enabled: boolean;
  support_priority: boolean;
}

/** 플랜별 Entitlement 매핑 (문서 기준) */
export const PLAN_ENTITLEMENTS: Record<SubscriptionPlanType, Entitlements> = {
  [SUBSCRIPTION_PLAN.STANDARD]: {
    access_prematch: true,
    access_live: false,
    access_valuebet: true,
    data_latency_mode: "REALTIME",
    alerts_enabled: true,
    alerts_priority: false,
    dex_mode: "PARTIAL",
    api_enabled: false,
    presets_enabled: false,
    support_priority: false,
  },
  [SUBSCRIPTION_PLAN.PRO]: {
    access_prematch: true,
    access_live: true,
    access_valuebet: true,
    data_latency_mode: "LOW_LATENCY",
    alerts_enabled: true,
    alerts_priority: true,
    dex_mode: "FULL",
    api_enabled: true,
    presets_enabled: true,
    support_priority: true,
  },
};

/** 플랜이 없을 때 기본값 (미구독 = STANDARD 제한과 동일하게 처리 가능) */
export const DEFAULT_ENTITLEMENTS: Entitlements =
  PLAN_ENTITLEMENTS[SUBSCRIPTION_PLAN.STANDARD];

export function getEntitlements(plan: SubscriptionPlanType | null | undefined): Entitlements {
  if (!plan || !(plan in PLAN_ENTITLEMENTS)) return DEFAULT_ENTITLEMENTS;
  return PLAN_ENTITLEMENTS[plan as SubscriptionPlanType];
}
